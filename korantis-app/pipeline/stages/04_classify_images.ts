import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  classifyImageWithM3,
  downloadImageBytesForVision,
  m3ConfigFromEnv,
  redactSecrets,
  type M3VisionResult,
  type SceneType,
} from '../utils/minimax_m3_vision';
import { loadLocalEnv } from './01_extract_data';
import type { ImageCandidate, RiskFlag } from '../types';

interface Stage03QueueFile {
  batch_id?: string;
  queue?: ImageCandidate[];
}

interface Stage04ImageRecord extends M3VisionResult {
  validation_status: 'imported_needs_validation';
  publication_status: 'not_approved_for_publication';
  selected_for_hero: boolean;
}

interface Stage04SkippedRecord {
  venue_name: string;
  resolved_image_url: string;
  source_url: string;
  source_type: string;
  width: number;
  height: number;
  ok_photo: false;
  skip_reason: string;
  model_used: string;
  vision: null;
  risk_flags: RiskFlag[];
}

interface SelectedHeroImage {
  venue_name: string;
  selected_image: Stage04ImageRecord;
  selection_score: number;
  validation_status: 'imported_needs_validation';
  publication_status: 'not_approved_for_publication';
}

interface Stage04Result {
  batch_id: string;
  generated_at: string;
  m3_called: boolean;
  model_used: string;
  images_requested: number;
  images_processed: number;
  images_skipped: number;
  m3_ok_count: number;
  invalid_json_count: number;
  scene_type_distribution: Record<string, number>;
  selected_images: SelectedHeroImage[];
  venues_without_hero_candidate: string[];
  risk_flag_distribution: Record<string, number>;
  vision_results: Array<Stage04ImageRecord | Stage04SkippedRecord>;
  report_markdown: string;
}

interface Stage04ProgressFile {
  batch_id: string;
  generated_at: string;
  updated_at: string;
  model_used: string;
  total_queue_size: number;
  images_processed_or_skipped: number;
  remaining: number;
  results: Array<Stage04ImageRecord | Stage04SkippedRecord>;
}

export interface Stage04Options {
  maxImagesPerVenue?: number;
  onlyVenueNames?: string[];
}

export async function runStage04VisionClassification(batchName: string, options: Stage04Options = {}): Promise<Stage04Result> {
  loadLocalEnv();

  const config = m3ConfigFromEnv();
  const outputDir = path.join(process.cwd(), 'data', 'batches', batchName);
  const queuePath = path.join(outputDir, 'stage_03_final_vision_queue.json');
  const requestedVenueNames = new Set((options.onlyVenueNames || []).map(normalizeVenueName));
  const discoveredQueue = readStage03Queue(queuePath);
  const targetedQueue = requestedVenueNames.size > 0
    ? discoveredQueue.filter((candidate) => requestedVenueNames.has(normalizeVenueName(candidate.venue_name)))
    : discoveredQueue;
  const queue = limitQueueByVenue(targetedQueue, options.maxImagesPerVenue);
  const progressPath = path.join(outputDir, 'stage_04_progress.json');
  const progress = readStage04Progress(progressPath);
  const processedUrls = new Set((progress?.results || []).map((item) => item.resolved_image_url));
  const totalWorkSize = new Set([
    ...queue.map((item) => item.resolved_image_url),
    ...(progress?.results || []).map((item) => item.resolved_image_url),
  ]).size;
  const generatedAt = new Date().toISOString();

  if (!config.apiKey) {
    const result = buildStoppedResult(batchName, generatedAt, config.model, queue, 'missing MINIMAX_API_KEY');
    writeStage04Outputs(outputDir, result);
    throw new Error('missing MINIMAX_API_KEY; Stage 04 did not call M3');
  }

  const results: Array<Stage04ImageRecord | Stage04SkippedRecord> = [...(progress?.results || [])];
  let m3Called = results.some((item) => item.vision !== null);
  let invalidJsonCount = results.filter((item) => item.skip_reason?.includes('m3_invalid_json')).length;

  writeStage04Progress(progressPath, batchName, generatedAt, config.model, totalWorkSize, results);

  for (const [index, candidate] of queue.entries()) {
    if (processedUrls.has(candidate.resolved_image_url)) {
      continue;
    }
    try {
      const image = await downloadImageBytesForVision(candidate);
      const classified = await classifyImageWithM3(candidate, image, config);
      m3Called = true;
      results.push({
        ...classified,
        risk_flags: mergeRiskFlags(candidate.risk_flags || [], classified.risk_flags || []),
        validation_status: 'imported_needs_validation',
        publication_status: 'not_approved_for_publication',
        selected_for_hero: false,
      });
    } catch (error) {
      const reason = redactSecrets(error instanceof Error ? error.message : String(error));
      if (reason.includes('m3_invalid_json')) invalidJsonCount += 1;
      results.push(buildSkippedRecord(candidate, config.model, reason));
    }
    processedUrls.add(candidate.resolved_image_url);
    writeStage04Progress(progressPath, batchName, generatedAt, config.model, totalWorkSize, results);
    console.log(`Stage 04 progress: ${results.length}/${totalWorkSize} processed_or_skipped (${index + 1}/${queue.length} recovery_candidates_scanned)`);
  }

  const selectedImages = selectBestImagesByVenue(results);
  const selectedUrls = new Set(selectedImages.map((item) => item.selected_image.resolved_image_url));
  const markedResults = results.map((result) =>
    result.vision
      ? {
          ...result,
          selected_for_hero: selectedUrls.has(result.resolved_image_url),
        }
      : result,
  );

  const result: Stage04Result = {
    batch_id: batchName,
    generated_at: generatedAt,
    m3_called: m3Called,
    model_used: config.model,
    images_requested: totalWorkSize,
    images_processed: markedResults.filter((item) => item.vision !== null).length,
    images_skipped: markedResults.filter((item) => item.vision === null).length,
    m3_ok_count: markedResults.filter((item) => item.vision !== null && item.ok_photo).length,
    invalid_json_count: invalidJsonCount,
    scene_type_distribution: countBy(
      markedResults.filter(isStage04ImageRecord),
      (item) => item.vision.scene_type,
    ),
    selected_images: selectedImages,
    venues_without_hero_candidate: venuesWithoutHero(queue, selectedImages),
    risk_flag_distribution: countRiskFlags(markedResults),
    vision_results: markedResults,
    report_markdown: '',
  };
  result.report_markdown = buildStage04Report(result);

  writeStage04Outputs(outputDir, result);
  console.log(`Stage 04 vision results written to ${path.join(outputDir, 'stage_04_vision_results.json')}`);
  console.log(`Stage 04 selected images written to ${path.join(outputDir, 'stage_04_selected_images.json')}`);
  console.log(`Stage 04 report written to ${path.join(outputDir, 'stage_04_report.md')}`);
  console.log(
    `Stage 04 summary: requested=${result.images_requested}, processed=${result.images_processed}, skipped=${result.images_skipped}, m3_ok=${result.m3_ok_count}, selected=${result.selected_images.length}`,
  );

  return result;
}

function readStage03Queue(filePath: string): ImageCandidate[] {
  const parsed = JSON.parse(readFileSync(filePath, 'utf8')) as Stage03QueueFile;
  if (!Array.isArray(parsed.queue) || parsed.queue.length === 0) {
    throw new Error(`Stage 04 input queue is missing or empty: ${filePath}`);
  }
  return parsed.queue;
}

function limitQueueByVenue(queue: ImageCandidate[], maxImagesPerVenue: number | undefined): ImageCandidate[] {
  if (!maxImagesPerVenue || maxImagesPerVenue <= 0) return queue;
  const counts = new Map<string, number>();
  return queue.filter((candidate) => {
    const count = counts.get(candidate.venue_name) || 0;
    if (count >= maxImagesPerVenue) return false;
    counts.set(candidate.venue_name, count + 1);
    return true;
  });
}

function normalizeVenueName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}
function readStage04Progress(filePath: string): Stage04ProgressFile | null {
  try {
    const parsed = JSON.parse(readFileSync(filePath, 'utf8')) as Stage04ProgressFile;
    return Array.isArray(parsed.results) ? parsed : null;
  } catch {
    return null;
  }
}

function writeStage04Progress(
  filePath: string,
  batchName: string,
  generatedAt: string,
  model: string,
  queueSize: number,
  results: Array<Stage04ImageRecord | Stage04SkippedRecord>,
): void {
  const payload = `${JSON.stringify({
    batch_id: batchName,
    generated_at: generatedAt,
    updated_at: new Date().toISOString(),
    model_used: model,
    total_queue_size: queueSize,
    images_processed_or_skipped: results.length,
    remaining: Math.max(0, queueSize - results.length),
    results,
  }, null, 2)}\n`;
  const tempPath = `${filePath}.${process.pid}.tmp`;
  try {
    writeFileSync(tempPath, payload, 'utf8');
    renameSync(tempPath, filePath);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`Stage 04 progress checkpoint skipped: ${redactSecrets(message)}`);
  }
}

function buildStoppedResult(
  batchName: string,
  generatedAt: string,
  model: string,
  queue: ImageCandidate[],
  reason: string,
): Stage04Result {
  const skipped = queue.map((candidate) => buildSkippedRecord(candidate, model, reason));
  const result: Stage04Result = {
    batch_id: batchName,
    generated_at: generatedAt,
    m3_called: false,
    model_used: model,
    images_requested: queue.length,
    images_processed: 0,
    images_skipped: queue.length,
    m3_ok_count: 0,
    invalid_json_count: 0,
    scene_type_distribution: {},
    selected_images: [],
    venues_without_hero_candidate: [...new Set(queue.map((candidate) => candidate.venue_name))],
    risk_flag_distribution: countRiskFlags(skipped),
    vision_results: skipped,
    report_markdown: '',
  };
  result.report_markdown = buildStage04Report(result);
  return result;
}

function buildSkippedRecord(candidate: ImageCandidate, model: string, reason: string): Stage04SkippedRecord {
  return {
    venue_name: candidate.venue_name,
    resolved_image_url: candidate.resolved_image_url,
    source_url: candidate.source_url,
    source_type: candidate.source_type,
    width: candidate.width,
    height: candidate.height,
    ok_photo: false,
    skip_reason: redactSecrets(reason),
    model_used: model,
    vision: null,
    risk_flags: candidate.risk_flags || [],
  };
}

function selectBestImagesByVenue(results: Array<Stage04ImageRecord | Stage04SkippedRecord>): SelectedHeroImage[] {
  const byVenue = new Map<string, Stage04ImageRecord[]>();
  for (const result of results) {
    if (!isStage04ImageRecord(result) || !isHeroEligible(result)) continue;
    const items = byVenue.get(result.venue_name) || [];
    items.push(result);
    byVenue.set(result.venue_name, items);
  }

  return [...byVenue.entries()].map((entry): SelectedHeroImage => {
    const [venueName, items] = entry;
    const selected = [...items].sort((a, b) => selectionScore(b) - selectionScore(a))[0];
    return {
      venue_name: venueName,
      selected_image: selected,
      selection_score: selectionScore(selected),
      validation_status: 'imported_needs_validation',
      publication_status: 'not_approved_for_publication',
    };
  }).sort((a, b) => a.venue_name.localeCompare(b.venue_name));
}

function isStage04ImageRecord(result: Stage04ImageRecord | Stage04SkippedRecord): result is Stage04ImageRecord {
  return result.vision !== null;
}

function isHeroEligible(result: Stage04ImageRecord): boolean {
  const rejectedScenes: SceneType[] = ['product_food', 'logo', 'menu', 'decorative', 'crowd', 'unusable'];
  return result.ok_photo && result.vision.shows_space && !result.vision.is_product_only && !rejectedScenes.includes(result.vision.scene_type);
}

function selectionScore(result: Stage04ImageRecord): number {
  const sceneScores: Record<SceneType, number> = {
    hero_interior: 110,
    gallery_atmosphere: 92,
    hero_exterior: 62,
    product_food: -100,
    logo: -100,
    menu: -100,
    crowd: -80,
    decorative: -70,
    unusable: -100,
  };
  let score = sceneScores[result.vision.scene_type];
  score += Math.max(result.width, result.height) >= 1024 ? 20 : 0;
  score += result.vision.quality === 'high' ? 18 : result.vision.quality === 'acceptable' ? 8 : -20;
  score += result.vision.has_identifiable_faces ? -25 : 10;
  score += result.source_type === 'official_website' || result.source_type === 'official_gallery' ? 12 : 0;
  score += result.risk_flags.includes('below_preferred_resolution') ? -10 : 0;
  return score;
}

function venuesWithoutHero(queue: ImageCandidate[], selected: SelectedHeroImage[]): string[] {
  const selectedVenues = new Set(selected.map((item) => item.venue_name));
  return [...new Set(queue.map((candidate) => candidate.venue_name))].filter((venue) => !selectedVenues.has(venue));
}

function writeStage04Outputs(outputDir: string, result: Stage04Result): void {
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(path.join(outputDir, 'stage_04_vision_results.json'), `${JSON.stringify({
    batch_id: result.batch_id,
    generated_at: result.generated_at,
    m3_called: result.m3_called,
    model_used: result.model_used,
    results: result.vision_results,
    summary: {
      images_requested: result.images_requested,
      images_processed: result.images_processed,
      images_skipped: result.images_skipped,
      m3_ok_count: result.m3_ok_count,
      invalid_json_count: result.invalid_json_count,
      scene_type_distribution: result.scene_type_distribution,
      risk_flag_distribution: result.risk_flag_distribution,
    },
  }, null, 2)}\n`, 'utf8');
  writeFileSync(path.join(outputDir, 'stage_04_selected_images.json'), `${JSON.stringify({
    batch_id: result.batch_id,
    generated_at: result.generated_at,
    validation_status: 'imported_needs_validation',
    publication_status: 'not_approved_for_publication',
    selected_images: result.selected_images,
    venues_without_hero_candidate: result.venues_without_hero_candidate,
    ready_to_connect_hero_image: result.selected_images.length > 0,
  }, null, 2)}\n`, 'utf8');
  writeFileSync(path.join(outputDir, 'stage_04_report.md'), result.report_markdown, 'utf8');
}

function buildStage04Report(result: Stage04Result): string {
  const lines = [
    '# Stage 04 M3 Vision Classification Report',
    '',
    `- Batch: ${result.batch_id}`,
    `- Generated: ${result.generated_at}`,
    `- Model: ${result.model_used}`,
    `- M3 called: ${result.m3_called ? 'yes' : 'no'}`,
    `- Images requested: ${result.images_requested}`,
    `- Images processed: ${result.images_processed}`,
    `- Images skipped: ${result.images_skipped}`,
    `- M3 ok count: ${result.m3_ok_count}`,
    `- Invalid JSON count: ${result.invalid_json_count}`,
    '',
    '## Scene Type Distribution',
    '',
    ...entriesOrNone(result.scene_type_distribution),
    '',
    '## Selected Hero Per Venue',
    '',
    ...(result.selected_images.length > 0
      ? result.selected_images.map((item) =>
          `- ${item.venue_name}: ${item.selected_image.vision.scene_type}, ${item.selected_image.vision.quality}, score ${item.selection_score}`,
        )
      : ['- none']),
    '',
    '## Hero Selection Policy',
    '',
    '- Primary hero preference: clear experiential venue interior or outdoor space where guests actually sit/drink/eat.',
    '- Secondary: spatial atmosphere/gallery image that communicates the venue mood.',
    '- Tertiary: exterior/facade/local identity only when no strong experiential image exists or the facade itself is the concept.',
    '- Rooftops, patios, gardens, terraces, and outdoor dining areas should behave like hero_interior when they are the customer experience.',
    '- Food-only, menus, logos, decorative images, and crowd-only images are rejected as hero.',
    '',
    '## Venues Without Hero Candidate',
    '',
    ...(result.venues_without_hero_candidate.length > 0 ? result.venues_without_hero_candidate.map((venue) => `- ${venue}`) : ['- none']),
    '',
    '## Risk Flags',
    '',
    ...entriesOrNone(result.risk_flag_distribution),
    '',
    '## Hero Connection Readiness',
    '',
    `- Ready to connect hero_image into VenueComplete: ${result.selected_images.length > 0 ? 'yes' : 'no'}`,
    '- Nothing is approved for publication.',
    '- Supabase, Cloudinary, deploy, and consumer UI were not touched.',
  ];

  return `${redactSecrets(lines.join('\n'))}\n`;
}

function entriesOrNone(values: Record<string, number>): string[] {
  const entries = Object.entries(values);
  return entries.length > 0 ? entries.map(([key, value]) => `- ${key}: ${value}`) : ['- none'];
}

function countBy<T>(items: T[], getter: (item: T) => string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const key = getter(item) || 'unknown';
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

function countRiskFlags(items: Array<Stage04ImageRecord | Stage04SkippedRecord>): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    for (const flag of item.risk_flags || []) {
      counts[flag] = (counts[flag] || 0) + 1;
    }
  }
  return counts;
}

function mergeRiskFlags(a: RiskFlag[], b: RiskFlag[]): RiskFlag[] {
  return [...new Set([...a, ...b])];
}

const currentFile = path.resolve(fileURLToPath(import.meta.url));
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : '';

if (currentFile === invokedFile) {
  const batchName = process.argv[2];
  if (!batchName) {
    console.error('Usage: npx tsx pipeline/stages/04_classify_images.ts <batch_id> [--max-images-per-venue N]');
    process.exitCode = 1;
  } else {
    runStage04VisionClassification(batchName, parseStage04Options(process.argv.slice(3))).catch((error: unknown) => {
      const message = redactSecrets(error instanceof Error ? error.message : String(error));
      console.error(`Stage 04 failed: ${message}`);
      process.exitCode = 1;
    });
  }
}

function parseStage04Options(args: string[]): Stage04Options {
  const max = valueAfter(args, '--max-images-per-venue');
  return {
    maxImagesPerVenue: max ? Number(max) : undefined,
  };
}

function valueAfter(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}
