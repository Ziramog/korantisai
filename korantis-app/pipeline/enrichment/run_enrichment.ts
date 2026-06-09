import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { runStage04VisionClassification } from '../stages/04_classify_images';
import { selectEnrichmentTargets } from './00_select_targets';
import { collectEvidence } from './01_collect_evidence';
import { discoverGallery } from './02_discover_gallery';
import { buildGalleryVisionQueue } from './02b_build_gallery_vision_queue';
import { runDeepImageDiscovery } from './02c_deep_image_discovery';
import { generateGalleryReview } from './03_generate_gallery_review';
import { escapeMd, safeString } from './utils/enrichment_types';

interface Options {
  runId?: string;
  city?: string;
  activeOnly: boolean;
  pendingReview: boolean;
  missingGallery: boolean;
  missingEditorial: boolean;
  missingFacts: boolean;
  maxTargets: number;
  force: boolean;
  resume: boolean;
  allowM3: boolean;
  maxGalleryImages: number;
  maxExpansionImagesPerVenue: number;
  maxDeepCandidatesPerVenue: number;
}

interface OrchestratorStep {
  name: string;
  status: 'completed' | 'skipped' | 'paused' | 'failed';
  detail: string;
}

interface GalleryReviewManifest {
  total_venues: number;
  ready_for_gallery_review: number;
  needs_more_spatial_images: number;
  blocked_gallery_quality: number;
  total_images: number;
}

interface GalleryExpansionQueue {
  expansion_batch_id: string;
  queue_size: number;
  next_command?: string;
}

interface DeepImageQueue {
  deep_discovery_batch_id: string;
  final_queue_size: number;
  next_command?: string;
}

interface OrchestratorResult {
  run_id: string;
  generated_at: string;
  mode: 'enrichment_orchestrator';
  status: 'review_ready' | 'paused_for_m3' | 'completed_with_warnings';
  allow_m3: boolean;
  steps: OrchestratorStep[];
  summary: {
    targets: number;
    gallery_ready: number;
    needs_more_spatial: number;
    blocked_gallery_quality: number;
    gallery_images: number;
    expansion_queue_size: number;
    expansion_batch_id?: string;
  };
  next_command?: string;
  output_files: string[];
  safety: {
    no_supabase_writes: true;
    no_cloudinary_uploads: true;
    no_publication_changes: true;
    m3_only_when_allow_m3: true;
  };
}

export async function runEnrichment(options: Options): Promise<OrchestratorResult> {
  const runId = options.runId || buildRunId();
  const outputDir = path.join(process.cwd(), 'data', 'enrichment', runId);
  mkdirSync(outputDir, { recursive: true });

  const steps: OrchestratorStep[] = [];
  try {
    if (options.resume && existsSync(path.join(outputDir, 'enrichment_targets.json'))) {
      steps.push({ name: 'E00 target selection', status: 'skipped', detail: 'resume_existing_targets' });
    } else {
      const targets = await selectEnrichmentTargets({
        activeOnly: options.activeOnly,
        pendingReview: options.pendingReview,
        city: options.city,
        venueIds: [],
        missingGallery: options.missingGallery,
        missingEditorial: options.missingEditorial,
        missingFacts: options.missingFacts,
        maxTargets: options.maxTargets,
        force: options.force,
        runId,
      });
      steps.push({ name: 'E00 target selection', status: 'completed', detail: `selected=${targets.selected_count}` });
    }

    if (options.resume && existsSync(path.join(outputDir, 'evidence_collected.json'))) {
      steps.push({ name: 'E01 evidence collection', status: 'skipped', detail: 'resume_existing_evidence' });
    } else {
      const evidence = await collectEvidence({ runId });
      steps.push({ name: 'E01 evidence collection', status: 'completed', detail: `coverage=${evidence.average_evidence_coverage}; sources=${evidence.sources_successful}/${evidence.sources_attempted}` });
    }

    const gallery = await discoverGallery({ runId, maxGalleryImages: options.maxGalleryImages });
    steps.push({ name: 'E02 gallery discovery', status: 'completed', detail: `selected=${gallery.total_gallery_images_selected}; venues=${gallery.venues_with_gallery_selection}/${gallery.targets}` });

    let review = await generateGalleryReview({ runId });
    steps.push({ name: 'E03 gallery review', status: 'completed', detail: `ready=${review.ready_for_gallery_review}; needs_more_spatial=${review.needs_more_spatial_images}` });

    let expansion: GalleryExpansionQueue | undefined;
    let deepQueue: DeepImageQueue | undefined;
    if (review.needs_more_spatial_images > 0) {
      expansion = await buildGalleryVisionQueue({
        runId,
        maxImagesPerVenue: options.maxExpansionImagesPerVenue,
        includeReady: false,
      });
      steps.push({ name: 'E02B gallery expansion queue', status: 'completed', detail: `queue=${expansion.queue_size}; batch=${expansion.expansion_batch_id}` });

      if (expansion.queue_size > 0 && options.allowM3) {
        await runStage04VisionClassification(expansion.expansion_batch_id, { maxImagesPerVenue: options.maxExpansionImagesPerVenue });
        steps.push({ name: 'M3 gallery expansion classification', status: 'completed', detail: `batch=${expansion.expansion_batch_id}` });

        const refreshedGallery = await discoverGallery({ runId, maxGalleryImages: options.maxGalleryImages });
        steps.push({ name: 'E02 gallery rediscovery after M3', status: 'completed', detail: `selected=${refreshedGallery.total_gallery_images_selected}; venues=${refreshedGallery.venues_with_gallery_selection}/${refreshedGallery.targets}` });
        review = await generateGalleryReview({ runId });
        steps.push({ name: 'E03 gallery review after M3', status: 'completed', detail: `ready=${review.ready_for_gallery_review}; needs_more_spatial=${review.needs_more_spatial_images}` });
      } else if (expansion.queue_size > 0) {
        steps.push({ name: 'M3 gallery expansion classification', status: 'paused', detail: 'run with --allow-m3 or execute next_command manually' });
      }

      if (expansion.queue_size === 0 && review.needs_more_spatial_images > 0) {
        deepQueue = await runDeepImageDiscovery({
          runId,
          maxVenues: review.needs_more_spatial_images,
          maxCandidatesPerVenue: options.maxDeepCandidatesPerVenue,
        });
        steps.push({ name: 'E02C deep image discovery', status: 'completed', detail: `queue=${deepQueue.final_queue_size}; batch=${deepQueue.deep_discovery_batch_id}` });

        if (deepQueue.final_queue_size > 0 && options.allowM3) {
          await runStage04VisionClassification(deepQueue.deep_discovery_batch_id, { maxImagesPerVenue: options.maxDeepCandidatesPerVenue });
          steps.push({ name: 'M3 deep image classification', status: 'completed', detail: `batch=${deepQueue.deep_discovery_batch_id}` });

          const refreshedGallery = await discoverGallery({ runId, maxGalleryImages: options.maxGalleryImages });
          steps.push({ name: 'E02 gallery rediscovery after deep M3', status: 'completed', detail: `selected=${refreshedGallery.total_gallery_images_selected}; venues=${refreshedGallery.venues_with_gallery_selection}/${refreshedGallery.targets}` });
          review = await generateGalleryReview({ runId });
          steps.push({ name: 'E03 gallery review after deep M3', status: 'completed', detail: `ready=${review.ready_for_gallery_review}; needs_more_spatial=${review.needs_more_spatial_images}` });
        } else if (deepQueue.final_queue_size > 0) {
          steps.push({ name: 'M3 deep image classification', status: 'paused', detail: 'run with --allow-m3 or execute next_command manually' });
        }
      }
    }

    const pendingM3Queue = (expansion?.queue_size || 0) + (deepQueue?.final_queue_size || 0);
    const status: OrchestratorResult['status'] = pendingM3Queue > 0 && !options.allowM3
      ? 'paused_for_m3'
      : review.needs_more_spatial_images > 0
        ? 'completed_with_warnings'
        : 'review_ready';

    const result = buildResult(runId, options, steps, review, expansion, deepQueue, status);
    writeOutputs(outputDir, result);
    printSummary(result);
    return result;
  } catch (error) {
    steps.push({ name: 'orchestrator', status: 'failed', detail: error instanceof Error ? error.message : String(error) });
    const fallbackReview = readJsonIfExists<GalleryReviewManifest>(path.join(outputDir, 'gallery_review_manifest.json')) || {
      total_venues: 0,
      ready_for_gallery_review: 0,
      needs_more_spatial_images: 0,
      blocked_gallery_quality: 0,
      total_images: 0,
    };
    const fallbackExpansion = readJsonIfExists<GalleryExpansionQueue>(path.join(outputDir, 'gallery_expansion_queue.json'));
    const fallbackDeep = readJsonIfExists<DeepImageQueue>(path.join(outputDir, 'deep_image_queue.json'));
    const result = buildResult(runId, options, steps, fallbackReview, fallbackExpansion, fallbackDeep, 'completed_with_warnings');
    writeOutputs(outputDir, result);
    throw error;
  }
}

function buildResult(
  runId: string,
  options: Options,
  steps: OrchestratorStep[],
  review: GalleryReviewManifest,
  expansion: GalleryExpansionQueue | undefined,
  deepQueue: DeepImageQueue | undefined,
  status: OrchestratorResult['status'],
): OrchestratorResult {
  const outputDir = path.join(process.cwd(), 'data', 'enrichment', runId);
  return {
    run_id: runId,
    generated_at: new Date().toISOString(),
    mode: 'enrichment_orchestrator',
    status,
    allow_m3: options.allowM3,
    steps,
    summary: {
      targets: review.total_venues,
      gallery_ready: review.ready_for_gallery_review,
      needs_more_spatial: review.needs_more_spatial_images,
      blocked_gallery_quality: review.blocked_gallery_quality,
      gallery_images: review.total_images,
      expansion_queue_size: (expansion?.queue_size || 0) + (deepQueue?.final_queue_size || 0),
      expansion_batch_id: deepQueue?.deep_discovery_batch_id || expansion?.expansion_batch_id,
    },
    next_command: status === 'paused_for_m3' ? deepQueue?.next_command || expansion?.next_command : undefined,
    output_files: [
      path.join(outputDir, 'enrichment_targets.json'),
      path.join(outputDir, 'evidence_collected.json'),
      path.join(outputDir, 'gallery_selection.json'),
      path.join(outputDir, 'gallery_review_manifest.json'),
      path.join(outputDir, 'gallery_review_dashboard.html'),
      path.join(outputDir, 'enrichment_orchestrator_report.md'),
    ],
    safety: {
      no_supabase_writes: true,
      no_cloudinary_uploads: true,
      no_publication_changes: true,
      m3_only_when_allow_m3: true,
    },
  };
}

function writeOutputs(outputDir: string, result: OrchestratorResult): void {
  writeFileSync(path.join(outputDir, 'enrichment_orchestrator_report.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  writeFileSync(path.join(outputDir, 'enrichment_orchestrator_report.md'), buildReport(result), 'utf8');
}

function buildReport(result: OrchestratorResult): string {
  return [
    `# Enrichment Orchestrator Report - ${result.run_id}`,
    '',
    `- Generated: ${result.generated_at}`,
    `- Status: ${result.status}`,
    `- M3 allowed: ${result.allow_m3}`,
    `- Targets: ${result.summary.targets}`,
    `- Gallery ready: ${result.summary.gallery_ready}`,
    `- Needs more spatial images: ${result.summary.needs_more_spatial}`,
    `- Blocked gallery quality: ${result.summary.blocked_gallery_quality}`,
    `- Gallery images selected: ${result.summary.gallery_images}`,
    `- Expansion queue size: ${result.summary.expansion_queue_size}`,
    '',
    '## Steps',
    '',
    '| Step | Status | Detail |',
    '| --- | --- | --- |',
    ...result.steps.map((step) => `| ${escapeMd(step.name)} | ${step.status} | ${escapeMd(step.detail)} |`),
    '',
    '## Next Command',
    '',
    result.next_command ? '```powershell' : '- none',
    result.next_command || '',
    result.next_command ? '```' : '',
    '',
    '## Outputs',
    '',
    ...result.output_files.map((file) => `- ${file}`),
    '',
    '## Safety',
    '',
    ...Object.entries(result.safety).map(([key, value]) => `- ${key}: ${value}`),
  ].filter((line) => line !== undefined).join('\n') + '\n';
}

function printSummary(result: OrchestratorResult): void {
  console.log(`Enrichment orchestrator report written for ${result.run_id}`);
  console.log(`Enrichment status: ${result.status}`);
  console.log(`Gallery summary: targets=${result.summary.targets}, ready=${result.summary.gallery_ready}, needs_more_spatial=${result.summary.needs_more_spatial}, images=${result.summary.gallery_images}`);
  if (result.next_command) console.log(`Next command: ${result.next_command}`);
}

function buildRunId(): string {
  const now = new Date();
  const pad = (value: number): string => String(value).padStart(2, '0');
  return `enrich_${now.getFullYear()}_${pad(now.getMonth() + 1)}_${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
}

function readJsonIfExists<T>(filePath: string): T | null {
  if (!existsSync(filePath)) return null;
  return JSON.parse(readFileSync(filePath, 'utf8')) as T;
}

function parseArgs(argv: string[]): Options {
  const valueAfter = (flag: string): string => {
    const index = argv.indexOf(flag);
    return index >= 0 ? safeString(argv[index + 1]) : '';
  };
  const maxTargets = Number(valueAfter('--max-targets') || '50');
  const maxGalleryImages = Number(valueAfter('--max-gallery-images') || '4');
  const maxExpansionImagesPerVenue = Number(valueAfter('--max-expansion-images-per-venue') || '8');
  const maxDeepCandidatesPerVenue = Number(valueAfter('--max-deep-candidates-per-venue') || '32');
  return {
    runId: valueAfter('--run-id') || undefined,
    city: valueAfter('--city') || undefined,
    activeOnly: argv.includes('--active-only'),
    pendingReview: argv.includes('--pending-review'),
    missingGallery: argv.includes('--missing-gallery'),
    missingEditorial: argv.includes('--missing-editorial'),
    missingFacts: argv.includes('--missing-facts'),
    maxTargets: Number.isFinite(maxTargets) && maxTargets > 0 ? maxTargets : 50,
    force: argv.includes('--force'),
    resume: argv.includes('--resume'),
    allowM3: argv.includes('--allow-m3'),
    maxGalleryImages: Number.isFinite(maxGalleryImages) && maxGalleryImages > 0 ? maxGalleryImages : 4,
    maxExpansionImagesPerVenue: Number.isFinite(maxExpansionImagesPerVenue) && maxExpansionImagesPerVenue > 0 ? maxExpansionImagesPerVenue : 8,
    maxDeepCandidatesPerVenue: Number.isFinite(maxDeepCandidatesPerVenue) && maxDeepCandidatesPerVenue > 0 ? maxDeepCandidatesPerVenue : 32,
  };
}

const isCli = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isCli) {
  runEnrichment(parseArgs(process.argv.slice(2))).catch((error: unknown) => {
    console.error(`Enrichment orchestrator failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
