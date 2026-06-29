import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { mergePipelineConfig } from '../config';
import { generateDashboard } from '../review/generate_dashboard';
import { scoreAndStage } from './06_score_and_stage';
import type {
  BatchResult,
  ImageCandidate,
  ImageClassification,
  ImageSourceType,
  ReviewQueueItem,
  RiskFlag,
  VenueComplete,
  VenueRaw,
} from '../types';

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
  validation_status: 'imported_needs_validation';
  publication_status: 'not_approved_for_publication';
}

interface Stage04SelectedImagesFile {
  selected_images: Stage04SelectedImage[];
  venues_without_hero_candidate?: string[];
}

interface MappingIssue {
  venue_name: string;
  reason: string;
}

interface ConnectedVenueSummary {
  venue_name: string;
  before_score?: number;
  after_score: number;
  before_errors: string[];
  after_errors: string[];
  status: string;
  hero_attached: boolean;
}

export async function connectSelectedImages(batchName: string): Promise<BatchResult> {
  const outputDir = path.join(process.cwd(), 'data', 'batches', batchName);
  const rawVenues = readJson<VenueRaw[]>(path.join(outputDir, 'stage_01_raw_venues.json'));
  const selectedImagesFile = readJson<Stage04SelectedImagesFile>(path.join(outputDir, 'stage_04_selected_images.json'));
  const priorResult = readOptionalJson<BatchResult>(path.join(outputDir, 'batch_result.json'));
  const priorEditorialResult = readOptionalJson<BatchResult>(path.join(outputDir, 'batch_result_with_editorial.json'));
  const config = mergePipelineConfig(undefined);
  const selectedByVenue = new Map(selectedImagesFile.selected_images.map((image) => [normalizeVenueName(image.venue_name), image]));
  const mappingIssues: MappingIssue[] = [];
  const summaries: ConnectedVenueSummary[] = [];

  const venues = rawVenues.map((raw) => {
    const selected = selectedByVenue.get(normalizeVenueName(raw.name));
    const venue = createVenueComplete(raw, selected, mappingIssues);
    const priorEditorial = priorEditorialResult?.candidates.find(
      (candidate) => normalizeVenueName(candidate.venue_name) === normalizeVenueName(raw.name),
    );
    if (priorEditorial) preserveExistingEditorial(venue, priorEditorial.venue);
    const staging = scoreAndStage(venue, config);
    const prior = priorEditorial || priorResult?.candidates.find(
      (candidate) => normalizeVenueName(candidate.venue_name) === normalizeVenueName(raw.name),
    );

    summaries.push({
      venue_name: raw.name,
      before_score: prior?.staging_score,
      after_score: staging.staging_score,
      before_errors: prior?.errors || [],
      after_errors: staging.errors,
      status: staging.status,
      hero_attached: Boolean(venue.hero_image),
    });

    return venue;
  });

  const candidates: ReviewQueueItem[] = venues.map((venue) => {
    const staging = scoreAndStage(venue, config);
    return {
      batch_id: batchName,
      venue_name: venue.raw.name,
      status: staging.status,
      staging_score: staging.staging_score,
      review_reason: staging.review_reason,
      errors: staging.errors,
      warnings: staging.warnings,
      venue,
    };
  });

  const finishedAt = new Date();
  const batchResult: BatchResult = {
    batch_id: batchName,
    city: rawVenues[0]?.city || 'unknown',
    generated_at: finishedAt.toISOString(),
    status: 'completed',
    summary: buildSummary(candidates),
    stage_statuses: [
      { stage: '01_extract_data', status: 'completed', notes: 'Read existing Stage 01 artifact; no external call made.' },
      { stage: '03_discover_images', status: 'completed', notes: 'Read existing Stage 03/04 image artifacts; no image discovery rerun.' },
      { stage: '04_classify_images', status: 'completed', notes: 'Read existing real M3-selected image artifact; M3 was not called by this connector.' },
      { stage: 'connect_selected_images', status: 'completed', notes: 'Selected heroes connected into VenueComplete and score_and_stage rerun.' },
      { stage: '07_stage_to_supabase', status: 'skipped', notes: 'No Supabase writes.' },
      { stage: '08_promote_staged', status: 'skipped', notes: 'No publication path.' },
    ],
    config,
    candidates,
    mood_distribution: countMoodTags(candidates),
    neighborhood_distribution: countNeighborhoods(candidates),
    cost_placeholder: {
      estimated_usd: null,
      notes: 'No M3, MiniMax, Supabase, Cloudinary, or publication calls were made by connect_selected_images.',
    },
    runtime_placeholder: {
      started_at: finishedAt.toISOString(),
      finished_at: finishedAt.toISOString(),
      duration_ms: 0,
    },
  };

  writeFileSync(path.join(outputDir, 'batch_result_with_images.json'), `${JSON.stringify(batchResult, null, 2)}\n`, 'utf8');
  generateDashboardWithName(batchResult, outputDir, 'dashboard_with_images.html');
  if (priorEditorialResult) {
    writeFileSync(path.join(outputDir, 'batch_result_with_editorial.json'), `${JSON.stringify(batchResult, null, 2)}\n`, 'utf8');
    writeFileSync(path.join(outputDir, 'batch_result_enriched.json'), `${JSON.stringify(batchResult, null, 2)}\n`, 'utf8');
    generateDashboardWithName(batchResult, outputDir, 'dashboard_with_editorial.html');
  }
  writeFileSync(
    path.join(outputDir, 'connect_selected_images_report.md'),
    buildReport(batchName, summaries, mappingIssues, selectedImagesFile.venues_without_hero_candidate || []),
    'utf8',
  );

  console.log(`Batch result with images written to ${path.join(outputDir, 'batch_result_with_images.json')}`);
  console.log(`Dashboard with images written to ${path.join(outputDir, 'dashboard_with_images.html')}`);
  console.log(`Connect report written to ${path.join(outputDir, 'connect_selected_images_report.md')}`);
  console.log(
    `Connect summary: venues=${rawVenues.length}, hero_attached=${summaries.filter((item) => item.hero_attached).length}, missing_hero=${summaries.filter((item) => !item.hero_attached).length}`,
  );

  return batchResult;
}

function preserveExistingEditorial(target: VenueComplete, source: VenueComplete): void {
  target.editorial = structuredClone(source.editorial);
  target.evidence = structuredClone(source.evidence);
  target.review_count_processed = source.review_count_processed;
  target.pipeline_notes = [
    ...(target.pipeline_notes || []),
    ...(source.pipeline_notes || []).filter((note) => !note.startsWith('Stage 04 selected image connected')),
    'Existing editorial and evidence preserved during image recovery.',
  ];
}

function createVenueComplete(
  raw: VenueRaw,
  selected: Stage04SelectedImage | undefined,
  mappingIssues: MappingIssue[],
): VenueComplete {
  const hero = selected ? mapSelectedImageToHero(selected, mappingIssues) : null;
  const images: ImageClassification = {
    hero: hero || undefined,
    candidates: hero ? [hero] : [],
    has_hero_image: Boolean(hero),
    spatial_candidate_count: hero?.shows_space ? 1 : 0,
    product_candidate_count: hero?.risk_flags?.includes('product_only') ? 1 : 0,
    warnings: hero ? buildHeroWarnings(hero) : ['no_selected_stage_04_hero_image'],
  };

  return {
    raw,
    evidence: {
      confidence: 0,
      sources: raw.google_maps_url
        ? [{ source_url: raw.google_maps_url, source_type: 'google_places', confidence: raw.extraction_confidence }]
        : [],
      contact: {
        website: raw.website_url,
        phone: raw.phone,
      },
      warnings: ['stub_evidence_pending'],
    },
    images,
    hero_image: hero || undefined,
    editorial: {
      mood_tags: [],
      mood_confidence: 0,
      warnings: ['stub_editorial_pending'],
    },
    review_count: raw.user_ratings_total || 0,
    review_count_processed: 0,
    pipeline_notes: [
      hero
        ? 'Stage 04 selected image connected. Publication remains not approved.'
        : 'No usable Stage 04 selected hero image available.',
    ],
  };
}

function mapSelectedImageToHero(selected: Stage04SelectedImage, mappingIssues: MappingIssue[]): ImageCandidate | null {
  const image = selected.selected_image;
  const requiredMissing = [
    image.venue_name ? '' : 'venue_name',
    image.source_url ? '' : 'source_url',
    image.resolved_image_url ? '' : 'resolved_image_url',
    image.width > 0 ? '' : 'width',
    image.height > 0 ? '' : 'height',
    image.source_type ? '' : 'source_type',
  ].filter(Boolean);

  if (requiredMissing.length > 0) {
    mappingIssues.push({
      venue_name: selected.venue_name,
      reason: `selected_image_missing_${requiredMissing.join('_')}`,
    });
    return null;
  }
  if (!image.ok_photo || !image.vision?.is_hero_usable || !image.vision.shows_space || image.vision.is_product_only) {
    mappingIssues.push({
      venue_name: selected.venue_name,
      reason: `selected_image_not_hero_usable_${image.skip_reason || image.vision?.scene_type || 'unknown'}`,
    });
    return null;
  }

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

function generateDashboardWithName(batch: BatchResult, outputDir: string, fileName: string): void {
  const defaultPath = generateDashboard(batch, outputDir);
  const html = readFileSync(defaultPath, 'utf8');
  writeFileSync(path.join(outputDir, fileName), html, 'utf8');
}

function buildReport(
  batchName: string,
  summaries: ConnectedVenueSummary[],
  mappingIssues: MappingIssue[],
  stage04WithoutHero: string[],
): string {
  const heroAttached = summaries.filter((item) => item.hero_attached);
  const stillMissing = summaries.filter((item) => !item.hero_attached);
  const lines = [
    '# Connect Selected Images Report',
    '',
    `- Batch: ${batchName}`,
    `- Venues processed: ${summaries.length}`,
    `- Venues with hero_image attached: ${heroAttached.length}`,
    `- Venues still missing hero_image: ${stillMissing.length}`,
    `- Stage 04 venues without hero candidate: ${stage04WithoutHero.join(', ') || 'none'}`,
    `- Selected images rejected during mapping: ${mappingIssues.length}`,
    '',
    '## Score Before/After',
    '',
    '| Venue | Hero Attached | Before Score | After Score | Status | Remaining Blocking Errors |',
    '| --- | --- | ---: | ---: | --- | --- |',
    ...summaries.map((item) =>
      `| ${escapeTable(item.venue_name)} | ${item.hero_attached ? 'yes' : 'no'} | ${item.before_score ?? 'n/a'} | ${item.after_score} | ${item.status} | ${escapeTable(item.after_errors.join(', ') || 'none')} |`,
    ),
    '',
    '## Mapping Issues',
    '',
    ...(mappingIssues.length > 0
      ? mappingIssues.map((issue) => `- ${issue.venue_name}: ${issue.reason}`)
      : ['- none']),
    '',
    '## Expected Remaining Blockers',
    '',
    '- Venues may still be blocked by editorial/evidence gaps until Stage 02 and Stage 05 are implemented.',
    '- No venue was published.',
    '- No image was approved for publication.',
    '- No M3, MiniMax, Supabase, Cloudinary, deploy, or consumer UI calls were made.',
  ];

  return `${lines.join('\n')}\n`;
}

function buildSummary(items: ReviewQueueItem[]): BatchResult['summary'] {
  return {
    input: items.length,
    auto_staged: items.filter((item) => item.status === 'auto_staged').length,
    needs_review: items.filter((item) => item.status === 'needs_review').length,
    blocked: items.filter((item) => item.status === 'blocked').length,
    approved: items.filter((item) => item.status === 'approved').length,
    rejected: items.filter((item) => item.status === 'rejected').length,
    staged: items.filter((item) => item.status === 'staged').length,
    published: items.filter((item) => item.status === 'published').length,
  };
}

function countMoodTags(items: ReviewQueueItem[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    for (const tag of item.venue.editorial.mood_tags) {
      counts[tag] = (counts[tag] || 0) + 1;
    }
  }
  return counts;
}

function countNeighborhoods(items: ReviewQueueItem[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const neighborhood = item.venue.raw.neighborhood || 'unknown';
    counts[neighborhood] = (counts[neighborhood] || 0) + 1;
  }
  return counts;
}

function normalizeVenueName(value: string): string {
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

function readOptionalJson<T>(filePath: string): T | null {
  try {
    return readJson<T>(filePath);
  } catch {
    return null;
  }
}

function escapeTable(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

const currentFile = path.resolve(fileURLToPath(import.meta.url));
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : '';

if (currentFile === invokedFile) {
  const batchName = process.argv[2];
  if (!batchName) {
    console.error('Usage: npx tsx pipeline/stages/connect_selected_images.ts <batch_id>');
    process.exitCode = 1;
  } else {
    connectSelectedImages(batchName).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Connect selected images failed: ${message}`);
      process.exitCode = 1;
    });
  }
}
