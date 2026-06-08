import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { loadLocalEnv } from './01_extract_data';

type AuditDecision = 'keep' | 'fix' | 'review_remove' | 'remove_candidate';

interface AuditOptions {
  outputDir: string;
  limit?: number;
}

interface GenericRow {
  id?: unknown;
  venue_id?: unknown;
  name?: unknown;
  city?: unknown;
  neighborhood?: unknown;
  coordinates?: unknown;
  curation_status?: unknown;
  hero_image?: unknown;
  tagline?: unknown;
  narrative?: unknown;
  description?: unknown;
  atmosphere_prose?: unknown;
  tags?: unknown;
  mood_tags?: unknown;
  category?: unknown;
  type?: unknown;
  rating?: unknown;
  review_count?: unknown;
  user_ratings_total?: unknown;
  publication_metadata?: unknown;
  canonical_data?: unknown;
  enrichment_data?: unknown;
  pipeline_batch_id?: unknown;
  pipeline_status?: unknown;
  secure_url?: unknown;
  url?: unknown;
  role?: unknown;
  is_cover?: unknown;
  is_selected_hero?: unknown;
  rights_status?: unknown;
  status?: unknown;
  public_id?: unknown;
  pipeline_quality_data?: unknown;
}

interface TableRead<T> {
  table: string;
  found: boolean;
  rows: T[];
  error?: string;
}

interface VenueAuditRow {
  id: string;
  name: string;
  city: string;
  neighborhood?: string;
  curation_status?: string;
  batch_id?: string;
  category?: string;
  rating?: number;
  review_count?: number;
  has_coordinates: boolean;
  coordinates_inside_expected_city: boolean | null;
  has_hero_image: boolean;
  has_cloudinary_hero: boolean;
  has_tagline: boolean;
  has_description: boolean;
  has_mood_tags: boolean;
  image_count: number;
  hero_image_url?: string;
  duplicate_key: string;
  duplicate_group_size: number;
  blockers: string[];
  warnings: string[];
  recommendation: AuditDecision;
  recommended_action: string;
}

interface PublicCatalogAuditResult {
  generated_at: string;
  mode: 'read_only_public_catalog_audit';
  env: {
    supabase_url_present: boolean;
    supabase_key_present: boolean;
    used_service_role: boolean;
  };
  summary: {
    public_venues_read: number;
    public_images_read: number;
    staging_venues_read: number;
    quality_scores_read: number;
    active: number;
    pending_review: number;
    other_status: number;
    keep: number;
    fix: number;
    review_remove: number;
    remove_candidate: number;
    missing_geo: number;
    missing_hero: number;
    missing_cloudinary_hero: number;
    duplicates: number;
    chain_or_generic_brand_candidates: number;
  };
  table_reads: Array<{ table: string; found: boolean; rows: number; error?: string }>;
  duplicate_groups: Array<{ key: string; venues: Array<{ id: string; name: string; status?: string }> }>;
  venue_audits: VenueAuditRow[];
  safety_checks: {
    read_only_supabase: true;
    no_supabase_writes: true;
    no_cloudinary_uploads: true;
    no_external_model_calls: true;
    no_publication_changes: true;
    no_consumer_ui_changes: true;
  };
}

const DEFAULT_OUTPUT_DIR = path.join(process.cwd(), 'data', 'audits');
const PAGE_SIZE = 1000;
const CITY_BOUNDS: Record<string, { minLat: number; maxLat: number; minLng: number; maxLng: number }> = {
  'buenos aires': { minLat: -34.8, maxLat: -34.4, minLng: -58.65, maxLng: -58.2 },
  'new york': { minLat: 40.45, maxLat: 40.95, minLng: -74.3, maxLng: -73.65 },
  'new york city': { minLat: 40.45, maxLat: 40.95, minLng: -74.3, maxLng: -73.65 },
  dubai: { minLat: 24.75, maxLat: 25.45, minLng: 54.85, maxLng: 55.65 },
};

const CHAIN_OR_GENERIC_BRAND_TERMS = [
  'starbucks',
  'mcdonald',
  'burger king',
  'subway',
  'kfc',
  'taco bell',
  'pizza hut',
  'dunkin',
  'costa coffee',
  'pret a manger',
  'tim hortons',
  'hard rock cafe',
];

export async function auditPublicCatalog(options: Partial<AuditOptions> = {}): Promise<PublicCatalogAuditResult> {
  loadLocalEnv();

  const outputDir = options.outputDir || DEFAULT_OUTPUT_DIR;
  mkdirSync(outputDir, { recursive: true });

  const clientInfo = getSupabaseClient();
  if (!clientInfo.client) {
    const result = buildMissingEnvResult(clientInfo);
    writeOutputs(outputDir, result);
    console.log(`Public catalog audit could not read Supabase: missing env. Report written to ${path.join(outputDir, 'public_catalog_audit_report.md')}`);
    return result;
  }

  const [venuesRead, imagesRead, stagingRead, qualityRead] = await Promise.all([
    readTable(clientInfo.client, 'venues', options.limit),
    readTable(clientInfo.client, 'venue_images'),
    readTable(clientInfo.client, 'staging_venues'),
    readTable(clientInfo.client, 'quality_scores'),
  ]);

  const venues = venuesRead.rows;
  const images = imagesRead.rows;
  const imagesByVenue = groupBy(images, (row) => stringValue(row.venue_id));
  const duplicateSizes = buildDuplicateSizes(venues);
  const venueAudits = venues.map((venue) => auditVenue(venue, imagesByVenue.get(stringValue(venue.id)) || [], duplicateSizes));
  const duplicateGroups = buildDuplicateGroups(venues);

  const result: PublicCatalogAuditResult = {
    generated_at: new Date().toISOString(),
    mode: 'read_only_public_catalog_audit',
    env: {
      supabase_url_present: clientInfo.urlPresent,
      supabase_key_present: clientInfo.keyPresent,
      used_service_role: clientInfo.usedServiceRole,
    },
    summary: {
      public_venues_read: venues.length,
      public_images_read: images.length,
      staging_venues_read: stagingRead.rows.length,
      quality_scores_read: qualityRead.rows.length,
      active: venueAudits.filter((row) => row.curation_status === 'active').length,
      pending_review: venueAudits.filter((row) => row.curation_status === 'pending_review').length,
      other_status: venueAudits.filter((row) => !['active', 'pending_review'].includes(row.curation_status || '')).length,
      keep: venueAudits.filter((row) => row.recommendation === 'keep').length,
      fix: venueAudits.filter((row) => row.recommendation === 'fix').length,
      review_remove: venueAudits.filter((row) => row.recommendation === 'review_remove').length,
      remove_candidate: venueAudits.filter((row) => row.recommendation === 'remove_candidate').length,
      missing_geo: venueAudits.filter((row) => !row.has_coordinates).length,
      missing_hero: venueAudits.filter((row) => !row.has_hero_image).length,
      missing_cloudinary_hero: venueAudits.filter((row) => !row.has_cloudinary_hero).length,
      duplicates: venueAudits.filter((row) => row.duplicate_group_size > 1).length,
      chain_or_generic_brand_candidates: venueAudits.filter((row) => row.warnings.includes('chain_or_generic_brand_candidate')).length,
    },
    table_reads: [venuesRead, imagesRead, stagingRead, qualityRead].map((read) => ({
      table: read.table,
      found: read.found,
      rows: read.rows.length,
      error: read.error,
    })),
    duplicate_groups: duplicateGroups,
    venue_audits: venueAudits.sort(sortAuditRows),
    safety_checks: {
      read_only_supabase: true,
      no_supabase_writes: true,
      no_cloudinary_uploads: true,
      no_external_model_calls: true,
      no_publication_changes: true,
      no_consumer_ui_changes: true,
    },
  };

  writeOutputs(outputDir, result);
  console.log(`Public catalog audit JSON written to ${path.join(outputDir, 'public_catalog_audit.json')}`);
  console.log(`Public catalog audit report written to ${path.join(outputDir, 'public_catalog_audit_report.md')}`);
  console.log(`Public catalog audit summary: venues=${result.summary.public_venues_read}, keep=${result.summary.keep}, fix=${result.summary.fix}, review_remove=${result.summary.review_remove}, remove_candidate=${result.summary.remove_candidate}`);
  return result;
}

function auditVenue(venue: GenericRow, images: GenericRow[], duplicateSizes: Map<string, number>): VenueAuditRow {
  const id = stringValue(venue.id);
  const name = stringValue(venue.name) || id;
  const city = readFirstString(venue.city, venue.canonical_data, venue.enrichment_data, 'city');
  const neighborhood = readFirstString(venue.neighborhood, venue.canonical_data, venue.enrichment_data, 'neighborhood');
  const curationStatus = stringValue(venue.curation_status);
  const coordinates = parseCoordinates(venue.coordinates);
  const cityBounds = CITY_BOUNDS[normalize(city)];
  const insideExpectedCity = coordinates ? (cityBounds ? insideBounds(coordinates, cityBounds) : null) : false;
  const textFields = extractTextFields(venue);
  const moodTags = extractTags(venue);
  const hero = findHeroImage(venue, images);
  const duplicateKey = `${normalize(name)}|${normalize(city || neighborhood)}`;
  const duplicateGroupSize = duplicateSizes.get(duplicateKey) || 1;
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!id) blockers.push('missing_id');
  if (!name || name === id) blockers.push('missing_name');
  if (!city) warnings.push('missing_city');
  if (!coordinates) blockers.push('missing_or_invalid_geo');
  if (coordinates && insideExpectedCity === false) blockers.push('geo_outside_expected_city');
  if (!hero.url) blockers.push('missing_hero_image');
  if (hero.url && !isCloudinaryUrl(hero.url)) warnings.push('hero_not_cloudinary');
  if (!textFields.tagline || textFields.tagline.length < 8) blockers.push('missing_or_short_tagline');
  if (!textFields.description || textFields.description.length < 24) blockers.push('missing_or_short_description');
  if (moodTags.length < 2) blockers.push('fewer_than_two_mood_tags');
  if (duplicateGroupSize > 1) warnings.push('possible_duplicate');
  if (isChainOrGenericBrand(name)) warnings.push('chain_or_generic_brand_candidate');
  if (String(hero.rightsStatus || '').toLowerCase().includes('approved_for_publication')) warnings.push('image_rights_marked_approved_check_policy');
  if (curationStatus && !['active', 'pending_review'].includes(curationStatus)) warnings.push(`unexpected_curation_status:${curationStatus}`);

  const recommendation = chooseRecommendation(blockers, warnings, curationStatus);

  return {
    id,
    name,
    city,
    neighborhood,
    curation_status: curationStatus,
    batch_id: readBatchId(venue),
    category: readFirstString(venue.category, venue.type, venue.canonical_data, venue.enrichment_data, 'category'),
    rating: numberValue(venue.rating),
    review_count: numberValue(venue.review_count) ?? numberValue(venue.user_ratings_total),
    has_coordinates: Boolean(coordinates),
    coordinates_inside_expected_city: insideExpectedCity,
    has_hero_image: Boolean(hero.url),
    has_cloudinary_hero: Boolean(hero.url && isCloudinaryUrl(hero.url)),
    has_tagline: Boolean(textFields.tagline && textFields.tagline.length >= 8),
    has_description: Boolean(textFields.description && textFields.description.length >= 24),
    has_mood_tags: moodTags.length >= 2,
    image_count: images.length,
    hero_image_url: hero.url,
    duplicate_key: duplicateKey,
    duplicate_group_size: duplicateGroupSize,
    blockers,
    warnings,
    recommendation,
    recommended_action: recommendedAction(recommendation, blockers, warnings),
  };
}

function chooseRecommendation(blockers: string[], warnings: string[], curationStatus: string): AuditDecision {
  const hardRemoveSignals = ['missing_or_invalid_geo', 'geo_outside_expected_city', 'missing_hero_image'];
  const hasHardRemoveSignal = blockers.some((blocker) => hardRemoveSignals.includes(blocker));
  if (warnings.includes('chain_or_generic_brand_candidate')) return 'review_remove';
  if (warnings.includes('possible_duplicate')) return 'review_remove';
  if (curationStatus === 'active' && hasHardRemoveSignal) return 'remove_candidate';
  if (blockers.length > 0) return 'fix';
  if (warnings.length > 0) return 'fix';
  return 'keep';
}

function recommendedAction(recommendation: AuditDecision, blockers: string[], warnings: string[]): string {
  if (recommendation === 'keep') return 'Keep in public catalog.';
  if (recommendation === 'remove_candidate') return `Manual removal/hide review recommended before more growth: ${blockers.join(', ') || warnings.join(', ')}`;
  if (recommendation === 'review_remove') return `Manual review recommended; likely not Korantis-fit or duplicate: ${warnings.join(', ')}`;
  return `Fix data before considering expansion: ${blockers.join(', ') || warnings.join(', ')}`;
}

async function readTable<T extends GenericRow>(supabase: SupabaseClient, table: string, limit?: number): Promise<TableRead<T>> {
  const rows: T[] = [];
  let from = 0;
  while (limit === undefined || rows.length < limit) {
    const to = limit === undefined ? from + PAGE_SIZE - 1 : Math.min(from + PAGE_SIZE - 1, limit - 1);
    const { data, error } = await supabase.from(table).select('*').range(from, to);
    if (error) {
      return { table, found: false, rows, error: error.message };
    }
    rows.push(...((data || []) as T[]));
    if (!data || data.length < PAGE_SIZE || (limit !== undefined && rows.length >= limit)) break;
    from += PAGE_SIZE;
  }
  return { table, found: true, rows };
}

function getSupabaseClient(): {
  client: SupabaseClient | null;
  urlPresent: boolean;
  keyPresent: boolean;
  usedServiceRole: boolean;
} {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const key = serviceKey || anonKey;
  return {
    client: url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null,
    urlPresent: Boolean(url),
    keyPresent: Boolean(key),
    usedServiceRole: Boolean(serviceKey),
  };
}

function buildDuplicateSizes(venues: GenericRow[]): Map<string, number> {
  const sizes = new Map<string, number>();
  for (const venue of venues) {
    const key = `${normalize(stringValue(venue.name))}|${normalize(readFirstString(venue.city, venue.canonical_data, venue.enrichment_data, 'city'))}`;
    if (!key.startsWith('|')) sizes.set(key, (sizes.get(key) || 0) + 1);
  }
  return sizes;
}

function buildDuplicateGroups(venues: GenericRow[]): PublicCatalogAuditResult['duplicate_groups'] {
  const grouped = groupBy(venues, (venue) => `${normalize(stringValue(venue.name))}|${normalize(readFirstString(venue.city, venue.canonical_data, venue.enrichment_data, 'city'))}`);
  return [...grouped.entries()]
    .filter(([key, rows]) => key !== '|' && rows.length > 1)
    .map(([key, rows]) => ({
      key,
      venues: rows.map((row) => ({
        id: stringValue(row.id),
        name: stringValue(row.name),
        status: stringValue(row.curation_status) || undefined,
      })),
    }));
}

function findHeroImage(venue: GenericRow, images: GenericRow[]): { url?: string; rightsStatus?: string } {
  const image = images.find((row) => row.role === 'hero' || row.is_cover === true || row.is_selected_hero === true) || images[0];
  const venueHero = stringValue(venue.hero_image);
  return {
    url: stringValue(image?.secure_url) || stringValue(image?.url) || venueHero || undefined,
    rightsStatus: stringValue(image?.rights_status),
  };
}

function extractTextFields(venue: GenericRow): { tagline: string; description: string } {
  const canonical = isRecord(venue.canonical_data) ? venue.canonical_data : {};
  const enrichment = isRecord(venue.enrichment_data) ? venue.enrichment_data : {};
  return {
    tagline: readFirstString(venue.tagline, canonical, enrichment, 'tagline'),
    description: readFirstString(venue.narrative, venue.description, venue.atmosphere_prose, canonical, enrichment, 'description', 'description_short', 'grounded_description'),
  };
}

function extractTags(venue: GenericRow): string[] {
  const rawValues = [venue.tags, venue.mood_tags];
  const canonical = isRecord(venue.canonical_data) ? venue.canonical_data : {};
  const enrichment = isRecord(venue.enrichment_data) ? venue.enrichment_data : {};
  rawValues.push(canonical.tags, canonical.mood_tags, enrichment.tags, enrichment.mood_tags);
  for (const raw of rawValues) {
    if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
    if (typeof raw === 'string' && raw.trim()) return raw.split(',').map((tag) => tag.trim()).filter(Boolean);
  }
  return [];
}

function readFirstString(...valuesAndKeys: unknown[]): string {
  const keys = valuesAndKeys.filter((value): value is string => typeof value === 'string' && ['city', 'neighborhood', 'category', 'tagline', 'description', 'description_short', 'grounded_description'].includes(value));
  for (const value of valuesAndKeys) {
    if (typeof value === 'string' && !keys.includes(value) && value.trim()) return value.trim();
    if (isRecord(value)) {
      for (const key of keys) {
        const nested = value[key];
        if (typeof nested === 'string' && nested.trim()) return nested.trim();
      }
    }
  }
  return '';
}

function readBatchId(venue: GenericRow): string | undefined {
  const metadata = isRecord(venue.publication_metadata) ? venue.publication_metadata : {};
  const canonical = isRecord(venue.canonical_data) ? venue.canonical_data : {};
  const enrichment = isRecord(venue.enrichment_data) ? venue.enrichment_data : {};
  return stringValue(venue.pipeline_batch_id) || stringValue(metadata.batch_id) || stringValue(canonical.batch_id) || stringValue(enrichment.batch_id) || undefined;
}

function parseCoordinates(value: unknown): { lat: number; lng: number } | null {
  if (!isRecord(value)) return null;
  const lat = numberValue(value.lat) ?? numberValue(value.latitude);
  const lng = numberValue(value.lng) ?? numberValue(value.longitude);
  if (lat === undefined || lng === undefined) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

function insideBounds(coordinates: { lat: number; lng: number }, bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }): boolean {
  return coordinates.lat >= bounds.minLat && coordinates.lat <= bounds.maxLat && coordinates.lng >= bounds.minLng && coordinates.lng <= bounds.maxLng;
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

function sortAuditRows(a: VenueAuditRow, b: VenueAuditRow): number {
  const rank: Record<AuditDecision, number> = {
    remove_candidate: 0,
    review_remove: 1,
    fix: 2,
    keep: 3,
  };
  return rank[a.recommendation] - rank[b.recommendation] || a.name.localeCompare(b.name);
}

function buildMissingEnvResult(clientInfo: ReturnType<typeof getSupabaseClient>): PublicCatalogAuditResult {
  return {
    generated_at: new Date().toISOString(),
    mode: 'read_only_public_catalog_audit',
    env: {
      supabase_url_present: clientInfo.urlPresent,
      supabase_key_present: clientInfo.keyPresent,
      used_service_role: clientInfo.usedServiceRole,
    },
    summary: {
      public_venues_read: 0,
      public_images_read: 0,
      staging_venues_read: 0,
      quality_scores_read: 0,
      active: 0,
      pending_review: 0,
      other_status: 0,
      keep: 0,
      fix: 0,
      review_remove: 0,
      remove_candidate: 0,
      missing_geo: 0,
      missing_hero: 0,
      missing_cloudinary_hero: 0,
      duplicates: 0,
      chain_or_generic_brand_candidates: 0,
    },
    table_reads: [],
    duplicate_groups: [],
    venue_audits: [],
    safety_checks: {
      read_only_supabase: true,
      no_supabase_writes: true,
      no_cloudinary_uploads: true,
      no_external_model_calls: true,
      no_publication_changes: true,
      no_consumer_ui_changes: true,
    },
  };
}

function writeOutputs(outputDir: string, result: PublicCatalogAuditResult): void {
  writeFileSync(path.join(outputDir, 'public_catalog_audit.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  writeFileSync(path.join(outputDir, 'public_catalog_audit_report.md'), buildReport(result), 'utf8');
}

function buildReport(result: PublicCatalogAuditResult): string {
  return [
    '# Korantis Public Catalog Audit',
    '',
    `- Generated: ${result.generated_at}`,
    `- Mode: ${result.mode}`,
    `- Supabase URL present: ${result.env.supabase_url_present ? 'yes' : 'no'}`,
    `- Supabase key present: ${result.env.supabase_key_present ? 'yes' : 'no'}`,
    `- Used service role: ${result.env.used_service_role ? 'yes' : 'no'}`,
    '',
    '## Summary',
    '',
    ...Object.entries(result.summary).map(([key, value]) => `- ${key}: ${value}`),
    '',
    '## Table Reads',
    '',
    '| Table | Found | Rows | Error |',
    '| --- | --- | ---: | --- |',
    ...result.table_reads.map((read) => `| ${read.table} | ${read.found ? 'yes' : 'no'} | ${read.rows} | ${escapeMd(read.error || '')} |`),
    '',
    '## Remove Candidates',
    '',
    ...rowsOrNone(result.venue_audits.filter((row) => row.recommendation === 'remove_candidate')),
    '',
    '## Review For Removal',
    '',
    ...rowsOrNone(result.venue_audits.filter((row) => row.recommendation === 'review_remove')),
    '',
    '## Fix Before Scaling',
    '',
    ...rowsOrNone(result.venue_audits.filter((row) => row.recommendation === 'fix').slice(0, 80)),
    '',
    '## Duplicate Groups',
    '',
    ...(result.duplicate_groups.length > 0
      ? result.duplicate_groups.map((group) => `- ${escapeMd(group.key)}: ${group.venues.map((venue) => `${venue.name} (${venue.id}, ${venue.status || 'unknown'})`).join('; ')}`)
      : ['- none']),
    '',
    '## Safety',
    '',
    ...Object.entries(result.safety_checks).map(([key, value]) => `- ${key}: ${value}`),
    '',
    '## Important',
    '',
    '- This report does not delete or hide venues.',
    '- Treat `remove_candidate` as a manual review queue, not an automatic deletion command.',
    '- Chain/generic brand detection is conservative and should be reviewed by a human.',
  ].join('\n') + '\n';
}

function rowsOrNone(rows: VenueAuditRow[]): string[] {
  if (rows.length === 0) return ['- none'];
  return rows.map((row) =>
    `- ${escapeMd(row.name)} (${row.id}): ${row.recommended_action}; blockers=${row.blockers.join(', ') || 'none'}; warnings=${row.warnings.join(', ') || 'none'}`,
  );
}

function isCloudinaryUrl(value: string): boolean {
  return value.startsWith('https://res.cloudinary.com/');
}

function isChainOrGenericBrand(name: string): boolean {
  const normalized = normalize(name);
  return CHAIN_OR_GENERIC_BRAND_TERMS.some((term) => normalized.includes(term));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function numberValue(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return undefined;
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function escapeMd(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

function parseArgs(argv: string[]): Partial<AuditOptions> {
  const options: Partial<AuditOptions> = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--output-dir') options.outputDir = path.resolve(argv[i + 1] || '');
    if (arg === '--limit') options.limit = Number(argv[i + 1] || '');
  }
  return options;
}

const currentFile = path.resolve(fileURLToPath(import.meta.url));
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : '';

if (currentFile === invokedFile) {
  auditPublicCatalog(parseArgs(process.argv.slice(2))).catch((error: unknown) => {
    console.error(`Public catalog audit failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
