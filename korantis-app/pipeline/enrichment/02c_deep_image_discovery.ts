import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { loadLocalEnv } from '../stages/01_extract_data';
import { findBestGooglePlace } from '../utils/google_places';
import { discoverGooglePlacesPhotoCandidates, discoverOfficialWebsiteImages, probeImageCandidate } from '../utils/image_downloader';
import { validateImageCandidates, type AcceptedImageCandidate, type RejectedImageCandidate } from '../validation/image_validator';
import {
  escapeMd,
  isRecord,
  normalizeText,
  safeNumber,
  safeString,
  type GenericVenueRow,
} from './utils/enrichment_types';
import type { ImageCandidate, VenueRaw, VenueType } from '../types';

type GalleryReviewStatus = 'ready_for_gallery_review' | 'needs_more_spatial_images' | 'blocked_gallery_quality';

interface GalleryReviewEntry {
  venue_id: string;
  venue_name: string;
  status: GalleryReviewStatus;
  current_hero_url?: string;
  selected_count: number;
  spatial_count: number;
  images: Array<{ resolved_image_url: string }>;
}

interface GalleryReviewManifest {
  entries: GalleryReviewEntry[];
}

interface Stage04ResultsFile {
  results?: Array<{ resolved_image_url?: string }>;
}

interface DeepDiscoveryResult {
  run_id: string;
  generated_at: string;
  deep_discovery_batch_id: string;
  mode: 'deep_image_discovery_read_only';
  venues_targeted: number;
  candidates_found: number;
  candidates_rejected: number;
  final_queue_size: number;
  candidates_per_venue: Record<string, number>;
  venues_with_candidates: string[];
  venues_with_zero_candidates: string[];
  source_breakdown: Record<string, number>;
  image_candidates: ImageCandidate[];
  final_vision_queue: AcceptedImageCandidate[];
  rejected_candidates: RejectedImageCandidate[];
  next_command?: string;
  safety: {
    no_supabase_writes: true;
    no_cloudinary_uploads: true;
    no_publication_changes: true;
    no_m3_calls: true;
  };
}

interface Options {
  runId: string;
  maxVenues: number;
  maxCandidatesPerVenue: number;
}

const PAGE_SIZE = 1000;

export async function runDeepImageDiscovery(options: Options): Promise<DeepDiscoveryResult> {
  loadLocalEnv();

  const outputDir = path.join(process.cwd(), 'data', 'enrichment', options.runId);
  const manifestPath = path.join(outputDir, 'gallery_review_manifest.json');
  if (!existsSync(manifestPath)) throw new Error(`Missing gallery review manifest: ${manifestPath}`);

  const manifest = readJson<GalleryReviewManifest>(manifestPath);
  const targets = manifest.entries
    .filter((entry) => entry.status !== 'ready_for_gallery_review')
    .sort((a, b) => a.spatial_count - b.spatial_count || a.selected_count - b.selected_count)
    .slice(0, options.maxVenues);
  const knownUrls = collectKnownUrls(manifest);

  const supabase = createSupabaseClient();
  if (!supabase) throw new Error('Missing Supabase read env.');
  const venuesRead = await readTable<GenericVenueRow>(supabase, 'venues');
  if (venuesRead.error) throw new Error(`Unable to read venues: ${venuesRead.error}`);
  const venuesById = new Map(venuesRead.rows.map((venue) => [safeString(venue.id), venue]));

  const googlePlacesApiKey = process.env.GOOGLE_PLACES_API_KEY;
  const imageCandidates: ImageCandidate[] = [];
  const classifiedUrls = collectClassifiedUrls(options.runId);

  for (const target of targets) {
    const venue = venuesById.get(target.venue_id);
    if (!venue) continue;
    const rawVenue = await hydrateVenueWithGooglePlace(toVenueRaw(venue, target), googlePlacesApiKey);
    const discovered = [
      ...discoverGooglePlacesPhotoCandidates(rawVenue),
      ...(await discoverOfficialWebsiteImages(rawVenue)),
    ];
    const prioritized = prioritizeDiscoveredCandidates(discovered)
      .filter((candidate) => !knownUrls.has(candidate.resolved_image_url))
      .filter((candidate) => !classifiedUrls.has(candidate.resolved_image_url))
      .slice(0, options.maxCandidatesPerVenue);

    for (const candidate of prioritized) {
      const probed = await probeImageCandidate(candidate, { googlePlacesApiKey });
      imageCandidates.push(probed.candidate);
    }
  }

  const validation = validateImageCandidates(imageCandidates, targets.map((target) => target.venue_name));
  const generatedAt = new Date().toISOString();
  const deepBatchId = `${options.runId}_deep_gallery`;
  const deepBatchDir = path.join(process.cwd(), 'data', 'batches', deepBatchId);
  const result: DeepDiscoveryResult = {
    run_id: options.runId,
    generated_at: generatedAt,
    deep_discovery_batch_id: deepBatchId,
    mode: 'deep_image_discovery_read_only',
    venues_targeted: targets.length,
    candidates_found: imageCandidates.length,
    candidates_rejected: validation.summary.rejected_count,
    final_queue_size: validation.summary.final_queue_size,
    candidates_per_venue: validation.summary.candidates_per_venue,
    venues_with_candidates: validation.summary.venues_with_candidates,
    venues_with_zero_candidates: validation.summary.venues_with_zero_candidates,
    source_breakdown: validation.summary.source_breakdown,
    image_candidates: imageCandidates,
    final_vision_queue: validation.final_queue,
    rejected_candidates: validation.rejected_candidates,
    next_command: validation.final_queue.length > 0 ? `npx tsx pipeline/stages/04_classify_images.ts ${deepBatchId} --max-images-per-venue ${options.maxCandidatesPerVenue}` : undefined,
    safety: {
      no_supabase_writes: true,
      no_cloudinary_uploads: true,
      no_publication_changes: true,
      no_m3_calls: true,
    },
  };

  mkdirSync(outputDir, { recursive: true });
  mkdirSync(deepBatchDir, { recursive: true });
  writeFileSync(path.join(outputDir, 'deep_image_candidates.json'), `${JSON.stringify(result.image_candidates, null, 2)}\n`, 'utf8');
  writeFileSync(path.join(outputDir, 'deep_image_queue.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  writeFileSync(path.join(outputDir, 'deep_image_report.md'), buildReport(result), 'utf8');
  writeFileSync(path.join(deepBatchDir, 'stage_03_final_vision_queue.json'), `${JSON.stringify({
    batch_id: deepBatchId,
    generated_at: generatedAt,
    ready_for_stage_04_m3: validation.final_queue.length > 0,
    queue: validation.final_queue,
    summary: {
      source: 'enrichment_deep_image_discovery',
      parent_run_id: options.runId,
      venues_targeted: targets.length,
      final_queue_size: validation.final_queue.length,
      source_breakdown: validation.summary.source_breakdown,
    },
  }, null, 2)}\n`, 'utf8');

  console.log(`Deep image candidates written to ${path.join(outputDir, 'deep_image_candidates.json')}`);
  console.log(`Deep image queue written to ${path.join(outputDir, 'deep_image_queue.json')}`);
  console.log(`Deep image report written to ${path.join(outputDir, 'deep_image_report.md')}`);
  console.log(`Reusable Stage 04 queue written to ${path.join(deepBatchDir, 'stage_03_final_vision_queue.json')}`);
  console.log(`E02C deep discovery summary: targeted=${result.venues_targeted}, candidates=${result.candidates_found}, queue=${result.final_queue_size}, rejected=${result.candidates_rejected}`);
  if (result.next_command) console.log(`Next command: ${result.next_command}`);
  return result;
}

async function hydrateVenueWithGooglePlace(venue: VenueRaw, googlePlacesApiKey?: string): Promise<VenueRaw> {
  if (discoverGooglePlacesPhotoCandidates(venue).length > 0) return venue;
  if (!googlePlacesApiKey?.trim()) return venue;

  const result = await findBestGooglePlace(
    {
      name: venue.name,
      neighborhood: venue.neighborhood,
      type: venue.type,
      google_maps_url: venue.google_maps_url,
      coordinates: venue.coordinates,
      address: venue.address,
    },
    {
      apiKey: googlePlacesApiKey,
      city: venue.city,
      regionCode: venue.city.toLowerCase().includes('buenos') ? 'AR' : undefined,
    },
  );
  if (!result.found) return venue;
  return {
    ...venue,
    ...result.venue,
    name: venue.name,
    website_url: venue.website_url || result.venue.website_url,
    google_maps_url: venue.google_maps_url || result.venue.google_maps_url,
  };
}

function toVenueRaw(venue: GenericVenueRow, target: GalleryReviewEntry): VenueRaw {
  const canonical = isRecord(venue.canonical_data) ? venue.canonical_data : {};
  const publication = isRecord(venue.publication_metadata) ? venue.publication_metadata : {};
  const coordinates = parseCoordinates(venue.coordinates);
  return {
    input: {
      name: target.venue_name,
      neighborhood: safeString(venue.neighborhood),
      type: normalizeVenueType(firstString(venue.category, canonical.category, canonical.type)),
      google_maps_url: firstString(publication.source_google_maps_url, canonical.google_maps_url),
      coordinates,
      address: firstString(venue.address, canonical.address),
    },
    name: target.venue_name,
    city: safeString(venue.city) || 'Buenos Aires',
    place_id: firstString(canonical.place_id, publication.place_id),
    address: firstString(venue.address, canonical.address),
    neighborhood: safeString(venue.neighborhood),
    type: normalizeVenueType(firstString(venue.category, canonical.category, canonical.type)),
    coordinates,
    google_maps_url: firstString(publication.source_google_maps_url, canonical.google_maps_url),
    google_place_types: asStringArray(canonical.google_place_types),
    website_url: firstString(venue.website, publication.source_website_url, canonical.website_url, canonical.website),
    instagram_url: firstString(venue.instagram_url, canonical.instagram_url),
    rating: safeNumber(canonical.rating),
    user_ratings_total: safeNumber(canonical.user_ratings_total),
    phone: firstString(venue.phone, canonical.phone),
    business_status: firstString(canonical.business_status),
    operational_status: 'operational',
    raw_google_place: isRecord(canonical.raw_google_place) ? canonical.raw_google_place : {},
  };
}

function prioritizeDiscoveredCandidates(candidates: ImageCandidate[]): ImageCandidate[] {
  return [...candidates].sort((a, b) => priorityScore(b) - priorityScore(a));
}

function priorityScore(candidate: ImageCandidate): number {
  const text = normalizeText([
    candidate.resolved_image_url,
    candidate.alt_text,
    candidate.source_page_context,
    candidate.source_type,
  ].map(safeString).join(' '));
  let score = 0;
  if (candidate.source_type === 'official_gallery') score += 50;
  if (candidate.source_type === 'official_website') score += 42;
  if (candidate.source_type === 'google_places') score += 30;
  if (/(interior|salon|dining|ambience|atmosphere|bar|terraza|patio|rooftop|gallery|press)/.test(text)) score += 24;
  if (/(food|dish|plate|menu|burger|pizza|coffee|cocktail|drink)/.test(text)) score -= 16;
  if ((candidate.width || 0) >= 1024 || (candidate.height || 0) >= 1024) score += 12;
  return score;
}

function collectKnownUrls(manifest: GalleryReviewManifest): Set<string> {
  const urls = new Set<string>();
  for (const entry of manifest.entries) {
    if (entry.current_hero_url) urls.add(entry.current_hero_url);
    for (const image of entry.images || []) {
      if (image.resolved_image_url) urls.add(image.resolved_image_url);
    }
  }
  return urls;
}

function collectClassifiedUrls(runId: string): Set<string> {
  const urls = new Set<string>();
  const batchIds = [`${runId}_gallery_expansion`, `${runId}_deep_gallery`];
  for (const batchId of batchIds) {
    const filePath = path.join(process.cwd(), 'data', 'batches', batchId, 'stage_04_vision_results.json');
    if (!existsSync(filePath)) continue;
    for (const result of readJson<Stage04ResultsFile>(filePath).results || []) {
      if (result.resolved_image_url) urls.add(result.resolved_image_url);
    }
  }
  return urls;
}

function buildReport(result: DeepDiscoveryResult): string {
  return [
    `# Deep Image Discovery - ${result.run_id}`,
    '',
    `- Generated: ${result.generated_at}`,
    `- Deep discovery batch: ${result.deep_discovery_batch_id}`,
    `- Venues targeted: ${result.venues_targeted}`,
    `- Candidates found/probed: ${result.candidates_found}`,
    `- Rejected before M3: ${result.candidates_rejected}`,
    `- Final M3 queue size: ${result.final_queue_size}`,
    '',
    '## Candidates Per Venue',
    '',
    ...Object.entries(result.candidates_per_venue).map(([venue, count]) => `- ${escapeMd(venue)}: ${count}`),
    '',
    '## Venues With Zero Candidates',
    '',
    ...(result.venues_with_zero_candidates.length > 0 ? result.venues_with_zero_candidates.map((venue) => `- ${escapeMd(venue)}`) : ['- none']),
    '',
    '## Source Breakdown',
    '',
    ...Object.entries(result.source_breakdown).map(([source, count]) => `- ${source}: ${count}`),
    '',
    '## Next Command',
    '',
    result.next_command ? '```powershell' : '- none',
    result.next_command || '',
    result.next_command ? '```' : '',
    '',
    '## Safety',
    '',
    ...Object.entries(result.safety).map(([key, value]) => `- ${key}: ${value}`),
  ].join('\n') + '\n';
}

async function readTable<T>(supabase: SupabaseClient, table: string): Promise<{ rows: T[]; error?: string }> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase.from(table).select('*').range(from, from + PAGE_SIZE - 1);
    if (error) return { rows, error: error.message };
    rows.push(...((data || []) as T[]));
    if (!data || data.length < PAGE_SIZE) break;
  }
  return { rows };
}

function createSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function parseCoordinates(value: unknown): { lat: number; lng: number } | undefined {
  if (!isRecord(value)) return undefined;
  const lat = safeNumber(value.lat) ?? safeNumber(value.latitude);
  const lng = safeNumber(value.lng) ?? safeNumber(value.longitude);
  return lat !== undefined && lng !== undefined ? { lat, lng } : undefined;
}

function firstString(...values: unknown[]): string {
  for (const value of values) {
    const item = safeString(value);
    if (item) return item;
  }
  return '';
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(safeString).filter(Boolean) : [];
}

function normalizeVenueType(value: string): VenueType | undefined {
  const normalized = normalizeText(value);
  if (normalized.includes('cafe')) return 'cafe';
  if (normalized.includes('bar')) return 'bar';
  if (normalized.includes('restaurant')) return 'restaurant';
  return undefined;
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, 'utf8')) as T;
}

function parseArgs(argv: string[]): Options {
  const valueAfter = (flag: string): string => {
    const index = argv.indexOf(flag);
    return index >= 0 ? safeString(argv[index + 1]) : '';
  };
  const runId = valueAfter('--run-id') || safeString(argv[0]);
  const maxVenues = Number(valueAfter('--max-venues') || '50');
  const maxCandidatesPerVenue = Number(valueAfter('--max-candidates-per-venue') || '32');
  if (!runId) throw new Error('Usage: npx tsx pipeline/enrichment/02c_deep_image_discovery.ts --run-id <run_id>');
  return {
    runId,
    maxVenues: Number.isFinite(maxVenues) && maxVenues > 0 ? maxVenues : 50,
    maxCandidatesPerVenue: Number.isFinite(maxCandidatesPerVenue) && maxCandidatesPerVenue > 0 ? maxCandidatesPerVenue : 32,
  };
}

const isCli = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isCli) {
  runDeepImageDiscovery(parseArgs(process.argv.slice(2))).catch((error: unknown) => {
    console.error(`E02C deep image discovery failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
