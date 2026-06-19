import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
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
  type EnrichmentTargetsResult,
  type EnrichmentTarget,
  type GenericImageRow,
  type GenericVenueRow,
} from './utils/enrichment_types';

type GalleryRole =
  | 'hero_interior'
  | 'hero_exterior'
  | 'gallery_atmosphere'
  | 'gallery_bar_area'
  | 'gallery_seating'
  | 'gallery_terrace_rooftop'
  | 'gallery_detail_texture'
  | 'gallery_exterior_context'
  | 'supporting_food_drink'
  | 'rejected_generic'
  | 'rejected_quality'
  | 'rejected_irrelevant';

type RightsStatus =
  | 'google_places_attribution_required'
  | 'official_website_assumed_ok'
  | 'existing_cloudinary_ok'
  | 'unknown_requires_review'
  | 'rejected_rights_risk';

interface Stage04VisionRecord {
  venue_name: string;
  resolved_image_url: string;
  source_url: string;
  source_type: string;
  width: number;
  height: number;
  ok_photo: boolean;
  skip_reason?: string | null;
  model_used?: string;
  vision?: {
    scene_type?: string;
    shows_space?: boolean;
    is_hero_usable?: boolean;
    is_product_only?: boolean;
    has_identifiable_faces?: boolean;
    quality?: string;
    atmosphere_signal?: string;
    visual_reason?: string;
  } | null;
  risk_flags?: string[];
  selected_for_hero?: boolean;
}

interface GalleryCandidate {
  candidate_id: string;
  venue_id: string;
  venue_name: string;
  source_batch_id?: string;
  source_url: string;
  resolved_image_url: string;
  source_type: string;
  source_origin: 'stage_04_vision' | 'existing_cloudinary' | 'publication_metadata';
  width: number;
  height: number;
  role: GalleryRole;
  role_confidence: number;
  quality_score: number;
  composition_score: number;
  lighting_score: number;
  atmosphere_score: number;
  resolution_adequate: boolean;
  has_identifiable_faces: boolean;
  has_text_overlay: boolean;
  has_watermark: boolean;
  is_screenshot: boolean;
  is_collage: boolean;
  perceptual_hash?: string;
  is_near_duplicate_of?: string;
  rights_status: RightsStatus;
  rights_notes?: string;
  current_public_hero: boolean;
  current_public_image: boolean;
  rejection_reasons: string[];
  selection_score: number;
  selection_reason: string[];
  raw_vision?: Stage04VisionRecord['vision'];
}

interface VenueGallerySelection {
  venue_id: string;
  venue_name: string;
  current_hero_url?: string;
  selected_gallery_images: Array<GalleryCandidate & { gallery_rank: number }>;
  rejected_candidates: GalleryCandidate[];
  warnings: string[];
}

interface GalleryDiscoveryResult {
  run_id: string;
  generated_at: string;
  mode: 'read_only_gallery_discovery_existing_classifications';
  targets: number;
  candidates_found: number;
  candidates_selectable: number;
  venues_with_gallery_selection: number;
  total_gallery_images_selected: number;
  source_batches_used: string[];
  candidates: GalleryCandidate[];
  selections: VenueGallerySelection[];
  safety: {
    read_only_supabase: true;
    no_supabase_writes: true;
    no_cloudinary_uploads: true;
    no_m3_calls: true;
    no_external_model_calls: true;
    no_publication_changes: true;
  };
}

interface Options {
  runId: string;
  maxGalleryImages: number;
}

interface TableRead<T> {
  rows: T[];
  error?: string;
}

const PAGE_SIZE = 1000;
const REJECT_ROLES = new Set<GalleryRole>(['rejected_generic', 'rejected_quality', 'rejected_irrelevant']);

export async function discoverGallery(options: Options): Promise<GalleryDiscoveryResult> {
  loadLocalEnv();

  const outputDir = path.join(process.cwd(), 'data', 'enrichment', options.runId);
  const targetsPath = path.join(outputDir, 'enrichment_targets.json');
  if (!existsSync(targetsPath)) throw new Error(`Missing enrichment targets: ${targetsPath}`);
  const targetsResult = readJson<EnrichmentTargetsResult>(targetsPath);

  const supabase = createSupabaseClient();
  if (!supabase) throw new Error('Missing Supabase read env.');
  const [venuesRead, imagesRead] = await Promise.all([
    readTable<GenericVenueRow>(supabase, 'venues'),
    readTable<GenericImageRow>(supabase, 'venue_images'),
  ]);
  if (venuesRead.error) throw new Error(`Unable to read venues: ${venuesRead.error}`);
  if (imagesRead.error) throw new Error(`Unable to read venue_images: ${imagesRead.error}`);

  const venuesById = new Map(venuesRead.rows.map((venue) => [safeString(venue.id), venue]));
  const imagesByVenue = groupBy(imagesRead.rows, (image) => safeString(image.venue_id));
  const candidates: GalleryCandidate[] = [];
  const sourceBatches = new Set<string>();

  for (const target of targetsResult.targets) {
    const venue = venuesById.get(target.venue_id);
    if (!venue) continue;
    const currentImages = imagesByVenue.get(target.venue_id) || [];
    const currentHero = safeString(venue.hero_image);
    const imageSourceUrl = safeString(nested(venue.publication_metadata, 'image_source_url'));
    const batchId = safeString(nested(venue.publication_metadata, 'batch_id'));

    candidates.push(...currentImages.map((image) => fromExistingImage(target, image, currentHero)));
    if (imageSourceUrl) candidates.push(fromPublicationMetadataImage(target, venue, imageSourceUrl, currentHero));

    if (batchId) {
      const stage04 = readStage04Results(batchId);
      if (stage04.length > 0) sourceBatches.add(batchId);
      const targetKey = normalizeText(target.venue_name);
      for (const record of stage04.filter((item) => normalizeText(item.venue_name) === targetKey)) {
        candidates.push(fromStage04Record(target, record, batchId, currentHero, imageSourceUrl));
      }
    }
  }

  for (const enrichmentBatchId of readEnrichmentVisionBatchIds(outputDir)) {
    const stage04 = readStage04Results(enrichmentBatchId);
    if (stage04.length > 0) sourceBatches.add(enrichmentBatchId);
    for (const target of targetsResult.targets) {
      const venue = venuesById.get(target.venue_id);
      if (!venue) continue;
      const currentHero = safeString(venue.hero_image);
      const imageSourceUrl = safeString(nested(venue.publication_metadata, 'image_source_url'));
      const targetKey = normalizeText(target.venue_name);
      for (const record of stage04.filter((item) => normalizeText(item.venue_name) === targetKey)) {
        candidates.push(fromStage04Record(target, record, enrichmentBatchId, currentHero, imageSourceUrl));
      }
    }
  }

  const dedupedCandidates = dedupeCandidates(candidates);
  const selections = targetsResult.targets.map((target) =>
    selectGalleryForVenue(
      target,
      dedupedCandidates.filter((candidate) => candidate.venue_id === target.venue_id),
      options.maxGalleryImages,
    ),
  );

  const result: GalleryDiscoveryResult = {
    run_id: options.runId,
    generated_at: new Date().toISOString(),
    mode: 'read_only_gallery_discovery_existing_classifications',
    targets: targetsResult.targets.length,
    candidates_found: dedupedCandidates.length,
    candidates_selectable: dedupedCandidates.filter((candidate) => candidate.rejection_reasons.length === 0).length,
    venues_with_gallery_selection: selections.filter((selection) => selection.selected_gallery_images.length > 0).length,
    total_gallery_images_selected: selections.reduce((sum, selection) => sum + selection.selected_gallery_images.length, 0),
    source_batches_used: [...sourceBatches].sort(),
    candidates: dedupedCandidates,
    selections,
    safety: {
      read_only_supabase: true,
      no_supabase_writes: true,
      no_cloudinary_uploads: true,
      no_m3_calls: true,
      no_external_model_calls: true,
      no_publication_changes: true,
    },
  };

  mkdirSync(outputDir, { recursive: true });
  writeFileSync(path.join(outputDir, 'gallery_candidates.json'), `${JSON.stringify(result.candidates, null, 2)}\n`, 'utf8');
  writeFileSync(path.join(outputDir, 'gallery_selection.json'), `${JSON.stringify(result.selections, null, 2)}\n`, 'utf8');
  writeFileSync(path.join(outputDir, 'gallery_rejections.json'), `${JSON.stringify(result.candidates.filter((candidate) => candidate.rejection_reasons.length > 0), null, 2)}\n`, 'utf8');
  writeFileSync(path.join(outputDir, 'gallery_report.md'), buildReport(result), 'utf8');

  console.log(`Gallery candidates written to ${path.join(outputDir, 'gallery_candidates.json')}`);
  console.log(`Gallery selection written to ${path.join(outputDir, 'gallery_selection.json')}`);
  console.log(`Gallery report written to ${path.join(outputDir, 'gallery_report.md')}`);
  console.log(`E02 gallery summary: targets=${result.targets}, candidates=${result.candidates_found}, selectable=${result.candidates_selectable}, venues_with_gallery=${result.venues_with_gallery_selection}, selected=${result.total_gallery_images_selected}`);
  return result;
}

function fromExistingImage(target: EnrichmentTarget, image: GenericImageRow, currentHero: string): GalleryCandidate {
  const url = firstString(image.secure_url, image.url);
  return scoreCandidate({
    candidate_id: candidateId(target.venue_id, url || safeString(image.id)),
    venue_id: target.venue_id,
    venue_name: target.venue_name,
    source_url: url,
    resolved_image_url: url,
    source_type: safeString(image.source_origin) || 'existing_cloudinary',
    source_origin: 'existing_cloudinary',
    width: 0,
    height: 0,
    role: safeString(image.role) === 'hero' ? 'hero_interior' : 'gallery_atmosphere',
    role_confidence: 0.5,
    quality_score: safeNumber(image.quality_score) ?? 0.55,
    composition_score: 0.5,
    lighting_score: 0.5,
    atmosphere_score: 0.5,
    resolution_adequate: true,
    has_identifiable_faces: false,
    has_text_overlay: false,
    has_watermark: false,
    is_screenshot: false,
    is_collage: false,
    rights_status: 'existing_cloudinary_ok',
    current_public_hero: Boolean(currentHero && url === currentHero),
    current_public_image: true,
    rejection_reasons: [],
    selection_score: 0,
    selection_reason: [],
  });
}

function fromPublicationMetadataImage(target: EnrichmentTarget, venue: GenericVenueRow, imageUrl: string, currentHero: string): GalleryCandidate {
  return scoreCandidate({
    candidate_id: candidateId(target.venue_id, imageUrl),
    venue_id: target.venue_id,
    venue_name: target.venue_name,
    source_url: safeString(nested(venue.publication_metadata, 'source_google_maps_url')),
    resolved_image_url: imageUrl,
    source_type: 'google_places',
    source_origin: 'publication_metadata',
    width: 0,
    height: 0,
    role: 'hero_interior',
    role_confidence: 0.55,
    quality_score: 0.6,
    composition_score: 0.55,
    lighting_score: 0.55,
    atmosphere_score: 0.55,
    resolution_adequate: true,
    has_identifiable_faces: false,
    has_text_overlay: false,
    has_watermark: false,
    is_screenshot: false,
    is_collage: false,
    rights_status: 'google_places_attribution_required',
    rights_notes: 'Google Places photo requires attribution/compliance review.',
    current_public_hero: Boolean(currentHero && imageUrl === currentHero),
    current_public_image: false,
    rejection_reasons: [],
    selection_score: 0,
    selection_reason: [],
  });
}

function fromStage04Record(target: EnrichmentTarget, record: Stage04VisionRecord, batchId: string, currentHero: string, currentSourceHero: string): GalleryCandidate {
  const role = mapSceneToRole(record.vision?.scene_type || '');
  const rightsStatus = rightsFor(record.source_type);
  return scoreCandidate({
    candidate_id: candidateId(target.venue_id, record.resolved_image_url),
    venue_id: target.venue_id,
    venue_name: target.venue_name,
    source_batch_id: batchId,
    source_url: record.source_url,
    resolved_image_url: record.resolved_image_url,
    source_type: record.source_type,
    source_origin: 'stage_04_vision',
    width: record.width || 0,
    height: record.height || 0,
    role,
    role_confidence: record.vision ? 0.85 : 0,
    quality_score: qualityScore(record.vision?.quality),
    composition_score: qualityScore(record.vision?.quality),
    lighting_score: qualityScore(record.vision?.quality),
    atmosphere_score: record.vision?.atmosphere_signal && record.vision.atmosphere_signal !== 'none' ? 0.75 : 0.45,
    resolution_adequate: Math.min(record.width || 0, record.height || 0) >= 800 || Math.max(record.width || 0, record.height || 0) >= 1024,
    has_identifiable_faces: Boolean(record.vision?.has_identifiable_faces),
    has_text_overlay: false,
    has_watermark: false,
    is_screenshot: false,
    is_collage: false,
    rights_status: rightsStatus,
    rights_notes: rightsStatus === 'google_places_attribution_required' ? 'Google Places photo requires attribution/compliance review.' : undefined,
    current_public_hero: Boolean((currentHero && record.resolved_image_url === currentHero) || (currentSourceHero && record.resolved_image_url === currentSourceHero)),
    current_public_image: false,
    rejection_reasons: rejectReasons(record, role),
    selection_score: 0,
    selection_reason: [],
    raw_vision: record.vision || undefined,
  });
}

function selectGalleryForVenue(target: EnrichmentTarget, candidates: GalleryCandidate[], maxGalleryImages: number): VenueGallerySelection {
  const rejected = candidates.filter((candidate) => candidate.rejection_reasons.length > 0 || candidate.current_public_hero);
  const selected: Array<GalleryCandidate & { gallery_rank: number }> = [];
  const seenRoles = new Set<string>();
  const selectable = candidates
    .filter((candidate) => candidate.rejection_reasons.length === 0)
    .filter((candidate) => !candidate.current_public_hero)
    .sort((a, b) => b.selection_score - a.selection_score);

  const spatialCandidates = selectable.filter((candidate) => isSpatialGalleryRole(candidate.role));
  const supportCandidates = selectable.filter((candidate) => candidate.role === 'supporting_food_drink');

  for (const candidate of spatialCandidates) {
    if (selected.length >= maxGalleryImages) break;
    const roleGroup = roleDiversityGroup(candidate.role);
    if (selected.length >= 2 && seenRoles.has(roleGroup) && selectable.length > maxGalleryImages) continue;
    selected.push({ ...candidate, gallery_rank: selected.length + 2 });
    seenRoles.add(roleGroup);
  }

  const needsSupportImage = selected.length < Math.min(3, maxGalleryImages);
  if (needsSupportImage && supportCandidates.length > 0 && selected.length < maxGalleryImages) {
    selected.push({ ...supportCandidates[0], gallery_rank: selected.length + 2 });
    seenRoles.add(roleDiversityGroup(supportCandidates[0].role));
  }

  return {
    venue_id: target.venue_id,
    venue_name: target.venue_name,
    current_hero_url: target.current.hero_image_url,
    selected_gallery_images: selected,
    rejected_candidates: rejected.slice(0, 20),
    warnings: [
      ...(selected.length === 0 ? ['no_gallery_images_selected_from_existing_classifications'] : []),
      ...(selected.length > 0 && selected.length < 3 ? ['gallery_selection_below_target_3'] : []),
      ...(supportCandidates.length > 0 && selected.filter((image) => image.role === 'supporting_food_drink').length === 0 ? ['food_drink_images_available_but_not_selected'] : []),
    ],
  };
}

function scoreCandidate(candidate: GalleryCandidate): GalleryCandidate {
  const reasons: string[] = [];
  let score = 0;
  if (candidate.current_public_hero) {
    candidate.rejection_reasons.push('same_as_current_public_hero');
  }
  if (!candidate.resolved_image_url) candidate.rejection_reasons.push('missing_image_url');
  if (REJECT_ROLES.has(candidate.role)) candidate.rejection_reasons.push(`rejected_role:${candidate.role}`);
  if (candidate.has_watermark) candidate.rejection_reasons.push('watermark');
  if (candidate.is_screenshot) candidate.rejection_reasons.push('screenshot');
  if (candidate.is_collage) candidate.rejection_reasons.push('collage');
  if (candidate.has_identifiable_faces && candidate.role === 'hero_interior') candidate.rejection_reasons.push('identifiable_faces');
  if (!candidate.resolution_adequate && candidate.source_origin === 'stage_04_vision') candidate.rejection_reasons.push('below_gallery_resolution');

  const roleScore = roleBaseScore(candidate.role);
  score += roleScore;
  reasons.push(`role:${candidate.role}+${roleScore}`);

  const quality = Math.round(candidate.quality_score * 30);
  score += quality;
  reasons.push(`quality:${candidate.quality_score}+${quality}`);

  const atmosphere = Math.round(candidate.atmosphere_score * 18);
  score += atmosphere;
  reasons.push(`atmosphere:${candidate.atmosphere_score}+${atmosphere}`);

  if (candidate.resolution_adequate) {
    score += 8;
    reasons.push('resolution_ok+8');
  }
  if (candidate.rights_status === 'existing_cloudinary_ok') {
    score += 8;
    reasons.push('rights:existing_cloudinary+8');
  } else if (candidate.rights_status === 'official_website_assumed_ok') {
    score += 6;
    reasons.push('rights:official+6');
  } else if (candidate.rights_status === 'google_places_attribution_required') {
    score += 4;
    reasons.push('rights:google_places+4');
  }

  return {
    ...candidate,
    rejection_reasons: [...new Set(candidate.rejection_reasons)],
    selection_score: score,
    selection_reason: reasons,
  };
}

function rejectReasons(record: Stage04VisionRecord, role: GalleryRole): string[] {
  const reasons: string[] = [];
  const heroOnlySkip = record.skip_reason?.startsWith('not_hero_usable_') && role !== 'rejected_irrelevant';
  if (!record.ok_photo && !heroOnlySkip) reasons.push(record.skip_reason || 'not_ok_photo');
  if (!record.vision) reasons.push('missing_vision');
  if (record.vision?.is_product_only && role !== 'supporting_food_drink') reasons.push('product_only');
  if (!record.vision?.shows_space && role !== 'supporting_food_drink') reasons.push('does_not_show_space');
  if (looksLikeHotelRoom(record.vision?.visual_reason || '')) reasons.push('non_venue_hotel_room');
  if (['logo', 'menu', 'crowd', 'decorative', 'unusable'].includes(record.vision?.scene_type || '')) reasons.push(`rejected_scene:${record.vision?.scene_type}`);
  if (Math.max(record.width || 0, record.height || 0) < 512) reasons.push('below_min_resolution');
  return reasons;
}

function looksLikeHotelRoom(visualReason: string): boolean {
  const text = ` ${normalizeText(visualReason)} `;
  return [
    ' hotel room ',
    ' guest room ',
    ' bedroom ',
    ' unmade bed ',
    ' bed corner ',
    ' bed visible ',
    ' room with bed ',
  ].some((term) => text.includes(term)) || /\sbed\s/.test(text);
}

function buildReport(result: GalleryDiscoveryResult): string {
  return [
    `# Enrichment Gallery Discovery - ${result.run_id}`,
    '',
    `- Generated: ${result.generated_at}`,
    `- Mode: ${result.mode}`,
    `- Targets: ${result.targets}`,
    `- Candidates found: ${result.candidates_found}`,
    `- Selectable candidates: ${result.candidates_selectable}`,
    `- Venues with gallery selection: ${result.venues_with_gallery_selection}`,
    `- Total gallery images selected: ${result.total_gallery_images_selected}`,
    `- Source batches used: ${result.source_batches_used.join(', ') || 'none'}`,
    '',
    '## Venue Selections',
    '',
    '| Venue | Selected | Candidate Count | Warnings |',
    '| --- | ---: | ---: | --- |',
    ...result.selections.map((selection) => {
      const count = result.candidates.filter((candidate) => candidate.venue_id === selection.venue_id).length;
      return `| ${escapeMd(selection.venue_name)} | ${selection.selected_gallery_images.length} | ${count} | ${escapeMd(selection.warnings.join(', ') || 'none')} |`;
    }),
    '',
    '## Selected Images',
    '',
    ...result.selections.flatMap((selection) =>
      selection.selected_gallery_images.length > 0
        ? selection.selected_gallery_images.map((image) => `- ${escapeMd(selection.venue_name)} rank ${image.gallery_rank}: ${image.role}, score ${image.selection_score}, ${image.resolved_image_url}`)
        : [`- ${escapeMd(selection.venue_name)}: none`],
    ),
    '',
    '## Safety',
    '',
    ...Object.entries(result.safety).map(([key, value]) => `- ${key}: ${value}`),
  ].join('\n') + '\n';
}

function readStage04Results(batchId: string): Stage04VisionRecord[] {
  const filePath = path.join(process.cwd(), 'data', 'batches', batchId, 'stage_04_vision_results.json');
  if (!existsSync(filePath)) return [];
  const parsed = readJson<{ results?: Stage04VisionRecord[]; vision_results?: Stage04VisionRecord[] }>(filePath);
  return parsed.results || parsed.vision_results || [];
}

function readEnrichmentVisionBatchIds(outputDir: string): string[] {
  const specs = [
    { file: 'gallery_expansion_queue.json', key: 'expansion_batch_id' },
    { file: 'deep_image_queue.json', key: 'deep_discovery_batch_id' },
  ];
  const batchIds = specs.map((spec) => {
    const filePath = path.join(outputDir, spec.file);
    if (!existsSync(filePath)) return '';
    try {
      const parsed = JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, unknown>;
      return safeString(parsed[spec.key]);
    } catch {
      return '';
    }
  }).filter(Boolean);
  return [...new Set(batchIds)];
}

async function readTable<T>(supabase: SupabaseClient, table: string): Promise<TableRead<T>> {
  const rows: T[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase.from(table).select('*').range(from, from + PAGE_SIZE - 1);
    if (error) return { rows, error: error.message };
    rows.push(...((data || []) as T[]));
    if (!data || data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return { rows };
}

function createSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function mapSceneToRole(scene: string): GalleryRole {
  if (scene === 'hero_interior') return 'hero_interior';
  if (scene === 'gallery_atmosphere') return 'gallery_atmosphere';
  if (scene === 'hero_exterior') return 'gallery_exterior_context';
  if (scene === 'product_food') return 'supporting_food_drink';
  if (['logo', 'menu', 'crowd', 'decorative', 'unusable'].includes(scene)) return 'rejected_irrelevant';
  return 'gallery_atmosphere';
}

function rightsFor(sourceType: string): RightsStatus {
  if (sourceType === 'google_places') return 'google_places_attribution_required';
  if (sourceType === 'official_website' || sourceType === 'official_gallery') return 'official_website_assumed_ok';
  if (sourceType === 'existing_cloudinary') return 'existing_cloudinary_ok';
  return 'unknown_requires_review';
}

function qualityScore(quality: string | undefined): number {
  if (quality === 'high') return 0.85;
  if (quality === 'acceptable') return 0.65;
  if (quality === 'low') return 0.35;
  return 0.45;
}

function roleBaseScore(role: GalleryRole): number {
  if (role === 'gallery_atmosphere') return 70;
  if (role === 'gallery_bar_area') return 68;
  if (role === 'gallery_seating') return 66;
  if (role === 'hero_interior') return 64;
  if (role === 'gallery_terrace_rooftop') return 62;
  if (role === 'gallery_exterior_context') return 48;
  if (role === 'gallery_detail_texture') return 45;
  if (role === 'supporting_food_drink') return 28;
  return 0;
}

function isSpatialGalleryRole(role: GalleryRole): boolean {
  return [
    'hero_interior',
    'gallery_atmosphere',
    'gallery_bar_area',
    'gallery_seating',
    'gallery_terrace_rooftop',
    'gallery_exterior_context',
    'gallery_detail_texture',
  ].includes(role);
}

function roleDiversityGroup(role: GalleryRole): string {
  if (role === 'hero_interior' || role === 'gallery_atmosphere' || role === 'gallery_seating') return 'interior';
  if (role === 'gallery_terrace_rooftop' || role === 'gallery_exterior_context') return 'context';
  if (role === 'supporting_food_drink') return 'food_drink';
  return role;
}

function dedupeCandidates(candidates: GalleryCandidate[]): GalleryCandidate[] {
  const byUrl = new Map<string, GalleryCandidate>();
  for (const candidate of candidates) {
    const key = candidate.resolved_image_url || candidate.candidate_id;
    const current = byUrl.get(key);
    if (!current || candidate.selection_score > current.selection_score || candidate.source_origin === 'stage_04_vision') {
      byUrl.set(key, candidate);
    }
  }
  return [...byUrl.values()];
}

function candidateId(venueId: string, url: string): string {
  return `${venueId}_${Math.abs(hashString(url))}`;
}

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
  }
  return hash;
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

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, 'utf8')) as T;
}

function parseArgs(argv: string[]): Options {
  const runIdIndex = argv.indexOf('--run-id');
  const maxIndex = argv.indexOf('--max-gallery-images');
  const runId = runIdIndex >= 0 ? argv[runIdIndex + 1] : '';
  if (!runId) throw new Error('Usage: npx tsx pipeline/enrichment/02_discover_gallery.ts --run-id <run_id> [--max-gallery-images 4]');
  const maxGalleryImages = maxIndex >= 0 ? Number(argv[maxIndex + 1] || '4') : 4;
  return { runId, maxGalleryImages: Number.isFinite(maxGalleryImages) && maxGalleryImages > 0 ? maxGalleryImages : 4 };
}

const currentFile = path.resolve(fileURLToPath(import.meta.url));
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : '';

if (currentFile === invokedFile) {
  discoverGallery(parseArgs(process.argv.slice(2))).catch((error: unknown) => {
    console.error(`E02 gallery discovery failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
