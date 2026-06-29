import { createServer, type IncomingMessage, type ServerResponse } from 'http';
import { spawn, type ChildProcessWithoutNullStreams } from 'child_process';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

interface CommandDefinition {
  label: string;
  description: string;
  danger: 'safe' | 'paid_model' | 'writes_cloudinary' | 'writes_hidden_public' | 'publishes_public';
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
const CONTROL_HOST = process.env.KORANTIS_CONTROL_HOST || '127.0.0.1';
const ROOT = process.cwd();
const BATCHES_DIR = path.join(ROOT, 'data', 'batches');
const MAX_LOG_LINES = 800;
const CITY_NEIGHBORHOODS: Record<string, string[]> = {
  'Buenos Aires': ['Palermo', 'Recoleta', 'San Telmo', 'Chacarita', 'Villa Crespo', 'Retiro', 'Centro', 'Belgrano', 'Colegiales', 'Núñez', 'Almagro', 'Puerto Madero', 'Monserrat', 'Barracas', 'Caballito', 'Villa Devoto', 'Saavedra'],
  'Córdoba, Argentina': ['Nueva Córdoba', 'Güemes', 'General Paz', 'Cerro de las Rosas', 'Alta Córdoba', 'Cofico', 'Alberdi', 'Centro', 'Barrio Jardín', 'Urca', 'Villa Belgrano', 'Argüello', 'Chateau Carreras', 'Rogelio Martínez', 'Juniors', 'San Vicente'],
  'New York City': ['Williamsburg', 'DUMBO', 'Lower East Side', 'NoMad', 'Chelsea', 'West Village', 'East Village', 'SoHo', 'Tribeca', 'Greenpoint', 'Bushwick', 'Flatiron', 'Upper West Side', 'Upper East Side', 'Midtown'],
  Dubai: ['DIFC', 'Downtown Dubai', 'Jumeirah', 'Dubai Marina', 'Palm Jumeirah', 'Business Bay', 'Al Quoz', 'City Walk', 'JBR', 'Dubai Design District', 'Bluewaters Island', 'Umm Suqeim'],
};
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
    description: 'Builds a broad candidate pool, uses M3 to reject weak venue photos, selects the final venues, and continues to review.',
    danger: 'paid_model',
    buildArgs: (_batchId, body) => buildConfiguredBatchArgs(body, false),
  },  resume_batch: {
    label: 'Continue batch',
    description: 'Continues from existing artifacts and stops at publication review.',
    danger: 'paid_model',
    buildArgs: (batchId) => ['tsx', 'pipeline/run_full_batch.ts', batchId, '--max-images-per-venue', '2'],
  },
  recover_batch_images: {
    label: 'Recover venue galleries',
    description: 'Rebuilds the image queue, reuses prior vision results, and scans at most two candidates per venue.',
    danger: 'paid_model',
    buildArgs: (batchId) => ['tsx', 'pipeline/recover_batch_images.ts', batchId, '--max-images-per-venue', '2'],
  },  recover_batch_images_deep: {
    label: 'Deepen gallery recovery',
    description: 'Scans up to four candidates only for venues that still have no selected hero.',
    danger: 'paid_model',
    buildArgs: (batchId) => ['tsx', 'pipeline/recover_batch_images.ts', batchId, '--max-images-per-venue', '4'],
  },
  recover_batch_images_exhaustive: {
    label: 'Final gallery recovery pass',
    description: 'Scans up to eight candidates only for venues that remain without a selected hero.',
    danger: 'paid_model',
    buildArgs: (batchId) => ['tsx', 'pipeline/recover_batch_images.ts', batchId, '--max-images-per-venue', '8'],
  },  recover_batch_images_salvage: {
    label: 'Exhaust remaining image queue',
    description: 'Scans the remaining validated candidates only for venues that still have no selected hero.',
    danger: 'paid_model',
    buildArgs: (batchId) => ['tsx', 'pipeline/recover_batch_images.ts', batchId, '--max-images-per-venue', '12'],
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
  const allowRemote = process.env.KORANTIS_CONTROL_ALLOW_REMOTE === '1';
  const loopbackHosts = new Set(['127.0.0.1', 'localhost', '::1']);

  if (!allowRemote && !loopbackHosts.has(CONTROL_HOST)) {
    throw new Error('Refusing to start control center on a non-loopback host. Set KORANTIS_CONTROL_ALLOW_REMOTE=1 only for a protected network.');
  }

  const server = createServer((request, response) => {
    route(request, response).catch((error: unknown) => {
      writeJson(response, 500, { error: error instanceof Error ? error.message : String(error) });
    });
  });

  server.listen(port, CONTROL_HOST, () => {
    console.log(`Korantis control center running at http://${CONTROL_HOST}:${port}`);
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
  if (request.method === 'GET' && url.pathname === '/api/workflow-state') {
    const batchId = url.searchParams.get('batch') || String(readRegistry().latest_batch_id || listBatches()[0]?.id || '');
    return writeJson(response, 200, buildWorkflowSnapshot(batchId));
  }
  if (request.method === 'GET' && url.pathname === '/api/next-batch-id') {
    return writeJson(response, 200, {
      batch_id: suggestNextBatchId(
        url.searchParams.get('city') || 'Buenos Aires',
        normalizeBatchType(url.searchParams.get('type') || 'restaurants'),
        url.searchParams.get('count') || '50',
      ),
    });
  }
  if (request.method === 'GET' && url.pathname === '/api/run-state') return writeJson(response, 200, runState);
  if (request.method === 'GET' && url.pathname === '/api/artifact') return writeArtifact(response, requiredParam(url, 'batch'), requiredParam(url, 'file'));
  if (request.method === 'GET' && url.pathname === '/api/enrichment-artifact') return writeEnrichmentArtifact(response, requiredParam(url, 'run'), requiredParam(url, 'file'));
  if (request.method === 'GET' && url.pathname === '/api/enrichment-review/manifest') return writeGalleryReviewManifest(response, requiredParam(url, 'run'));
  if (request.method === 'GET' && url.pathname === '/api/enrichment-review/status') return writeJson(response, 200, readGalleryReviewStatus(requiredParam(url, 'run')));
  if (request.method === 'GET' && url.pathname === '/api/workflows') return writeJson(response, 200, readRegistry());
  if (request.method === 'POST' && url.pathname === '/api/enrichment-review/save') return handleGalleryReviewSave(request, response);
  if (request.method === 'POST' && url.pathname === '/api/publication-review/save') return handlePublicationReviewSave(request, response);
  
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
  const payload = isRecord(body) ? { ...body } : {};
  const action = explicitAction || stringField(payload, 'action');
  const requestedBatchId = stringField(payload, 'batch_id') || stringField(payload, 'new_batch_id');
  const shouldNumberBatch = action === 'custom_batch_plan' || action === 'custom_batch_run';
  const batchId = shouldNumberBatch && (!requestedBatchId || requestedBatchId.startsWith('batch_new_'))
    ? suggestNextBatchId(
        stringField(payload, 'city') || 'Buenos Aires',
        normalizeBatchType(stringField(payload, 'batch_type')),
        stringField(payload, 'count') || '50',
      )
    : requestedBatchId || 'default_batch';
  payload.new_batch_id = batchId;
  const confirm = stringField(payload, 'confirm');
  const command = COMMANDS[action];
  if (!command) return writeJson(response, 400, { error: `Unknown action: ${action}` });
  if (runState.running) return writeJson(response, 409, { error: 'A command is already running.' });
  if (action === 'enrichment_gallery_apply') {
    const runId = cleanRunId(stringField(payload, 'enrichment_run_id'));
    const reviewStatus = readGalleryReviewStatus(runId);
    const reviewedAt = typeof reviewStatus.reviewed_at === 'string' ? Date.parse(reviewStatus.reviewed_at) : NaN;
    const reviewAgeMs = Number.isFinite(reviewedAt) ? Date.now() - reviewedAt : Number.POSITIVE_INFINITY;
    if (!reviewStatus.reviewed_exists || reviewAgeMs > 4 * 60 * 60 * 1000) {
      return writeJson(response, 409, { error: 'La revision de galeria no existe o vencio. Volve a revisar y guardar antes de aplicar.' });
    }
  }  if (command.danger === 'paid_model' && confirm !== 'RUN MODELS') {
    return writeJson(response, 400, { error: 'Confirm the model-assisted run before continuing.' });
  }
  if ((command.danger === 'writes_cloudinary' || command.danger === 'writes_hidden_public' || command.danger === 'publishes_public') && confirm !== 'RUN' && confirm !== 'APPLY GALLERY') {
    return writeJson(response, 400, { error: 'Confirmation is required for this action.' });
  }

  // Update registry
  if (action.includes('enrichment')) writeRegistry({ latest_enrichment_run_id: stringField(payload, 'enrichment_run_id') || 'enrich_current', current_workflow_status: 'running' });
  else writeRegistry({ latest_batch_id: batchId, current_workflow_status: 'running' });

  const args = command.buildArgs(batchId, payload);
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

async function handlePublicationReviewSave(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const body = await readRequestJson(request);
  const payload = isRecord(body) ? body : {};
  const batchId = cleanBatchId(stringField(payload, 'batch_id'));
  const outputDir = batchDir(batchId);
  const manifestPath = path.join(outputDir, 'publication_decision_manifest.json');
  if (!batchId || !existsSync(manifestPath)) return writeJson(response, 404, { error: 'publication_manifest_missing' });
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Record<string, unknown>;
  const baseDecisions = Array.isArray(manifest.decisions) ? manifest.decisions.filter(isRecord) : [];
  const requestedDecisions = Array.isArray(payload.decisions) ? payload.decisions.filter(isRecord) : [];
  const requestedByVenue = new Map(requestedDecisions.map((decision) => [normalizeWorkflowName(stringField(decision, 'venue_name')), decision]));
  const decisions: Array<Record<string, unknown> & { publication_decision: string; reviewer_notes: string }> = baseDecisions.map((decision) => {
    const requested = requestedByVenue.get(normalizeWorkflowName(stringField(decision, 'venue_name')));
    const requestedValue = stringField(requested || {}, 'publication_decision');
    const publishEligible = decision.publish_eligible === true;
    const safeDecision = requestedValue === 'reject' || requestedValue === 'pause' || (requestedValue === 'approve' && publishEligible)
      ? requestedValue
      : 'pause';
    return {
      ...decision,
      publication_decision: safeDecision,
      reviewer_notes: stringField(requested || {}, 'reviewer_notes'),
    };
  });
  const reviewed = {
    ...manifest,
    status: 'reviewed',
    generated_at: new Date().toISOString(),
    reviewed_at: new Date().toISOString(),
    decisions,
  };
  const reviewedPath = path.join(outputDir, 'publication_decision_manifest.reviewed.json');
  writeFileSync(reviewedPath, `${JSON.stringify(reviewed, null, 2)}\n`, 'utf8');
  writeJson(response, 200, {
    batch_id: batchId,
    reviewed_file: reviewedPath,
    approved: decisions.filter((decision) => decision.publication_decision === 'approve').length,
    rejected: decisions.filter((decision) => decision.publication_decision === 'reject').length,
    paused: decisions.filter((decision) => decision.publication_decision === 'pause').length,
    blocked_excluded: decisions.filter((decision) => decision.publish_eligible !== true).length,
  });
}

function normalizeWorkflowName(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
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
  const numericCount = Number.isFinite(Number(count)) && Number(count) > 0 ? Math.floor(Number(count)) : 50;
  if (batchType === 'cafes') return `cafes=${numericCount}`;
  if (batchType === 'bars') {
    const cocktails = Math.max(1, Math.round(numericCount * 0.3));
    const wine = Math.max(1, Math.round(numericCount * 0.2));
    const rooftops = Math.max(1, Math.round(numericCount * 0.1));
    const bars = numericCount - cocktails - wine - rooftops;
    return `cocktails=${cocktails},wine=${wine},bars=${bars},rooftops=${rooftops}`;
  }
  return `restaurants=${numericCount}`;
}

function defaultNeighborhoodsForCity(city: string): string[] {
  return CITY_NEIGHBORHOODS[city] || CITY_NEIGHBORHOODS['Buenos Aires'];
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

type WorkflowStepState = 'pending' | 'running' | 'complete' | 'warning' | 'error';
type WorkflowSeverity = 'neutral' | 'running' | 'success' | 'warning' | 'error';

interface WorkflowIssue {
  severity: 'warning' | 'error';
  title: string;
  detail: string;
}

interface WorkflowSnapshot {
  batch_id: string;
  suggested_next_batch_id: string;
  severity: WorkflowSeverity;
  headline: string;
  message: string;
  running: boolean;
  progress_percent: number;
  current_step: string;
  counts: {
    total_venues: number;
    image_candidates: number;
    selected_heroes: number;
    missing_heroes: number;
    ready: number;
    blocked: number;
  };
  steps: Array<{ id: string; label: string; state: WorkflowStepState; detail: string }>;
  issues: WorkflowIssue[];
  next_action: {
    id: 'wait' | 'create_batch' | 'resume_batch' | 'recover_batch_images' | 'recover_batch_images_deep' | 'recover_batch_images_exhaustive' | 'recover_batch_images_salvage' | 'open_review' | 'audit';
    label: string;
    description: string;
    tab: string;
    paid_model: boolean;
  };
}

function suggestNextBatchId(city: string, batchType: 'bars' | 'cafes' | 'restaurants', count: string): string {
  const existingNames = [
    ...(existsSync(BATCHES_DIR) ? readdirSync(BATCHES_DIR) : []),
    ...(existsSync(path.join(ROOT, 'pipeline', 'input')) ? readdirSync(path.join(ROOT, 'pipeline', 'input')) : []),
  ];
  const usedNumbers = existingNames
    .map((name) => /^batch_(\d{3})(?:_|\.)/i.exec(name)?.[1])
    .filter((value): value is string => Boolean(value))
    .map(Number);
  let sequence = (usedNumbers.length > 0 ? Math.max(...usedNumbers) : 0) + 1;
  const citySlug = slugIdentifier(city.replace(/,?\s*(argentina|united states|uae)$/i, '')) || 'city';
  const safeCount = String(Math.max(1, Math.floor(Number(count) || 50)));
  let candidate = '';
  do {
    candidate = `batch_${String(sequence).padStart(3, '0')}_${citySlug}_${batchType}_${safeCount}`;
    sequence += 1;
  } while (existsSync(batchDir(candidate)) || existsSync(path.join(ROOT, 'pipeline', 'input', `${candidate}.json`)));
  return candidate;
}

function slugIdentifier(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function buildWorkflowSnapshot(batchId: string): WorkflowSnapshot {
  const outputDir = batchDir(batchId);
  const raw = readJsonUnknown(path.join(outputDir, 'stage_01_raw_venues.json'));
  const seed = readJsonRecordSafe(path.join(outputDir, 'venue_seed.json'));
  const stage03 = readJsonRecordSafe(path.join(outputDir, 'stage_03_final_vision_queue.json'));
  const stage04 = readJsonRecordSafe(path.join(outputDir, 'stage_04_selected_images.json'));
  const editorial = readJsonRecordSafe(path.join(outputDir, 'batch_result_with_editorial.json'));
  const quality = readJsonRecordSafe(path.join(outputDir, 'batch_result_quality_gated.json'));
  const approval = readJsonRecordSafe(path.join(outputDir, 'approval_manifest.json'));
  const reviewed = readJsonRecordSafe(path.join(outputDir, 'publication_decision_manifest.reviewed.json'));
  const activation = readJsonRecordSafe(path.join(outputDir, 'public_activation_apply_result.json'));
  const recovery = readJsonRecordSafe(path.join(outputDir, 'image_recovery_status.json'));
  const stage03Summary = isRecord(stage03?.summary) ? stage03.summary : {};
  const qualitySummary = isRecord(quality?.summary) ? quality.summary : {};
  const totalVenues = Array.isArray(raw)
    ? raw.length
    : Array.isArray(seed?.venues)
      ? seed.venues.length
      : numberValue(qualitySummary.input);
  const selectedHeroes = Array.isArray(stage04?.selected_images) ? stage04.selected_images.length : 0;
  const imageCandidates = numberValue(stage03Summary.final_queue_size);
  const missingHeroes = Math.max(0, totalVenues - selectedHeroes);
  const ready = numberValue(qualitySummary.ready_for_db_staging) || numberValue(qualitySummary.auto_staged);
  const blocked = numberValue(qualitySummary.blocked);
  const recoveryDepth = numberValue(recovery?.max_images_per_venue);
  const sameRun = runState.batch_id === batchId;
  const running = Boolean(sameRun && runState.running);
  const failed = Boolean(sameRun && !runState.running && runState.exit_code !== undefined && runState.exit_code !== null && runState.exit_code !== 0);
  const issues: WorkflowIssue[] = [];

  if (failed) {
    issues.push({ severity: 'error', title: 'La ultima ejecucion fallo', detail: lastActionableLogLine(runState.log) || 'Open the technical log for details.' });
  }
  const zeroCandidateVenues = Array.isArray(stage03Summary.venues_with_zero_candidates) ? stage03Summary.venues_with_zero_candidates.length : 0;
  if (zeroCandidateVenues > 0) {
    issues.push({ severity: 'error', title: `${zeroCandidateVenues} venues have no image candidates`, detail: 'Run gallery recovery before review.' });
  }
  if (stage04 && missingHeroes > 0) {
    issues.push({ severity: 'warning', title: `${missingHeroes} venues todavia necesitan hero`, detail: `${selectedHeroes}/${totalVenues} venues tienen una imagen espacial seleccionada.` });
  }
  const blockerCounts = qualityBlockerCounts(quality);
  for (const [reason, count] of Object.entries(blockerCounts).slice(0, 4)) {
    if (reason === 'no_hero_image' && missingHeroes > 0) continue;
    issues.push({ severity: 'warning', title: `${count} blocked by ${humanizeCode(reason)}`, detail: 'This must be resolved before database staging.' });
  }

  const stepDefinitions = [
    { id: 'seed', label: 'Discover venues', done: Boolean(seed), detail: seed ? `${totalVenues} selected` : 'Waiting to start' },
    { id: 'data', label: 'Verify venue data', done: Array.isArray(raw), detail: Array.isArray(raw) ? `${totalVenues} records verified` : 'Pending' },
    { id: 'images', label: 'Find and classify images', done: Boolean(stage04), detail: stage04 ? `${selectedHeroes} heroes selected` : 'Pending' },
    { id: 'editorial', label: 'Generate editorial', done: Boolean(editorial), detail: editorial ? 'Editorial available' : 'Pending' },
    { id: 'quality', label: 'Quality gate', done: Boolean(quality), detail: quality ? `${ready} ready · ${blocked} blocked` : 'Pending' },
    { id: 'review', label: 'Human review', done: Boolean(reviewed), detail: reviewed ? 'Decisions saved' : approval ? 'Ready for review' : 'Pending' },
  ];
  const inferredStep = running ? inferRunningStep(runState.log) : '';
  const steps = stepDefinitions.map((step) => {
    let state: WorkflowStepState = step.done ? 'complete' : 'pending';
    if (running && step.id === inferredStep) state = 'running';
    if (step.id === 'images' && stage04 && missingHeroes > 0) state = 'warning';
    if (step.id === 'quality' && quality && blocked > 0) state = 'warning';
    if (failed && step.id === inferredStep) state = 'error';
    return { id: step.id, label: step.label, state, detail: step.detail };
  });
  const completedSteps = steps.filter((step) => step.state === 'complete').length;
  const progressPercent = running
    ? Math.max(8, Math.round(((completedSteps + 0.35) / steps.length) * 100))
    : Math.round((completedSteps / steps.length) * 100);

  let severity: WorkflowSeverity = 'neutral';
  let headline = 'Ready to create the next batch';
  let message = 'Choose a city, venue type, and neighborhoods. Korantis will number and track the batch automatically.';
  let nextAction: WorkflowSnapshot['next_action'] = {
    id: 'create_batch', label: 'Create next batch', description: 'Open the guided batch form.', tab: 'tab-create', paid_model: false,
  };

  if (running) {
    severity = 'running';
    headline = `Running ${humanizeCode(inferredStep || runState.action || 'pipeline')}`;
    message = `Batch ${batchId} is processing. You can leave this page open; Korantis will notify you when it finishes.`;
    nextAction = { id: 'wait', label: 'Processing…', description: 'No action is required.', tab: 'tab-operator', paid_model: false };
  } else if (failed) {
    severity = 'error';
    headline = 'The batch needs attention';
    message = issues[0]?.detail || 'The last process failed. Continue from the last valid artifact.';
    nextAction = { id: 'resume_batch', label: 'Retry from last safe step', description: 'Existing completed stages will be reused.', tab: 'tab-operator', paid_model: true };
  } else if (!seed) {
    nextAction = { id: 'create_batch', label: 'Create next batch', description: 'Open the guided batch form.', tab: 'tab-create', paid_model: false };
  } else if (!quality) {
    severity = 'warning';
    headline = 'Batch is incomplete';
    message = 'Continue from the last completed stage. Existing artifacts will not be repeated.';
    nextAction = { id: 'resume_batch', label: 'Continue batch', description: 'Run only the missing stages.', tab: 'tab-operator', paid_model: true };
  } else if (missingHeroes > 0 && !reviewed && recoveryDepth < 12) {
    severity = 'warning';
    const nextDepth = recoveryDepth < 2 ? 2 : recoveryDepth < 4 ? 4 : recoveryDepth < 8 ? 8 : 12;
    headline = recoveryDepth > 0
      ? `${ready} ready; deepen recovery for ${missingHeroes}`
      : 'Gallery recovery required';
    message = `${missingHeroes} of ${totalVenues} venues still need a usable hero. The next pass targets only those venues; completed editorial and heroes are preserved.`;
    nextAction = {
      id: nextDepth === 2 ? 'recover_batch_images' : nextDepth === 4 ? 'recover_batch_images_deep' : nextDepth === 8 ? 'recover_batch_images_exhaustive' : 'recover_batch_images_salvage',
      label: nextDepth === 2 ? 'Recover missing galleries' : nextDepth === 4 ? `Deep recovery for ${missingHeroes} venues` : nextDepth === 8 ? `Final recovery for ${missingHeroes} venues` : `Check last images for ${missingHeroes} venues`,
      description: `Scan up to ${nextDepth} candidates only for venues still missing a hero.`,
      tab: 'tab-operator',
      paid_model: true,
    };
  } else if (!reviewed) {
    severity = ready > 0 ? 'success' : 'warning';
    headline = ready > 0
      ? `${ready} venues listos${missingHeroes > 0 ? `; ${missingHeroes} bloqueados` : ''}`
      : 'Ningun venue supero el control de calidad';
    message = ready > 0
      ? `Continuar con los ${ready} venues validos. ${missingHeroes > 0 ? `${missingHeroes} quedan bloqueados y no avanzaran.` : 'No quedan bloqueos.'}`
      : 'Resolver los bloqueos indicados abajo.';
    nextAction = {
      id: 'open_review',
      label: `Revisar ${ready} venues listos`,
      description: missingHeroes > 0 ? `${missingHeroes} venues bloqueados quedan excluidos.` : 'Abrir la revision humana.',
      tab: 'tab-review',
      paid_model: false,
    };  } else if (activation) {
    severity = 'success';
    headline = 'Batch completed';
    message = 'The activation result exists. Run the catalog audit to verify production state.';
    nextAction = { id: 'audit', label: 'Audit published venues', description: 'Run a read-only production verification.', tab: 'tab-audit', paid_model: false };
  } else {
    severity = 'success';
    headline = 'Review decisions saved';
    message = 'The batch is ready for the explicitly confirmed publication workflow.';
    nextAction = { id: 'open_review', label: 'Continue publication review', description: 'No publication happens automatically.', tab: 'tab-review', paid_model: false };
  }

  return {
    batch_id: batchId,
    suggested_next_batch_id: suggestNextBatchId('Buenos Aires', 'restaurants', '50'),
    severity,
    headline,
    message,
    running,
    progress_percent: progressPercent,
    current_step: inferredStep || steps.find((step) => step.state === 'pending' || step.state === 'warning')?.id || 'complete',
    counts: { total_venues: totalVenues, image_candidates: imageCandidates, selected_heroes: selectedHeroes, missing_heroes: missingHeroes, ready, blocked },
    steps,
    issues,
    next_action: nextAction,
  };
}

function readJsonUnknown(filePath: string): unknown {
  if (!existsSync(filePath)) return null;
  try {
    return JSON.parse(readFileSync(filePath, 'utf8')) as unknown;
  } catch {
    return null;
  }
}

function readJsonRecordSafe(filePath: string): Record<string, unknown> | null {
  const value = readJsonUnknown(filePath);
  return isRecord(value) ? value : null;
}

function qualityBlockerCounts(quality: Record<string, unknown> | null): Record<string, number> {
  const counts: Record<string, number> = {};
  const candidates = Array.isArray(quality?.candidates) ? quality.candidates : [];
  for (const candidate of candidates) {
    if (!isRecord(candidate) || !Array.isArray(candidate.errors)) continue;
    for (const error of candidate.errors) {
      if (typeof error !== 'string') continue;
      counts[error] = (counts[error] || 0) + 1;
    }
  }
  return Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1]));
}

function inferRunningStep(log: string[]): string {
  const text = log.join('').toLowerCase();
  const markers: Array<[string, string]> = [
    ['stage 09', 'review'],
    ['approval manifest', 'review'],
    ['quality gate', 'quality'],
    ['stage 05', 'editorial'],
    ['connect summary', 'editorial'],
    ['stage 04', 'images'],
    ['stage 03', 'images'],
    ['stage 02', 'data'],
    ['stage 01', 'data'],
    ['stage 00', 'seed'],
  ];
  return markers.find(([marker]) => text.includes(marker))?.[1] || 'seed';
}

function lastActionableLogLine(log: string[]): string {
  return log
    .join('\n')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /error|failed|missing|invalid|blocked/i.test(line))
    .at(-1) || '';
}

function humanizeCode(value: string): string {
  return value.replace(/^\d+_/, '').replace(/[_-]+/g, ' ').trim();
}
function renderApp(): string {
  const batches = listBatches();
  const registry = readRegistry();
  const registeredBatch = typeof registry.latest_batch_id === 'string' ? registry.latest_batch_id : '';
  const defaultBatch = batches.some((batch) => batch.id === registeredBatch) ? registeredBatch : batches[0]?.id || '';
  const data = JSON.stringify({
    defaultBatch,
    suggestedBatch: suggestNextBatchId('Buenos Aires', 'restaurants', '50'),
    cityNeighborhoods: CITY_NEIGHBORHOODS,
  }).replace(/</g, '\\u003c');
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
    .neighborhood-picker { position: relative; }
    .neighborhood-picker > summary { width: 100%; min-height: 42px; display: flex; align-items: center; justify-content: space-between; background: var(--ink); color: var(--text); border: 1px solid var(--line); border-radius: 6px; padding: 10px 12px; font-size: 14px; }
    .neighborhood-picker > summary::-webkit-details-marker { display: none; }
    .neighborhood-picker > summary::after { content: "⌄"; color: var(--muted); font-size: 18px; line-height: 1; }
    .neighborhood-picker[open] > summary { border-color: var(--blue); border-radius: 6px 6px 0 0; }
    .neighborhood-picker[open] > summary::after { transform: rotate(180deg); }
    .neighborhood-menu { border: 1px solid var(--blue); border-top: 0; border-radius: 0 0 8px 8px; background: #090b09; padding: 10px; }
    .neighborhood-actions { display: flex; gap: 8px; padding-bottom: 8px; border-bottom: 1px solid var(--line); margin-bottom: 6px; }
    .neighborhood-actions button { padding: 6px 10px; font-size: 12px; }
    .neighborhood-options { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 2px 12px; max-height: 260px; overflow-y: auto; padding-top: 4px; }
    .neighborhood-option { display: flex; align-items: center; gap: 9px; color: var(--text); padding: 8px; margin: 0; border-radius: 5px; cursor: pointer; }
    .neighborhood-option:hover { background: var(--panel-2); }
    .neighborhood-option input { width: 16px; height: 16px; margin: 0; accent-color: var(--blue); }
    .neighborhood-option span { font-size: 13px; }
    .field-help { color: var(--muted); font-size: 12px; margin-top: 7px; }
    
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
    
    .main { padding: 36px 42px; }
    .tab-content { max-width: 1040px; width: 100%; }
    .mission-card { position: relative; overflow: hidden; padding: 30px; border-radius: 18px; border: 1px solid var(--line); background: linear-gradient(145deg, #1a1d17 0%, #10120f 72%); box-shadow: 0 24px 80px rgba(0,0,0,.22); }
    .mission-card::before { content: ""; position: absolute; inset: 0 auto 0 0; width: 4px; background: var(--muted); }
    .mission-card[data-severity="running"]::before { background: var(--blue); }
    .mission-card[data-severity="success"]::before { background: var(--green); }
    .mission-card[data-severity="warning"]::before { background: var(--gold); }
    .mission-card[data-severity="error"]::before { background: var(--red); }
    .mission-kicker { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 28px; }
    .batch-identity { color: var(--blue); font: 600 12px/1.2 Consolas, monospace; letter-spacing: .08em; text-transform: uppercase; }
    .batch-select-compact { width: auto; min-width: 280px; padding: 8px 34px 8px 10px; font-size: 12px; }
    .mission-card h2 { max-width: 720px; margin: 0; font: 500 clamp(28px, 4vw, 46px)/1.02 Georgia, serif; letter-spacing: -.035em; }
    .mission-message { max-width: 720px; color: var(--muted); font-size: 15px; line-height: 1.6; margin: 14px 0 26px; }
    .progress-track { height: 7px; overflow: hidden; border-radius: 999px; background: #080908; border: 1px solid #272a23; }
    .progress-fill { width: 0; height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--blue), #b9d8ee); transition: width .5s ease; }
    .progress-meta { display: flex; justify-content: space-between; color: var(--muted); font: 11px/1.4 Consolas, monospace; margin-top: 8px; }
    .metric-grid { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 10px; margin: 24px 0; }
    .metric { padding: 14px; border: 1px solid var(--line); border-radius: 11px; background: rgba(4,5,4,.42); }
    .metric strong { display: block; font: 500 25px/1 Georgia, serif; }
    .metric span { display: block; margin-top: 7px; color: var(--muted); font-size: 11px; }
    .primary-action { min-height: 46px; padding-inline: 20px; }
    .action-note { align-self: center; color: var(--muted); font-size: 12px; max-width: 430px; }
    .workflow-section { margin-top: 24px; }
    .section-label { margin: 0 0 12px; color: var(--muted); font: 600 11px/1 Consolas, monospace; letter-spacing: .12em; text-transform: uppercase; }
    .workflow-steps { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 10px; }
    .workflow-step { position: relative; min-height: 92px; padding: 15px 15px 14px 18px; border: 1px solid var(--line); border-radius: 11px; background: var(--panel); }
    .workflow-step::before { content: ""; position: absolute; left: 0; top: 14px; bottom: 14px; width: 3px; border-radius: 4px; background: #3b3f36; }
    .workflow-step[data-state="complete"]::before { background: var(--green); }
    .workflow-step[data-state="running"]::before { background: var(--blue); animation: pulse 1.2s infinite; }
    .workflow-step[data-state="warning"]::before { background: var(--gold); }
    .workflow-step[data-state="error"]::before { background: var(--red); }
    .workflow-step b { display: block; font-size: 13px; }
    .workflow-step span { display: block; color: var(--muted); font-size: 11px; margin-top: 7px; line-height: 1.4; }
    .issue-list { display: grid; gap: 8px; }
    .issue-row { display: grid; grid-template-columns: 22px 1fr; gap: 10px; padding: 13px 14px; border: 1px solid rgba(212,179,95,.28); border-radius: 10px; background: rgba(212,179,95,.07); }
    .issue-row[data-severity="error"] { border-color: rgba(239,125,115,.3); background: rgba(239,125,115,.07); }
    .issue-icon { color: var(--gold); font-weight: 700; }
    .issue-row[data-severity="error"] .issue-icon { color: var(--red); }
    .issue-row b { display: block; font-size: 13px; }
    .issue-row span { display: block; color: var(--muted); font-size: 11px; margin-top: 3px; }
    .empty-issues { padding: 14px; border: 1px solid rgba(111,207,143,.25); border-radius: 10px; color: #bfe5c9; background: rgba(111,207,143,.06); font-size: 13px; }
    .batch-preview { padding: 14px 16px; border: 1px solid rgba(127,179,232,.35); border-radius: 10px; background: rgba(127,179,232,.06); }
    .batch-preview b { display: block; color: var(--blue); font: 600 13px/1.4 Consolas, monospace; overflow-wrap: anywhere; }
    .batch-preview span { display: block; color: var(--muted); font-size: 11px; margin-top: 5px; }
    .right-panel { width: 310px; background: #0a0c0a; }
    .activity-summary { padding: 22px 18px; border-bottom: 1px solid var(--line); }
    .activity-summary h3 { margin: 0 0 8px; font: 500 20px/1.1 Georgia, serif; }
    .activity-summary p { color: var(--muted); font-size: 12px; line-height: 1.5; margin: 0; }
    .technical-log { padding: 14px 16px; }
    .technical-log details { width: 100%; }
    .technical-log summary { display: flex; width: 100%; justify-content: space-between; }
    .console { display: none; margin-top: 12px; max-height: 62vh; min-height: 260px; border: 1px solid var(--line); border-radius: 8px; }
    .technical-log details[open] .console { display: block; }
    .toast { position: fixed; z-index: 20; right: 24px; bottom: 24px; max-width: 390px; padding: 15px 18px; border: 1px solid var(--line); border-radius: 12px; background: #20231d; box-shadow: 0 18px 50px rgba(0,0,0,.45); transform: translateY(24px); opacity: 0; pointer-events: none; transition: .25s ease; }
    .toast.visible { transform: translateY(0); opacity: 1; }
    .toast.error { border-color: rgba(239,125,115,.6); }
    .toast b { display: block; font-size: 13px; }
    .toast span { display: block; color: var(--muted); font-size: 12px; margin-top: 4px; }
    @media (max-width: 1180px) { .right-panel { display: none; } .main { padding: 28px; } }
    @media (max-width: 780px) { .sidebar { width: 72px; } .nav-item { padding: 14px 9px; font-size: 0; } .nav-item::first-letter { font-size: 14px; } .main { padding: 18px; } .mission-kicker { align-items: flex-start; flex-direction: column; } .batch-select-compact { width: 100%; min-width: 0; } .metric-grid { grid-template-columns: repeat(2,1fr); } .workflow-steps { grid-template-columns: 1fr; } }  </style>
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
      <div class="nav-item active" data-tab="tab-operator" onclick="switchTab('tab-operator')">Panel operativo</div>
      <div class="nav-item" data-tab="tab-create" onclick="switchTab('tab-create')">Crear venues</div>
      <div class="nav-item" data-tab="tab-improve" onclick="switchTab('tab-improve')">Mejorar galerías</div>
      <div class="nav-item" data-tab="tab-review" onclick="switchTab('tab-review')">Revisar y publicar</div>
      <div class="nav-item" data-tab="tab-audit" onclick="switchTab('tab-audit')">Auditoria</div>
    </div>
    
    <div class="main">
      <!-- Panel operativo Tab -->
      <div id="tab-operator" class="tab-content active">
        <section class="mission-card" id="missionCard" data-severity="neutral">
          <div class="mission-kicker">
            <div>
              <div class="batch-identity" id="activeBatchIdentity">Sin batch activo</div>
            </div>
            <select id="operatorBatchSelector" class="batch-select-compact" onchange="syncBatchFromOperator()"></select>
          </div>
          <h2 id="workflowHeadline">Loading workflow…</h2>
          <p class="mission-message" id="workflowMessage">Leyendo el estado del batch.</p>
          <div class="progress-track"><div class="progress-fill" id="workflowProgressFill"></div></div>
          <div class="progress-meta"><span id="workflowCurrentStep">Preparando estado</span><span id="workflowProgressText">0%</span></div>
          <div class="metric-grid">
            <div class="metric"><strong id="metricVenues">0</strong><span>venues</span></div>
            <div class="metric"><strong id="metricHeroes">0</strong><span>heroes seleccionados</span></div>
            <div class="metric"><strong id="metricReady">0</strong><span>listos para revisar</span></div>
            <div class="metric"><strong id="metricBlocked">0</strong><span>bloqueados</span></div>
          </div>
          <div class="btn-row">
            <button class="primary primary-action" id="workflowNextButton" onclick="runWorkflowNextAction()">Loading…</button>
            <span class="action-note" id="workflowNextDescription">Korantis determinará el próximo paso seguro.</span>
          </div>
        </section>

        <section class="workflow-section">
          <p class="section-label">Progreso del pipeline</p>
          <div class="workflow-steps" id="workflowSteps"></div>
        </section>

        <section class="workflow-section">
          <p class="section-label">Requiere atención</p>
          <div class="issue-list" id="workflowIssues"><div class="empty-issues">Checking batch health…</div></div>
        </section>

        <details class="workflow-section">
          <summary>Reporte técnico detallado</summary>
          <div style="padding-top: 14px;">
            <div class="btn-row" style="margin: 0 0 12px;">
              <button onclick="runOperatorAction('operator_status')">Actualizar reporte</button>
              <button onclick="loadOperatorDashboard()">Abrir reporte</button>
            </div>
            <iframe id="operatorDashboardFrame" class="operator-dashboard-frame"></iframe>
          </div>
        </details>
      </div>
      <!-- Crear venues Tab -->
      <div id="tab-create" class="tab-content">
        <div class="card">
          <h2>Crear nuevo batch de venues</h2>
          <p>Un solo flujo: Google descubre candidatos, la IA descarta venues con fotos inservibles, selecciona los mejores y deja el batch listo para revisión. No publica automáticamente.</p>
          <div class="batch-preview" style="margin-bottom: 20px;"><b id="createBatchPreview">Calculating next batch…</b><span>El nombre y la numeración se asignan automáticamente.</span></div>
          
          <div class="form-group">
            <label>Ciudad</label>
            <select id="createCity" onchange="renderCreateNeighborhoods(); updateBatchSuggestion()">
              <option value="Buenos Aires">Buenos Aires</option>
              <option value="Córdoba, Argentina">Córdoba Capital, Argentina</option>
              <option value="New York City">New York City</option>
              <option value="Dubai">Dubai</option>
            </select>
          </div>
          
          <div class="form-group" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div>
              <label>Tipo</label>
              <select id="createType" onchange="updateBatchSuggestion()">
                <option value="bars">Bars</option>
                <option value="cafes">Cafes</option>
                <option value="restaurants">Restaurants</option>
              </select>
            </div>
            <div>
              <label>Cantidad</label>
              <input type="number" id="createCount" value="50" min="1" max="200" oninput="updateBatchSuggestion()">
            </div>
          </div>
          
          <div class="form-group">
            <label>Barrios</label>
            <details class="neighborhood-picker" id="createNeighborhoodPicker">
              <summary><span id="createNeighborhoodSummary">Select neighborhoods</span></summary>
              <div class="neighborhood-menu">
                <div class="neighborhood-actions">
                  <button type="button" onclick="setAllCreateNeighborhoods(true)">Select all</button>
                  <button type="button" onclick="setAllCreateNeighborhoods(false)">Clear</button>
                </div>
                <div class="neighborhood-options" id="createNeighborhoodOptions"></div>
              </div>
            </details>
            <div class="field-help">Elegí uno o más barrios para este batch.</div>
          </div>
          
          <div class="btn-row">
            <button onclick="runBatchPlan()">Estimar sin ejecutar</button>
            <button class="primary" onclick="runBatchToReview()">Crear con selección IA</button>
          </div>
        </div>
      </div>
      
      <!-- Mejorar galerías Tab -->
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
                <label>Ciudad</label>
                <select id="improveCity">
                  <option value="Buenos Aires">Buenos Aires</option>
                  <option value="Córdoba, Argentina">Córdoba Capital, Argentina</option>
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
    
    <aside class="right-panel">
      <div class="activity-summary">
        <p class="section-label">Actividad actual</p>
        <h3 id="activityTitle">Sistema listo</h3>
        <p id="activityMessage">Continuá el batch actual o creá el siguiente.</p>
      </div>
      <div class="technical-log">
        <details>
          <summary>Log técnico <span>opcional</span></summary>
          <div class="console" id="console">Sistema listo.</div>
        </details>
      </div>
    </aside>  </div>

  <div class="toast" id="toast"><b id="toastTitle"></b><span id="toastMessage"></span></div>

  <script>
    const bootData = ${data};
    let currentWorkflow = { status: 'idle', batch_id: bootData.defaultBatch, enrichment_id: '' };
    let wasRunning = false;
    let galleryManifest = null;
    let galleryDecisions = new Map();
    let workflowSnapshot = null;
    let completionNotificationKey = '';
    
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
          showToast('No se pudo iniciar la acción', data.error || 'Unknown error', true);
          return null;
        }
        requestCompletionNotifications();
        return data;
      } catch (err) {
        showToast('Error de conexión del dashboard', err.message, true);
        return null;
      }
    }

    function showToast(title, message, isError = false) {
      const toast = document.getElementById('toast');
      document.getElementById('toastTitle').textContent = title;
      document.getElementById('toastMessage').textContent = message;
      toast.className = 'toast visible' + (isError ? ' error' : '');
      clearTimeout(showToast.timer);
      showToast.timer = setTimeout(() => { toast.className = 'toast'; }, 6500);
    }

    function requestCompletionNotifications() {
      if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission().catch(() => {});
    }

    function notifyCompletion(ok, batchId) {
      const title = ok ? 'El batch de Korantis terminó' : 'El batch requiere atención';
      const message = ok ? batchId + ' terminó. El próximo paso está listo.' : batchId + ' se detuvo con un error. Abrí el dashboard para recuperarlo.';
      showToast(title, message, !ok);
      document.title = (ok ? 'Complete · ' : 'Attention · ') + batchId;
      if ('Notification' in window && Notification.permission === 'granted') new Notification(title, { body: message });
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
      loadWorkflowState();
      refreshArtifacts();
    }

    async function loadWorkflowState() {
      const batch = selectedOperatorBatch();
      if (!batch) return;
      try {
        const res = await fetch('/api/workflow-state?batch=' + encodeURIComponent(batch) + '&ts=' + Date.now());
        if (!res.ok) return;
        workflowSnapshot = await res.json();
        renderWorkflowState(workflowSnapshot);
      } catch {
        // The polling loop will retry.
      }
    }

    function renderWorkflowState(snapshot) {
      const card = document.getElementById('missionCard');
      card.dataset.severity = snapshot.severity;
      document.getElementById('activeBatchIdentity').textContent = snapshot.batch_id || 'Sin batch activo';
      document.getElementById('workflowHeadline').textContent = snapshot.headline;
      document.getElementById('workflowMessage').textContent = snapshot.message;
      document.getElementById('workflowProgressFill').style.width = snapshot.progress_percent + '%';
      document.getElementById('workflowProgressText').textContent = snapshot.progress_percent + '%';
      document.getElementById('workflowCurrentStep').textContent = snapshot.running ? 'Ahora: ' + humanizeLabel(snapshot.current_step) : 'Estado: ' + snapshot.severity;
      document.getElementById('metricVenues').textContent = snapshot.counts.total_venues;
      document.getElementById('metricHeroes').textContent = snapshot.counts.selected_heroes;
      document.getElementById('metricReady').textContent = snapshot.counts.ready;
      document.getElementById('metricBlocked').textContent = snapshot.counts.blocked;
      const nextButton = document.getElementById('workflowNextButton');
      nextButton.textContent = snapshot.next_action.label;
      nextButton.disabled = snapshot.next_action.id === 'wait';
      document.getElementById('workflowNextDescription').textContent = snapshot.next_action.description;
      document.getElementById('activityTitle').textContent = snapshot.headline;
      document.getElementById('activityMessage').textContent = snapshot.message;
      document.getElementById('workflowSteps').innerHTML = snapshot.steps.map((step, index) =>
        '<div class="workflow-step" data-state="' + escapeHtml(step.state) + '"><b>' + (index + 1) + '. ' + escapeHtml(step.label) + '</b><span>' + escapeHtml(step.detail) + '</span></div>'
      ).join('');
      document.getElementById('workflowIssues').innerHTML = snapshot.issues.length
        ? snapshot.issues.map(issue => '<div class="issue-row" data-severity="' + escapeHtml(issue.severity) + '"><div class="issue-icon">!</div><div><b>' + escapeHtml(issue.title) + '</b><span>' + escapeHtml(issue.detail) + '</span></div></div>').join('')
        : '<div class="empty-issues">No se detectaron errores que requieran acción.</div>';
      document.title = snapshot.running ? 'Running · ' + snapshot.batch_id : 'Korantis Operations · ' + snapshot.batch_id;
    }

    function humanizeLabel(value) {
      return String(value || '').replace(/[_-]+/g, ' ').replace(/^\\w/, char => char.toUpperCase());
    }

    async function runWorkflowNextAction() {
      if (!workflowSnapshot) return;
      const next = workflowSnapshot.next_action;
      if (next.id === 'wait') return;
      if (next.id === 'create_batch') return switchTab('tab-create');
      if (next.id === 'open_review') {
        switchTab('tab-review');
        return loadReviewDashboard();
      }
      if (next.id === 'audit') {
        switchTab('tab-audit');
        return;
      }
      if (next.paid_model) {
        const accepted = confirm(next.label + '\\n\\n' + next.description + '\\n\\nEsta acción puede usar llamadas pagas de modelos. El trabajo terminado se reutiliza. ¿Continuar?');
        if (!accepted) return;
      }
      const result = await apiCall('/api/run', {
        action: next.id,
        batch_id: workflowSnapshot.batch_id,
        confirm: next.paid_model ? 'RUN MODELS' : ''
      });
      if (result) {
        showToast('Workflow iniciado', next.label + ' · ' + workflowSnapshot.batch_id);
        wasRunning = true;
        await pollState();
      }
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
    function slugPart(value) {
      return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
    }

    function renderCreateNeighborhoods() {
      const city = document.getElementById('createCity').value;
      const neighborhoods = bootData.cityNeighborhoods[city] || [];
      const options = document.getElementById('createNeighborhoodOptions');
      options.innerHTML = neighborhoods.map(neighborhood =>
        '<label class="neighborhood-option"><input type="checkbox" value="' + escapeHtml(neighborhood) + '" checked onchange="updateCreateNeighborhoodSummary()"><span>' + escapeHtml(neighborhood) + '</span></label>'
      ).join('');
      updateCreateNeighborhoodSummary();
    }

    function selectedCreateNeighborhoods() {
      return Array.from(document.querySelectorAll('#createNeighborhoodOptions input:checked')).map(input => input.value);
    }

    function updateCreateNeighborhoodSummary() {
      const selected = selectedCreateNeighborhoods();
      const total = document.querySelectorAll('#createNeighborhoodOptions input').length;
      const summary = document.getElementById('createNeighborhoodSummary');
      if (selected.length === 0) summary.textContent = 'No neighborhoods selected';
      else if (selected.length === total) summary.textContent = 'All neighborhoods (' + total + ')';
      else summary.textContent = selected.length + ' selected · ' + selected.slice(0, 2).join(', ') + (selected.length > 2 ? '…' : '');
    }

    function setAllCreateNeighborhoods(checked) {
      document.querySelectorAll('#createNeighborhoodOptions input').forEach(input => { input.checked = checked; });
      updateCreateNeighborhoodSummary();
    }

    function getSelectedCreateNeighborhoods() {
      const selected = selectedCreateNeighborhoods();
      if (selected.length === 0) {
        alert('Select at least one neighborhood.');
        return '';
      }
      return selected.join(',');
    }

    async function updateBatchSuggestion() {
      const city = document.getElementById('createCity').value;
      const type = document.getElementById('createType').value;
      const count = document.getElementById('createCount').value;
      try {
        const res = await fetch('/api/next-batch-id?city=' + encodeURIComponent(city) + '&type=' + encodeURIComponent(type) + '&count=' + encodeURIComponent(count));
        const data = await res.json();
        const preview = document.getElementById('createBatchPreview');
        preview.textContent = data.batch_id;
        preview.dataset.batchId = data.batch_id;
      } catch {
        document.getElementById('createBatchPreview').textContent = bootData.suggestedBatch;
      }
    }

    async function startConfiguredBatch(planOnly) {
      const city = document.getElementById('createCity').value;
      const count = document.getElementById('createCount').value;
      const type = document.getElementById('createType').value;
      const neighborhoods = getSelectedCreateNeighborhoods();
      if (!neighborhoods) return;
      const preview = document.getElementById('createBatchPreview');
      const result = await apiCall(planOnly ? '/api/venue-batches/plan' : '/api/venue-batches/run-to-review', {
        new_batch_id: preview.dataset.batchId || '',
        city, count, batch_type: type, neighborhoods, confirm: planOnly ? '' : 'RUN MODELS'
      });
      if (!result) return;
      currentWorkflow.batch_id = result.batch_id;
      showToast(planOnly ? 'Batch plan started' : 'Batch started', result.batch_id);
      wasRunning = true;
      await loadBatches(result.batch_id);
      switchTab('tab-operator');
      await pollState();
    }

    function runBatchPlan() {
      return startConfiguredBatch(true);
    }

    function runBatchToReview() {
      return startConfiguredBatch(false);
    }
    // Improve Flow
    function getEnrichmentId() {
      const city = slugPart(document.getElementById('improveCity').value);
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
        if (rs.batch_id && rs.batch_id !== 'default_batch' && rs.action && !String(rs.action).includes('enrichment')) {
          currentWorkflow.batch_id = rs.batch_id;
          ensureBatchOption(rs.batch_id);
        }

        const badge = document.getElementById('workflowStatusBadge');
        const badgeText = document.getElementById('workflowStatusText');
        if (rs.running) {
          badge.className = 'status-badge running';
          badgeText.textContent = 'Running';
          wasRunning = true;
          const consoleEl = document.getElementById('console');
          if (rs.log && rs.log.length > 0) {
            consoleEl.textContent = rs.log.join('');
            consoleEl.scrollTop = consoleEl.scrollHeight;
          }
        } else {
          const ok = rs.exit_code === 0;
          badge.className = 'status-badge ' + (rs.finished_at ? (ok ? 'idle' : 'running') : 'idle');
          badgeText.textContent = rs.finished_at ? (ok ? 'Complete' : 'Attention') : 'Ready';
          if (wasRunning) {
            wasRunning = false;
            const key = String(rs.finished_at || Date.now());
            if (completionNotificationKey !== key) {
              completionNotificationKey = key;
              notifyCompletion(ok, rs.batch_id || currentWorkflow.batch_id);
            }
            await loadBatches(rs.batch_id || currentWorkflow.batch_id);
            refreshArtifacts();
            updateBatchSuggestion();
            if (String(rs.action || '').includes('enrichment')) {
              loadGalleryReviewDashboard();
              loadGalleryPreviewReport();
            }
          }
        }
        await loadWorkflowState();
      } catch {
        document.getElementById('activityTitle').textContent = 'Dashboard connection interrupted';
        document.getElementById('activityMessage').textContent = 'Korantis will retry automatically.';
      }
    }

    function ensureBatchOption(batchId) {
      for (const selectorId of ['batchSelector', 'operatorBatchSelector']) {
        const selector = document.getElementById(selectorId);
        if (!selector || Array.from(selector.options).some(option => option.value === batchId)) continue;
        selector.add(new Option(batchId + ' (running)', batchId), 0);
        selector.value = batchId;
      }
    }

    async function loadBatches(preferredBatch = '') {
      const res = await fetch('/api/batches');
      const data = await res.json();
      const sel = document.getElementById('batchSelector');
      const operatorSel = document.getElementById('operatorBatchSelector');
      const target = preferredBatch || currentWorkflow.batch_id || bootData.defaultBatch;
      const options = data.batch_items.map(b => '<option value="' + b.id + '">' + b.label + '</option>').join('');
      sel.innerHTML = options;
      operatorSel.innerHTML = options;
      if (target && !data.batch_items.some(item => item.id === target)) ensureBatchOption(target);
      sel.value = target;
      operatorSel.value = target;
      currentWorkflow.batch_id = target;
      refreshArtifacts();
      loadWorkflowState();
      const workflowsRes = await fetch('/api/workflows');
      const workflows = await workflowsRes.json();
      if (workflows.latest_enrichment_run_id) {
        currentWorkflow.enrichment_id = workflows.latest_enrichment_run_id;
        document.getElementById('legacyEnrichmentId').value = workflows.latest_enrichment_run_id;
        document.getElementById('visibleEnrichmentId').value = workflows.latest_enrichment_run_id;
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
    
    window.addEventListener('message', event => {
      if (event.origin !== window.location.origin || event.data?.type !== 'publication-review-saved') return;
      showToast('Decisiones guardadas', event.data.result.approved + ' aprobados / ' + event.data.result.paused + ' pausados');
      loadWorkflowState();
      refreshArtifacts();
    });

    // Init
    renderCreateNeighborhoods();
    updateBatchSuggestion();
    loadBatches().then(pollState);
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
