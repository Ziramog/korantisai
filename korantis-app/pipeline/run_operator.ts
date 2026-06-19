import path from 'path';
import { fileURLToPath } from 'url';
import { generateOperatorDashboard } from './stages/generate_operator_dashboard';
import { runSupabaseStagingDryRun } from './stages/08_sync_supabase_staging';

type OperatorMode = 'status' | 'venues' | 'galleries' | 'staging';

interface OperatorArgs {
  batchName: string;
  mode: OperatorMode;
}

interface ParsedOperatorArgs {
  args?: OperatorArgs;
  help: boolean;
}

const VALID_MODES: OperatorMode[] = ['status', 'venues', 'galleries', 'staging'];

async function runOperator(rawArgs: string[]): Promise<void> {
  const parsed = parseArgs(rawArgs);
  if (parsed.help || !parsed.args) {
    printHelp();
    return;
  }

  const { batchName, mode } = parsed.args;

  if (mode === 'staging') {
    console.log('Operator mode: staging dry-run only. --apply is intentionally blocked in this wrapper.');
    await runSupabaseStagingDryRun(batchName, ['--dry-run']);
  }

  const summary = generateOperatorDashboard(batchName);

  if (mode === 'venues') {
    printVenueAcquisition(summary);
    return;
  }

  if (mode === 'galleries') {
    printGalleryEnrichment(summary);
    return;
  }

  if (mode === 'staging') {
    printStagingSummary(summary);
    return;
  }

  printStatusSummary(summary);
}

function parseArgs(rawArgs: string[]): ParsedOperatorArgs {
  if (rawArgs.includes('--help') || rawArgs.includes('-h')) return { help: true };
  if (rawArgs.includes('--apply')) {
    throw new Error(
      'The operator wrapper never runs --apply. Use the explicit Stage 08 command only after manual approval: npx tsx pipeline/stages/08_sync_supabase_staging.ts <batch_id> --apply --confirm-venue-images-index',
    );
  }

  const batchName = rawArgs.find((arg) => !arg.startsWith('--'));
  if (!batchName) return { help: true };

  const modeArg = getFlagValue(rawArgs, '--mode') || getFlagValue(rawArgs, '-m') || 'status';
  if (!isOperatorMode(modeArg)) {
    throw new Error(`Unknown operator mode "${modeArg}". Valid modes: ${VALID_MODES.join(', ')}.`);
  }

  return {
    help: false,
    args: {
      batchName,
      mode: modeArg,
    },
  };
}

function getFlagValue(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  if (index === -1) return undefined;
  return args[index + 1];
}

function isOperatorMode(value: string): value is OperatorMode {
  return VALID_MODES.includes(value as OperatorMode);
}

function printStatusSummary(summary: ReturnType<typeof generateOperatorDashboard>): void {
  console.log('');
  console.log('Korantis operator status');
  console.log(`Batch: ${summary.batch_id}`);
  console.log(`Venue acquisition: ${summary.venue_acquisition.ready_for_db_staging}/${summary.venue_acquisition.total} ready, ${summary.venue_acquisition.blocked} blocked`);
  console.log(
    `Gallery enrichment: ${summary.gallery_enrichment.selected_heroes} selected heroes, ${summary.gallery_enrichment.venues_without_hero.length} venues without hero`,
  );
  console.log(`Staging: dry-run approved=${summary.staging_sync.dry_run_approved}, applied=${summary.staging_sync.applied ? 'yes' : 'no'}`);
  console.log(`Dashboard: ${path.join(process.cwd(), 'data', 'batches', summary.batch_id, 'operator_dashboard.html')}`);
}

function printVenueAcquisition(summary: ReturnType<typeof generateOperatorDashboard>): void {
  console.log('');
  console.log('Venue acquisition');
  console.log(`Found: ${summary.venue_acquisition.found}/${summary.venue_acquisition.total}`);
  console.log(`Ready for DB staging: ${summary.venue_acquisition.ready_for_db_staging}`);
  console.log(`Needs review: ${summary.venue_acquisition.needs_review}`);
  console.log(`Blocked: ${summary.venue_acquisition.blocked}`);
  printBlockers(summary.venue_acquisition.primary_blockers);
}

function printGalleryEnrichment(summary: ReturnType<typeof generateOperatorDashboard>): void {
  console.log('');
  console.log('Gallery enrichment');
  console.log(`Candidates found: ${summary.gallery_enrichment.candidates_found}`);
  console.log(`Candidates rejected before vision: ${summary.gallery_enrichment.candidates_rejected}`);
  console.log(`Final vision queue: ${summary.gallery_enrichment.final_vision_queue}`);
  console.log(`Selected heroes: ${summary.gallery_enrichment.selected_heroes}`);
  console.log(`Venues without hero: ${summary.gallery_enrichment.venues_without_hero.join(', ') || 'none'}`);
}

function printStagingSummary(summary: ReturnType<typeof generateOperatorDashboard>): void {
  console.log('');
  console.log('Staging dry-run');
  console.log(`Approved in dry-run: ${summary.staging_sync.dry_run_approved}`);
  console.log(`Blocked in dry-run: ${summary.staging_sync.dry_run_blocked}`);
  console.log(`Applied artifact present: ${summary.staging_sync.applied ? 'yes' : 'no'}`);
  console.log(`Image rights status: ${summary.staging_sync.image_rights_status}`);
}

function printBlockers(blockers: Record<string, number>): void {
  const entries = Object.entries(blockers);
  if (entries.length === 0) {
    console.log('Primary blockers: none');
    return;
  }

  console.log('Primary blockers:');
  for (const [blocker, count] of entries) {
    console.log(`- ${blocker}: ${count}`);
  }
}

function printHelp(): void {
  console.log(`Korantis operator runner

Usage:
  npx tsx pipeline/run_operator.ts <batch_id> [--mode status|venues|galleries|staging]

Modes:
  status     Generate the simplified operator dashboard and print the two-lane summary.
  venues     Focus on venue acquisition readiness and blockers.
  galleries  Focus on gallery enrichment, selected heroes, and missing hero images.
  staging    Run Stage 08 dry-run, then regenerate the operator dashboard.

Safety:
  This wrapper blocks --apply. Real Supabase apply must use the explicit Stage 08 command after approval.
`);
}

const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedFile === fileURLToPath(import.meta.url)) {
  runOperator(process.argv.slice(2)).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Operator run failed: ${message}`);
    process.exitCode = 1;
  });
}

