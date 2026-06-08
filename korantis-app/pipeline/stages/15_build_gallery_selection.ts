import { existsSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

type SceneType = 'hero_interior' | 'gallery_atmosphere' | 'hero_exterior' | 'product_food' | 'logo' | 'menu' | 'crowd' | 'decorative' | 'unusable' | string;

interface VisionImageRecord {
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
    scene_type?: SceneType;
    shows_space?: boolean;
    is_hero_usable?: boolean;
    is_product_only?: boolean;
    has_identifiable_faces?: boolean;
    quality?: string;
    atmosphere_signal?: string;
    visual_reason?: string;
  };
  risk_flags?: string[];
  validation_status?: string;
  publication_status?: string;
  selected_for_hero?: boolean;
}

interface SelectedHeroImage {
  venue_name: string;
  selected_image?: VisionImageRecord;
}

interface Stage04VisionResults {
  batch_id: string;
  results: VisionImageRecord[];
}

interface Stage04SelectedImages {
  selected_images: SelectedHeroImage[];
}

interface GalleryImageSelection {
  venue_name: string;
  role: 'gallery_1' | 'gallery_2' | 'gallery_3';
  image: VisionImageRecord;
  selection_score: number;
  selection_reason: string[];
}

interface VenueGallerySelection {
  venue_name: string;
  hero_image_url?: string;
  selected_gallery_images: GalleryImageSelection[];
  rejected_gallery_candidates: Array<{
    resolved_image_url: string;
    scene_type?: string;
    reasons: string[];
  }>;
  warnings: string[];
}

interface GallerySelectionResult {
  batch_id: string;
  generated_at: string;
  mode: 'local_deterministic_selection';
  venues_processed: number;
  venues_with_gallery: number;
  total_gallery_images_selected: number;
  gallery_slots_requested_per_venue: number;
  selections: VenueGallerySelection[];
  safety_checks: Record<string, boolean>;
}

const MAX_GALLERY_IMAGES = 3;
const REJECT_SCENES = new Set(['product_food', 'logo', 'menu', 'crowd', 'decorative', 'unusable']);

export function buildGallerySelection(batchName: string): GallerySelectionResult {
  const outputDir = path.join(process.cwd(), 'data', 'batches', batchName);
  const visionPath = path.join(outputDir, 'stage_04_vision_results.json');
  const selectedPath = path.join(outputDir, 'stage_04_selected_images.json');
  if (!existsSync(visionPath)) throw new Error(`Missing Stage 04 vision results: ${visionPath}`);
  if (!existsSync(selectedPath)) throw new Error(`Missing Stage 04 selected images: ${selectedPath}`);

  const visionResults = readJson<Stage04VisionResults>(visionPath);
  const selectedHeroes = readJson<Stage04SelectedImages>(selectedPath);
  const heroByVenue = new Map(selectedHeroes.selected_images.map((item) => [normalizeName(item.venue_name), item.selected_image]));
  const resultsByVenue = groupByVenue(visionResults.results || []);

  const selections = [...resultsByVenue.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([venueKey, images]) => selectVenueGallery(venueKey, images, heroByVenue.get(venueKey)));

  const result: GallerySelectionResult = {
    batch_id: visionResults.batch_id || batchName,
    generated_at: new Date().toISOString(),
    mode: 'local_deterministic_selection',
    venues_processed: selections.length,
    venues_with_gallery: selections.filter((selection) => selection.selected_gallery_images.length > 0).length,
    total_gallery_images_selected: selections.reduce((sum, selection) => sum + selection.selected_gallery_images.length, 0),
    gallery_slots_requested_per_venue: MAX_GALLERY_IMAGES,
    selections,
    safety_checks: {
      no_m3_calls: true,
      no_minimax_calls: true,
      no_cloudinary_uploads: true,
      no_supabase_writes: true,
      no_publication: true,
      no_consumer_ui_changes: true,
    },
  };

  writeFileSync(path.join(outputDir, 'stage_15_gallery_selection.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  writeFileSync(path.join(outputDir, 'stage_15_gallery_selection_report.md'), buildReport(result), 'utf8');
  console.log(`Stage 15 gallery selection JSON written to ${path.join(outputDir, 'stage_15_gallery_selection.json')}`);
  console.log(`Stage 15 gallery selection report written to ${path.join(outputDir, 'stage_15_gallery_selection_report.md')}`);
  console.log(`Stage 15 summary: venues=${result.venues_processed}, venues_with_gallery=${result.venues_with_gallery}, gallery_images=${result.total_gallery_images_selected}`);
  return result;
}

function selectVenueGallery(venueKey: string, images: VisionImageRecord[], hero: VisionImageRecord | undefined): VenueGallerySelection {
  const heroUrl = hero?.resolved_image_url;
  const rejected: VenueGallerySelection['rejected_gallery_candidates'] = [];
  const candidates = images
    .filter((image) => {
      const reasons = rejectReasons(image, heroUrl);
      if (reasons.length > 0) {
        rejected.push({
          resolved_image_url: image.resolved_image_url,
          scene_type: image.vision?.scene_type,
          reasons,
        });
        return false;
      }
      return true;
    })
    .map((image) => scoreGalleryImage(image))
    .sort((a, b) => b.selection_score - a.selection_score);

  const selected: GalleryImageSelection[] = [];
  const seenAtmospheres = new Set<string>();
  const seenSources = new Set<string>();
  for (const candidate of candidates) {
    if (selected.length >= MAX_GALLERY_IMAGES) break;
    const atmosphere = candidate.image.vision?.atmosphere_signal || 'none';
    const sourceKey = candidate.image.source_type || 'unknown';
    const duplicateAtmosphere = atmosphere !== 'none' && seenAtmospheres.has(atmosphere);
    const duplicateSource = seenSources.has(sourceKey);
    if (selected.length > 0 && duplicateAtmosphere && duplicateSource && candidates.length > MAX_GALLERY_IMAGES) continue;
    selected.push({
      ...candidate,
      role: `gallery_${selected.length + 1}` as GalleryImageSelection['role'],
    });
    seenAtmospheres.add(atmosphere);
    seenSources.add(sourceKey);
  }

  return {
    venue_name: images[0]?.venue_name || venueKey,
    hero_image_url: heroUrl,
    selected_gallery_images: selected,
    rejected_gallery_candidates: rejected.slice(0, 20),
    warnings: selected.length === 0 ? ['no_gallery_images_selected'] : [],
  };
}

function rejectReasons(image: VisionImageRecord, heroUrl?: string): string[] {
  const reasons: string[] = [];
  const scene = image.vision?.scene_type || 'unknown';
  if (!image.ok_photo) reasons.push(image.skip_reason || 'not_ok_photo');
  if (heroUrl && image.resolved_image_url === heroUrl) reasons.push('same_as_selected_hero');
  if (!image.vision?.shows_space) reasons.push('does_not_show_space');
  if (image.vision?.is_product_only) reasons.push('product_only');
  if (image.vision?.has_identifiable_faces) reasons.push('identifiable_faces');
  if (REJECT_SCENES.has(scene)) reasons.push(`rejected_scene:${scene}`);
  if (Math.max(image.width || 0, image.height || 0) < 512) reasons.push('below_min_resolution');
  return reasons;
}

function scoreGalleryImage(image: VisionImageRecord): Omit<GalleryImageSelection, 'role'> {
  const reasons: string[] = [];
  let score = 0;
  const scene = image.vision?.scene_type || 'unknown';
  const quality = image.vision?.quality || 'unknown';
  const maxDimension = Math.max(image.width || 0, image.height || 0);

  const sceneScore = scene === 'gallery_atmosphere' ? 90 :
    scene === 'hero_interior' ? 82 :
      scene === 'hero_exterior' ? 62 :
        25;
  score += sceneScore;
  reasons.push(`scene:${scene}+${sceneScore}`);

  if (quality === 'high') {
    score += 18;
    reasons.push('quality:high+18');
  } else if (quality === 'acceptable') {
    score += 10;
    reasons.push('quality:acceptable+10');
  }

  if (maxDimension >= 1600) {
    score += 14;
    reasons.push('resolution:1600+14');
  } else if (maxDimension >= 1024) {
    score += 10;
    reasons.push('resolution:1024+10');
  } else if (maxDimension >= 512) {
    score += 3;
    reasons.push('resolution:512+3');
  }

  if (image.source_type === 'official_website' || image.source_type === 'official_gallery') {
    score += 12;
    reasons.push('source:official+12');
  } else if (image.source_type === 'google_places') {
    score += 5;
    reasons.push('source:google_places+5');
  }

  if (image.vision?.atmosphere_signal && image.vision.atmosphere_signal !== 'none') {
    score += 8;
    reasons.push(`atmosphere:${image.vision.atmosphere_signal}+8`);
  }

  if ((image.risk_flags || []).includes('preferred_resolution')) {
    score += 4;
    reasons.push('preferred_resolution+4');
  }

  return {
    venue_name: image.venue_name,
    image: {
      ...image,
      validation_status: image.validation_status || 'imported_needs_validation',
      publication_status: image.publication_status || 'not_approved_for_publication',
    },
    selection_score: score,
    selection_reason: reasons,
  };
}

function groupByVenue(images: VisionImageRecord[]): Map<string, VisionImageRecord[]> {
  const grouped = new Map<string, VisionImageRecord[]>();
  for (const image of images) {
    const key = normalizeName(image.venue_name);
    const list = grouped.get(key) || [];
    list.push(image);
    grouped.set(key, list);
  }
  return grouped;
}

function buildReport(result: GallerySelectionResult): string {
  const distribution = countBy(result.selections, (selection) => String(selection.selected_gallery_images.length));
  return [
    `# Stage 15 Gallery Selection - ${result.batch_id}`,
    '',
    `- Generated: ${result.generated_at}`,
    `- Mode: ${result.mode}`,
    `- Venues processed: ${result.venues_processed}`,
    `- Venues with gallery: ${result.venues_with_gallery}`,
    `- Total gallery images selected: ${result.total_gallery_images_selected}`,
    `- Gallery slots requested per venue: ${result.gallery_slots_requested_per_venue}`,
    '',
    '## Gallery Count Distribution',
    '',
    ...Object.entries(distribution).sort(([a], [b]) => Number(a) - Number(b)).map(([count, total]) => `- ${count} images: ${total} venues`),
    '',
    '## Selected Gallery Images',
    '',
    '| Venue | Role | Scene | Quality | Source | Score | URL |',
    '| --- | --- | --- | --- | --- | ---: | --- |',
    ...result.selections.flatMap((selection) => selection.selected_gallery_images.map((item) =>
      `| ${escapeMd(selection.venue_name)} | ${item.role} | ${escapeMd(item.image.vision?.scene_type || '')} | ${escapeMd(item.image.vision?.quality || '')} | ${escapeMd(item.image.source_type)} | ${item.selection_score} | ${escapeMd(item.image.resolved_image_url)} |`,
    )),
    '',
    '## Venues With Warnings',
    '',
    ...result.selections.filter((selection) => selection.warnings.length > 0).map((selection) =>
      `- ${selection.venue_name}: ${selection.warnings.join(', ')}`,
    ),
    '',
    '## Safety',
    '',
    ...Object.entries(result.safety_checks).map(([key, value]) => `- ${key}: ${value}`),
  ].join('\n') + '\n';
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, 'utf8')) as T;
}

function countBy<T>(items: T[], getter: (item: T) => string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const key = getter(item);
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

function normalizeName(value: string): string {
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

const isDirectRun = process.argv[1] ? fileURLToPath(import.meta.url) === path.resolve(process.argv[1]) : false;

if (isDirectRun) {
  const [, , batchName] = process.argv;
  if (!batchName) {
    console.error('Usage: npx tsx pipeline/stages/15_build_gallery_selection.ts <batch_id>');
    process.exit(1);
  }

  try {
    buildGallerySelection(batchName);
  } catch (error) {
    console.error(`Stage 15 gallery selection failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
