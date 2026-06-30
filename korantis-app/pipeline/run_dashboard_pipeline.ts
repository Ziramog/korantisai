import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { runStage01Cli } from './stages/01_extract_data';
import { runStage02SourceDiscovery } from './stages/02_discover_sources';
import { runStage03ImageDiscovery } from './stages/03_discover_images';
import { runStage04VisionClassification } from './stages/04_classify_images';
import { runStage05EditorialGeneration } from './stages/05_generate_editorial';
import { retryFailedEditorial } from './stages/05b_retry_failed_editorial';
import { connectSelectedImages } from './stages/connect_selected_images';
import { runQualityGate } from './stages/06_quality_gate';
import { generateApprovalManifest } from './stages/07_generate_approval_manifest';
import { runSupabaseStagingDryRun } from './stages/08_sync_supabase_staging';
import { generatePublicationReview } from './stages/09_generate_publication_review';
import { runReviewedPublicationApply } from './stages/run_reviewed_publication_apply';
import { generateControlPanel } from './stages/13_generate_control_panel';
import { buildGallerySelection } from './stages/15_build_gallery_selection';
import { generateAutoPublicationReview } from './stages/17_auto_publication_review';

type Phase = 'images' | 'editorial-quality' | 'safe-full' | 'auto-publish';
type StepStatus = 'completed' | 'skipped_existing' | 'failed';

interface DashboardPipelineOptions {
  phase: Phase;
  force: boolean;
  skipOfficialImages: boolean;
  maxCandidatesPerVenue: number;
  maxImagesPerVenue: number;
  skipStage08: boolean;
}

interface StepReport {
  step: string;
  status: StepStatus;
  output?: string;
  notes: string;
  started_at: string;
  finished_at: string;
}

const currentFile = path.resolve(fileURLToPath(import.meta.url));
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : '';

if (currentFile === invokedFile) {
  const batchName = process.argv[2];
  if (!batchName) {
    console.error('Usage: npx tsx pipeline/run_dashboard_pipeline.ts <batch_id> [--phase images|editorial-quality|safe-full|auto-publish] [--force] [--max-candidates-per-venue 6] [--max-images-per-venue 3] [--skip-official-images] [--skip-stage-08]');
    process.exitCode = 1;
  } else {
    runDashboardPipeline(batchName, parseOptions(process.argv.slice(3))).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Dashboard pipeline failed: ${message}`);
      process.exitCode = 1;
    });
  }
}

export async function runDashboardPipeline(batchName: string, options: DashboardPipelineOptions): Promise<StepReport[]> {
  const outputDir = path.join(process.cwd(), 'data', 'batches', batchName);
  mkdirSync(outputDir, { recursive: true });
  const steps: StepReport[] = [];

  if (options.phase === 'images' || options.phase === 'safe-full') {
    await runImagesPhase(batchName, outputDir, options, steps);
  }
  if (options.phase === 'editorial-quality' || options.phase === 'safe-full') {
    await runEditorialQualityPhase(batchName, outputDir, options, steps);
  }
  if (options.phase === 'auto-publish') {
    await runAutoPublishPhase(batchName, outputDir, options, steps);
  }

  writeReports(outputDir, batchName, options, steps);
  console.log(`Dashboard pipeline summary: batch=${batchName}, phase=${options.phase}, steps=${steps.length}`);
  return steps;
}

async function runImagesPhase(
  batchName: string,
  outputDir: string,
  options: DashboardPipelineOptions,
  steps: StepReport[],
): Promise<void> {
  await runStep(steps, options, '01_extract_data', path.join(outputDir, 'stage_01_raw_venues.json'), async () => {
    await runStage01Cli(batchName);
  });
  await runStep(steps, options, '02_discover_sources', path.join(outputDir, 'stage_02_source_discovery.json'), async () => {
    await runStage02SourceDiscovery(batchName);
  });
  await runStep(steps, options, '03_discover_images', path.join(outputDir, 'stage_03_final_vision_queue.json'), async () => {
    await runStage03ImageDiscovery(batchName, {
      maxCandidatesPerVenue: options.maxCandidatesPerVenue,
      skipOfficialImages: options.skipOfficialImages,
    });
  });
  await runStep(steps, options, '04_classify_images', path.join(outputDir, 'stage_04_selected_images.json'), async () => {
    await runStage04VisionClassification(batchName, { maxImagesPerVenue: options.maxImagesPerVenue });
  });
  await runStep(steps, options, 'connect_selected_images', path.join(outputDir, 'batch_result_with_images.json'), async () => {
    await connectSelectedImages(batchName);
  });
}

async function runEditorialQualityPhase(
  batchName: string,
  outputDir: string,
  options: DashboardPipelineOptions,
  steps: StepReport[],
): Promise<void> {
  await runStep(steps, options, '05_generate_editorial', path.join(outputDir, 'batch_result_with_editorial.json'), async () => {
    const result = await runStage05EditorialGeneration(batchName);
    const textProvider = (process.env.KORANTIS_TEXT_PROVIDER || process.env.TEXT_PROVIDER || '').trim().toLowerCase();
    if (textProvider !== 'mimo' && (result.failed_generations > 0 || result.invalid_json_count > 0)) {
      await retryFailedEditorial(batchName);
    }
  });
  await runStep(steps, options, '05_alias_enriched_result', path.join(outputDir, 'batch_result_enriched.json'), async () => {
    copyFileSync(path.join(outputDir, 'batch_result_with_editorial.json'), path.join(outputDir, 'batch_result_enriched.json'));
  });
  await runStep(steps, options, '06_quality_gate', path.join(outputDir, 'batch_result_quality_gated.json'), async () => {
    runQualityGate(batchName);
  });
  await runStep(steps, options, '07_generate_approval_manifest', path.join(outputDir, 'approval_manifest.json'), async () => {
    generateApprovalManifest(batchName);
  });

  if (!options.skipStage08) {
    await runStep(steps, options, '08_supabase_staging_dry_run', path.join(outputDir, 'supabase_staging_dry_run.json'), async () => {
      await runSupabaseStagingDryRun(batchName, ['--dry-run']);
    });
  }

  await runStep(steps, options, '09_publication_review', path.join(outputDir, 'publication_decision_manifest.json'), async () => {
    generatePublicationReview(batchName);
  });
  await runStep(steps, options, '13_control_panel', path.join(outputDir, 'pipeline_control_panel.html'), async () => {
    generateControlPanel(batchName);
  });
}

async function runAutoPublishPhase(
  batchName: string,
  outputDir: string,
  options: DashboardPipelineOptions,
  steps: StepReport[],
): Promise<void> {
  await runStep(steps, options, '15_gallery_selection', path.join(outputDir, 'stage_15_gallery_selection.json'), async () => {
    buildGallerySelection(batchName);
  });
  await runStep(steps, options, '17_auto_publication_review', path.join(outputDir, 'publication_decision_manifest.reviewed.json'), async () => {
    generateAutoPublicationReview(batchName);
  });
  await runStep(steps, options, 'reviewed_publication_apply', path.join(outputDir, 'reviewed_publication_apply_result.json'), async () => {
    await runReviewedPublicationApply(batchName);
  });
  await runStep(steps, options, '13_control_panel', path.join(outputDir, 'pipeline_control_panel.html'), async () => {
    generateControlPanel(batchName);
  });
}

async function runStep(
  steps: StepReport[],
  options: DashboardPipelineOptions,
  step: string,
  output: string,
  action: () => Promise<void>,
): Promise<void> {
  const startedAt = new Date().toISOString();
  if (!options.force && existsSync(output)) {
    console.log(`Skipping ${step}; output exists.`);
    steps.push({
      step,
      status: 'skipped_existing',
      output,
      notes: 'Skipped because output already exists. Use --force to rerun.',
      started_at: startedAt,
      finished_at: new Date().toISOString(),
    });
    return;
  }

  console.log(`Running ${step}...`);
  try {
    await action();
    steps.push({
      step,
      status: 'completed',
      output,
      notes: 'Completed.',
      started_at: startedAt,
      finished_at: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    steps.push({
      step,
      status: 'failed',
      output,
      notes: message,
      started_at: startedAt,
      finished_at: new Date().toISOString(),
    });
    throw error;
  } finally {
    const outputDir = path.dirname(output);
    const batchName = path.basename(outputDir);
    writeReports(outputDir, batchName, options, steps);
  }
}

function writeReports(outputDir: string, batchName: string, options: DashboardPipelineOptions, steps: StepReport[]): void {
  const publishes = options.phase === 'auto-publish';
  const payload = {
    batch_id: batchName,
    generated_at: new Date().toISOString(),
    phase: options.phase,
    safety: {
      supabase_apply: publishes,
      cloudinary_upload: publishes,
      public_publish: publishes,
    },
    options,
    steps,
  };
  writeFileSync(path.join(outputDir, 'dashboard_pipeline_run_report.json'), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  writeFileSync(path.join(outputDir, 'dashboard_pipeline_run_report.md'), buildMarkdownReport(payload), 'utf8');
}

function buildMarkdownReport(report: { batch_id: string; generated_at: string; phase: string; safety: { supabase_apply: boolean; cloudinary_upload: boolean; public_publish: boolean }; steps: StepReport[] }): string {
  return [
    '# Dashboard Pipeline Run Report',
    '',
    `- Batch: ${report.batch_id}`,
    `- Generated: ${report.generated_at}`,
    `- Phase: ${report.phase}`,
    `- Supabase apply: ${report.safety.supabase_apply}`,
    `- Cloudinary upload: ${report.safety.cloudinary_upload}`,
    `- Public publish: ${report.safety.public_publish}`,
    '',
    '## Steps',
    '',
    '| Step | Status | Notes |',
    '| --- | --- | --- |',
    ...report.steps.map((step) => `| ${escapeTable(step.step)} | ${step.status} | ${escapeTable(step.notes)} |`),
    '',
  ].join('\n');
}

function parseOptions(args: string[]): DashboardPipelineOptions {
  const phase = (valueAfter(args, '--phase') || 'safe-full') as Phase;
  if (!['images', 'editorial-quality', 'safe-full', 'auto-publish'].includes(phase)) throw new Error(`Invalid --phase: ${phase}`);
  return {
    phase,
    force: args.includes('--force'),
    skipOfficialImages: args.includes('--skip-official-images'),
    maxCandidatesPerVenue: positiveInt(valueAfter(args, '--max-candidates-per-venue'), 6),
    maxImagesPerVenue: positiveInt(valueAfter(args, '--max-images-per-venue'), 3),
    skipStage08: args.includes('--skip-stage-08'),
  };
}

function valueAfter(args: string[], key: string): string | undefined {
  const index = args.indexOf(key);
  return index === -1 ? undefined : args[index + 1];
}

function positiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function escapeTable(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}
