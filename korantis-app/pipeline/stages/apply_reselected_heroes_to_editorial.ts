import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { scoreAndStage } from './06_score_and_stage';
import type { BatchResult, ImageCandidate, ImageSourceType, ReviewQueueItem, RiskFlag } from '../types';

interface Stage04Vision {
  scene_type: string;
  shows_space: boolean;
  is_hero_usable: boolean;
  is_product_only: boolean;
  has_identifiable_faces: boolean;
  quality: string;
  atmosphere_signal: string;
  visual_reason: string;
}

interface Stage04SelectedImage {
  venue_name: string;
  selected_image: {
    venue_name: string;
    resolved_image_url: string;
    source_url: string;
    source_type: string;
    width: number;
    height: number;
    ok_photo: boolean;
    skip_reason: string | null;
    model_used: string;
    vision: Stage04Vision;
    risk_flags: RiskFlag[];
    validation_status: 'imported_needs_validation';
    publication_status: 'not_approved_for_publication';
  };
  selection_score: number;
}

interface Stage04SelectedImagesFile {
  selected_images: Stage04SelectedImage[];
}

interface ApplySummary {
  venue_name: string;
  previous_scene: string;
  new_scene: string;
  previous_url: string;
  new_url: string;
  hero_changed: boolean;
  status: string;
  errors: string[];
}

export function applyReselectedHeroesToEditorial(batchName: string): BatchResult {
  const outputDir = path.join(process.cwd(), 'data', 'batches', batchName);
  const batchPath = path.join(outputDir, 'batch_result_with_editorial.json');
  const selectedPath = path.join(outputDir, 'stage_04_selected_images.json');
  const batch = readJson<BatchResult>(batchPath);
  const selected = readJson<Stage04SelectedImagesFile>(selectedPath);
  const selectedByVenue = new Map(selected.selected_images.map((item) => [normalizeName(item.venue_name), item]));
  const summaries: ApplySummary[] = [];

  const candidates: ReviewQueueItem[] = batch.candidates.map((candidate) => {
    const next = cloneCandidate(candidate);
    const selection = selectedByVenue.get(normalizeName(candidate.venue_name));
    const previousHero = next.venue.hero_image || next.venue.images.hero;

    if (selection) {
      const hero = mapSelectedImageToHero(selection);
      next.venue.hero_image = hero;
      next.venue.images.hero = hero;
      next.venue.images.has_hero_image = true;
      next.venue.images.candidates = [hero, ...next.venue.images.candidates.filter((image) => image.resolved_image_url !== hero.resolved_image_url)];
      next.venue.images.spatial_candidate_count = Math.max(1, next.venue.images.spatial_candidate_count || 0);
      next.venue.images.warnings = buildHeroWarnings(hero);
      next.venue.pipeline_notes = [
        ...(next.venue.pipeline_notes || []),
        'Reselected hero applied after exterior-first Stage 04 selection policy. Editorial text preserved.',
      ];
    }

    const staging = scoreAndStage(next.venue, batch.config);
    summaries.push({
      venue_name: next.venue_name,
      previous_scene: previousHero?.classification?.scene || 'none',
      new_scene: next.venue.hero_image?.classification?.scene || 'none',
      previous_url: previousHero?.resolved_image_url || '',
      new_url: next.venue.hero_image?.resolved_image_url || '',
      hero_changed: Boolean(previousHero?.resolved_image_url && next.venue.hero_image?.resolved_image_url && previousHero.resolved_image_url !== next.venue.hero_image.resolved_image_url),
      status: staging.status,
      errors: staging.errors,
    });

    return {
      ...next,
      status: staging.status,
      staging_score: staging.staging_score,
      review_reason: staging.review_reason,
      errors: staging.errors,
      warnings: staging.warnings,
    };
  });

  const finishedAt = new Date().toISOString();
  const updated: BatchResult = {
    ...batch,
    generated_at: finishedAt,
    summary: buildSummary(candidates),
    candidates,
    stage_statuses: [
      ...batch.stage_statuses,
      {
        stage: 'apply_reselected_heroes_to_editorial',
        status: 'completed',
        notes: 'Applied Stage 04 exterior-first hero reselection to editorial batch result. No M3/MiniMax/Supabase/Cloudinary calls.',
      },
    ],
    cost_placeholder: {
      estimated_usd: null,
      notes: 'No external calls. Existing Stage 04 vision and Stage 05 editorial were reused.',
    },
  };

  writeFileSync(batchPath, `${JSON.stringify(updated, null, 2)}\n`, 'utf8');
  writeFileSync(path.join(outputDir, 'reselected_heroes_report.md'), buildReport(batchName, summaries), 'utf8');

  console.log(`Reselected heroes applied to ${batchPath}`);
  console.log(`Reselected heroes report written to ${path.join(outputDir, 'reselected_heroes_report.md')}`);
  console.log(`Reselected hero summary: venues=${summaries.length}, changed=${summaries.filter((item) => item.hero_changed).length}`);

  return updated;
}

function mapSelectedImageToHero(selected: Stage04SelectedImage): ImageCandidate {
  const image = selected.selected_image;
  const riskFlags = image.risk_flags || [];
  return {
    venue_name: image.venue_name,
    source_url: image.source_url,
    resolved_image_url: image.resolved_image_url,
    original_image_url: image.resolved_image_url,
    source_type: normalizeSourceType(image.source_type),
    rights_hint: image.source_type === 'google_places' ? 'google_places_photo_attribution_required' : 'venue_controlled_or_source_review_required',
    rights_risk: deriveRightsRisk(riskFlags, image.source_type),
    width: image.width,
    height: image.height,
    content_length: 0,
    shows_space: image.vision.shows_space,
    usable: image.vision.is_hero_usable,
    role: 'hero',
    risk_flags: riskFlags,
    validation_status: image.validation_status,
    publication_status: image.publication_status,
    notes: [
      `model_used=${image.model_used}`,
      `scene=${image.vision.scene_type}`,
      `atmosphere_signal=${image.vision.atmosphere_signal}`,
      `quality=${image.vision.quality}`,
      `visual_reason=${image.vision.visual_reason}`,
      `selection_score=${selected.selection_score}`,
    ].join('; '),
    classification: {
      shows_space: image.vision.shows_space,
      is_hero_usable: image.vision.is_hero_usable,
      scene: image.vision.scene_type,
      atmosphere_signal: image.vision.atmosphere_signal,
      quality: image.vision.quality,
      model_used: image.model_used,
      has_identifiable_faces: image.vision.has_identifiable_faces,
    },
  };
}

function buildHeroWarnings(hero: ImageCandidate): string[] {
  const warnings: string[] = [];
  if (hero.rights_risk === 'medium') warnings.push('medium_rights_risk');
  if (hero.rights_risk === 'high') warnings.push('high_rights_risk');
  if (hero.risk_flags?.includes('rights_review_needed')) warnings.push('rights_review_needed');
  if (hero.risk_flags?.includes('below_preferred_resolution')) warnings.push('below_preferred_resolution');
  if (hero.classification?.scene === 'hero_interior') warnings.push('hero_is_interior_no_stronger_exterior_selected');
  return warnings;
}

function deriveRightsRisk(flags: RiskFlag[], sourceType: string): ImageCandidate['rights_risk'] {
  if (flags.includes('high_rights_risk')) return 'high';
  if (flags.includes('rights_review_needed') || sourceType === 'google_places') return 'medium';
  if (sourceType === 'official_website' || sourceType === 'official_gallery') return 'low';
  return 'unknown';
}

function normalizeSourceType(value: string): ImageSourceType {
  const allowed: ImageSourceType[] = [
    'official_website',
    'official_gallery',
    'press_media',
    'michelin',
    'fifty_best',
    'city_tourism',
    'editorial_review',
    'instagram',
    'google_places',
    'ugc',
    'unknown',
  ];
  return allowed.includes(value as ImageSourceType) ? value as ImageSourceType : 'unknown';
}

function buildSummary(items: ReviewQueueItem[]): BatchResult['summary'] {
  return {
    input: items.length,
    ready_for_db_staging: items.filter((item) => item.status === 'ready_for_db_staging').length,
    auto_staged: items.filter((item) => item.status === 'auto_staged').length,
    needs_review: items.filter((item) => item.status === 'needs_review').length,
    blocked: items.filter((item) => item.status === 'blocked').length,
    approved: items.filter((item) => item.status === 'approved').length,
    rejected: items.filter((item) => item.status === 'rejected').length,
    staged: items.filter((item) => item.status === 'staged').length,
    published: items.filter((item) => item.status === 'published').length,
  };
}

function buildReport(batchName: string, summaries: ApplySummary[]): string {
  const sceneCounts = countBy(summaries.map((item) => item.new_scene));
  return [
    '# Reselected Heroes Report',
    '',
    `- Batch: ${batchName}`,
    `- Venues processed: ${summaries.length}`,
    `- Heroes changed: ${summaries.filter((item) => item.hero_changed).length}`,
    '',
    '## New Scene Distribution',
    '',
    ...Object.entries(sceneCounts).map(([scene, count]) => `- ${scene}: ${count}`),
    '',
    '## Changes',
    '',
    '| Venue | Changed | Previous Scene | New Scene | Status | Errors |',
    '| --- | --- | --- | --- | --- | --- |',
    ...summaries.map((item) =>
      `| ${escapeTable(item.venue_name)} | ${item.hero_changed ? 'yes' : 'no'} | ${item.previous_scene} | ${item.new_scene} | ${item.status} | ${escapeTable(item.errors.join(', ') || 'none')} |`,
    ),
    '',
    '## Safety',
    '',
    '- No M3 calls were made.',
    '- No MiniMax text calls were made.',
    '- No Supabase writes were made.',
    '- No Cloudinary uploads were made.',
    '- Publication decisions should be reviewed again after hero reselection.',
  ].join('\n') + '\n';
}

function countBy(values: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const value of values) counts[value] = (counts[value] || 0) + 1;
  return counts;
}

function cloneCandidate(candidate: ReviewQueueItem): ReviewQueueItem {
  return JSON.parse(JSON.stringify(candidate)) as ReviewQueueItem;
}

function normalizeName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, 'utf8')) as T;
}

function escapeTable(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

const currentFile = path.resolve(fileURLToPath(import.meta.url));
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : '';

if (currentFile === invokedFile) {
  const batchName = process.argv[2];
  if (!batchName) {
    console.error('Usage: npx tsx pipeline/stages/apply_reselected_heroes_to_editorial.ts <batch_id>');
    process.exitCode = 1;
  } else {
    try {
      applyReselectedHeroesToEditorial(batchName);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Apply reselected heroes failed: ${message}`);
      process.exitCode = 1;
    }
  }
}
