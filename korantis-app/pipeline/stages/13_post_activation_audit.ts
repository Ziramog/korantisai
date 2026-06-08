import { existsSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { loadLocalEnv } from './01_extract_data';

interface ActivationApplyResult {
  batch_id: string;
  venue_ids_written?: string[];
  checks?: Array<{ venue_id: string }>;
  activated?: number;
}

interface VenueRow {
  id: string;
  name?: string | null;
  city?: string | null;
  coordinates?: unknown;
  curation_status?: string | null;
  hero_image?: string | null;
  tagline?: string | null;
  narrative?: string | null;
  tags?: unknown;
  publication_metadata?: unknown;
}

interface ImageRow {
  venue_id: string;
  secure_url?: string | null;
  url?: string | null;
  role?: string | null;
  is_cover?: boolean | null;
  public_id?: string | null;
  rights_status?: string | null;
  status?: string | null;
  selection_data?: unknown;
}

interface CityBounds {
  min_lat: number;
  max_lat: number;
  min_lng: number;
  max_lng: number;
}

interface VenueAudit {
  venue_id: string;
  name?: string;
  city?: string;
  curation_status?: string;
  has_venue_row: boolean;
  has_active_status: boolean;
  has_valid_coordinates: boolean;
  coordinates_inside_city_bounds: boolean;
  has_tagline: boolean;
  has_narrative: boolean;
  has_tags: boolean;
  has_cloudinary_hero: boolean;
  cloudinary_hero_url?: string;
  cloudinary_url_resolves: boolean | null;
  publication_metadata_batch_match: boolean;
  blockers: string[];
  warnings: string[];
}

interface PostActivationAuditResult {
  batch_id: string;
  generated_at: string;
  mode: 'read_only_audit';
  requested: number;
  passed: number;
  failed: number;
  venue_audits: VenueAudit[];
  safety_checks: Record<string, boolean>;
}

const CITY_BOUNDS: Record<string, CityBounds> = {
  'buenos aires': { min_lat: -34.8, max_lat: -34.4, min_lng: -58.65, max_lng: -58.2 },
  'new york city': { min_lat: 40.45, max_lat: 40.95, min_lng: -74.3, max_lng: -73.65 },
  'new york': { min_lat: 40.45, max_lat: 40.95, min_lng: -74.3, max_lng: -73.65 },
  dubai: { min_lat: 24.75, max_lat: 25.45, min_lng: 54.85, max_lng: 55.65 },
};

export async function runPostActivationAudit(batchName: string): Promise<PostActivationAuditResult> {
  loadLocalEnv();

  const outputDir = path.join(process.cwd(), 'data', 'batches', batchName);
  const activationPath = path.join(outputDir, 'public_activation_apply_result.json');
  if (!existsSync(activationPath)) {
    throw new Error(`Missing activation apply result: ${activationPath}`);
  }

  const activation = readJson<ActivationApplyResult>(activationPath);
  const venueIds = unique([
    ...(activation.venue_ids_written || []),
    ...((activation.checks || []).map((check) => check.venue_id)),
  ]).filter(Boolean);
  if (venueIds.length === 0) throw new Error('Stage 13 found no activated venue ids to audit.');

  const supabase = createSupabaseClient();
  if (!supabase) throw new Error('Stage 13 requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL.');

  const [venues, images] = await Promise.all([
    fetchVenues(supabase, venueIds),
    fetchImages(supabase, venueIds),
  ]);

  const venuesById = new Map(venues.map((venue) => [venue.id, venue]));
  const imagesByVenue = groupImagesByVenue(images);
  const venueAudits = await Promise.all(venueIds.map((venueId) =>
    auditVenue(batchName, venueId, venuesById.get(venueId), imagesByVenue.get(venueId) || []),
  ));

  const result: PostActivationAuditResult = {
    batch_id: activation.batch_id || batchName,
    generated_at: new Date().toISOString(),
    mode: 'read_only_audit',
    requested: venueIds.length,
    passed: venueAudits.filter((audit) => audit.blockers.length === 0).length,
    failed: venueAudits.filter((audit) => audit.blockers.length > 0).length,
    venue_audits: venueAudits,
    safety_checks: {
      read_only_supabase: true,
      no_supabase_writes: true,
      no_cloudinary_uploads: true,
      no_external_model_calls: true,
      no_consumer_ui_changes: true,
      no_deploy: true,
    },
  };

  writeFileSync(path.join(outputDir, 'post_activation_audit.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  writeFileSync(path.join(outputDir, 'post_activation_audit_report.md'), buildReport(result), 'utf8');
  console.log(`Post-activation audit JSON written to ${path.join(outputDir, 'post_activation_audit.json')}`);
  console.log(`Post-activation audit report written to ${path.join(outputDir, 'post_activation_audit_report.md')}`);
  console.log(`Stage 13 audit summary: requested=${result.requested}, passed=${result.passed}, failed=${result.failed}`);
  return result;
}

async function fetchVenues(supabase: SupabaseClient, venueIds: string[]): Promise<VenueRow[]> {
  const { data, error } = await supabase
    .from('venues')
    .select('id,name,city,coordinates,curation_status,hero_image,tagline,narrative,tags,publication_metadata')
    .in('id', venueIds);
  if (error) throw new Error(`Stage 13 venues read failed: ${error.message}`);
  return (data || []) as VenueRow[];
}

async function fetchImages(supabase: SupabaseClient, venueIds: string[]): Promise<ImageRow[]> {
  const { data, error } = await supabase
    .from('venue_images')
    .select('venue_id,secure_url,url,role,is_cover,public_id,rights_status,status,selection_data')
    .in('venue_id', venueIds);
  if (error) throw new Error(`Stage 13 venue_images read failed: ${error.message}`);
  return (data || []) as ImageRow[];
}

async function auditVenue(batchName: string, venueId: string, venue: VenueRow | undefined, images: ImageRow[]): Promise<VenueAudit> {
  const heroImages = images.filter((image) => image.role === 'hero' || image.is_cover);
  const cloudinaryHero = heroImages.find((image) => isCloudinaryUrl(image.secure_url || image.url));
  const coordinates = parseCoordinates(venue?.coordinates);
  const city = venue?.city || undefined;
  const bounds = city ? CITY_BOUNDS[normalize(city)] : undefined;
  const metadata = isRecord(venue?.publication_metadata) ? venue.publication_metadata : {};
  const blockers: string[] = [];
  const warnings: string[] = [];

  const hasVenueRow = Boolean(venue);
  const hasActiveStatus = venue?.curation_status === 'active';
  const hasValidCoordinates = Boolean(coordinates);
  const insideBounds = Boolean(coordinates && (!bounds || coordinatesInsideBounds(coordinates, bounds)));
  const hasTags = Array.isArray(venue?.tags) ? venue.tags.length > 0 : typeof venue?.tags === 'string' && venue.tags.trim().length > 0;
  const metadataBatchMatch = String(metadata.batch_id || '') === batchName;
  const cloudinaryUrlResolves = cloudinaryHero ? await urlResolves(cloudinaryHero.secure_url || cloudinaryHero.url || '') : null;

  if (!hasVenueRow) blockers.push('venue_row_missing');
  if (hasVenueRow && !hasActiveStatus) blockers.push(`status_not_active:${venue?.curation_status || 'missing'}`);
  if (hasVenueRow && !metadataBatchMatch) blockers.push('publication_metadata_batch_mismatch');
  if (!hasValidCoordinates) blockers.push('invalid_or_missing_coordinates');
  if (hasValidCoordinates && bounds && !insideBounds) blockers.push('coordinates_outside_city_bounds');
  if (!venue?.name) blockers.push('missing_name');
  if (!venue?.city) blockers.push('missing_city');
  if (!venue?.tagline || venue.tagline.trim().length < 8) blockers.push('missing_or_short_tagline');
  if (!venue?.narrative || venue.narrative.trim().length < 20) blockers.push('missing_or_short_narrative');
  if (!hasTags) blockers.push('missing_tags');
  if (!cloudinaryHero) blockers.push('missing_cloudinary_hero');
  if (cloudinaryUrlResolves === false) blockers.push('cloudinary_hero_url_not_resolving');
  if (city && !bounds) warnings.push('city_bounds_not_configured');

  return {
    venue_id: venueId,
    name: venue?.name || undefined,
    city,
    curation_status: venue?.curation_status || undefined,
    has_venue_row: hasVenueRow,
    has_active_status: hasActiveStatus,
    has_valid_coordinates: hasValidCoordinates,
    coordinates_inside_city_bounds: insideBounds,
    has_tagline: Boolean(venue?.tagline && venue.tagline.trim().length >= 8),
    has_narrative: Boolean(venue?.narrative && venue.narrative.trim().length >= 20),
    has_tags: hasTags,
    has_cloudinary_hero: Boolean(cloudinaryHero),
    cloudinary_hero_url: cloudinaryHero?.secure_url || cloudinaryHero?.url || undefined,
    cloudinary_url_resolves: cloudinaryUrlResolves,
    publication_metadata_batch_match: metadataBatchMatch,
    blockers,
    warnings,
  };
}

function groupImagesByVenue(images: ImageRow[]): Map<string, ImageRow[]> {
  const grouped = new Map<string, ImageRow[]>();
  for (const image of images) {
    const list = grouped.get(image.venue_id) || [];
    list.push(image);
    grouped.set(image.venue_id, list);
  }
  return grouped;
}

function parseCoordinates(value: unknown): { lat: number; lng: number } | null {
  if (!isRecord(value)) return null;
  const lat = numberValue(value.lat ?? value.latitude);
  const lng = numberValue(value.lng ?? value.longitude);
  return lat === null || lng === null ? null : { lat, lng };
}

function coordinatesInsideBounds(coordinates: { lat: number; lng: number }, bounds: CityBounds): boolean {
  return coordinates.lat >= bounds.min_lat &&
    coordinates.lat <= bounds.max_lat &&
    coordinates.lng >= bounds.min_lng &&
    coordinates.lng <= bounds.max_lng;
}

async function urlResolves(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(8000),
    });
    const contentType = response.headers.get('content-type') || '';
    return response.ok && contentType.startsWith('image/');
  } catch {
    return false;
  }
}

function isCloudinaryUrl(value: unknown): boolean {
  return typeof value === 'string' && value.startsWith('https://res.cloudinary.com/');
}

function createSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function buildReport(result: PostActivationAuditResult): string {
  return [
    `# Stage 13 Post-Activation Audit - ${result.batch_id}`,
    '',
    `- Generated: ${result.generated_at}`,
    `- Requested: ${result.requested}`,
    `- Passed: ${result.passed}`,
    `- Failed: ${result.failed}`,
    `- Mode: ${result.mode}`,
    '',
    '## Venue Audits',
    '',
    '| Venue | Status | Coordinates | Bounds | Cloudinary Hero | URL Resolves | Batch Match | Blockers | Warnings |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...result.venue_audits.map((audit) => [
      escapeMd(audit.name || audit.venue_id),
      escapeMd(audit.curation_status || ''),
      audit.has_valid_coordinates ? 'yes' : 'no',
      audit.coordinates_inside_city_bounds ? 'yes' : 'no',
      audit.has_cloudinary_hero ? 'yes' : 'no',
      audit.cloudinary_url_resolves === null ? 'n/a' : audit.cloudinary_url_resolves ? 'yes' : 'no',
      audit.publication_metadata_batch_match ? 'yes' : 'no',
      escapeMd(audit.blockers.join(', ') || 'none'),
      escapeMd(audit.warnings.join(', ') || 'none'),
    ].join(' | ')).map((row) => `| ${row} |`),
    '',
    '## Safety',
    '',
    ...Object.entries(result.safety_checks).map(([key, value]) => `- ${key}: ${value}`),
  ].join('\n');
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, 'utf8')) as T;
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function numberValue(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function normalize(value: string): string {
  return value.toLowerCase().trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function escapeMd(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

const isDirectRun = process.argv[1] ? fileURLToPath(import.meta.url) === path.resolve(process.argv[1]) : false;

if (isDirectRun) {
  const [, , batchName] = process.argv;
  if (!batchName) {
    console.error('Usage: npx tsx pipeline/stages/13_post_activation_audit.ts <batch_id>');
    process.exit(1);
  }

  runPostActivationAudit(batchName).catch((error: unknown) => {
    console.error(`Stage 13 post-activation audit failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  });
}
