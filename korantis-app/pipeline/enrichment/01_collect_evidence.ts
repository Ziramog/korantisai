import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { loadLocalEnv } from '../stages/01_extract_data';
import {
  escapeMd,
  isRecord,
  safeString,
  type AuthorityLevel,
  type EvidenceCollectionResult,
  type EvidenceFact,
  type EvidenceSource,
  type FetchStatus,
  type GenericImageRow,
  type GenericVenueRow,
  type VenueEvidence,
} from './utils/enrichment_types';
import { SOURCE_REGISTRY } from './utils/source_registry';
import type { EnrichmentTargetsResult, EnrichmentTarget } from './utils/enrichment_types';

interface EvidenceOptions {
  runId: string;
}

interface TableRead<T> {
  table: string;
  rows: T[];
  error?: string;
}

const PAGE_SIZE = 1000;
const FETCH_TIMEOUT_MS = 10_000;
const MAX_FETCH_ATTEMPTS = 3;

export async function collectEvidence(options: EvidenceOptions): Promise<EvidenceCollectionResult> {
  loadLocalEnv();

  const outputDir = path.join(process.cwd(), 'data', 'enrichment', options.runId);
  const targetsPath = path.join(outputDir, 'enrichment_targets.json');
  if (!existsSync(targetsPath)) throw new Error(`Missing enrichment targets: ${targetsPath}`);

  const targetsResult = readJson<EnrichmentTargetsResult>(targetsPath);
  const targets = targetsResult.targets;
  const targetIds = new Set(targets.map((target) => target.venue_id));

  const supabase = createSupabaseClient();
  if (!supabase) {
    throw new Error('Missing Supabase read env: NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }

  const [venuesRead, imagesRead] = await Promise.all([
    readTable<GenericVenueRow>(supabase, 'venues'),
    readTable<GenericImageRow>(supabase, 'venue_images'),
  ]);
  if (venuesRead.error) throw new Error(`Unable to read venues: ${venuesRead.error}`);
  if (imagesRead.error) throw new Error(`Unable to read venue_images: ${imagesRead.error}`);

  const venuesById = new Map(venuesRead.rows.filter((venue) => targetIds.has(safeString(venue.id))).map((venue) => [safeString(venue.id), venue]));
  const imagesByVenue = groupBy(imagesRead.rows, (image) => safeString(image.venue_id));
  const fetchLog: EvidenceCollectionResult['fetch_log'] = [];
  const venueEvidence: VenueEvidence[] = [];

  for (const target of targets) {
    const venue = venuesById.get(target.venue_id);
    if (!venue) {
      venueEvidence.push(buildMissingVenueEvidence(target));
      continue;
    }

    const evidence = await collectVenueEvidence(target, venue, imagesByVenue.get(target.venue_id) || [], fetchLog);
    venueEvidence.push(evidence);
  }

  const sourcesAttempted = venueEvidence.reduce((sum, venue) => sum + venue.sources_attempted, 0);
  const sourcesSuccessful = venueEvidence.reduce((sum, venue) => sum + venue.sources_successful, 0);
  const averageCoverage = venueEvidence.length > 0
    ? venueEvidence.reduce((sum, venue) => sum + venue.evidence_coverage_score, 0) / venueEvidence.length
    : 0;

  const result: EvidenceCollectionResult = {
    run_id: options.runId,
    generated_at: new Date().toISOString(),
    mode: 'read_only_evidence_collection',
    target_count: targets.length,
    venues_processed: venueEvidence.length,
    sources_attempted: sourcesAttempted,
    sources_successful: sourcesSuccessful,
    average_evidence_coverage: Number(averageCoverage.toFixed(3)),
    venue_evidence: venueEvidence,
    fetch_log: fetchLog,
    safety: targetsResult.safety,
  };

  mkdirSync(outputDir, { recursive: true });
  writeFileSync(path.join(outputDir, 'evidence_collected.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  writeFileSync(path.join(outputDir, 'source_fetch_log.json'), `${JSON.stringify(fetchLog, null, 2)}\n`, 'utf8');
  writeFileSync(path.join(outputDir, 'evidence_conflicts.json'), `${JSON.stringify([], null, 2)}\n`, 'utf8');
  writeFileSync(path.join(outputDir, 'evidence_report.md'), buildReport(result), 'utf8');

  console.log(`Evidence collected written to ${path.join(outputDir, 'evidence_collected.json')}`);
  console.log(`Source fetch log written to ${path.join(outputDir, 'source_fetch_log.json')}`);
  console.log(`Evidence report written to ${path.join(outputDir, 'evidence_report.md')}`);
  console.log(`E01 evidence summary: run_id=${options.runId}, targets=${result.target_count}, sources=${result.sources_successful}/${result.sources_attempted}, avg_coverage=${result.average_evidence_coverage}`);
  return result;
}

async function collectVenueEvidence(
  target: EnrichmentTarget,
  venue: GenericVenueRow,
  images: GenericImageRow[],
  fetchLog: EvidenceCollectionResult['fetch_log'],
): Promise<VenueEvidence> {
  const sources: EvidenceSource[] = [];
  const googleSource = buildGooglePlacesEvidence(target, venue);
  if (googleSource) sources.push(googleSource);

  const officialWebsite = getUrl(venue.website, nested(venue.publication_metadata, 'source_website_url'), nested(venue.canonical_data, 'website'), nested(venue.enrichment_data, 'facts.website.value'));
  if (officialWebsite) sources.push(await buildHttpEvidence(target, 'official_website', officialWebsite, venue, fetchLog));

  const instagramUrl = getUrl(venue.instagram_url, nested(venue.publication_metadata, 'instagram_url'), nested(venue.canonical_data, 'instagram_url'), nested(venue.enrichment_data, 'facts.instagram_url.value'));
  if (instagramUrl) sources.push(buildStoredLinkEvidence(target, 'instagram_profile', instagramUrl));

  const menuUrl = getUrl(venue.menu_url, nested(venue.canonical_data, 'menu_url'), nested(venue.enrichment_data, 'facts.menu_url.value'));
  if (menuUrl) sources.push(await buildHttpEvidence(target, 'menu_url', menuUrl, venue, fetchLog));

  const reservationUrl = getUrl(venue.reservation_url, nested(venue.canonical_data, 'reservation_url'), nested(venue.enrichment_data, 'facts.reservation_url.value'));
  if (reservationUrl) sources.push(await buildHttpEvidence(target, reservationSourceId(reservationUrl), reservationUrl, venue, fetchLog));

  const facts = sources.flatMap((source) => source.extracted_facts);
  const sourcesAttempted = sources.length;
  const sourcesSuccessful = sources.filter((source) => source.fetch_status === 'stored' || source.fetch_status === 'success').length;
  const highestAuthority = sources.reduce<AuthorityLevel | 0>((max, source) => source.authority_level > max ? source.authority_level : max, 0);

  return {
    venue_id: target.venue_id,
    venue_name: target.venue_name,
    city: target.city,
    sources_attempted: sourcesAttempted,
    sources_successful: sourcesSuccessful,
    evidence_coverage_score: sourcesAttempted > 0 ? Number((sourcesSuccessful / sourcesAttempted).toFixed(3)) : 0,
    highest_authority: highestAuthority,
    facts,
    sources,
    warnings: [
      ...(sourcesAttempted === 0 ? ['no_sources_detected'] : []),
      ...(target.needs.includes('facts_missing') ? ['target_marked_facts_missing'] : []),
    ],
  };
}

function buildGooglePlacesEvidence(target: EnrichmentTarget, venue: GenericVenueRow): EvidenceSource | null {
  const facts: EvidenceFact[] = [];
  const authority = authorityFor('google_places');
  const priceLevel = firstValue(venue.price_level, nested(venue.canonical_data, 'price_level'), nested(venue.enrichment_data, 'facts.price_level.value'));
  const openingHours = firstValue(venue.opening_hours, nested(venue.canonical_data, 'opening_hours'), nested(venue.enrichment_data, 'facts.opening_hours.value'));
  const phone = firstValue(venue.phone, nested(venue.canonical_data, 'phone'), nested(venue.enrichment_data, 'facts.phone.value'));
  const website = getUrl(venue.website, nested(venue.canonical_data, 'website'), nested(venue.enrichment_data, 'facts.website.value'));
  const googleMapsUrl = getUrl(nested(venue.publication_metadata, 'source_google_maps_url'), nested(venue.canonical_data, 'google_maps_url'));
  const placeId = firstValue(nested(venue.publication_metadata, 'source_place_id'), nested(venue.canonical_data, 'place_id'));

  if (priceLevel !== undefined) facts.push(buildFact('price_level', priceLevel, 'google_places', authority, undefined, 'stored'));
  if (openingHours !== undefined) facts.push(buildFact('opening_hours', openingHours, 'google_places', authority, undefined, 'stored'));
  if (phone !== undefined) facts.push(buildFact('phone', phone, 'google_places', authority, undefined, 'stored'));
  if (website) facts.push(buildFact('website', website, 'google_places', authority, website, 'stored'));
  if (googleMapsUrl) facts.push(buildFact('google_maps_url', googleMapsUrl, 'google_places', authority, googleMapsUrl, 'stored'));
  if (placeId !== undefined) facts.push(buildFact('place_id', placeId, 'google_places', authority, undefined, 'stored'));

  if (facts.length === 0) return null;
  return {
    source_id: 'google_places',
    source_name: 'Google Places stored data',
    source_type: 'maps_places',
    authority_level: authority,
    fetched_at: new Date().toISOString(),
    fetch_status: 'stored',
    freshness_status: 'unknown',
    extracted_facts: facts,
    raw_snippet: `${target.venue_name}: ${facts.map((fact) => fact.field).join(', ')}`,
    warnings: [],
  };
}

async function buildHttpEvidence(
  target: EnrichmentTarget,
  sourceId: string,
  sourceUrl: string,
  venue: GenericVenueRow,
  fetchLog: EvidenceCollectionResult['fetch_log'],
): Promise<EvidenceSource> {
  const definition = SOURCE_REGISTRY.find((source) => source.source_id === sourceId);
  const authority = definition?.authority_level || 3;
  const fetchStatus = await headWithRetry(sourceUrl);
  const facts: EvidenceFact[] = [];
  if (sourceId === 'official_website') facts.push(buildFact('website', sourceUrl, sourceId, authority, sourceUrl, 'deterministic'));
  if (sourceId === 'menu_url') facts.push(buildFact('menu_url', sourceUrl, sourceId, authority, sourceUrl, 'deterministic'));
  if (sourceId === 'reservation_url' || sourceId === 'opentable' || sourceId === 'tock') {
    facts.push(buildFact('reservation_url', sourceUrl, sourceId, authority, sourceUrl, 'deterministic'));
    if (sourceId !== 'reservation_url') facts.push(buildFact('reservation_platform', sourceId, sourceId, authority, sourceUrl, 'deterministic'));
  }

  fetchLog.push({
    venue_id: target.venue_id,
    source_id: sourceId,
    source_url: sourceUrl,
    fetch_status: fetchStatus,
    warning: fetchStatus === 'success' ? undefined : `HEAD check ${fetchStatus}`,
  });

  return {
    source_id: sourceId,
    source_name: definition?.source_name || sourceId,
    source_type: definition?.source_type || 'official',
    authority_level: authority,
    source_url: sourceUrl,
    fetched_at: new Date().toISOString(),
    fetch_status: fetchStatus,
    freshness_status: 'fresh',
    extracted_facts: facts,
    raw_snippet: `${safeString(venue.name) || target.venue_name}: ${sourceUrl}`,
    warnings: fetchStatus === 'success' ? [] : [`fetch_${fetchStatus}`],
  };
}

function buildStoredLinkEvidence(target: EnrichmentTarget, sourceId: string, sourceUrl: string): EvidenceSource {
  const definition = SOURCE_REGISTRY.find((source) => source.source_id === sourceId);
  const authority = definition?.authority_level || 5;
  return {
    source_id: sourceId,
    source_name: definition?.source_name || sourceId,
    source_type: definition?.source_type || 'social_profile',
    authority_level: authority,
    source_url: sourceUrl,
    fetched_at: new Date().toISOString(),
    fetch_status: 'stored',
    freshness_status: 'unknown',
    extracted_facts: [buildFact('instagram_url', sourceUrl, sourceId, authority, sourceUrl, 'stored')],
    raw_snippet: `${target.venue_name}: stored social profile link`,
    warnings: [],
  };
}

function reservationSourceId(url: string): 'reservation_url' | 'opentable' | 'tock' {
  const normalized = url.toLowerCase();
  if (normalized.includes('opentable.com')) return 'opentable';
  if (normalized.includes('exploretock.com')) return 'tock';
  return 'reservation_url';
}

function buildMissingVenueEvidence(target: EnrichmentTarget): VenueEvidence {
  return {
    venue_id: target.venue_id,
    venue_name: target.venue_name,
    city: target.city,
    sources_attempted: 0,
    sources_successful: 0,
    evidence_coverage_score: 0,
    highest_authority: 0,
    facts: [],
    sources: [],
    warnings: ['venue_not_found_in_public_table'],
  };
}

function buildFact(
  field: string,
  value: unknown,
  sourceId: string,
  authority: AuthorityLevel,
  sourceUrl: string | undefined,
  extractionMethod: EvidenceFact['extraction_method'],
): EvidenceFact {
  const confidence = confidenceFor(authority, extractionMethod);
  const status = confidence >= 0.7 ? 'confirmed' : confidence >= 0.5 ? 'likely' : 'weak_hint';
  return {
    field,
    value,
    display_value: displayValue(value),
    source_id: sourceId,
    source_url: sourceUrl,
    source_authority: authority,
    extraction_method: extractionMethod,
    confidence,
    status,
    show_to_user: status === 'confirmed' || status === 'likely',
  };
}

async function headWithRetry(url: string): Promise<FetchStatus> {
  for (let attempt = 0; attempt < MAX_FETCH_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        redirect: 'follow',
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        headers: {
          'User-Agent': 'KorantisEnrichmentEvidence/1.0',
        },
      });
      if (response.status === 401 || response.status === 403) return 'blocked';
      if (response.ok) return 'success';
      if (response.status >= 500) continue;
      return 'failed';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'TimeoutError') {
        if (attempt === MAX_FETCH_ATTEMPTS - 1) return 'timeout';
        continue;
      }
      if (attempt === MAX_FETCH_ATTEMPTS - 1) return 'failed';
    }
  }
  return 'failed';
}

function buildReport(result: EvidenceCollectionResult): string {
  return [
    `# Enrichment Evidence Collection - ${result.run_id}`,
    '',
    `- Generated: ${result.generated_at}`,
    `- Mode: ${result.mode}`,
    `- Targets: ${result.target_count}`,
    `- Venues processed: ${result.venues_processed}`,
    `- Sources successful: ${result.sources_successful}/${result.sources_attempted}`,
    `- Average evidence coverage: ${result.average_evidence_coverage}`,
    '',
    '## Venue Evidence',
    '',
    '| Venue | Coverage | Highest Authority | Facts | Sources | Warnings |',
    '| --- | ---: | ---: | --- | --- | --- |',
    ...result.venue_evidence.map((venue) =>
      `| ${escapeMd(venue.venue_name)} | ${venue.evidence_coverage_score.toFixed(3)} | ${venue.highest_authority} | ${escapeMd(venue.facts.map((fact) => fact.field).join(', ') || 'none')} | ${escapeMd(venue.sources.map((source) => `${source.source_id}:${source.fetch_status}`).join(', ') || 'none')} | ${escapeMd(venue.warnings.join(', ') || 'none')} |`,
    ),
    '',
    '## Fetch Failures',
    '',
    ...(result.fetch_log.filter((item) => !['success', 'stored'].includes(item.fetch_status)).length > 0
      ? result.fetch_log
        .filter((item) => !['success', 'stored'].includes(item.fetch_status))
        .map((item) => `- ${item.venue_id} ${item.source_id}: ${item.fetch_status} ${item.source_url || ''}`)
      : ['- none']),
    '',
    '## Safety',
    '',
    ...Object.entries(result.safety).map(([key, value]) => `- ${key}: ${value}`),
  ].join('\n') + '\n';
}

async function readTable<T>(supabase: SupabaseClient, table: string): Promise<TableRead<T>> {
  const rows: T[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase.from(table).select('*').range(from, from + PAGE_SIZE - 1);
    if (error) return { table, rows, error: error.message };
    rows.push(...((data || []) as T[]));
    if (!data || data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return { table, rows };
}

function createSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function confidenceFor(authority: AuthorityLevel, extractionMethod: EvidenceFact['extraction_method']): number {
  const base = authority / 5;
  const methodModifier = extractionMethod === 'deterministic' || extractionMethod === 'stored' ? 1 : 0.85;
  return Number((base * methodModifier).toFixed(2));
}

function authorityFor(sourceId: string): AuthorityLevel {
  return SOURCE_REGISTRY.find((source) => source.source_id === sourceId)?.authority_level || 3;
}

function displayValue(value: unknown): string {
  if (Array.isArray(value)) return value.join(', ');
  if (isRecord(value)) return JSON.stringify(value);
  return String(value);
}

function getUrl(...values: unknown[]): string {
  const value = values.map((item) => safeString(item)).find(Boolean) || '';
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  if (/^[a-z0-9.-]+\.[a-z]{2,}/i.test(value)) return `https://${value}`;
  return '';
}

function firstValue(...values: unknown[]): unknown {
  return values.find((value) => {
    if (Array.isArray(value)) return value.length > 0;
    if (isRecord(value)) return Object.keys(value).length > 0;
    return value !== null && value !== undefined && safeString(value) !== '';
  });
}

function nested(value: unknown, pathExpression: string): unknown {
  if (!isRecord(value)) return undefined;
  return pathExpression.split('.').reduce<unknown>((current, key) => (isRecord(current) ? current[key] : undefined), value);
}

function groupBy<T>(rows: T[], keyFn: (row: T) => string): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  for (const row of rows) {
    const key = keyFn(row);
    if (!key) continue;
    grouped.set(key, [...(grouped.get(key) || []), row]);
  }
  return grouped;
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, 'utf8')) as T;
}

function parseArgs(argv: string[]): EvidenceOptions {
  const runIdIndex = argv.indexOf('--run-id');
  const runId = runIdIndex >= 0 ? argv[runIdIndex + 1] : '';
  if (!runId) throw new Error('Usage: npx tsx pipeline/enrichment/01_collect_evidence.ts --run-id <run_id>');
  return { runId };
}

const currentFile = path.resolve(fileURLToPath(import.meta.url));
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : '';

if (currentFile === invokedFile) {
  collectEvidence(parseArgs(process.argv.slice(2))).catch((error: unknown) => {
    console.error(`E01 evidence collection failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
