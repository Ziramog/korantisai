import { createServer, type IncomingMessage, type ServerResponse } from 'http';
import { spawn, type ChildProcessWithoutNullStreams } from 'child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
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

const COMMANDS: Record<string, CommandDefinition> = {
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
  if (request.method === 'POST' && url.pathname === '/api/run') return runAction(request, response);
  writeJson(response, 404, { error: 'not_found' });
}

async function runAction(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const body = await readRequestJson(request);
  const batchId = stringField(body, 'batch_id');
  const action = stringField(body, 'action');
  const confirm = stringField(body, 'confirm');
  const command = COMMANDS[action];
  if (!command) return writeJson(response, 400, { error: `Unknown action: ${action}` });
  if (runState.running) return writeJson(response, 409, { error: 'A command is already running.' });
  if ((command.danger === 'writes_cloudinary' || command.danger === 'writes_hidden_public' || command.danger === 'publishes_public') && confirm !== 'RUN') {
    return writeJson(response, 400, { error: 'Confirmation RUN is required for this action.' });
  }

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
    activeProcess = null;
  });
  activeProcess.on('close', (code) => {
    appendLog(`\n[exit ${code ?? 'unknown'}]`);
    runState.running = false;
    runState.finished_at = new Date().toISOString();
    runState.exit_code = code;
    activeProcess = null;
  });

  writeJson(response, 202, { started: true, action, batch_id: batchId });
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

function artifactList(): Array<{ label: string; file: string; kind: 'html' | 'json' | 'markdown' }> {
  return [
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

function renderApp(): string {
  const batches = listBatches();
  const data = JSON.stringify({ defaultBatch: batches[0]?.id || 'batch_004_buenos_aires_50' }).replace(/</g, '\\u003c');
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Korantis Command Center</title>
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
    }
    * { box-sizing: border-box; }
    body { margin: 0; background: linear-gradient(135deg, #0d0f0d 0%, #121611 48%, #0b0b0a 100%); color: var(--text); font-family: "Aptos", "Segoe UI", sans-serif; }
    header { height: 72px; display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 0 18px; border-bottom: 1px solid var(--line); background: rgba(13,15,13,.94); position: sticky; top: 0; z-index: 4; }
    .header-actions { display: flex; align-items: end; gap: 6px; min-width: 0; }
    h1, h2, h3, p { margin: 0; }
    h1 { font-size: 19px; letter-spacing: .01em; }
    select, button, input { font: inherit; }
    select, input { background: var(--ink); color: var(--text); border: 1px solid var(--line); border-radius: 6px; padding: 8px 10px; }
    button { background: var(--panel-2); color: var(--text); border: 1px solid var(--line); border-radius: 6px; padding: 8px 10px; cursor: pointer; }
    button:hover { border-color: var(--blue); }
    button.danger { border-color: rgba(239,125,115,.55); color: #ffd1cc; }
    button.write { border-color: rgba(212,179,95,.55); color: #ffe1a0; }
    .layout { display: grid; grid-template-columns: 260px minmax(640px, 1fr) 380px; min-height: calc(100vh - 72px); }
    aside, .main, .right { border-right: 1px solid var(--line); padding: 16px; overflow: auto; }
    .right { border-right: 0; }
    .muted { color: var(--muted); }
    .panel { background: rgba(23,25,21,.86); border: 1px solid var(--line); border-radius: 8px; padding: 12px; margin-bottom: 12px; }
    .stats { display: grid; grid-template-columns: repeat(4, minmax(120px, 1fr)); gap: 10px; }
    .stat strong { display: block; font-size: 27px; margin-top: 5px; }
    .ok { color: var(--green); }
    .bad { color: var(--red); }
    .warn { color: var(--gold); }
    .tabs { display: flex; gap: 8px; margin-bottom: 10px; flex-wrap: wrap; }
    .tabs button.active { background: var(--text); color: var(--ink); }
    .artifact-toolbar { display: none; gap: 8px; margin-bottom: 10px; }
    .artifact-toolbar.visible { display: flex; }
    .artifact { width: 100%; min-height: calc(100vh - 205px); border: 1px solid var(--line); background: #0b0c0b; color: #e8e4d7; border-radius: 8px; padding: 12px; overflow: auto; white-space: pre-wrap; }
    iframe.artifact { padding: 0; white-space: normal; }
    .command { display: grid; gap: 8px; border-bottom: 1px solid rgba(255,255,255,.07); padding: 10px 0; }
    .command:last-child { border-bottom: 0; }
    .batch-form { display: grid; gap: 9px; }
    .batch-form label { display: grid; gap: 4px; color: var(--muted); font-size: 12px; }
    .batch-form input { width: 100%; }
    .check-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; }
    .check-grid label { display: flex; align-items: center; gap: 6px; min-height: 30px; padding: 6px 8px; background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.08); border-radius: 6px; color: var(--text); font-size: 12px; }
    .check-grid input { width: auto; accent-color: var(--gold); }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .console { height: 360px; overflow: auto; background: #050605; border: 1px solid var(--line); border-radius: 8px; padding: 12px; font: 12px/1.45 Consolas, monospace; white-space: pre-wrap; color: #d7f5d7; }
    .file-row { display: flex; justify-content: space-between; gap: 10px; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,.07); }
    .file-row button { padding: 4px 7px; }
    .batch-picker { display: grid; gap: 3px; width: min(520px, 42vw); min-width: 280px; }
    .batch-picker span { font-size: 11px; color: var(--muted); }
    .batch-picker select { width: 100%; min-width: 0; }
    @media (max-width: 1100px) { .layout { grid-template-columns: 1fr; } aside, .main, .right { border-right: 0; border-bottom: 1px solid var(--line); } .stats { grid-template-columns: repeat(2, 1fr); } }
  </style>
</head>
<body>
  <header>
    <div>
      <p class="muted">Korantis</p>
      <h1>Pipeline Command Center</h1>
    </div>
    <div class="header-actions">
      <label class="batch-picker"><span>Viewing batch</span><select id="batch"></select></label>
      <button onclick="refresh()">Refresh</button>
      <button onclick="openManual()">Manual</button>
    </div>
  </header>
  <div class="layout">
    <aside>
      <div class="panel">
        <h2>Run State</h2>
        <p id="runState" class="muted">idle</p>
      </div>
      <div class="panel">
        <h2>Files</h2>
        <div id="files"></div>
      </div>
    </aside>
    <section class="main">
      <div class="stats" id="stats"></div>
      <div class="panel">
        <div class="tabs" id="artifactTabs"></div>
        <div class="artifact-toolbar" id="artifactToolbar">
          <button onclick="openArtifactFullScreen()">Open review full screen</button>
        </div>
        <div id="artifactHost" class="artifact">Select an artifact.</div>
      </div>
    </section>
    <section class="right">
      <div class="panel">
        <h2>New Batch</h2>
        <div class="batch-form">
          <label>Batch id<input id="newBatchId" value="batch_005_buenos_aires_restaurants_50" oninput="this.dataset.touched=this.value.trim() ? 'true' : ''"></label>
          <label>City<select id="newCity" onchange="syncCityDefaults()">
            <option value="Buenos Aires">Buenos Aires</option>
            <option value="New York City">New York</option>
            <option value="Dubai">Dubai</option>
          </select></label>
          <label>Count<input id="newCount" value="50" oninput="syncBatchTypeDefaults()"></label>
          <label>Batch type<select id="newBatchType" onchange="syncBatchTypeDefaults()">
            <option value="bars">Bars</option>
            <option value="cafes">Cafes</option>
            <option value="restaurants">Restaurants</option>
          </select></label>
          <p class="muted" id="batchTypeHelp">Bars includes cocktail, speakeasy, wine, neighborhood bars, and a small rooftop/terrace slice.</p>
          <label>Neighborhoods</label>
          <div class="check-grid" id="newNeighborhoods"></div>
          <div class="form-row">
            <button onclick="runConfiguredBatch('custom_batch_plan')">Plan</button>
            <button onclick="runConfiguredBatch('custom_batch_run')">Run</button>
          </div>
        </div>
      </div>
      <div class="panel">
        <h2>Actions</h2>
        <div id="commands"></div>
      </div>
      <div class="panel">
        <h2>Console</h2>
        <div id="console" class="console"></div>
      </div>
    </section>
  </div>
  <script>
    const boot = ${data};
    const cityConfigs = {
      'Buenos Aires': {
        slug: 'buenos_aires',
        neighborhoods: ['Palermo', 'Chacarita', 'Villa Crespo', 'Colegiales', 'Recoleta', 'San Telmo'],
      },
      'New York City': {
        slug: 'new_york',
        neighborhoods: ['Williamsburg', 'DUMBO', 'Lower East Side', 'NoMad', 'Chelsea', 'West Village'],
      },
      Dubai: {
        slug: 'dubai',
        neighborhoods: ['DIFC', 'Downtown Dubai', 'Jumeirah', 'Dubai Marina', 'Palm Jumeirah', 'Business Bay'],
      },
    };
    let status = null;
    let selectedArtifact = null;
    let lastObservedFinish = '';
    let batchItems = [];
    let pendingBatchSelection = '';

    async function init() {
      await loadBatchList(boot.defaultBatch);
      await refresh();
      renderNeighborhoodChecks();
      syncBatchTypeDefaults();
      setInterval(pollRunState, 1500);
    }

    async function loadBatchList(preferredBatch) {
      const batches = await (await fetch('/api/batches')).json();
      batchItems = batches.batch_items || batches.batches.map(b => ({ id: b, label: b }));
      const select = document.getElementById('batch');
      const ids = batchItems.map(b => b.id);
      const current = preferredBatch || select.value || boot.defaultBatch;
      select.innerHTML = batchItems.map(b => '<option value="' + b.id + '">' + b.label + '</option>').join('');
      select.value = ids.includes(current) ? current : (ids.includes(boot.defaultBatch) ? boot.defaultBatch : ids[0]);
      select.onchange = () => { selectedArtifact = null; refresh(); };
    }

    async function refresh() {
      const batch = document.getElementById('batch').value;
      status = await (await fetch('/api/status?batch=' + encodeURIComponent(batch))).json();
      if (!selectedArtifact || !status.artifacts.some(a => a.file === selectedArtifact && a.exists)) {
        selectedArtifact = status.artifacts.find(a => a.exists)?.file;
      }
      render();
      if (selectedArtifact) await openArtifact(selectedArtifact, false, true);
    }

    function render() {
      const counts = status.counts || {};
      const stats = [
        ['Ready', counts.quality_gate?.ready_for_db_staging ?? 'n/a', 'ok'],
        ['Blocked', counts.quality_gate?.blocked ?? 'n/a', 'bad'],
        ['Approved', counts.decisions?.approved ?? 'n/a', 'ok'],
        ['Cloudinary', counts.cloudinary?.uploaded ?? 'n/a', 'ok'],
        ['Projected', counts.projection_apply?.approved_projected ?? 'n/a', 'ok'],
        ['Activated', counts.activation?.activated ?? 0, counts.activation?.activated ? 'ok' : 'warn'],
        ['Activation ready', counts.activation_dry_run?.ready ?? 'n/a', 'ok'],
        ['Image errors', counts.cloudinary?.errors ?? 'n/a', counts.cloudinary?.errors ? 'bad' : 'ok'],
        ['Audit failed', counts.post_activation_audit?.failed ?? 'n/a', counts.post_activation_audit?.failed ? 'bad' : 'ok'],
        ['Rollback eligible', counts.rollback?.eligible ?? 'n/a', counts.rollback?.eligible ? 'warn' : 'ok'],
      ];
      document.getElementById('stats').innerHTML = stats.map(([label, value, cls]) => '<div class="panel stat"><span class="muted">' + label + '</span><strong class="' + cls + '">' + value + '</strong></div>').join('');
      document.getElementById('files').innerHTML = status.artifacts.map(a => '<div class="file-row"><span>' + a.label + '</span><button ' + (a.exists ? '' : 'disabled') + ' onclick="openArtifact(\\'' + a.file + '\\')">' + (a.exists ? 'open' : 'missing') + '</button></div>').join('');
      document.getElementById('artifactTabs').innerHTML = status.artifacts.filter(a => a.exists).map(a => '<button class="' + (a.file === selectedArtifact ? 'active' : '') + '" onclick="openArtifact(\\'' + a.file + '\\')">' + a.label + '</button>').join('');
      document.getElementById('commands').innerHTML = Object.entries(status.commands).map(([key, cmd]) => renderCommand(key, cmd)).join('');
    }

    function renderCommand(key, cmd) {
      const cls = cmd.danger === 'publishes_public' ? 'danger' : (cmd.danger === 'safe' ? '' : 'write');
      return '<div class="command"><h3>' + cmd.label + '</h3><p class="muted">' + cmd.description + '</p><button class="' + cls + '" onclick="runCommand(\\'' + key + '\\', \\'' + cmd.danger + '\\')">' + cmd.label + '</button></div>';
    }

    async function openArtifact(file, rerender = true, preserveCurrent = false) {
      selectedArtifact = file;
      if (rerender) render();
      const batch = document.getElementById('batch').value;
      const artifact = status.artifacts.find(a => a.file === file);
      const url = '/api/artifact?batch=' + encodeURIComponent(batch) + '&file=' + encodeURIComponent(file);
      const host = document.getElementById('artifactHost');
      const toolbar = document.getElementById('artifactToolbar');
      toolbar.classList.toggle('visible', file === 'publication_review_dashboard.html');
      if (artifact?.kind === 'html') {
        if (preserveCurrent && host.tagName.toLowerCase() === 'iframe' && host.getAttribute('src') === url) return;
        host.outerHTML = '<iframe id="artifactHost" class="artifact" src="' + url + '"></iframe>';
        return;
      }
      toolbar.classList.remove('visible');
      const text = await (await fetch(url)).text();
      const current = document.getElementById('artifactHost');
      if (current.tagName.toLowerCase() === 'iframe') current.outerHTML = '<pre id="artifactHost" class="artifact"></pre>';
      document.getElementById('artifactHost').textContent = text;
    }

    function openArtifactFullScreen() {
      if (!selectedArtifact) return;
      const batch = document.getElementById('batch').value;
      const url = '/api/artifact?batch=' + encodeURIComponent(batch) + '&file=' + encodeURIComponent(selectedArtifact);
      window.open(url, '_blank');
    }

    async function runCommand(action, danger) {
      const batch = document.getElementById('batch').value;
      let confirm = '';
      if (danger !== 'safe') {
        confirm = prompt('Type RUN to execute this action');
        if (confirm !== 'RUN') return;
      }
      const response = await fetch('/api/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ batch_id: batch, action, confirm }) });
      const payload = await response.json();
      if (!response.ok) alert(payload.error || 'command failed to start');
      await pollRunState();
    }

    async function runConfiguredBatch(action) {
      const neighborhoods = selectedNeighborhoods();
      if (neighborhoods.length === 0) {
        alert('Select at least one neighborhood.');
        return;
      }
      const payload = {
        batch_id: document.getElementById('batch').value,
        action,
        new_batch_id: document.getElementById('newBatchId').value,
        city: document.getElementById('newCity').value,
        count: document.getElementById('newCount').value,
        neighborhoods: neighborhoods.join(','),
        batch_type: document.getElementById('newBatchType').value,
      };
      const response = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) alert(result.error || 'command failed to start');
      if (response.ok) pendingBatchSelection = payload.new_batch_id;
      await pollRunState();
    }

    function syncCityDefaults() {
      renderNeighborhoodChecks();
      syncBatchTypeDefaults();
    }

    function renderNeighborhoodChecks() {
      const city = document.getElementById('newCity').value || 'Buenos Aires';
      const config = cityConfigs[city] || cityConfigs['Buenos Aires'];
      document.getElementById('newNeighborhoods').innerHTML = config.neighborhoods.map((neighborhood) =>
        '<label><input type="checkbox" value="' + neighborhood.replace(/"/g, '&quot;') + '" checked onchange="syncBatchTypeDefaults()"> ' + neighborhood + '</label>'
      ).join('');
    }

    function selectedNeighborhoods() {
      return Array.from(document.querySelectorAll('#newNeighborhoods input:checked')).map(input => input.value);
    }

    function syncBatchTypeDefaults() {
      const type = document.getElementById('newBatchType').value;
      const batchId = document.getElementById('newBatchId');
      const city = document.getElementById('newCity').value || 'Buenos Aires';
      const count = document.getElementById('newCount').value || '50';
      const slugCity = (cityConfigs[city] && cityConfigs[city].slug) || city.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'city';
      const slugAreas = selectedNeighborhoods().map(slugPart).slice(0, 3).join('_') || 'all';
      const help = {
        bars: 'Bars includes cocktail, speakeasy, wine, neighborhood bars, and a small rooftop/terrace slice.',
        cafes: 'Uses Stage 00 type mix: cafes=count.',
        restaurants: 'Restaurants are atmosphere-forward only; not food-guide coverage.',
      };
      document.getElementById('batchTypeHelp').textContent = help[type] || help.bars;
      if (!batchId.dataset.touched) batchId.value = 'batch_' + nextBatchNumberHint() + '_' + slugCity + '_' + type + '_' + count + '_' + slugAreas;
    }

    function nextBatchNumberHint() {
      const maxNumber = batchItems.reduce((max, item) => {
        const match = String(item.id || '').match(/batch_(\\d+)/);
        return match ? Math.max(max, Number(match[1])) : max;
      }, 0);
      return String(maxNumber + 1).padStart(3, '0');
    }

    function slugPart(value) {
      return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 18) || 'area';
    }

    async function openManual() {
      selectedArtifact = null;
      const text = await (await fetch('/api/manual')).text();
      const current = document.getElementById('artifactHost');
      if (current.tagName.toLowerCase() === 'iframe') current.outerHTML = '<pre id="artifactHost" class="artifact"></pre>';
      document.getElementById('artifactHost').textContent = text;
      document.getElementById('artifactTabs').querySelectorAll('button').forEach(button => button.classList.remove('active'));
    }

    async function pollRunState() {
      const state = await (await fetch('/api/run-state')).json();
      document.getElementById('runState').textContent = state.running ? 'running ' + state.action : 'idle';
      const log = (state.log || []).join('');
      const consoleEl = document.getElementById('console');
      consoleEl.textContent = log || 'No command output yet.';
      consoleEl.scrollTop = consoleEl.scrollHeight;
      if (!state.running && state.finished_at && state.finished_at !== lastObservedFinish) {
        lastObservedFinish = state.finished_at;
        const targetBatch = pendingBatchSelection;
        pendingBatchSelection = '';
        await loadBatchList(targetBatch);
        refresh();
      }
    }

    init();
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
