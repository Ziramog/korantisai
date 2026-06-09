import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { loadLocalEnv } from '../stages/01_extract_data';
import {
  escapeMd,
  isRecord,
  normalizeText,
  safeNumber,
  safeString,
  type CurrentVenueStatus,
  type EnrichmentNeed,
  type EnrichmentRunConfig,
  type EnrichmentTarget,
  type EnrichmentTargetsResult,
  type GenericImageRow,
  type GenericVenueRow,
} from './utils/enrichment_types';

interface TargetSelectorOptions {
  activeOnly: boolean;
  pendingReview: boolean;
  city?: string;
  venueIds: string[];
  missingGallery: boolean;
  missingEditorial: boolean;
  missingFacts: boolean;
  maxTargets: number;
  force: boolean;
  runId?: string;
}

interface TableRead<T> {
  table: string;
  rows: T[];
  error?: string;
}

const PAGE_SIZE = 1000;
const RECENT_ENRICHMENT_DAYS = 14;

export async function selectEnrichmentTargets(options: TargetSelectorOptions): Promise<EnrichmentTargetsResult> {
  loadLocalEnv();

  const runId = options.runId || buildRunId();
  const outputDir = path.join(process.cwd(), 'data', 'enrichment', runId);
  mkdirSync(outputDir, { recursive: true });

  const config = buildRunConfig(runId, options);
  writeFileSync(path.join(outputDir, 'enrichment_run_config.json'), `${JSON.stringify(config, null, 2)}\n`, 'utf8');

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

  const imagesByVenue = groupBy(imagesRead.rows, (image) => safeString(image.venue_id));
  const now = new Date();
  const skippedRecent: EnrichmentTarget[] = [];
  const targets = venuesRead.rows
    .map((venue) => buildTarget(venue, imagesByVenue.get(safeString(venue.id)) || [], now))
    .filter((target) => target.venue_id)
    .filter((target) => matchesFilters(target, options))
    .filter((target) => {
      if (options.force || !target.last_enriched_at) return true;
      const ageDays = daysBetween(new Date(target.last_enriched_at), now);
      if (ageDays < RECENT_ENRICHMENT_DAYS) {
        skippedRecent.push(target);
        return false;
      }
      return true;
    })
    .sort((a, b) => b.priority_score - a.priority_score || a.venue_name.localeCompare(b.venue_name))
    .slice(0, options.maxTargets);

  const result: EnrichmentTargetsResult = {
    run_id: runId,
    generated_at: new Date().toISOString(),
    mode: 'read_only_target_selection',
    total_venues_read: venuesRead.rows.length,
    total_images_read: imagesRead.rows.length,
    selected_count: targets.length,
    skipped_recent_count: skippedRecent.length,
    targets,
    summary: buildSummary(targets),
    safety: config.safety,
  };

  writeFileSync(path.join(outputDir, 'enrichment_targets.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  writeFileSync(path.join(outputDir, 'enrichment_target_report.md'), buildReport(result, options), 'utf8');

  console.log(`Enrichment run config written to ${path.join(outputDir, 'enrichment_run_config.json')}`);
  console.log(`Enrichment targets written to ${path.join(outputDir, 'enrichment_targets.json')}`);
  console.log(`Enrichment target report written to ${path.join(outputDir, 'enrichment_target_report.md')}`);
  console.log(`E00 target summary: run_id=${runId}, venues_read=${result.total_venues_read}, selected=${result.selected_count}, skipped_recent=${result.skipped_recent_count}`);
  console.log(`Next command: npx tsx pipeline/enrichment/01_collect_evidence.ts --run-id ${runId}`);

  return result;
}

function buildTarget(venue: GenericVenueRow, images: GenericImageRow[], now: Date): EnrichmentTarget {
  const venueId = safeString(venue.id);
  const venueName = safeString(venue.name) || venueId;
  const city = firstString(venue.city, nested(venue.canonical_data, 'city'), nested(venue.enrichment_data, 'city'));
  const neighborhood = firstString(venue.neighborhood, nested(venue.canonical_data, 'neighborhood'), nested(venue.enrichment_data, 'neighborhood')) || undefined;
  const curationStatus = safeString(venue.curation_status);
  const currentStatus = normalizeStatus(curationStatus);
  const hero = findHero(venue, images);
  const usableImages = images.filter(isUsableImage);
  const tagline = firstString(venue.tagline, nested(venue.canonical_data, 'tagline'), nested(venue.enrichment_data, 'tagline'));
  const description = firstString(
    venue.narrative,
    venue.description,
    venue.atmosphere_prose,
    nested(venue.canonical_data, 'description'),
    nested(venue.canonical_data, 'description_short'),
    nested(venue.enrichment_data, 'description'),
    nested(venue.enrichment_data, 'description_short'),
    nested(venue.enrichment_data, 'editorial.description_short'),
  );
  const moodTags = extractTags(venue);
  const evidenceCoverage = safeNumber(nested(venue.evidence_data, 'quality.evidence_coverage')) ?? safeNumber(nested(venue.enrichment_data, 'quality.evidence_coverage'));
  const lastEnrichedAt = firstString(venue.last_enriched_at, nested(venue.enrichment_data, 'generated_at'), nested(venue.evidence_data, 'generated_at')) || null;
  const lastRunId = firstString(nested(venue.enrichment_data, 'run_id'), nested(venue.evidence_data, 'run_id')) || null;

  const current = {
    image_count: images.length,
    usable_image_count: usableImages.length,
    hero_image_url: hero.url,
    has_cloudinary_hero: Boolean(hero.url && hero.url.startsWith('https://res.cloudinary.com/')),
    has_tagline: tagline.length >= 8,
    has_description: description.length >= 24,
    mood_tag_count: moodTags.length,
    has_price_level: hasAnyValue(venue.price_level, nested(venue.canonical_data, 'price_level'), nested(venue.enrichment_data, 'facts.price_level.value')),
    has_opening_hours: hasAnyValue(venue.opening_hours, nested(venue.canonical_data, 'opening_hours'), nested(venue.enrichment_data, 'facts.opening_hours.value')),
    has_website: Boolean(firstString(venue.website, nested(venue.publication_metadata, 'source_website_url'), nested(venue.canonical_data, 'website'), nested(venue.enrichment_data, 'facts.website.value'))),
    has_phone: Boolean(firstString(venue.phone, nested(venue.canonical_data, 'phone'), nested(venue.enrichment_data, 'facts.phone.value'))),
    has_instagram: Boolean(firstString(venue.instagram_url, nested(venue.publication_metadata, 'instagram_url'), nested(venue.canonical_data, 'instagram_url'), nested(venue.enrichment_data, 'facts.instagram_url.value'))),
    evidence_coverage: evidenceCoverage,
  };

  const needs = determineNeeds(current, hero.qualityScore, evidenceCoverage, lastEnrichedAt, now);
  const reasons = buildReasons(needs, current);
  const warnings = buildWarnings(venue, current, hero);

  return {
    venue_id: venueId,
    venue_name: venueName,
    city,
    neighborhood,
    current_status: currentStatus,
    curation_status: curationStatus || undefined,
    needs,
    priority_score: calculatePriority(currentStatus, needs),
    last_enriched_at: lastEnrichedAt,
    last_enrichment_run_id: lastRunId,
    current,
    reasons,
    warnings,
  };
}

function determineNeeds(
  current: EnrichmentTarget['current'],
  heroQuality: number | undefined,
  evidenceCoverage: number | undefined,
  lastEnrichedAt: string | null,
  now: Date,
): EnrichmentNeed[] {
  const needs: EnrichmentNeed[] = [];
  if (current.usable_image_count < 3) needs.push('gallery_depth');
  if (!current.hero_image_url) needs.push('hero_missing');
  if (current.hero_image_url && (!current.has_cloudinary_hero || (heroQuality !== undefined && heroQuality < 0.6))) needs.push('hero_weak');
  if (!current.has_tagline || !current.has_description || current.mood_tag_count < 2) needs.push('editorial_thin');
  if (!current.has_price_level && !current.has_opening_hours && !current.has_website && !current.has_phone) needs.push('facts_missing');
  if (evidenceCoverage === undefined || evidenceCoverage < 0.4) needs.push('evidence_weak');
  if (!lastEnrichedAt) {
    needs.push('stale', 'source_unchecked');
  } else if (daysBetween(new Date(lastEnrichedAt), now) > 180) {
    needs.push('stale');
  }
  return [...new Set(needs)];
}

function calculatePriority(status: CurrentVenueStatus, needs: EnrichmentNeed[]): number {
  let score = status === 'active' ? 0.3 : status === 'pending_review' ? 0.1 : 0;
  if (needs.includes('hero_missing')) score += 0.3;
  if (needs.includes('gallery_depth')) score += 0.15;
  if (needs.includes('editorial_thin')) score += 0.15;
  if (needs.includes('facts_missing')) score += 0.05;
  if (needs.includes('evidence_weak')) score += 0.05;
  if (needs.includes('source_unchecked')) score += 0.03;
  return Number(Math.min(1, score).toFixed(3));
}

function matchesFilters(target: EnrichmentTarget, options: TargetSelectorOptions): boolean {
  if (options.activeOnly && target.current_status !== 'active') return false;
  if (options.pendingReview && target.current_status !== 'pending_review') return false;
  if (options.city && normalizeText(target.city) !== normalizeText(options.city)) return false;
  if (options.venueIds.length > 0 && !options.venueIds.includes(target.venue_id)) return false;
  const needFilters: EnrichmentNeed[] = [];
  if (options.missingGallery) needFilters.push('gallery_depth', 'hero_missing', 'hero_weak');
  if (options.missingEditorial) needFilters.push('editorial_thin');
  if (options.missingFacts) needFilters.push('facts_missing');
  if (needFilters.length > 0 && !target.needs.some((need) => needFilters.includes(need))) return false;
  return target.needs.length > 0;
}

function buildReasons(needs: EnrichmentNeed[], current: EnrichmentTarget['current']): string[] {
  const reasons: string[] = [];
  if (needs.includes('gallery_depth')) reasons.push(`gallery_depth: ${current.usable_image_count} usable image(s), target is 3+`);
  if (needs.includes('hero_missing')) reasons.push('hero_missing');
  if (needs.includes('hero_weak')) reasons.push('hero_weak: non-Cloudinary or low-quality hero');
  if (needs.includes('editorial_thin')) reasons.push(`editorial_thin: tagline=${current.has_tagline}, description=${current.has_description}, mood_tags=${current.mood_tag_count}`);
  if (needs.includes('facts_missing')) reasons.push('facts_missing: no price/hours/contact facts detected');
  if (needs.includes('evidence_weak')) reasons.push(`evidence_weak: coverage=${current.evidence_coverage ?? 'unknown'}`);
  if (needs.includes('stale')) reasons.push('stale_or_never_enriched');
  if (needs.includes('source_unchecked')) reasons.push('source_unchecked');
  return reasons;
}

function buildWarnings(venue: GenericVenueRow, current: EnrichmentTarget['current'], hero: { url?: string }): string[] {
  const warnings: string[] = [];
  if (!firstString(venue.city, nested(venue.canonical_data, 'city'))) warnings.push('missing_city');
  if (hero.url && !current.has_cloudinary_hero) warnings.push('hero_not_cloudinary');
  if (current.image_count > 0 && current.usable_image_count === 0) warnings.push('images_present_but_not_usable');
  return warnings;
}

function buildSummary(targets: EnrichmentTarget[]): Record<string, number> {
  const summary: Record<string, number> = {
    targets: targets.length,
    active: targets.filter((target) => target.current_status === 'active').length,
    pending_review: targets.filter((target) => target.current_status === 'pending_review').length,
  };
  for (const target of targets) {
    for (const need of target.needs) {
      summary[`need_${need}`] = (summary[`need_${need}`] || 0) + 1;
    }
  }
  return summary;
}

function buildReport(result: EnrichmentTargetsResult, options: TargetSelectorOptions): string {
  return [
    `# Enrichment Target Selection - ${result.run_id}`,
    '',
    `- Generated: ${result.generated_at}`,
    `- Mode: ${result.mode}`,
    `- Total venues read: ${result.total_venues_read}`,
    `- Total images read: ${result.total_images_read}`,
    `- Selected targets: ${result.selected_count}`,
    `- Skipped recent enrichments: ${result.skipped_recent_count}`,
    `- Filters: active_only=${options.activeOnly}, pending_review=${options.pendingReview}, city=${options.city || 'any'}, missing_gallery=${options.missingGallery}, missing_editorial=${options.missingEditorial}, missing_facts=${options.missingFacts}`,
    '',
    '## Summary',
    '',
    ...Object.entries(result.summary).map(([key, value]) => `- ${key}: ${value}`),
    '',
    '## Targets',
    '',
    '| Priority | Venue | Status | City | Neighborhood | Needs | Current | Reasons |',
    '| ---: | --- | --- | --- | --- | --- | --- | --- |',
    ...result.targets.map((target) =>
      `| ${target.priority_score.toFixed(3)} | ${escapeMd(target.venue_name)} | ${target.current_status} | ${escapeMd(target.city)} | ${escapeMd(target.neighborhood || '')} | ${target.needs.join(', ')} | images=${target.current.usable_image_count}/${target.current.image_count}; moods=${target.current.mood_tag_count}; hero=${target.current.hero_image_url ? 'yes' : 'no'} | ${escapeMd(target.reasons.join('; '))} |`,
    ),
    ...(result.targets.length > 0 ? [] : ['|  | none |  |  |  |  |  |  |']),
    '',
    '## Next Command',
    '',
    '```powershell',
    `npx tsx pipeline/enrichment/01_collect_evidence.ts --run-id ${result.run_id}`,
    '```',
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

function buildRunConfig(runId: string, options: TargetSelectorOptions): EnrichmentRunConfig {
  return {
    run_id: runId,
    generated_at: new Date().toISOString(),
    args: options as unknown as Record<string, unknown>,
    filters: {
      active_only: options.activeOnly,
      pending_review: options.pendingReview,
      city: options.city,
      venue_ids: options.venueIds,
      missing_gallery: options.missingGallery,
      missing_editorial: options.missingEditorial,
      missing_facts: options.missingFacts,
      max_targets: options.maxTargets,
      force: options.force,
    },
    safety: {
      read_only_supabase: true,
      no_supabase_writes: true,
      no_cloudinary_uploads: true,
      no_external_model_calls: true,
      no_publication_changes: true,
    },
  };
}

function createSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function findHero(venue: GenericVenueRow, images: GenericImageRow[]): { url?: string; qualityScore?: number } {
  const image = images.find((row) => row.role === 'hero' || row.is_cover === true || row.is_selected_hero === true) || images[0];
  return {
    url: firstString(image?.secure_url, image?.url, venue.hero_image) || undefined,
    qualityScore: safeNumber(image?.quality_score) ?? safeNumber(nested(image?.selection_data, 'quality_score')),
  };
}

function isUsableImage(image: GenericImageRow): boolean {
  const url = firstString(image.secure_url, image.url);
  if (!url) return false;
  const rights = safeString(image.rights_status);
  if (rights === 'rejected_rights_risk') return false;
  return true;
}

function extractTags(venue: GenericVenueRow): string[] {
  const values = [
    venue.tags,
    venue.mood_tags,
    nested(venue.canonical_data, 'tags'),
    nested(venue.canonical_data, 'mood_tags'),
    nested(venue.enrichment_data, 'tags'),
    nested(venue.enrichment_data, 'mood_tags'),
    nested(venue.enrichment_data, 'editorial.mood_tags'),
  ];
  for (const value of values) {
    if (Array.isArray(value)) return value.map(String).filter(Boolean);
    if (typeof value === 'string' && value.trim()) return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function nested(value: unknown, pathExpression: string): unknown {
  if (!isRecord(value)) return undefined;
  return pathExpression.split('.').reduce<unknown>((current, key) => (isRecord(current) ? current[key] : undefined), value);
}

function firstString(...values: unknown[]): string {
  for (const value of values) {
    const item = safeString(value);
    if (item) return item;
  }
  return '';
}

function hasAnyValue(...values: unknown[]): boolean {
  return values.some((value) => {
    if (Array.isArray(value)) return value.length > 0;
    if (isRecord(value)) return Object.keys(value).length > 0;
    return value !== null && value !== undefined && safeString(value) !== '';
  });
}

function normalizeStatus(status: string): CurrentVenueStatus {
  if (status === 'active') return 'active';
  if (status === 'pending_review') return 'pending_review';
  return 'other';
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

function daysBetween(start: Date, end: Date): number {
  if (Number.isNaN(start.getTime())) return Number.POSITIVE_INFINITY;
  return Math.floor((end.getTime() - start.getTime()) / 86_400_000);
}

function buildRunId(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `enrich_${now.getFullYear()}_${pad(now.getMonth() + 1)}_${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
}

function parseArgs(argv: string[]): TargetSelectorOptions {
  const options: TargetSelectorOptions = {
    activeOnly: false,
    pendingReview: false,
    venueIds: [],
    missingGallery: false,
    missingEditorial: false,
    missingFacts: false,
    maxTargets: 50,
    force: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === '--active-only') options.activeOnly = true;
    if (arg === '--pending-review') options.pendingReview = true;
    if (arg === '--city') options.city = next;
    if (arg === '--venue-ids') options.venueIds = (next || '').split(',').map((item) => item.trim()).filter(Boolean);
    if (arg === '--missing-gallery') options.missingGallery = true;
    if (arg === '--missing-editorial') options.missingEditorial = true;
    if (arg === '--missing-facts') options.missingFacts = true;
    if (arg === '--max-targets') options.maxTargets = Number(next || '50');
    if (arg === '--force') options.force = true;
    if (arg === '--run-id') options.runId = next;
  }
  if (!Number.isFinite(options.maxTargets) || options.maxTargets <= 0) options.maxTargets = 50;
  return options;
}

const currentFile = path.resolve(fileURLToPath(import.meta.url));
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : '';

if (currentFile === invokedFile) {
  selectEnrichmentTargets(parseArgs(process.argv.slice(2))).catch((error: unknown) => {
    console.error(`E00 target selection failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
