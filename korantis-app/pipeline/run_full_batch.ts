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
import { projectToPublicDryRun } from './stages/11_project_to_public';
import { generateControlPanel } from './stages/13_generate_control_panel';
import type { BatchInput } from './types';

type StageState = 'completed' | 'skipped_existing' | 'failed' | 'planned';

interface RunnerOptions {
  force: boolean;
  planOnly: boolean;
  allowNon50: boolean;
  skipStage08: boolean;
  skipPublicationReview: boolean;
  maxImagesPerVenue?: number;
}

interface StageSummary {
  stage: string;
  status: StageState;
  output?: string;
  notes: string;
  started_at: string;
  finished_at: string;
}

interface FullRunReport {
  batch_id: string;
  generated_at: string;
  input_venues: number;
  mode: 'plan' | 'run';
  safety: {
    supabase_apply: false;
    cloudinary_upload: false;
    public_publish: false;
    consumer_ui_changes: false;
  };
  stages: StageSummary[];
  final_outputs: string[];
  next_action: string;
}

const currentFile = path.resolve(fileURLToPath(import.meta.url));
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : '';

if (currentFile === invokedFile) {
  const batchName = process.argv[2];
  if (!batchName) {
    console.error('Usage: npx tsx pipeline/run_full_batch.ts <batch_id> [--force] [--plan] [--allow-non-50] [--skip-stage-08]');
    process.exitCode = 1;
  } else {
    runFullBatch(batchName, parseOptions(process.argv.slice(3))).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Full batch run failed: ${message}`);
      process.exitCode = 1;
    });
  }
}

export async function runFullBatch(batchName: string, options: RunnerOptions): Promise<FullRunReport> {
  const inputPath = path.join(process.cwd(), 'pipeline', 'input', `${batchName}.json`);
  if (!existsSync(inputPath)) {
    throw new Error(`Missing batch input: ${inputPath}`);
  }

  const input = readJson<BatchInput>(inputPath);
  const venueCount = input.venues?.length || input.prebuilt_venues?.length || 0;
  validateInputForScale(batchName, venueCount, options);

  const outputDir = path.join(process.cwd(), 'data', 'batches', input.batch_id);
  mkdirSync(outputDir, { recursive: true });

  const stages: StageSummary[] = [];
  await runStage(stages, options, {
    name: '01_extract_data',
    output: path.join(outputDir, 'stage_01_raw_venues.json'),
    action: async () => {
      await runStage01Cli(batchName);
    },
  });
  await runStage(stages, options, {
    name: '02_discover_sources',
    output: path.join(outputDir, 'stage_02_source_discovery.json'),
    action: async () => {
      await runStage02SourceDiscovery(batchName);
    },
  });
  await runStage(stages, options, {
    name: '03_discover_images',
    output: path.join(outputDir, 'stage_03_final_vision_queue.json'),
    action: async () => {
      await runStage03ImageDiscovery(batchName);
    },
  });
  await runStage(stages, options, {
    name: '04_classify_images',
    output: path.join(outputDir, 'stage_04_selected_images.json'),
    action: async () => {
      await runStage04VisionClassification(batchName, { maxImagesPerVenue: options.maxImagesPerVenue });
    },
  });
  await runStage(stages, options, {
    name: 'connect_selected_images',
    output: path.join(outputDir, 'batch_result_with_images.json'),
    action: async () => {
      await connectSelectedImages(batchName);
    },
  });
  await runStage(stages, options, {
    name: '05_generate_editorial',
    output: path.join(outputDir, 'batch_result_with_editorial.json'),
    action: async () => {
      const result = await runStage05EditorialGeneration(batchName);
      if (result.failed_generations > 0 || result.invalid_json_count > 0) {
        await retryFailedEditorial(batchName);
      }
    },
  });

  await runStage(stages, options, {
    name: '05_alias_enriched_result',
    output: path.join(outputDir, 'batch_result_enriched.json'),
    action: async () => {
      copyFileSync(path.join(outputDir, 'batch_result_with_editorial.json'), path.join(outputDir, 'batch_result_enriched.json'));
    },
  });
  await runStage(stages, options, {
    name: '06_quality_gate',
    output: path.join(outputDir, 'batch_result_quality_gated.json'),
    action: async () => {
      runQualityGate(batchName);
    },
  });
  await runStage(stages, options, {
    name: '07_generate_approval_manifest',
    output: path.join(outputDir, 'approval_manifest.json'),
    action: async () => {
      generateApprovalManifest(batchName);
    },
  });

  if (!options.skipStage08) {
    await runStage(stages, options, {
      name: '08_supabase_staging_dry_run',
      output: path.join(outputDir, 'supabase_staging_dry_run.json'),
      action: async () => {
        await runSupabaseStagingDryRun(batchName, ['--dry-run']);
      },
    });
  }

  if (!options.skipPublicationReview) {
    await runStage(stages, options, {
      name: '09_publication_review',
      output: path.join(outputDir, 'publication_decision_manifest.json'),
      action: async () => {
        generatePublicationReview(batchName);
      },
    });

    await runStage(stages, options, {
      name: '11_public_projection_dry_run_if_reviewed',
      output: path.join(outputDir, 'public_projection_dry_run.json'),
      action: async () => {
        const reviewedPath = path.join(outputDir, 'publication_decision_manifest.reviewed.json');
        if (!existsSync(reviewedPath)) {
          console.log('Skipping Stage 11 dry-run; reviewed publication decision manifest is missing.');
          return;
        }
        await projectToPublicDryRun(batchName, ['--dry-run']);
      },
    });

    await runStage(stages, options, {
      name: '13_control_panel',
      output: path.join(outputDir, 'pipeline_control_panel.html'),
      action: async () => {
        generateControlPanel(batchName);
      },
    });
  }

  const report: FullRunReport = {
    batch_id: input.batch_id,
    generated_at: new Date().toISOString(),
    input_venues: venueCount,
    mode: options.planOnly ? 'plan' : 'run',
    safety: {
      supabase_apply: false,
      cloudinary_upload: false,
      public_publish: false,
      consumer_ui_changes: false,
    },
    stages,
    final_outputs: [
      path.join(outputDir, 'stage_01_report.md'),
      path.join(outputDir, 'stage_02_source_discovery_report.md'),
      path.join(outputDir, 'stage_03_report.md'),
      path.join(outputDir, 'stage_04_report.md'),
      path.join(outputDir, 'connect_selected_images_report.md'),
      path.join(outputDir, 'stage_05_report.md'),
      path.join(outputDir, 'quality_gate_report.md'),
      path.join(outputDir, 'approval_manifest_report.md'),
      path.join(outputDir, 'supabase_staging_dry_run_report.md'),
      path.join(outputDir, 'publication_review_report.md'),
      path.join(outputDir, 'public_projection_report.md'),
      path.join(outputDir, 'pipeline_control_panel.html'),
    ].filter((filePath) => options.planOnly || existsSync(filePath)),
    next_action: options.planOnly
      ? 'Run without --plan when ready.'
      : 'Open pipeline_control_panel.html, review publication_review_dashboard.html, export publication_decision_manifest.reviewed.json, then run Cloudinary/hidden public apply commands from the control panel.',
  };

  writeFileSync(path.join(outputDir, 'full_batch_run_report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  writeFileSync(path.join(outputDir, 'full_batch_run_report.md'), buildMarkdownReport(report), 'utf8');
  console.log(`Full batch report written to ${path.join(outputDir, 'full_batch_run_report.md')}`);
  console.log(`Full batch summary: venues=${venueCount}, stages=${stages.length}, mode=${report.mode}, stage08=${options.skipStage08 ? 'skipped' : 'dry_run'}`);

  return report;
}

async function runStage(
  summaries: StageSummary[],
  options: RunnerOptions,
  stage: { name: string; output: string; action: () => Promise<void> },
): Promise<void> {
  const startedAt = new Date().toISOString();
  if (options.planOnly) {
    summaries.push({
      stage: stage.name,
      status: 'planned',
      output: stage.output,
      notes: existsSync(stage.output) ? 'Output already exists; normal run would skip unless --force is used.' : 'Output missing; normal run would execute.',
      started_at: startedAt,
      finished_at: new Date().toISOString(),
    });
    return;
  }

  if (!options.force && existsSync(stage.output)) {
    summaries.push({
      stage: stage.name,
      status: 'skipped_existing',
      output: stage.output,
      notes: 'Skipped because output already exists. Pass --force to rerun.',
      started_at: startedAt,
      finished_at: new Date().toISOString(),
    });
    console.log(`Skipping ${stage.name}; output exists.`);
    return;
  }

  try {
    await stage.action();
    summaries.push({
      stage: stage.name,
      status: 'completed',
      output: stage.output,
      notes: 'Completed.',
      started_at: startedAt,
      finished_at: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    summaries.push({
      stage: stage.name,
      status: 'failed',
      output: stage.output,
      notes: message,
      started_at: startedAt,
      finished_at: new Date().toISOString(),
    });
    throw error;
  }
}

function validateInputForScale(batchName: string, venueCount: number, options: RunnerOptions): void {
  if (venueCount === 0) throw new Error('Batch input has no venues.');
  if (batchName.includes('50') && venueCount !== 50 && !options.allowNon50) {
    throw new Error(`Batch name implies 50 venues, but input has ${venueCount}. Expand the input to 50 or pass --allow-non-50 for a smoke test.`);
  }
}

function parseOptions(args: string[]): RunnerOptions {
  if (args.includes('--apply')) throw new Error('run_full_batch does not support --apply. Run Stage 08 apply manually only after review.');
  if (args.includes('--publish')) throw new Error('run_full_batch does not support publish.');
  if (args.includes('--cloudinary-upload')) throw new Error('run_full_batch does not support Cloudinary upload yet.');
  return {
    force: args.includes('--force'),
    planOnly: args.includes('--plan'),
    allowNon50: args.includes('--allow-non-50'),
    skipStage08: args.includes('--skip-stage-08'),
    skipPublicationReview: args.includes('--skip-publication-review'),
    maxImagesPerVenue: valueAfter(args, '--max-images-per-venue') ? Number(valueAfter(args, '--max-images-per-venue')) : undefined,
  };
}

function valueAfter(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

function buildMarkdownReport(report: FullRunReport): string {
  const lines = [
    '# Full Batch Run Report',
    '',
    `- Batch: ${report.batch_id}`,
    `- Generated: ${report.generated_at}`,
    `- Input venues: ${report.input_venues}`,
    `- Mode: ${report.mode}`,
    '',
    '## Safety',
    '',
    '- Supabase apply: false',
    '- Cloudinary upload: false',
    '- Public publish: false',
    '- Consumer UI changes: false',
    '',
    '## Stages',
    '',
    '| Stage | Status | Output | Notes |',
    '| --- | --- | --- | --- |',
    ...report.stages.map((stage) => `| ${stage.stage} | ${stage.status} | ${stage.output || ''} | ${escapeTable(stage.notes)} |`),
    '',
    '## Final Outputs',
    '',
    ...(report.final_outputs.length > 0 ? report.final_outputs.map((filePath) => `- ${filePath}`) : ['- none']),
    '',
    '## Next Action',
    '',
    report.next_action,
  ];
  return `${lines.join('\n')}\n`;
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, 'utf8')) as T;
}

function escapeTable(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}
