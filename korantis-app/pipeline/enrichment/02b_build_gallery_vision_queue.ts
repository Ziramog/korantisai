import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { escapeMd, normalizeText, safeNumber, safeString } from './utils/enrichment_types';
import type { ImageCandidate } from '../types';

type GalleryReviewStatus = 'ready_for_gallery_review' | 'needs_more_spatial_images' | 'blocked_gallery_quality';

interface GalleryReviewEntry {
  venue_id: string;
  venue_name: string;
  current_hero_url?: string;
  status: GalleryReviewStatus;
  selected_count: number;
  spatial_count: number;
  support_count: number;
  images: Array<{ resolved_image_url: string }>;
}

interface GalleryReviewManifest {
  run_id: string;
  entries: GalleryReviewEntry[];
}

interface Stage03QueueFile {
  batch_id?: string;
  queue?: ImageCandidate[];
}

interface Stage04ResultsFile {
  results?: Array<{ venue_name?: string; resolved_image_url?: string }>;
}

interface GalleryCandidateFileItem {
  source_batch_id?: string;
}

interface ExpansionQueueItem extends ImageCandidate {
  enrichment_run_id: string;
  expansion_reason: string[];
  gallery_candidate_score: number;
}

interface VenueQueueSummary {
  venue_id: string;
  venue_name: string;
  status: GalleryReviewStatus;
  current_spatial_count: number;
  queued_count: number;
  skipped_known_or_classified: number;
  warnings: string[];
}

interface ExpansionQueueResult {
  run_id: string;
  generated_at: string;
  expansion_batch_id: string;
  mode: 'read_only_gallery_expansion_queue';
  source_batches_used: string[];
  venues_targeted: number;
  queue_size: number;
  per_venue: VenueQueueSummary[];
  queue: ExpansionQueueItem[];
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
  maxImagesPerVenue: number;
  includeReady: boolean;
}

const SPATIAL_HINTS = [
  'interior',
  'inside',
  'salon',
  'salón',
  'dining',
  'room',
  'bar',
  'barra',
  'ambience',
  'ambiente',
  'atmosphere',
  'terraza',
  'terrace',
  'rooftop',
  'patio',
  'jardin',
  'jardín',
  'lounge',
  'space',
  'restaurant',
  'cafe',
  'café',
];

const PRODUCT_HINTS = [
  'food',
  'dish',
  'plate',
  'menu',
  'burger',
  'pizza',
  'coffee',
  'espresso',
  'cocktail',
  'drink',
  'wine',
  'dessert',
  'cake',
  'sandwich',
  'parrilla',
];

export async function buildGalleryVisionQueue(options: Options): Promise<ExpansionQueueResult> {
  const outputDir = path.join(process.cwd(), 'data', 'enrichment', options.runId);
  const manifestPath = path.join(outputDir, 'gallery_review_manifest.json');
  const candidatesPath = path.join(outputDir, 'gallery_candidates.json');
  if (!existsSync(manifestPath)) throw new Error(`Missing gallery review manifest: ${manifestPath}`);
  if (!existsSync(candidatesPath)) throw new Error(`Missing gallery candidates: ${candidatesPath}`);

  const manifest = readJson<GalleryReviewManifest>(manifestPath);
  const sourceBatches = sourceBatchesFromCandidates(readJson<GalleryCandidateFileItem[]>(candidatesPath));
  const previousExpansionBatchId = readPreviousExpansionBatchId(outputDir);
  const targetEntries = manifest.entries.filter((entry) => options.includeReady || entry.status !== 'ready_for_gallery_review');
  const targetNames = new Map(targetEntries.map((entry) => [normalizeText(entry.venue_name), entry]));
  const knownUrls = new Set<string>();
  for (const entry of manifest.entries) {
    if (entry.current_hero_url) knownUrls.add(entry.current_hero_url);
    for (const image of entry.images || []) {
      if (image.resolved_image_url) knownUrls.add(image.resolved_image_url);
    }
  }

  const classifiedUrls = new Set<string>();
  const queueSources: ImageCandidate[] = [];
  if (previousExpansionBatchId) {
    const previousStage04Path = path.join(process.cwd(), 'data', 'batches', previousExpansionBatchId, 'stage_04_vision_results.json');
    if (existsSync(previousStage04Path)) {
      for (const result of readJson<Stage04ResultsFile>(previousStage04Path).results || []) {
        if (result.resolved_image_url) classifiedUrls.add(result.resolved_image_url);
      }
    }
  }
  for (const batchId of sourceBatches) {
    const stage04Path = path.join(process.cwd(), 'data', 'batches', batchId, 'stage_04_vision_results.json');
    if (existsSync(stage04Path)) {
      for (const result of readJson<Stage04ResultsFile>(stage04Path).results || []) {
        if (result.resolved_image_url) classifiedUrls.add(result.resolved_image_url);
      }
    }

    const stage03Path = path.join(process.cwd(), 'data', 'batches', batchId, 'stage_03_final_vision_queue.json');
    if (!existsSync(stage03Path)) continue;
    for (const candidate of readJson<Stage03QueueFile>(stage03Path).queue || []) {
      if (targetNames.has(normalizeText(candidate.venue_name))) queueSources.push(candidate);
    }
  }

  const byVenue = groupBy(queueSources, (candidate) => normalizeText(candidate.venue_name));
  const queue: ExpansionQueueItem[] = [];
  const perVenue: VenueQueueSummary[] = [];

  for (const entry of targetEntries) {
    const candidates = byVenue.get(normalizeText(entry.venue_name)) || [];
    let skipped = 0;
    const ranked = candidates
      .filter((candidate) => {
        if (!candidate.resolved_image_url || knownUrls.has(candidate.resolved_image_url) || classifiedUrls.has(candidate.resolved_image_url)) {
          skipped += 1;
          return false;
        }
        return true;
      })
      .map((candidate) => scoreExpansionCandidate(candidate, options.runId))
      .sort((a, b) => b.gallery_candidate_score - a.gallery_candidate_score)
      .slice(0, options.maxImagesPerVenue);

    queue.push(...ranked);
    perVenue.push({
      venue_id: entry.venue_id,
      venue_name: entry.venue_name,
      status: entry.status,
      current_spatial_count: entry.spatial_count,
      queued_count: ranked.length,
      skipped_known_or_classified: skipped,
      warnings: ranked.length === 0 ? ['no_unclassified_prefiltered_images_available'] : [],
    });
  }

  const expansionBatchId = `${options.runId}_gallery_expansion`;
  const expansionBatchDir = path.join(process.cwd(), 'data', 'batches', expansionBatchId);
  const result: ExpansionQueueResult = {
    run_id: options.runId,
    generated_at: new Date().toISOString(),
    expansion_batch_id: expansionBatchId,
    mode: 'read_only_gallery_expansion_queue',
    source_batches_used: sourceBatches,
    venues_targeted: targetEntries.length,
    queue_size: queue.length,
    per_venue: perVenue,
    queue,
    next_command: queue.length > 0 ? `npx tsx pipeline/stages/04_classify_images.ts ${expansionBatchId} --max-images-per-venue ${options.maxImagesPerVenue}` : undefined,
    safety: {
      no_supabase_writes: true,
      no_cloudinary_uploads: true,
      no_publication_changes: true,
      no_m3_calls: true,
    },
  };

  mkdirSync(outputDir, { recursive: true });
  mkdirSync(expansionBatchDir, { recursive: true });
  writeFileSync(path.join(outputDir, 'gallery_expansion_queue.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  writeFileSync(path.join(outputDir, 'gallery_expansion_report.md'), buildReport(result), 'utf8');
  if (queue.length > 0) {
    writeFileSync(path.join(expansionBatchDir, 'stage_03_final_vision_queue.json'), `${JSON.stringify({
      batch_id: expansionBatchId,
      generated_at: result.generated_at,
      ready_for_stage_04_m3: true,
      queue,
      summary: {
        source: 'enrichment_gallery_expansion',
        parent_run_id: options.runId,
        source_batches_used: sourceBatches,
        venues_targeted: targetEntries.length,
        final_queue_size: queue.length,
      },
    }, null, 2)}\n`, 'utf8');
  }

  console.log(`Gallery expansion queue written to ${path.join(outputDir, 'gallery_expansion_queue.json')}`);
  console.log(`Gallery expansion report written to ${path.join(outputDir, 'gallery_expansion_report.md')}`);
  if (queue.length > 0) console.log(`Reusable Stage 04 queue written to ${path.join(expansionBatchDir, 'stage_03_final_vision_queue.json')}`);
  console.log(`E02B expansion summary: targeted=${result.venues_targeted}, queue=${result.queue_size}, source_batches=${sourceBatches.join(', ') || 'none'}`);
  if (result.next_command) console.log(`Next command: ${result.next_command}`);
  return result;
}

function sourceBatchesFromCandidates(candidates: GalleryCandidateFileItem[]): string[] {
  return [...new Set(candidates.map((candidate) => safeString(candidate.source_batch_id)).filter((batchId) => batchId && !batchId.endsWith('_gallery_expansion')))].sort();
}

function readPreviousExpansionBatchId(outputDir: string): string {
  const filePath = path.join(outputDir, 'gallery_expansion_queue.json');
  if (!existsSync(filePath)) return '';
  try {
    const parsed = readJson<{ expansion_batch_id?: unknown }>(filePath);
    return safeString(parsed.expansion_batch_id);
  } catch {
    return '';
  }
}

function scoreExpansionCandidate(candidate: ImageCandidate, runId: string): ExpansionQueueItem {
  const reason: string[] = [];
  let score = 0;
  const text = normalizeText([
    candidate.resolved_image_url,
    candidate.original_image_url,
    candidate.alt_text,
    candidate.source_page_context,
    candidate.source_type,
  ].map(safeString).join(' '));

  if ((candidate.width || 0) >= 1024 || (candidate.height || 0) >= 1024) {
    score += 20;
    reason.push('preferred_resolution+20');
  }
  if (safeString(candidate.source_type) === 'official_website') {
    score += 18;
    reason.push('official_website+18');
  } else if (safeString(candidate.source_type) === 'google_places') {
    score += 10;
    reason.push('google_places+10');
  }
  const spatialHits = SPATIAL_HINTS.filter((hint) => text.includes(normalizeText(hint))).length;
  if (spatialHits > 0) {
    const value = Math.min(24, spatialHits * 6);
    score += value;
    reason.push(`spatial_context+${value}`);
  }
  const productHits = PRODUCT_HINTS.filter((hint) => text.includes(normalizeText(hint))).length;
  if (productHits > 0) {
    const penalty = Math.min(18, productHits * 4);
    score -= penalty;
    reason.push(`product_context-${penalty}`);
  }
  if ((candidate.risk_flags || []).includes('preferred_resolution')) {
    score += 8;
    reason.push('preflight_preferred_resolution+8');
  }
  if ((candidate.risk_flags || []).includes('rights_review_needed')) {
    score -= 2;
    reason.push('rights_review_needed-2');
  }
  const preM3Score = safeNumber((candidate as { pre_m3_score?: unknown }).pre_m3_score);
  score += preM3Score ? Math.min(20, Math.round(preM3Score / 5)) : 0;
  if (preM3Score) reason.push(`pre_m3_score+${Math.min(20, Math.round(preM3Score / 5))}`);

  return {
    ...candidate,
    enrichment_run_id: runId,
    expansion_reason: reason,
    gallery_candidate_score: score,
  };
}

function buildReport(result: ExpansionQueueResult): string {
  return [
    `# Gallery Expansion Vision Queue - ${result.run_id}`,
    '',
    `- Generated: ${result.generated_at}`,
    `- Expansion batch id: ${result.expansion_batch_id}`,
    `- Source batches used: ${result.source_batches_used.join(', ') || 'none'}`,
    `- Venues targeted: ${result.venues_targeted}`,
    `- Queue size: ${result.queue_size}`,
    '',
    '## Per Venue',
    '',
    '| Venue | Status | Current Spatial | Queued | Skipped Known/Classified | Warnings |',
    '| --- | --- | ---: | ---: | ---: | --- |',
    ...result.per_venue.map((item) =>
      `| ${escapeMd(item.venue_name)} | ${item.status} | ${item.current_spatial_count} | ${item.queued_count} | ${item.skipped_known_or_classified} | ${escapeMd(item.warnings.join(', ') || 'none')} |`,
    ),
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

function groupBy<T>(items: T[], keyFn: (item: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    groups.set(key, [...(groups.get(key) || []), item]);
  }
  return groups;
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, 'utf8')) as T;
}

function parseArgs(argv: string[]): Options {
  const runIdFlagIndex = argv.indexOf('--run-id');
  const runId = runIdFlagIndex >= 0 ? safeString(argv[runIdFlagIndex + 1]) : safeString(argv[0]);
  const maxFlagIndex = argv.indexOf('--max-images-per-venue');
  const maxImagesPerVenue = maxFlagIndex >= 0 ? Number(argv[maxFlagIndex + 1]) : 8;
  if (!runId) throw new Error('Usage: npx tsx pipeline/enrichment/02b_build_gallery_vision_queue.ts --run-id <run_id> [--max-images-per-venue 8] [--include-ready]');
  if (!Number.isFinite(maxImagesPerVenue) || maxImagesPerVenue < 1) throw new Error('--max-images-per-venue must be a positive number');
  return {
    runId,
    maxImagesPerVenue,
    includeReady: argv.includes('--include-ready'),
  };
}

const isCli = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isCli) {
  buildGalleryVisionQueue(parseArgs(process.argv.slice(2))).catch((error: unknown) => {
    console.error(`E02B gallery expansion queue failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
