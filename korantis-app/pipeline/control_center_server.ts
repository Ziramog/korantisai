import { createServer, type IncomingMessage, type ServerResponse } from 'http';
import { spawn, type ChildProcessWithoutNullStreams } from 'child_process';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

interface CommandDefinition {
  label: string;
  description: string;
  danger: 'safe' | 'writes_cloudinary' | 'writes_hidden_public' | 'publishes_public';
  buildArgs: (batchId: string, body: Record<string, unknown>) => string[];
}

interface RunState {
  running: boolean;
  action?: string;
  batch_id?: string;
  started_at?: string;
  finished_at?: string;
  exit_code?: number | null;
  log: string[];
}

interface BatchListItem {
  id: string;
  score: number;
  label: string;
}

const PORT = Number(process.env.KORANTIS_CONTROL_PORT || 4317);
const ROOT = process.cwd();
const BATCHES_DIR = path.join(ROOT, 'data', 'batches');
const MAX_LOG_LINES = 800;
const runState: RunState = {
  running: false,
  log: [],
};
let activeProcess: ChildProcessWithoutNullStreams | null = null;

const REGISTRY_FILE = path.join(ROOT, 'data', 'control_center', 'workflows.json');

function readRegistry(): Record<string, unknown> {
  if (!existsSync(REGISTRY_FILE)) return { current_workflow_status: 'idle' };
  try {
    return JSON.parse(readFileSync(REGISTRY_FILE, 'utf8'));
  } catch {
    return { current_workflow_status: 'idle' };
  }
}

function writeRegistry(data: Record<string, unknown>): void {
  const dir = path.dirname(REGISTRY_FILE);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const current = readRegistry();
  writeFileSync(REGISTRY_FILE, JSON.stringify({ ...current, ...data }, null, 2));
}

const COMMANDS: Record<string, CommandDefinition> = {
  operator_status: {
    label: 'Refresh operator dashboard',
    description: 'Regenerates the simplified two-lane operator dashboard. No external models or writes.',
    danger: 'safe',
    buildArgs: (batchId) => ['tsx', 'pipeline/run_operator.ts', batchId, '--mode', 'status'],
  },
  operator_venues: {
    label: 'Check venue acquisition',
    description: 'Refreshes the operator dashboard and prints venue acquisition readiness.',
    danger: 'safe',
    buildArgs: (batchId) => ['tsx', 'pipeline/run_operator.ts', batchId, '--mode', 'venues'],
  },
  operator_galleries: {
    label: 'Check gallery enrichment',
    description: 'Refreshes the operator dashboard and prints gallery enrichment status.',
    danger: 'safe',
    buildArgs: (batchId) => ['tsx', 'pipeline/run_operator.ts', batchId, '--mode', 'galleries'],
  },
  operator_staging_dry_run: {
    label: 'Run staging dry-run',
    description: 'Runs Stage 08 dry-run and refreshes the operator dashboard. Never applies writes.',
    danger: 'safe',
    buildArgs: (batchId) => ['tsx', 'pipeline/run_operator.ts', batchId, '--mode', 'staging'],
  },
  refresh_panel: {
    label: 'Refresh control panel artifacts',
    description: 'Regenerates the static control panel for the selected batch.',
    danger: 'safe',
    buildArgs: (batchId) => ['tsx', 'pipeline/stages/13_generate_control_panel.ts', batchId],
  },
  activation_dry_run: {
    label: 'Activation dry-run',
    description: 'Checks which pending_review venues are ready to become active.',
    danger: 'safe',
    buildArgs: (batchId) => ['tsx', 'pipeline/stages/12_activate_public_venues.ts', batchId, '--dry-run'],
  },
  activate_public: {
    label: 'Activate public venues',
    description: 'Flips ready venues from pending_review to active.',
    danger: 'publishes_public',
    buildArgs: (batchId) => ['tsx', 'pipeline/stages/12_activate_public_venues.ts', batchId, '--apply'],
  },
  post_activation_audit: {
    label: 'Run post-activation audit',
    description: 'Read-only audit of active public venues, Cloudinary heroes, coordinates, and batch metadata.',
    danger: 'safe',
    buildArgs: (batchId) => ['tsx', 'pipeline/stages/13_post_activation_audit.ts', batchId],
  },
  rollback_public_dry_run: {
    label: 'Rollback batch dry-run',
    description: 'Checks which active venues from this batch can be moved back to pending_review.',
    danger: 'safe',
    buildArgs: (batchId) => ['tsx', 'pipeline/stages/14_rollback_public_batch.ts', batchId, '--dry-run'],
  },
  rollback_public_apply: {
    label: 'Rollback batch apply',
    description: 'Moves eligible active venues from this batch back to pending_review. Does not delete venues/images.',
    danger: 'publishes_public',
    buildArgs: (batchId) => ['tsx', 'pipeline/stages/14_rollback_public_batch.ts', batchId, '--apply'],
  },
  build_gallery_selection: {
    label: 'Build gallery selection',
    description: 'Selects secondary gallery images from existing Stage 04 M3 results. No uploads or writes.',
    danger: 'safe',
    buildArgs: (batchId) => ['tsx', 'pipeline/stages/15_build_gallery_selection.ts', batchId],
  },
  publish_reviewed_all: {
    label: 'Publish reviewed approved venues',
    description: 'Runs Cloudinary upload, hidden public projection, activation dry-run, and activation apply for reviewed approved venues.',
    danger: 'publishes_public',
    buildArgs: (batchId) => ['tsx', 'pipeline/stages/run_reviewed_publication_apply.ts', batchId],
  },
  cloudinary_apply: {
    label: 'Upload approved heroes to Cloudinary',
    description: 'Uploads approved hero images to Cloudinary.',
    danger: 'writes_cloudinary',
    buildArgs: (batchId) => ['tsx', 'pipeline/stages/10_materialize_cloudinary.ts', batchId, '--apply'],
  },
  public_projection_apply: {
    label: 'Apply hidden public projection',
    description: 'Writes approved venues and images to public tables as pending_review.',
    danger: 'writes_hidden_public',
    buildArgs: (batchId) => ['tsx', 'pipeline/stages/11_project_to_public.ts', batchId, '--apply'],
  },
  next_restaurants_plan: {
    label: 'Plan next 50 restaurants',
    description: 'Builds a plan for the next Buenos Aires restaurant-only batch.',
    danger: 'safe',
    buildArgs: () => [
      'tsx',
      'pipeline/stages/00_build_venue_seed.ts',
      'batch_005_buenos_aires_restaurants_50',
      '--count',
      '50',
      '--city',
      'Buenos Aires',
      '--type-mix',
      'restaurants=50',
      '--plan',
    ],
  },
  next_restaurants_run: {
    label: 'Run next 50 restaurants',
    description: 'Runs Stage 00 and continues the full pipeline for a restaurant-only Buenos Aires batch.',
    danger: 'safe',
    buildArgs: () => [
      'tsx',
      'pipeline/stages/00_build_venue_seed.ts',
      'batch_005_buenos_aires_restaurants_50',
      '--count',
      '50',
      '--city',
      'Buenos Aires',
      '--type-mix',
      'restaurants=50',
      '--continue',
    ],
  },
  custom_batch_plan: {
    label: 'Plan configured batch',
    description: 'Plans a new batch using the form values.',
    danger: 'safe',
    buildArgs: (_batchId, body) => buildConfiguredBatchArgs(body, true),
  },
  custom_batch_run: {
    label: 'Run configured batch',
    description: 'Runs Stage 00 and continues the full pipeline using the form values.',
    danger: 'safe',
    buildArgs: (_batchId, body) => buildConfiguredBatchArgs(body, false),
  },
  enrichment_resume: {
    label: 'Run/resume enrichment',
    description: 'Runs enrichment through gallery review. Stops before M3 unless no vision queue is needed.',
    danger: 'safe',
    buildArgs: (_batchId, body) => buildEnrichmentArgs(body, false),
  },
  enrichment_resume_m3: {
    label: 'Run enrichment with M3',
    description: 'Runs enrichment and allows M3 classification for gallery image queues. No Supabase or Cloudinary writes.',
    danger: 'safe',
    buildArgs: (_batchId, body) => buildEnrichmentArgs(body, true),
  },
  enrichment_gallery_apply_dry_run: {
    label: 'Gallery apply dry-run',
    description: 'Maps reviewed gallery approvals to Cloudinary/venue_images writes without applying.',
    danger: 'safe',
    buildArgs: (_batchId, body) => ['tsx', 'pipeline/enrichment/04_apply_gallery.ts', '--run-id', cleanRunId(stringField(body, 'enrichment_run_id') || 'enrich_current'), '--dry-run'],
  },
  enrichment_gallery_apply: {
    label: 'Apply reviewed gallery',
    description: 'Uploads approved gallery images to Cloudinary and writes venue_images role=gallery. Does not change heroes.',
    danger: 'writes_hidden_public',
    buildArgs: (_batchId, body) => ['tsx', 'pipeline/enrichment/04_apply_gallery.ts', '--run-id', cleanRunId(stringField(body, 'enrichment_run_id') || 'enrich_current'), '--apply'],
  },
};

export function startControlCenterServer(port = PORT): void {
  const server = createServer((request, response) => {
    route(request, response).catch((error: unknown) => {
      writeJson(response, 500, { error: error instanceof Error ? error.message : String(error) });
    });
  });

  server.listen(port, () => {
    console.log(`Korantis control center running at http://localhost:${port}`);
  });
}

async function route(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const url = new URL(request.url || '/', `http://${request.headers.host || `localhost:${PORT}`}`);
  if (request.method === 'GET' && url.pathname === '/') return writeHtml(response, renderApp());
  if (request.method === 'GET' && url.pathname === '/api/manual') return writeManual(response);
  if (request.method === 'GET' && url.pathname === '/api/batches') {
    const batches = listBatches();
    return writeJson(response, 200, { batches: batches.map((batch) => batch.id), batch_items: batches });
  }
  if (request.method === 'GET' && url.pathname === '/api/status') return writeJson(response, 200, readBatchStatus(requiredParam(url, 'batch')));
  if (request.method === 'GET' && url.pathname === '/api/run-state') return writeJson(response, 200, runState);
  if (request.method === 'GET' && url.pathname === '/api/artifact') return writeArtifact(response, requiredParam(url, 'batch'), requiredParam(url, 'file'));
  if (request.method === 'GET' && url.pathname === '/api/enrichment-artifact') return writeEnrichmentArtifact(response, requiredParam(url, 'run'), requiredParam(url, 'file'));
  if (request.method === 'GET' && url.pathname === '/api/enrichment-review/manifest') return writeGalleryReviewManifest(response, requiredParam(url, 'run'));
  if (request.method === 'GET' && url.pathname === '/api/enrichment-review/status') return writeJson(response, 200, readGalleryReviewStatus(requiredParam(url, 'run')));
  if (request.method === 'GET' && url.pathname === '/api/workflows') return writeJson(response, 200, readRegistry());
  if (request.method === 'POST' && url.pathname === '/api/enrichment-review/save') return handleGalleryReviewSave(request, response);
  
  // Legacy fallback
  if (request.method === 'POST' && url.pathname === '/api/run') return handleApiAction(request, response, null);

  // New REST API
  if (request.method === 'POST' && url.pathname === '/api/venue-batches/plan') return handleApiAction(request, response, 'custom_batch_plan');
  if (request.method === 'POST' && url.pathname === '/api/venue-batches/run-to-review') return handleApiAction(request, response, 'custom_batch_run');
  if (request.method === 'POST' && url.pathname === '/api/enrichment/start') return handleApiAction(request, response, 'enrichment_resume');
  if (request.method === 'POST' && url.pathname === '/api/enrichment/continue') return handleApiAction(request, response, 'enrichment_resume');
  if (request.method === 'POST' && url.pathname === '/api/enrichment/run-image-classification') return handleApiAction(request, response, 'enrichment_resume_m3');
  if (request.method === 'POST' && url.pathname === '/api/enrichment/gallery-dry-run') return handleApiAction(request, response, 'enrichment_gallery_apply_dry_run');
  if (request.method === 'POST' && url.pathname === '/api/enrichment/apply-gallery') return handleApiAction(request, response, 'enrichment_gallery_apply');
  if (request.method === 'POST' && url.pathname === '/api/publication/apply-projection') return handleApiAction(request, response, 'public_projection_apply');
  if (request.method === 'POST' && url.pathname === '/api/publication/activate') return handleApiAction(request, response, 'activate_public');
  if (request.method === 'POST' && url.pathname === '/api/audit/public-catalog') return handleApiAction(request, response, 'post_activation_audit');
  
  writeJson(response, 404, { error: 'not_found' });
}

async function handleApiAction(request: IncomingMessage, response: ServerResponse, explicitAction: string | null): Promise<void> {
  const body = await readRequestJson(request);
  const action = explicitAction || stringField(body, 'action');
  const batchId = stringField(body, 'batch_id') || stringField(body, 'new_batch_id') || 'default_batch';
  const confirm = stringField(body, 'confirm');
  const command = COMMANDS[action];
  if (!command) return writeJson(response, 400, { error: `Unknown action: ${action}` });
  if (runState.running) return writeJson(response, 409, { error: 'A command is already running.' });
  if ((command.danger === 'writes_cloudinary' || command.danger === 'writes_hidden_public' || command.danger === 'publishes_public') && confirm !== 'RUN' && confirm !== 'APPLY GALLERY') {
    return writeJson(response, 400, { error: 'Confirmation is required for this action.' });
  }

  // Update registry
  if (action.includes('enrichment')) writeRegistry({ latest_enrichment_run_id: stringField(body, 'enrichment_run_id') || 'enrich_current', current_workflow_status: 'running' });
  else writeRegistry({ latest_batch_id: batchId, current_workflow_status: 'running' });

  const args = command.buildArgs(batchId, isRecord(body) ? body : {});
  runState.running = true;
  runState.action = action;
  runState.batch_id = batchId;
  runState.started_at = new Date().toISOString();
  runState.finished_at = undefined;
  runState.exit_code = undefined;
  runState.log = [`$ ${args.join(' ')}`];

  const spawned = spawnPipelineCommand(args);
  activeProcess = spawned;
  activeProcess.stdout.on('data', (data) => appendLog(String(data)));
  activeProcess.stderr.on('data', (data) => appendLog(String(data)));
  activeProcess.on('error', (error) => {
    appendLog(`\n[spawn error] ${error.message}`);
    runState.running = false;
    runState.finished_at = new Date().toISOString();
    runState.exit_code = -1;
    writeRegistry({ current_workflow_status: 'error' });
    activeProcess = null;
  });
  activeProcess.on('close', (code) => {
    appendLog(`\n[exit ${code ?? 'unknown'}]`);
    runState.running = false;
    runState.finished_at = new Date().toISOString();
    runState.exit_code = code;
    writeRegistry({ current_workflow_status: 'idle' });
    activeProcess = null;
  });

  writeJson(response, 202, { started: true, action, batch_id: batchId });
}

async function handleGalleryReviewSave(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const body = await readRequestJson(request);
  const runId = cleanRunId(stringField(body, 'run_id'));
  const action = stringField(body, 'review_action') || 'approve_ready';
  if (!runId) return writeJson(response, 400, { error: 'Missing run_id.' });
  if (!['custom', 'approve_ready', 'pause_all', 'reject_all'].includes(action)) return writeJson(response, 400, { error: `Unknown review_action: ${action}` });

  const decisions = isRecord(body) && isRecord(body.decisions) ? body.decisions : undefined;
  const result = saveReviewedGalleryManifest(runId, action as 'custom' | 'approve_ready' | 'pause_all' | 'reject_all', decisions);
  return writeJson(response, 200, result);
}

function spawnPipelineCommand(args: string[]): ChildProcessWithoutNullStreams {
  if (args[0] === 'tsx') {
    const tsxCli = path.join(ROOT, 'node_modules', 'tsx', 'dist', 'cli.mjs');
    return spawn(process.execPath, [tsxCli, ...args.slice(1)], { cwd: ROOT, env: process.env });
  }
  return spawn(args[0], args.slice(1), { cwd: ROOT, env: process.env });
}

function readBatchStatus(batchId: string): Record<string, unknown> {
  const outputDir = batchDir(batchId);
  const artifacts = artifactList().map((artifact) => {
    const filePath = path.join(outputDir, artifact.file);
    return {
      ...artifact,
      exists: existsSync(filePath),
      size_bytes: existsSync(filePath) ? statSync(filePath).size : 0,
      updated_at: existsSync(filePath) ? statSync(filePath).mtime.toISOString() : null,
    };
  });

  return {
    batch_id: batchId,
    exists: existsSync(outputDir),
    counts: {
      quality_gate: readJsonSummary(path.join(outputDir, 'batch_result_quality_gated.json'), (data) => data.summary),
      editorial_sources: readJsonSummary(path.join(outputDir, 'stage_00b_editorial_source_enrichment.json'), (data) => ({
        confirmed_editorial_mentions: data.confirmed_editorial_mentions,
        source_query_candidates: data.source_query_candidates,
        verification_failed: data.verification_failed,
        mode: data.mode,
      })),
      decisions: readJsonSummary(path.join(outputDir, 'publication_decision_manifest.reviewed.json'), summarizeDecisions),
      cloudinary: readJsonSummary(path.join(outputDir, 'cloudinary_materialization_result.json'), (data) => ({
        mode: data.mode,
        uploaded: data.uploaded,
        errors: data.errors,
        considered: data.images_considered,
      })),
      projection_apply: readJsonSummary(path.join(outputDir, 'public_projection_apply_result.json'), (data) => ({
        mode: data.mode,
        approved_projected: data.approved_projected,
        intended_write_count: data.intended_write_count,
      })),
      activation: readJsonSummary(path.join(outputDir, 'public_activation_apply_result.json'), (data) => ({
        mode: data.mode,
        requested: data.requested,
        activated: data.activated,
        blocked: data.blocked,
      })),
      post_activation_audit: readJsonSummary(path.join(outputDir, 'post_activation_audit.json'), (data) => ({
        requested: data.requested,
        passed: data.passed,
        failed: data.failed,
      })),
      rollback: readJsonSummary(path.join(outputDir, 'public_rollback_dry_run.json'), (data) => ({
        requested: data.requested,
        eligible: data.eligible,
        blocked: data.blocked,
      })),
      activation_dry_run: readJsonSummary(path.join(outputDir, 'public_activation_dry_run.json'), (data) => ({
        requested: data.requested,
        ready: data.ready_to_activate,
        blocked: data.blocked,
      })),
    },
    artifacts,
    commands: Object.fromEntries(Object.entries(COMMANDS)
      .filter(([key]) => !key.startsWith('custom_batch_'))
      .map(([key, command]) => [key, {
      label: command.label,
      description: command.description,
      danger: command.danger,
    }])),
  };
}

function readGalleryReviewStatus(runId: string): Record<string, unknown> {
  const safeRunId = cleanRunId(runId);
  const outputDir = path.join(ROOT, 'data', 'enrichment', safeRunId);
  const manifestPath = path.join(outputDir, 'gallery_review_manifest.json');
  const reviewedPath = path.join(outputDir, 'gallery_review_manifest.reviewed.json');
  if (!existsSync(manifestPath)) {
    return { run_id: safeRunId, exists: false, reviewed_exists: existsSync(reviewedPath), error: 'gallery_review_manifest_missing' };
  }

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Record<string, unknown>;
  const entries = Array.isArray(manifest.entries) ? manifest.entries as Array<Record<string, unknown>> : [];
  const reviewed = existsSync(reviewedPath) ? JSON.parse(readFileSync(reviewedPath, 'utf8')) as Record<string, unknown> : null;
  const reviewedEntries = reviewed && Array.isArray(reviewed.entries) ? reviewed.entries as Array<Record<string, unknown>> : [];
  return {
    run_id: safeRunId,
    exists: true,
    reviewed_exists: existsSync(reviewedPath),
    reviewed_file: reviewedPath,
    total_venues: entries.length,
    ready_for_gallery_review: entries.filter((entry) => entry.status === 'ready_for_gallery_review').length,
    needs_more_spatial_images: entries.filter((entry) => entry.status === 'needs_more_spatial_images').length,
    blocked_gallery_quality: entries.filter((entry) => entry.status === 'blocked_gallery_quality').length,
    approved_venues: reviewedEntries.filter((entry) => entry.reviewer_decision === 'approve_gallery').length,
    approved_images: reviewedEntries
      .filter((entry) => entry.reviewer_decision === 'approve_gallery')
      .reduce((sum, entry) => sum + (Array.isArray(entry.images) ? entry.images.length : 0), 0),
  };
}

function writeGalleryReviewManifest(response: ServerResponse, runId: string): void {
  const safeRunId = cleanRunId(runId);
  const manifestPath = path.join(ROOT, 'data', 'enrichment', safeRunId, 'gallery_review_manifest.json');
  if (!existsSync(manifestPath)) return writeJson(response, 404, { error: 'gallery_review_manifest_missing' });
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Record<string, unknown>;
  writeJson(response, 200, {
    ...manifest,
    reviewed_status: readGalleryReviewStatus(safeRunId),
  });
}

function saveReviewedGalleryManifest(
  runId: string,
  action: 'custom' | 'approve_ready' | 'pause_all' | 'reject_all',
  decisions?: Record<string, unknown>,
): Record<string, unknown> {
  const outputDir = path.join(ROOT, 'data', 'enrichment', runId);
  const manifestPath = path.join(outputDir, 'gallery_review_manifest.json');
  if (!existsSync(manifestPath)) throw new Error(`Missing gallery review manifest: ${manifestPath}`);

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Record<string, unknown>;
  const entries = Array.isArray(manifest.entries) ? manifest.entries as Array<Record<string, unknown>> : [];
  const reviewedEntries = entries.map((entry) => {
    const explicit = decisionForVenue(decisions, typeof entry.venue_id === 'string' ? entry.venue_id : '');
    const fallbackAction = action === 'custom' ? 'pause_all' : action;
    const decision = explicit?.decision || galleryDecisionForAction(entry, fallbackAction);
    return {
      ...entry,
      reviewer_decision: decision,
      reviewer_notes: explicit?.reviewer_notes || galleryReviewerNote(entry, decision, action),
    };
  });
  const reviewed = {
    ...manifest,
    reviewed_at: new Date().toISOString(),
    review_action: action,
    entries: reviewedEntries,
  };
  const reviewedPath = path.join(outputDir, 'gallery_review_manifest.reviewed.json');
  writeFileSync(reviewedPath, `${JSON.stringify(reviewed, null, 2)}\n`, 'utf8');

  const approvedEntries = reviewedEntries.filter((entry) => entry.reviewer_decision === 'approve_gallery');
  const rejectedEntries = reviewedEntries.filter((entry) => entry.reviewer_decision === 'reject_gallery');
  const pausedEntries = reviewedEntries.filter((entry) => entry.reviewer_decision === 'pause');
  return {
    run_id: runId,
    reviewed_file: reviewedPath,
    action,
    total_venues: reviewedEntries.length,
    approved_venues: approvedEntries.length,
    approved_images: approvedEntries.reduce((sum, entry) => {
      const images = (entry as Record<string, unknown>).images;
      return sum + (Array.isArray(images) ? images.length : 0);
    }, 0),
    paused_venues: pausedEntries.length,
    rejected_venues: rejectedEntries.length,
  };
}

function decisionForVenue(decisions: Record<string, unknown> | undefined, venueId: string): { decision: 'approve_gallery' | 'pause' | 'reject_gallery'; reviewer_notes?: string } | null {
  if (!decisions || !venueId) return null;
  const value = decisions[venueId];
  if (!isRecord(value)) return null;
  const decision = value.decision;
  if (decision !== 'approve_gallery' && decision !== 'pause' && decision !== 'reject_gallery') return null;
  return {
    decision,
    reviewer_notes: typeof value.reviewer_notes === 'string' ? value.reviewer_notes : '',
  };
}

function galleryDecisionForAction(entry: Record<string, unknown>, action: 'approve_ready' | 'pause_all' | 'reject_all'): 'approve_gallery' | 'pause' | 'reject_gallery' {
  if (action === 'pause_all') return 'pause';
  if (action === 'reject_all') return 'reject_gallery';
  return entry.status === 'ready_for_gallery_review' ? 'approve_gallery' : 'pause';
}

function galleryReviewerNote(entry: Record<string, unknown>, decision: string, action: string): string {
  if (action === 'approve_ready' && decision === 'approve_gallery') return 'Auto-approved by operator flow: venue was ready_for_gallery_review.';
  if (action === 'approve_ready') return `Auto-paused by operator flow: status=${String(entry.status || 'unknown')}.`;
  return `Set by operator flow: ${action}.`;
}

function artifactList(): Array<{ label: string; file: string; kind: 'html' | 'json' | 'markdown' }> {
  return [
    { label: 'Operator dashboard', file: 'operator_dashboard.html', kind: 'html' },
    { label: 'Operator summary JSON', file: 'batch_status_summary.json', kind: 'json' },
    { label: 'Control panel snapshot', file: 'pipeline_control_panel.html', kind: 'html' },
    { label: 'Publication review dashboard', file: 'publication_review_dashboard.html', kind: 'html' },
    { label: 'Venue seed report', file: 'venue_seed_report.md', kind: 'markdown' },
    { label: 'Stage 00B editorial source report', file: 'stage_00b_editorial_source_enrichment_report.md', kind: 'markdown' },
    { label: 'Stage 03 image report', file: 'stage_03_report.md', kind: 'markdown' },
    { label: 'Stage 04 M3 report', file: 'stage_04_report.md', kind: 'markdown' },
    { label: 'Stage 05 editorial report', file: 'stage_05_report.md', kind: 'markdown' },
    { label: 'Quality gate report', file: 'quality_gate_report.md', kind: 'markdown' },
    { label: 'Approval manifest report', file: 'approval_manifest_report.md', kind: 'markdown' },
    { label: 'Cloudinary report', file: 'cloudinary_materialization_report.md', kind: 'markdown' },
    { label: 'Public projection report', file: 'public_projection_report.md', kind: 'markdown' },
    { label: 'Public apply report', file: 'public_projection_apply_report.md', kind: 'markdown' },
    { label: 'Public activation report', file: 'public_activation_apply_report.md', kind: 'markdown' },
    { label: 'Post-activation audit report', file: 'post_activation_audit_report.md', kind: 'markdown' },
    { label: 'Rollback dry-run report', file: 'public_rollback_dry_run_report.md', kind: 'markdown' },
    { label: 'Rollback apply report', file: 'public_rollback_apply_report.md', kind: 'markdown' },
    { label: 'Stage 15 gallery report', file: 'stage_15_gallery_selection_report.md', kind: 'markdown' },
    { label: 'Stage 15 gallery JSON', file: 'stage_15_gallery_selection.json', kind: 'json' },
    { label: 'One-click publication report', file: 'reviewed_publication_apply_report.md', kind: 'markdown' },
    { label: 'Reviewed decision manifest', file: 'publication_decision_manifest.reviewed.json', kind: 'json' },
    { label: 'Activation dry-run JSON', file: 'public_activation_dry_run.json', kind: 'json' },
  ];
}

function buildConfiguredBatchArgs(body: Record<string, unknown>, planOnly: boolean): string[] {
  const batchId = cleanBatchId(stringField(body, 'new_batch_id') || 'batch_new_buenos_aires_50');
  const city = stringField(body, 'city') || 'Buenos Aires';
  const count = stringField(body, 'count') || '50';
  const neighborhoods = stringField(body, 'neighborhoods') || defaultNeighborhoodsForCity(city).join(',');
  const batchType = normalizeBatchType(stringField(body, 'batch_type'));
  const typeMix = typeMixForBatchType(batchType, count);
  const args = [
    'tsx',
    'pipeline/stages/00_build_venue_seed.ts',
    batchId,
    '--count',
    count,
    '--city',
    city,
    '--type-mix',
    typeMix,
  ];
  if (neighborhoods) args.push('--neighborhoods', neighborhoods);
  args.push(planOnly ? '--plan' : '--continue');
  return args;
}

function buildEnrichmentArgs(body: Record<string, unknown>, allowM3: boolean): string[] {
  const runId = cleanRunId(stringField(body, 'enrichment_run_id'));
  const city = stringField(body, 'enrichment_city') || 'Buenos Aires';
  const maxTargets = stringField(body, 'enrichment_max_targets') || '50';
  const args = ['tsx', 'pipeline/enrichment/run_enrichment.ts'];
  if (runId) args.push('--run-id', runId, '--resume');
  else args.push('--city', city, '--active-only', '--missing-gallery', '--max-targets', maxTargets);
  args.push('--max-gallery-images', '4', '--max-expansion-images-per-venue', '8', '--max-deep-candidates-per-venue', '12');
  if (allowM3) args.push('--allow-m3');
  return args;
}

function normalizeBatchType(value: string): 'bars' | 'cafes' | 'restaurants' {
  if (value === 'bars') return 'bars';
  if (value === 'cafes') return 'cafes';
  return 'restaurants';
}

function typeMixForBatchType(batchType: 'bars' | 'cafes' | 'restaurants', count: string): string {
  const safeCount = Number.isFinite(Number(count)) && Number(count) > 0 ? String(Math.floor(Number(count))) : '50';
  if (batchType === 'cafes') return `cafes=${safeCount}`;
  if (batchType === 'bars') return 'cocktails=20,wine=12,bars=12,rooftops=6';
  return `restaurants=${safeCount}`;
}

function defaultNeighborhoodsForCity(city: string): string[] {
  const normalized = city.toLowerCase();
  if (normalized.includes('new york')) return ['Williamsburg', 'DUMBO', 'Lower East Side', 'NoMad', 'Chelsea', 'West Village'];
  if (normalized.includes('dubai')) return ['DIFC', 'Downtown Dubai', 'Jumeirah', 'Dubai Marina', 'Palm Jumeirah', 'Business Bay'];
  return ['Palermo', 'Chacarita', 'Villa Crespo', 'Colegiales', 'Recoleta', 'San Telmo'];
}

function listBatches(): BatchListItem[] {
  if (!existsSync(BATCHES_DIR)) return [];
  return readdirSync(BATCHES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => buildBatchListItem(entry.name))
    .sort((a, b) => b.score - a.score || b.id.localeCompare(a.id));
}

function buildBatchListItem(batchId: string): BatchListItem {
  const outputDir = batchDir(batchId);
  const activation = readJsonSummary(path.join(outputDir, 'public_activation_apply_result.json'), (data) => data) as Record<string, unknown> | null;
  const projection = readJsonSummary(path.join(outputDir, 'public_projection_apply_result.json'), (data) => data) as Record<string, unknown> | null;
  const quality = readJsonSummary(path.join(outputDir, 'batch_result_quality_gated.json'), (data) => data.summary) as Record<string, unknown> | null;
  const seed = readJsonSummary(path.join(outputDir, 'venue_seed.json'), (data) => data) as Record<string, unknown> | null;
  const activated = numberValue(activation?.activated);
  const projected = numberValue(projection?.approved_projected);
  const ready = numberValue(quality?.ready_for_db_staging);
  const seedCount = Array.isArray(seed?.venues) ? seed.venues.length : 0;
  const score = activated * 1000 + projected * 100 + ready * 10 + seedCount;
  const label = activated > 0
    ? `${batchId} (${activated} active)`
    : projected > 0
      ? `${batchId} (${projected} projected)`
      : ready > 0
        ? `${batchId} (${ready} ready)`
        : seedCount > 0
          ? `${batchId} (${seedCount} seed)`
          : `${batchId} (plan)`;
  return { id: batchId, score, label };
}

function writeArtifact(response: ServerResponse, batchId: string, file: string): void {
  const allowed = new Set(artifactList().map((artifact) => artifact.file));
  if (!allowed.has(file)) return writeJson(response, 403, { error: 'artifact_not_allowed' });
  const filePath = path.join(batchDir(batchId), file);
  if (!existsSync(filePath)) return writeJson(response, 404, { error: 'artifact_missing' });
  const content = readFileSync(filePath, 'utf8');
  if (file.endsWith('.html')) {
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    response.end(content);
    return;
  }
  response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  response.end(content);
}

function writeEnrichmentArtifact(response: ServerResponse, runId: string, file: string): void {
  const allowed = new Set([
    'gallery_review_dashboard.html',
    'gallery_review_manifest.json',
    'gallery_review_report.md',
    'gallery_apply_report.md',
    'gallery_apply_result.json',
    'enrichment_orchestrator_report.md',
    'enrichment_orchestrator_report.json',
  ]);
  if (!allowed.has(file)) return writeJson(response, 403, { error: 'artifact_not_allowed' });
  const safeRunId = cleanRunId(runId);
  const filePath = path.join(ROOT, 'data', 'enrichment', safeRunId, file);
  if (!existsSync(filePath)) return writeJson(response, 404, { error: 'artifact_missing' });
  const content = readFileSync(filePath, 'utf8');
  if (file.endsWith('.html')) {
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    response.end(content);
    return;
  }
  response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  response.end(content);
}

function renderApp(): string {
  const batches = listBatches();
  const data = JSON.stringify({ defaultBatch: batches[0]?.id || 'batch_004_buenos_aires_50' }).replace(/</g, '\\u003c');
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Korantis Operations Console</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #0d0f0d;
      --panel: #171915;
      --panel-2: #20231d;
      --line: #34392d;
      --text: #f2f0e8;
      --muted: #a9aa9f;
      --green: #6fcf8f;
      --red: #ef7d73;
      --gold: #d4b35f;
      --blue: #7fb3e8;
      --ink: #070807;
      --radius: 8px;
    }
    * { box-sizing: border-box; }
    body { margin: 0; background: var(--bg); color: var(--text); font-family: "Inter", "Segoe UI", sans-serif; display: flex; flex-direction: column; min-height: 100vh; }
    header { height: 64px; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; border-bottom: 1px solid var(--line); background: var(--panel); }
    h1 { font-size: 18px; font-weight: 600; margin: 0; letter-spacing: -0.01em; }
    .status-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 999px; font-size: 13px; font-weight: 500; background: var(--panel-2); border: 1px solid var(--line); }
    .status-badge.running { color: var(--blue); border-color: rgba(127, 179, 232, 0.4); }
    .status-badge.idle { color: var(--muted); }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
    .status-badge.running .status-dot { animation: pulse 1.5s infinite; }
    @keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
    
    .layout { display: flex; flex: 1; overflow: hidden; }
    .sidebar { width: 240px; border-right: 1px solid var(--line); background: var(--panel); display: flex; flex-direction: column; }
    .nav-item { padding: 12px 24px; color: var(--muted); text-decoration: none; font-size: 14px; font-weight: 500; cursor: pointer; border-left: 3px solid transparent; transition: all 0.2s; }
    .nav-item:hover { color: var(--text); background: rgba(255,255,255,0.02); }
    .nav-item.active { color: var(--text); border-left-color: var(--blue); background: rgba(127,179,232,0.05); }
    
    .main { flex: 1; display: flex; flex-direction: column; overflow-y: auto; padding: 32px 48px; }
    .tab-content { display: none; max-width: 800px; }
    .tab-content.active { display: block; animation: fadeIn 0.3s; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
    
    .card { background: var(--panel); border: 1px solid var(--line); border-radius: var(--radius); padding: 24px; margin-bottom: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .card h2 { font-size: 20px; font-weight: 600; margin: 0 0 16px 0; }
    .card p { color: var(--muted); font-size: 14px; margin: 0 0 20px 0; line-height: 1.5; }
    
    .form-group { margin-bottom: 20px; }
    label { display: block; font-size: 13px; font-weight: 500; color: var(--muted); margin-bottom: 8px; }
    select, input[type="text"], input[type="number"] { width: 100%; background: var(--ink); color: var(--text); border: 1px solid var(--line); border-radius: 6px; padding: 10px 12px; font-size: 14px; font-family: inherit; transition: border-color 0.2s; }
    select:focus, input:focus { outline: none; border-color: var(--blue); }
    
    .btn-row { display: flex; gap: 12px; margin-top: 24px; }
    button { display: inline-flex; align-items: center; justify-content: center; background: var(--panel-2); color: var(--text); border: 1px solid var(--line); border-radius: 6px; padding: 10px 16px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
    button:hover:not(:disabled) { background: rgba(255,255,255,0.05); border-color: var(--muted); }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    button.primary { background: var(--text); color: var(--ink); border-color: transparent; }
    button.primary:hover:not(:disabled) { background: #fff; }
    button.danger { background: rgba(239, 125, 115, 0.1); color: var(--red); border-color: rgba(239, 125, 115, 0.3); }
    button.danger:hover:not(:disabled) { background: rgba(239, 125, 115, 0.15); border-color: var(--red); }
    button.warning { background: rgba(212, 179, 95, 0.1); color: var(--gold); border-color: rgba(212, 179, 95, 0.3); }
    button.warning:hover:not(:disabled) { background: rgba(212, 179, 95, 0.15); border-color: var(--gold); }
    
    .checkbox-wrap { display: flex; align-items: center; gap: 8px; cursor: pointer; user-select: none; }
    .checkbox-wrap input { margin: 0; width: 16px; height: 16px; accent-color: var(--blue); }
    .checkbox-wrap span { font-size: 14px; }
    
    .right-panel { width: 380px; border-left: 1px solid var(--line); background: var(--bg); display: flex; flex-direction: column; }
    .console-header { padding: 16px 20px; border-bottom: 1px solid var(--line); display: flex; justify-content: space-between; align-items: center; background: var(--panel); }
    .console-header h3 { margin: 0; font-size: 14px; font-weight: 600; }
    .console { flex: 1; overflow: auto; padding: 16px; font: 12px/1.5 Consolas, "Courier New", monospace; color: #a5d6a7; white-space: pre-wrap; background: #050605; }
    
    .advanced-drawer { margin-top: 40px; padding-top: 24px; border-top: 1px solid var(--line); }
    details > summary { font-size: 14px; font-weight: 500; color: var(--muted); cursor: pointer; user-select: none; display: inline-flex; align-items: center; gap: 6px; }
    details > summary:hover { color: var(--text); }
    .file-list { margin-top: 16px; display: grid; gap: 8px; }
    .file-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: var(--panel); border: 1px solid var(--line); border-radius: 6px; font-size: 13px; }
    .file-item button { padding: 4px 8px; font-size: 12px; }
    
    .alert { padding: 12px 16px; border-radius: 6px; margin-bottom: 20px; font-size: 13px; display: flex; align-items: flex-start; gap: 10px; }
    .alert-warning { background: rgba(212, 179, 95, 0.1); border: 1px solid rgba(212, 179, 95, 0.3); color: #f2e2b6; }
    .alert-success { background: rgba(111, 207, 143, 0.1); border: 1px solid rgba(111, 207, 143, 0.35); color: #cff2d9; }
    
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
    th, td { text-align: left; padding: 12px; border-bottom: 1px solid var(--line); }
    th { color: var(--muted); font-weight: 500; }
    
    #artifactHost { width: 100%; min-height: 400px; border: 1px solid var(--line); border-radius: 6px; background: #fff; display: none; }
    #artifactHost.visible { display: block; }
    #artifactText { width: 100%; min-height: 400px; border: 1px solid var(--line); border-radius: 6px; background: var(--ink); color: var(--text); padding: 16px; overflow: auto; white-space: pre-wrap; font-family: monospace; font-size: 12px; display: none; }
    #artifactText.visible { display: block; }
    .artifact-controls { display: flex; gap: 8px; margin-bottom: 12px; display: none; }
    .artifact-controls.visible { display: flex; }
    .operator-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-bottom: 24px; }
    .operator-card { background: var(--panel); border: 1px solid var(--line); border-radius: var(--radius); padding: 20px; }
    .operator-card h3 { margin: 0 0 8px 0; font-size: 16px; }
    .operator-card p { margin-bottom: 16px; min-height: 42px; }
    .operator-dashboard-frame { width: 100%; min-height: 720px; border: 1px solid var(--line); border-radius: var(--radius); background: #fff; }
    .flow-strip { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin: 18px 0; }
    .flow-step { border: 1px solid var(--line); background: var(--panel-2); border-radius: 10px; padding: 12px; }
    .flow-step b { display: block; font-size: 13px; margin-bottom: 4px; }
    .flow-step span { color: var(--muted); font-size: 12px; line-height: 1.35; }
    .summary-pills { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0 18px; }
    .pill { border: 1px solid var(--line); background: #080a08; border-radius: 999px; padding: 7px 10px; font-size: 12px; color: var(--muted); }
    .pill strong { color: var(--text); }
    .review-toolbar { display: flex; flex-wrap: wrap; gap: 10px; margin: 16px 0; }
    .review-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(310px, 1fr)); gap: 14px; }
    .review-card { border: 1px solid var(--line); background: #10130f; border-radius: 14px; overflow: hidden; }
    .review-card[data-decision="approve_gallery"] { border-color: rgba(111, 207, 143, .7); }
    .review-card[data-decision="reject_gallery"] { border-color: rgba(239, 125, 115, .75); }
    .review-card-head { padding: 14px; border-bottom: 1px solid var(--line); }
    .review-card-head h3 { margin: 0 0 6px; font-size: 15px; }
    .review-card-head p { margin: 0; font-size: 12px; }
    .review-images { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; padding: 10px; }
    .review-image { min-width: 0; }
    .review-image img { display: block; width: 100%; height: 116px; object-fit: cover; border-radius: 9px; background: #050605; }
    .review-image span { display: block; color: var(--muted); font-size: 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 4px; }
    .decision-buttons { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; padding: 0 10px 10px; }
    .decision-buttons button { padding: 8px; font-size: 12px; }
    .review-notes { padding: 0 10px 12px; }
    .review-notes textarea { min-height: 46px; font-size: 12px; }
    .preview-report { display: none; margin-top: 16px; border: 1px solid var(--line); border-radius: 10px; background: #050605; color: #cfe7c6; padding: 14px; white-space: pre-wrap; font: 12px/1.45 Consolas, "Courier New", monospace; max-height: 420px; overflow: auto; }
    .preview-report.visible { display: block; }
    
  </style>
</head>
<body>
  <header>
    <h1>Korantis Operations</h1>
    <div class="status-badge" id="workflowStatusBadge">
      <div class="status-dot"></div>
      <span id="workflowStatusText">Idle</span>
    </div>
  </header>
  
  <div class="layout">
    <div class="sidebar">
      <div class="nav-item active" data-tab="tab-operator" onclick="switchTab('tab-operator')">Operator Dashboard</div>
      <div class="nav-item" data-tab="tab-create" onclick="switchTab('tab-create')">Create Venues</div>
      <div class="nav-item" data-tab="tab-improve" onclick="switchTab('tab-improve')">Improve Existing Venues</div>
      <div class="nav-item" data-tab="tab-review" onclick="switchTab('tab-review')">Review &amp; Publish</div>
      <div class="nav-item" data-tab="tab-audit" onclick="switchTab('tab-audit')">Audit</div>
    </div>
    
    <div class="main">
      <!-- Operator Dashboard Tab -->
      <div id="tab-operator" class="tab-content active">
        <div class="card">
          <h2>Simple Operator Dashboard</h2>
          <p>One screen for the two current goals: get venues ready, then enrich gallery/hero images. Safe actions only.</p>

          <div class="form-group">
            <label>Batch</label>
            <select id="operatorBatchSelector" onchange="syncBatchFromOperator()"></select>
          </div>

          <div class="operator-grid">
            <div class="operator-card">
              <h3>1. Venue acquisition</h3>
              <p>Check how many venues are found, ready, blocked, or missing required fields.</p>
              <div class="btn-row">
                <button class="primary" onclick="runOperatorAction('operator_venues')">Check venues</button>
              </div>
            </div>
            <div class="operator-card">
              <h3>2. Gallery enrichment</h3>
              <p>Check image candidates, selected heroes, and venues still missing hero images.</p>
              <div class="btn-row">
                <button class="primary" onclick="runOperatorAction('operator_galleries')">Check galleries</button>
              </div>
            </div>
            <div class="operator-card">
              <h3>Refresh dashboard</h3>
              <p>Regenerate the local operator dashboard from existing artifacts.</p>
              <div class="btn-row">
                <button onclick="runOperatorAction('operator_status')">Refresh status</button>
                <button onclick="loadOperatorDashboard()">Open below</button>
              </div>
            </div>
            <div class="operator-card">
              <h3>Staging preview</h3>
              <p>Run Supabase staging compatibility preview only. No writes, no publish.</p>
              <div class="btn-row">
                <button class="warning" onclick="runOperatorAction('operator_staging_dry_run')">Dry-run staging</button>
              </div>
            </div>
          </div>

          <iframe id="operatorDashboardFrame" class="operator-dashboard-frame"></iframe>
        </div>
      </div>

      <!-- Create Venues Tab -->
      <div id="tab-create" class="tab-content">
        <div class="card">
          <h2>Create New Venue Batch</h2>
          <p>Create a new batch of venues from seed discovery through publication review.</p>
          
          <div class="form-group">
            <label>City</label>
            <select id="createCity">
              <option value="Buenos Aires">Buenos Aires</option>
              <option value="New York City">New York City</option>
              <option value="Dubai">Dubai</option>
            </select>
          </div>
          
          <div class="form-group" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div>
              <label>Type</label>
              <select id="createType">
                <option value="bars">Bars</option>
                <option value="cafes">Cafes</option>
                <option value="restaurants">Restaurants</option>
              </select>
            </div>
            <div>
              <label>Count</label>
              <input type="number" id="createCount" value="50" min="1" max="200">
            </div>
          </div>
          
          <div class="form-group">
            <label>Neighborhoods</label>
            <input type="text" id="createNeighborhoods" value="Palermo, Chacarita, Villa Crespo, Colegiales, Recoleta, San Telmo">
            <p style="font-size: 12px; margin-top: 6px;">Comma-separated list of neighborhoods.</p>
          </div>
          
          <div class="btn-row">
            <button onclick="runBatchPlan()">Plan batch</button>
            <button class="primary" onclick="runBatchToReview()">Run batch to review</button>
          </div>
        </div>
      </div>
      
      <!-- Improve Existing Venues Tab -->
      <div id="tab-improve" class="tab-content">
        <div class="card" id="galleryReviewCard">
          <h2>Gallery Enrichment Flow</h2>
          <p>Work here only. No downloads, no file moving, no hidden full-screen workflow. Review images, save decisions, preview the exact changes, then apply only after the preview is clean.</p>
          <div class="form-group">
            <label>Active Enrichment Run ID</label>
            <input type="text" id="visibleEnrichmentId" value="enrich_current" oninput="syncVisibleEnrichmentId()">
          </div>

          <div class="flow-strip">
            <div class="flow-step"><b>1. Load</b><span>Show selected images below.</span></div>
            <div class="flow-step"><b>2. Decide</b><span>Approve, pause, or reject per venue.</span></div>
            <div class="flow-step"><b>3. Preview</b><span>Dry-run only. No uploads or DB writes.</span></div>
            <div class="flow-step"><b>4. Apply</b><span>Manual confirmation after preview.</span></div>
          </div>

          <div id="galleryFlowStatus" class="alert alert-warning">Load the current gallery run to begin.</div>
          <div id="gallerySummary" class="summary-pills"></div>
          <div class="review-toolbar">
            <button class="primary" onclick="loadGalleryReviewDashboard()">1. Load review</button>
            <button onclick="approveReadyInReview()">Approve ready venues</button>
            <button onclick="pauseAllInReview()">Pause all</button>
            <button onclick="saveGalleryReview('custom')">2. Save decisions</button>
            <button class="warning" onclick="runGalleryDryRun()">3. Preview changes</button>
            <button class="danger" onclick="runGalleryApply()">4. Apply approved photos</button>
          </div>
          <div id="galleryReviewList" class="review-grid"></div>
          <pre id="galleryPreviewReport" class="preview-report"></pre>
        </div>

        <div class="card">
          <details>
            <summary>Start or continue a gallery discovery run</summary>
            <div style="padding-top: 18px;">
              <div class="form-group">
                <label>City</label>
                <select id="improveCity">
                  <option value="Buenos Aires">Buenos Aires</option>
                  <option value="New York City">New York City</option>
                  <option value="Dubai">Dubai</option>
                </select>
              </div>
              <div class="form-group">
                <label>Target</label>
                <select id="improveTarget">
                  <option value="missing-gallery">Venues missing gallery photos</option>
                  <option value="all">All eligible venues</option>
                </select>
              </div>
              <div class="form-group">
                <label>Count (Max Targets)</label>
                <input type="number" id="improveCount" value="50" min="1" max="500">
              </div>
              <div class="form-group">
                <label class="checkbox-wrap">
                  <input type="checkbox" id="improveUseM3">
                  <span>Allow M3 image classification</span>
                </label>
                <p style="font-size: 12px; margin-top: 6px; margin-left: 24px;">Uses paid vision calls. Leave off unless you are intentionally continuing discovery.</p>
              </div>
              <div class="btn-row">
                <button class="primary" onclick="runFindImprovements()">Find improvements</button>
                <button onclick="runContinueImprovements()">Continue improvement run</button>
              </div>
            </div>
          </details>
        </div>
      </div>
      
      <!-- Review & Publish Tab -->
      <div id="tab-review" class="tab-content">
        <div class="card">
          <h2>A. New Venue Publication</h2>
          <p>Human decision layer before anything visible changes.</p>
          
          <div class="alert alert-warning">
            <strong>Hidden public projection</strong> means rows are inserted as <code>pending_review</code>. <strong>Activate</strong> makes them visible in the product.
          </div>
          
          <div class="btn-row">
            <button onclick="loadReviewDashboard()">Open publication review</button>
            <button class="warning" onclick="runProjectionApply()">Apply hidden public projection</button>
            <button class="danger" onclick="runActivationApply()">Activate reviewed venues</button>
          </div>
        </div>
        
        <div class="card">
          <h2>B. Gallery Improvements</h2>
          
          <div class="alert alert-warning" style="flex-direction: column;">
            <p style="margin: 0 0 8px 0; color: inherit;">Gallery apply uploads approved images to Cloudinary and writes venue_images with role=gallery.</p>
            <ul style="margin: 0; padding-left: 20px; color: inherit;">
              <li>It does not change hero images.</li>
              <li>It does not publish new venues.</li>
              <li>It does not activate hidden venues.</li>
            </ul>
          </div>
          
          <div class="btn-row">
            <button class="warning" onclick="runGalleryDryRun()">Preview gallery changes</button>
            <button class="danger" onclick="runGalleryApply()">Apply approved gallery photos</button>
          </div>
        </div>
        
        <div id="reviewArtifactContainer" style="margin-top: 24px;"></div>
      </div>
      
      <!-- Audit Tab -->
      <div id="tab-audit" class="tab-content">
        <div class="card">
          <h2>Catalog Health Audit</h2>
          <p>Understand current catalog health and readiness.</p>
          
          <div class="btn-row" style="margin-bottom: 24px;">
            <button class="primary" onclick="runCatalogAudit()">Run public catalog audit</button>
            <button onclick="runPostActivationAudit()">Run post-activation audit</button>
          </div>
          
          <div id="auditStatsContainer"></div>
        </div>
      </div>
      
      <!-- Advanced Drawer -->
      <div class="advanced-drawer">
        <details>
          <summary>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            Advanced &amp; Legacy Controls
          </summary>
          <div style="padding-top: 16px;">
            <div class="form-group" style="max-width: 300px;">
              <label>Active Batch ID</label>
              <select id="batchSelector" onchange="refreshArtifacts()"></select>
            </div>
            
            <div class="form-group" style="max-width: 300px;">
              <label>Active Enrichment Run ID</label>
              <input type="text" id="legacyEnrichmentId" value="enrich_current">
            </div>
            
            <h3>Artifact Files</h3>
            <div class="file-list" id="legacyFiles"></div>
          </div>
        </details>
      </div>
    </div>
    
    <div class="right-panel">
      <div class="console-header">
        <h3>Action Log</h3>
        <button style="padding: 4px 8px; font-size: 11px;" onclick="document.getElementById('console').innerHTML=''">Clear</button>
      </div>
      <div class="console" id="console">System ready.</div>
    </div>
  </div>

  <script>
    const bootData = ${data};
    let currentWorkflow = { status: 'idle', batch_id: bootData.defaultBatch, enrichment_id: '' };
    let wasRunning = false;
    let galleryManifest = null;
    let galleryDecisions = new Map();
    
    function switchTab(tabId) {
      document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
      
      document.querySelector('[data-tab="' + tabId + '"]').classList.add('active');
      document.getElementById(tabId).classList.add('active');
    }
    
    function appendLog(msg) {
      const cons = document.getElementById('console');
      cons.textContent += msg + '\\n';
      cons.scrollTop = cons.scrollHeight;
    }
    
    async function apiCall(endpoint, payload) {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) {
          alert('Error: ' + (data.error || 'Unknown error'));
          return false;
        }
        return true;
      } catch (err) {
        alert('Network error: ' + err.message);
        return false;
      }
    }

    function selectedOperatorBatch() {
      return document.getElementById('operatorBatchSelector').value || currentWorkflow.batch_id || bootData.defaultBatch;
    }

    function syncBatchFromOperator() {
      const batch = selectedOperatorBatch();
      currentWorkflow.batch_id = batch;
      const legacySelector = document.getElementById('batchSelector');
      if (legacySelector) legacySelector.value = batch;
      loadOperatorDashboard();
      refreshArtifacts();
    }

    async function runOperatorAction(action) {
      const batchId = selectedOperatorBatch();
      currentWorkflow.batch_id = batchId;
      const ok = await apiCall('/api/run', { batch_id: batchId, action });
      if (ok) {
        appendLog('Started ' + action + ' for ' + batchId);
        setTimeout(loadOperatorDashboard, 1200);
      }
    }

    function loadOperatorDashboard() {
      const batch = selectedOperatorBatch();
      const frame = document.getElementById('operatorDashboardFrame');
      frame.src = '/api/artifact?batch=' + encodeURIComponent(batch) + '&file=operator_dashboard.html&ts=' + Date.now();
    }

    function currentEnrichmentRunId() {
      return document.getElementById('visibleEnrichmentId').value || document.getElementById('legacyEnrichmentId').value || currentWorkflow.enrichment_id || 'enrich_current';
    }

    function syncVisibleEnrichmentId() {
      const runId = document.getElementById('visibleEnrichmentId').value;
      document.getElementById('legacyEnrichmentId').value = runId;
      currentWorkflow.enrichment_id = runId;
    }

    function setGalleryFlowStatus(message, kind) {
      const status = document.getElementById('galleryFlowStatus');
      status.textContent = message;
      status.className = 'alert ' + (kind === 'ok' ? 'alert-success' : 'alert-warning');
    }

    function escapeHtml(value) {
      return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
    }

    function statusLabel(status) {
      if (status === 'ready_for_gallery_review') return 'Ready';
      if (status === 'needs_more_spatial_images') return 'Needs more spatial images';
      if (status === 'blocked_gallery_quality') return 'Blocked by quality';
      return status || 'Unknown';
    }

    function decisionPayload() {
      return Object.fromEntries([...galleryDecisions.entries()].map(([venueId, value]) => [venueId, value]));
    }

    function setGalleryDecision(venueId, decision) {
      const current = galleryDecisions.get(venueId) || { reviewer_notes: '' };
      galleryDecisions.set(venueId, { ...current, decision });
      const card = document.querySelector('[data-gallery-venue="' + CSS.escape(venueId) + '"]');
      if (card) card.dataset.decision = decision;
      renderGalleryCounts();
    }

    function setGalleryNote(venueId, notes) {
      const current = galleryDecisions.get(venueId) || { decision: 'pause' };
      galleryDecisions.set(venueId, { ...current, reviewer_notes: notes });
    }

    function approveReadyInReview() {
      if (!galleryManifest) return loadGalleryReviewDashboard().then(approveReadyInReview);
      galleryManifest.entries.forEach(entry => setGalleryDecision(entry.venue_id, entry.status === 'ready_for_gallery_review' ? 'approve_gallery' : 'pause'));
      setGalleryFlowStatus('Ready venues approved locally. Click "2. Save decisions", or preview to save and dry-run automatically.', 'ok');
    }

    function pauseAllInReview() {
      if (!galleryManifest) return;
      galleryManifest.entries.forEach(entry => setGalleryDecision(entry.venue_id, 'pause'));
      setGalleryFlowStatus('All venues paused locally. Click "2. Save decisions" to persist.', 'ok');
    }

    function renderGalleryCounts() {
      if (!galleryManifest) return;
      const values = [...galleryDecisions.values()];
      const approved = values.filter(item => item.decision === 'approve_gallery').length;
      const paused = values.filter(item => item.decision === 'pause').length;
      const rejected = values.filter(item => item.decision === 'reject_gallery').length;
      const approvedImages = galleryManifest.entries
        .filter(entry => galleryDecisions.get(entry.venue_id)?.decision === 'approve_gallery')
        .reduce((sum, entry) => sum + (Array.isArray(entry.images) ? entry.images.length : 0), 0);
      const summary = document.getElementById('gallerySummary');
      summary.innerHTML = [
        '<span class="pill"><strong>' + galleryManifest.entries.length + '</strong> venues</span>',
        '<span class="pill"><strong>' + galleryManifest.ready_for_gallery_review + '</strong> ready</span>',
        '<span class="pill"><strong>' + galleryManifest.needs_more_spatial_images + '</strong> need more</span>',
        '<span class="pill"><strong>' + galleryManifest.blocked_gallery_quality + '</strong> blocked</span>',
        '<span class="pill"><strong>' + approved + '</strong> approved</span>',
        '<span class="pill"><strong>' + approvedImages + '</strong> approved images</span>',
        '<span class="pill"><strong>' + paused + '</strong> paused</span>',
        '<span class="pill"><strong>' + rejected + '</strong> rejected</span>',
      ].join('');
    }

    function renderGalleryReview() {
      const list = document.getElementById('galleryReviewList');
      if (!galleryManifest) {
        list.innerHTML = '';
        return;
      }
      renderGalleryCounts();
      list.innerHTML = galleryManifest.entries.map(entry => {
        const decision = galleryDecisions.get(entry.venue_id)?.decision || 'pause';
        const images = (entry.images || []).slice(0, 3).map(image =>
          '<div class="review-image"><img src="' + escapeHtml(image.resolved_image_url) + '" loading="lazy"><span>' +
          escapeHtml(image.role || image.source_type || 'image') + ' | ' + escapeHtml(image.rights_status || '') + '</span></div>'
        ).join('') || '<div class="review-image"><span>No selected images</span></div>';
        return '<section class="review-card" data-gallery-venue="' + escapeHtml(entry.venue_id) + '" data-decision="' + escapeHtml(decision) + '">' +
          '<div class="review-card-head"><h3>' + escapeHtml(entry.venue_name) + '</h3>' +
          '<p>' + escapeHtml(statusLabel(entry.status)) + ' | ' + escapeHtml(entry.selected_count || 0) + ' images | ' + escapeHtml(entry.spatial_count || 0) + ' spatial</p></div>' +
          '<div class="review-images">' + images + '</div>' +
          '<div class="decision-buttons">' +
          '<button onclick="setGalleryDecision(\\'' + escapeHtml(entry.venue_id) + '\\', \\'approve_gallery\\')">Approve</button>' +
          '<button onclick="setGalleryDecision(\\'' + escapeHtml(entry.venue_id) + '\\', \\'pause\\')">Pause</button>' +
          '<button onclick="setGalleryDecision(\\'' + escapeHtml(entry.venue_id) + '\\', \\'reject_gallery\\')">Reject</button>' +
          '</div>' +
          '<div class="review-notes"><textarea placeholder="Notes" oninput="setGalleryNote(\\'' + escapeHtml(entry.venue_id) + '\\', this.value)">' +
          escapeHtml(galleryDecisions.get(entry.venue_id)?.reviewer_notes || '') + '</textarea></div>' +
          '</section>';
      }).join('');
    }

    async function loadGalleryReviewDashboard() {
      const runId = currentEnrichmentRunId();
      try {
        const res = await fetch('/api/enrichment-review/manifest?run=' + encodeURIComponent(runId));
        const data = await res.json();
        if (!res.ok) {
          setGalleryFlowStatus('Could not load gallery review: ' + (data.error || 'unknown error'), 'warn');
          return;
        }
        galleryManifest = data;
        galleryDecisions = new Map((data.entries || []).map(entry => [entry.venue_id, { decision: 'pause', reviewer_notes: '' }]));
        renderGalleryReview();
        setGalleryFlowStatus('Loaded ' + data.entries.length + ' venues. Approve ready venues or adjust decisions below.', 'ok');
      } catch (err) {
        setGalleryFlowStatus('Could not load gallery review: ' + err.message, 'warn');
      }
    }

    async function loadGalleryPreviewReport() {
      const runId = currentEnrichmentRunId();
      const target = document.getElementById('galleryPreviewReport');
      if (!target) return;
      const res = await fetch('/api/enrichment-artifact?run=' + encodeURIComponent(runId) + '&file=gallery_apply_report.md&ts=' + Date.now());
      if (!res.ok) return;
      target.textContent = await res.text();
      target.classList.add('visible');
    }

    async function saveGalleryReview(reviewAction) {
      const runId = currentEnrichmentRunId();
      if (!galleryManifest && reviewAction === 'custom') await loadGalleryReviewDashboard();
      try {
        const res = await fetch('/api/enrichment-review/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            run_id: runId,
            review_action: reviewAction,
            decisions: reviewAction === 'custom' ? decisionPayload() : undefined
          })
        });
        const data = await res.json();
        if (!res.ok) {
          setGalleryFlowStatus('Could not save review manifest: ' + (data.error || 'unknown error'), 'warn');
          appendLog('Gallery review save failed: ' + (data.error || 'unknown error'));
          return false;
        }
        const message = 'Saved reviewed manifest: ' + data.approved_venues + ' venues approved, ' + data.approved_images + ' images, ' + data.paused_venues + ' paused.';
        setGalleryFlowStatus(message, 'ok');
        appendLog(message + ' File: ' + data.reviewed_file);
        return true;
      } catch (err) {
        setGalleryFlowStatus('Could not save review manifest: ' + err.message, 'warn');
        appendLog('Gallery review save failed: ' + err.message);
        return false;
      }
    }
    
    // Create Flow
    async function runBatchPlan() {
      const city = document.getElementById('createCity').value;
      const count = document.getElementById('createCount').value;
      const type = document.getElementById('createType').value;
      const neighborhoods = document.getElementById('createNeighborhoods').value;
      
      const batchId = 'batch_new_' + city.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + type + '_' + count;
      currentWorkflow.batch_id = batchId;
      
      await apiCall('/api/venue-batches/plan', {
        new_batch_id: batchId,
        city, count, batch_type: type, neighborhoods
      });
    }
    
    async function runBatchToReview() {
      const city = document.getElementById('createCity').value;
      const count = document.getElementById('createCount').value;
      const type = document.getElementById('createType').value;
      const neighborhoods = document.getElementById('createNeighborhoods').value;
      
      const batchId = 'batch_new_' + city.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + type + '_' + count;
      currentWorkflow.batch_id = batchId;
      
      await apiCall('/api/venue-batches/run-to-review', {
        new_batch_id: batchId,
        city, count, batch_type: type, neighborhoods
      });
    }
    
    // Improve Flow
    function getEnrichmentId() {
      const city = document.getElementById('improveCity').value.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const target = document.getElementById('improveTarget').value;
      const date = new Date().toISOString().slice(0,10).replace(/-/g, '_');
      return 'enrich_' + date + '_' + city + '_' + target;
    }
    
    async function runFindImprovements() {
      const useM3 = document.getElementById('improveUseM3').checked;
      const endpoint = useM3 ? '/api/enrichment/run-image-classification' : '/api/enrichment/start';
      const runId = getEnrichmentId();
      document.getElementById('legacyEnrichmentId').value = runId;
      document.getElementById('visibleEnrichmentId').value = runId;
      currentWorkflow.enrichment_id = runId;
      
      await apiCall(endpoint, {
        enrichment_run_id: runId,
        enrichment_city: document.getElementById('improveCity').value,
        enrichment_max_targets: document.getElementById('improveCount').value
      });
    }
    
    async function runContinueImprovements() {
      const runId = currentEnrichmentRunId() || getEnrichmentId();
      await apiCall('/api/enrichment/continue', { enrichment_run_id: runId });
    }
    
    async function runGalleryDryRun() {
      const runId = currentEnrichmentRunId();
      const saved = await saveGalleryReview('custom');
      if (!saved) return;
      const ok = await apiCall('/api/enrichment/gallery-dry-run', { enrichment_run_id: runId });
      if (ok) {
        setGalleryFlowStatus('Preview started. The report will appear below when the command finishes.', 'ok');
        setTimeout(loadGalleryPreviewReport, 2500);
        setTimeout(loadGalleryPreviewReport, 5000);
      }
    }
    
    async function runGalleryApply() {
      const runId = currentEnrichmentRunId();
      const conf = prompt('Type APPLY GALLERY to confirm applying photos to Cloudinary and DB:');
      if (conf !== 'APPLY GALLERY') return;
      await apiCall('/api/enrichment/apply-gallery', { enrichment_run_id: runId, confirm: 'APPLY GALLERY' });
    }
    
    // Review Flow
    async function runProjectionApply() {
      const batchId = currentWorkflow.batch_id || bootData.defaultBatch;
      const conf = prompt('Type RUN to apply hidden public projection:');
      if (conf !== 'RUN') return;
      await apiCall('/api/publication/apply-projection', { batch_id: batchId, confirm: 'RUN' });
    }
    
    async function runActivationApply() {
      const batchId = currentWorkflow.batch_id || bootData.defaultBatch;
      const conf = prompt('Type RUN to activate reviewed venues:');
      if (conf !== 'RUN') return;
      await apiCall('/api/publication/activate', { batch_id: batchId, confirm: 'RUN' });
    }
    
    // Audit Flow
    async function runCatalogAudit() {
      await apiCall('/api/audit/public-catalog', {});
    }
    
    async function runPostActivationAudit() {
      const batchId = currentWorkflow.batch_id || bootData.defaultBatch;
      await apiCall('/api/audit/public-catalog', { batch_id: batchId, action: 'post_activation_audit' });
    }
    
    // Artifact loading
    async function loadReviewDashboard() {
      const batch = currentWorkflow.batch_id || bootData.defaultBatch;
      const url = '/api/artifact?batch=' + encodeURIComponent(batch) + '&file=publication_review_dashboard.html';
      const container = document.getElementById('reviewArtifactContainer');
      const host = document.createElement('iframe');
      host.className = 'operator-dashboard-frame';
      host.src = url;
      container.innerHTML = '';
      container.appendChild(host);
    }
    
    function openExternalArtifact(file) {
      const batch = currentWorkflow.batch_id || bootData.defaultBatch;
      window.open('/api/artifact?batch=' + encodeURIComponent(batch) + '&file=' + encodeURIComponent(file), '_blank');
    }

    function openExternalEnrichmentArtifact(file) {
      const runId = currentEnrichmentRunId();
      window.open('/api/enrichment-artifact?run=' + encodeURIComponent(runId) + '&file=' + encodeURIComponent(file), '_blank');
    }

    async function loadRawArtifact(file) {
      const batch = document.getElementById('batchSelector').value || currentWorkflow.batch_id;
      const res = await fetch('/api/artifact?batch=' + encodeURIComponent(batch) + '&file=' + encodeURIComponent(file));
      if (!res.ok) return alert('Artifact not found');
      
      if (file.endsWith('.html')) {
        openExternalArtifact(file);
      } else {
        const data = await res.text();
        let text = document.getElementById('artifactText');
        if (!text) {
          text = document.createElement('pre');
          text.id = 'artifactText';
          text.className = 'artifact visible';
          document.getElementById('reviewArtifactContainer').appendChild(text);
        }
        text.textContent = data;
      }
    }
    
    // Polling & Status
    async function pollState() {
      try {
        const [workflowsRes, runStateRes] = await Promise.all([
          fetch('/api/workflows'),
          fetch('/api/run-state')
        ]);
        
        const wf = await workflowsRes.json();
        const rs = await runStateRes.json();
        if (wf.latest_enrichment_run_id && wf.latest_enrichment_run_id !== currentWorkflow.enrichment_id) {
          currentWorkflow.enrichment_id = wf.latest_enrichment_run_id;
          document.getElementById('legacyEnrichmentId').value = wf.latest_enrichment_run_id;
          document.getElementById('visibleEnrichmentId').value = wf.latest_enrichment_run_id;
        }
        
        const badge = document.getElementById('workflowStatusBadge');
        const badgeText = document.getElementById('workflowStatusText');
        
        if (rs.running) {
          badge.className = 'status-badge running';
          badgeText.textContent = 'Running: ' + rs.action;
          wasRunning = true;
          
          const consoleEl = document.getElementById('console');
          if (rs.log && rs.log.length > 0) {
            consoleEl.textContent = rs.log.join('');
            consoleEl.scrollTop = consoleEl.scrollHeight;
          }
        } else {
          badge.className = 'status-badge idle';
          badgeText.textContent = 'Idle';
          if (wasRunning) {
            wasRunning = false;
            loadOperatorDashboard();
            loadGalleryReviewDashboard();
            loadGalleryPreviewReport();
            refreshArtifacts();
          }
        }
        
      } catch (e) {
        // ignore network errors on poll
      }
    }
    
    async function loadBatches() {
      const res = await fetch('/api/batches');
      const data = await res.json();
      const sel = document.getElementById('batchSelector');
      const operatorSel = document.getElementById('operatorBatchSelector');
      sel.innerHTML = data.batch_items.map(b => '<option value="' + b.id + '">' + b.label + '</option>').join('');
      operatorSel.innerHTML = data.batch_items.map(b => '<option value="' + b.id + '">' + b.label + '</option>').join('');
      sel.value = bootData.defaultBatch;
      operatorSel.value = bootData.defaultBatch;
      refreshArtifacts();
      loadOperatorDashboard();
      const workflowsRes = await fetch('/api/workflows');
      const workflows = await workflowsRes.json();
      if (workflows.latest_enrichment_run_id) {
        currentWorkflow.enrichment_id = workflows.latest_enrichment_run_id;
        document.getElementById('legacyEnrichmentId').value = workflows.latest_enrichment_run_id;
        document.getElementById('visibleEnrichmentId').value = workflows.latest_enrichment_run_id;
        loadGalleryReviewDashboard();
      }
    }
    
    async function refreshArtifacts() {
      const batch = document.getElementById('batchSelector').value;
      currentWorkflow.batch_id = batch;
      const res = await fetch('/api/status?batch=' + encodeURIComponent(batch));
      const data = await res.json();
      
      const list = document.getElementById('legacyFiles');
      list.innerHTML = data.artifacts.map(a => 
        '<div class="file-item"><span>' + a.label + '</span>' + 
        '<button ' + (a.exists ? '' : 'disabled') + ' onclick="loadRawArtifact(\\'' + a.file + '\\')">' + 
        (a.exists ? 'Open' : 'Missing') + '</button></div>'
      ).join('');
    }
    
    // Init
    loadBatches();
    setInterval(pollState, 1500);
  </script>
</body>
</html>`;
}

function appendLog(value: string): void {
  runState.log.push(value);
  if (runState.log.length > MAX_LOG_LINES) runState.log.splice(0, runState.log.length - MAX_LOG_LINES);
}

function batchDir(batchId: string): string {
  const safe = batchId.replace(/[^a-zA-Z0-9_.-]/g, '');
  return path.join(BATCHES_DIR, safe);
}

function readJsonSummary(filePath: string, selector: (data: Record<string, unknown>) => unknown): unknown {
  if (!existsSync(filePath)) return null;
  try {
    return selector(JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, unknown>);
  } catch {
    return null;
  }
}

function summarizeDecisions(data: Record<string, unknown>): Record<string, number> {
  const decisions = Array.isArray(data.decisions) ? data.decisions as Array<{ publication_decision?: string }> : [];
  return {
    total: decisions.length,
    approved: decisions.filter((decision) => decision.publication_decision === 'approve').length,
    paused: decisions.filter((decision) => decision.publication_decision === 'pause').length,
    rejected: decisions.filter((decision) => decision.publication_decision === 'reject').length,
  };
}

function numberValue(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function requiredParam(url: URL, name: string): string {
  const value = url.searchParams.get(name);
  if (!value) throw new Error(`Missing query param: ${name}`);
  return value;
}

function stringField(body: unknown, key: string): string {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return '';
  const value = (body as Record<string, unknown>)[key];
  return typeof value === 'string' ? value : '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function cleanBatchId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_.-]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '') || 'batch_new';
}

function cleanRunId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_.-]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');
}

function writeManual(response: ServerResponse): void {
  const manualPath = path.join(ROOT, 'docs', 'KORANTIS_CONTROL_CENTER_MANUAL.md');
  if (!existsSync(manualPath)) return writeJson(response, 404, { error: 'manual_missing' });
  response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  response.end(readFileSync(manualPath, 'utf8'));
}

async function readRequestJson(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

function writeJson(response: ServerResponse, statusCode: number, payload: unknown): void {
  response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload, null, 2));
}

function writeHtml(response: ServerResponse, html: string): void {
  response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  response.end(html);
}

const isDirectRun = process.argv[1] ? fileURLToPath(import.meta.url) === path.resolve(process.argv[1]) : false;

if (isDirectRun) {
  startControlCenterServer();
}
