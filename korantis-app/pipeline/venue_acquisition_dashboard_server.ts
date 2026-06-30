import { spawn, type ChildProcessWithoutNullStreams } from 'child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync } from 'fs';
import { createServer, type IncomingMessage, type ServerResponse } from 'http';
import path from 'path';

interface RunState {
  running: boolean;
  batch_id?: string;
  started_at?: string;
  finished_at?: string;
  exit_code?: number | null;
  command?: string[];
  log: string[];
}

interface CandidateLike {
  name?: string;
  neighborhood?: string;
  type?: string;
  candidate_score?: number;
  source_signals?: string[];
  discovery_lanes?: string[];
  best_query_rank?: number;
  rejection_reasons?: string[];
  scores?: { generic_chain_penalty?: number };
}

interface ImageCandidateLike {
  venue_name?: string;
  resolved_image_url?: string;
  source_url?: string;
  source_type?: string;
  rights_risk?: string;
  width?: number;
  height?: number;
  pre_m3_score?: number;
  risk_flags?: string[];
}

interface SelectedHeroLike {
  venue_name?: string;
  selection_score?: number;
  selected_image?: ImageCandidateLike & {
    ok_photo?: boolean;
    vision?: {
      scene_type?: string;
      quality?: string;
      atmosphere_signal?: string;
      visual_reason?: string;
    };
  };
}

const PORT = Number(process.env.KORANTIS_VENUE_DASHBOARD_PORT || 4320);
const HOST = process.env.KORANTIS_VENUE_DASHBOARD_HOST || '127.0.0.1';
const ROOT = process.cwd();
const BATCHES_DIR = path.join(ROOT, 'data', 'batches');
const MAX_LOG_LINES = 500;

const runState: RunState = {
  running: false,
  log: ['Venue acquisition dashboard ready.'],
};
let activeProcess: ChildProcessWithoutNullStreams | null = null;

const DEFAULT_CORDOBA_NEIGHBORHOODS = [
  'Nueva Cordoba',
  'Guemes',
  'General Paz',
  'Cerro de las Rosas',
  'Alta Cordoba',
  'Cofico',
  'Alberdi',
  'Centro',
  'Barrio Jardin',
  'Urca',
  'Villa Belgrano',
  'Arguello',
];

function stateForClient(): RunState {
  if (runState.running || runState.batch_id) return runState;
  const latestBatch = latestBatchIdWithSeed();
  return latestBatch ? { ...runState, batch_id: latestBatch } : runState;
}

createServer(async (request, response) => {
  try {
    const url = new URL(request.url || '/', `http://${request.headers.host || `${HOST}:${PORT}`}`);
    if (request.method === 'GET' && url.pathname === '/') return sendHtml(response);
    if (request.method === 'GET' && url.pathname === '/api/state') return writeJson(response, 200, stateForClient());
    if (request.method === 'POST' && url.pathname === '/api/run-seed') return runSeed(request, response);
    if (request.method === 'POST' && url.pathname === '/api/run-pipeline') return runPipeline(request, response);
    if (request.method === 'GET' && url.pathname.startsWith('/api/batch/')) return batchSummary(url, response);
    if (request.method === 'GET' && url.pathname === '/api/artifact') return artifact(url, response);
    writeJson(response, 404, { error: 'not_found' });
  } catch (error) {
    writeJson(response, 500, { error: error instanceof Error ? error.message : String(error) });
  }
}).listen(PORT, HOST, () => {
  console.log(`Korantis venue acquisition dashboard: http://${HOST}:${PORT}`);
});

async function runSeed(request: IncomingMessage, response: ServerResponse): Promise<void> {
  if (runState.running) return writeJson(response, 409, { error: 'A seed run is already active.' });
  const body = await readBody(request);
  const batchId = cleanBatchId(stringField(body, 'batch_id') || suggestedBatchId());
  const city = stringField(body, 'city') || 'Cordoba Argentina';
  const count = positiveInt(body.count, 50, 1, 200);
  const neighborhoods = stringField(body, 'neighborhoods') || DEFAULT_CORDOBA_NEIGHBORHOODS.join(',');
  const typeMix = stringField(body, 'type_mix') || defaultCordobaTypeMix(count);
  const maxQueries = positiveInt(body.max_queries, 110, 1, 500);
  const maxSourceQueries = positiveInt(body.max_source_queries, 48, 0, 300);
  const mode = stringField(body, 'mode') || 'fresh';
  const useVision = Boolean(body.use_vision);

  const args = [
    'pipeline/stages/00_build_venue_seed.ts',
    batchId,
    '--count',
    String(count),
    '--city',
    city,
    '--neighborhoods',
    neighborhoods,
    '--type-mix',
    typeMix,
    '--max-queries',
    String(maxQueries),
    '--max-source-queries',
    String(maxSourceQueries),
  ];
  if (mode === 'fresh') args.push('--fresh-city-seed');
  if (!useVision) args.push('--skip-visual-preselection');

  startProcess(batchId, args);
  writeJson(response, 202, { batch_id: batchId, command: ['tsx', ...args] });
}

function startProcess(batchId: string, args: string[]): void {
  const tsx = path.join(ROOT, 'node_modules', '.bin', process.platform === 'win32' ? 'tsx.cmd' : 'tsx');
  runState.running = true;
  runState.batch_id = batchId;
  runState.started_at = new Date().toISOString();
  runState.finished_at = undefined;
  runState.exit_code = null;
  runState.command = [tsx, ...args];
  runState.log = [`$ ${['tsx', ...args].map(shellQuote).join(' ')}`];
  mkdirSync(path.join(BATCHES_DIR, batchId), { recursive: true });

  activeProcess = process.platform === 'win32'
    ? spawn('cmd.exe', ['/c', tsx, ...args], { cwd: ROOT, env: process.env })
    : spawn(tsx, args, { cwd: ROOT, env: process.env });
  activeProcess.stdout.on('data', (chunk) => appendLog(String(chunk)));
  activeProcess.stderr.on('data', (chunk) => appendLog(String(chunk)));
  activeProcess.on('error', (error) => {
    appendLog(`process error: ${error.message}`);
    runState.running = false;
    runState.finished_at = new Date().toISOString();
    runState.exit_code = -1;
    activeProcess = null;
  });
  activeProcess.on('close', (code) => {
    appendLog(`process exited with code ${code}`);
    runState.running = false;
    runState.finished_at = new Date().toISOString();
    runState.exit_code = code;
    activeProcess = null;
  });
}

async function runPipeline(request: IncomingMessage, response: ServerResponse): Promise<void> {
  if (runState.running) return writeJson(response, 409, { error: 'A pipeline run is already active.' });
  const body = await readBody(request);
  const batchId = cleanBatchId(stringField(body, 'batch_id'));
  if (!batchId) return writeJson(response, 400, { error: 'batch_id_required' });
  const phase = stringField(body, 'phase') || 'safe-full';
  const maxCandidatesPerVenue = positiveInt(body.max_candidates_per_venue, 6, 1, 28);
  const maxImagesPerVenue = positiveInt(body.max_images_per_venue, 3, 1, 10);
  const skipOfficialImages = body.skip_official_images !== false;
  const force = Boolean(body.force);
  const skipStage08 = Boolean(body.skip_stage_08);

  const args = [
    'pipeline/run_dashboard_pipeline.ts',
    batchId,
    '--phase',
    phase,
    '--max-candidates-per-venue',
    String(maxCandidatesPerVenue),
    '--max-images-per-venue',
    String(maxImagesPerVenue),
  ];
  if (skipOfficialImages) args.push('--skip-official-images');
  if (force) args.push('--force');
  if (skipStage08) args.push('--skip-stage-08');

  startProcess(batchId, args);
  writeJson(response, 202, { batch_id: batchId, command: ['tsx', ...args] });
}

function batchSummary(url: URL, response: ServerResponse): void {
  const batchId = cleanBatchId(decodeURIComponent(url.pathname.replace('/api/batch/', '')));
  const outputDir = path.join(BATCHES_DIR, batchId);
  const debug = readJson<Record<string, unknown>>(path.join(outputDir, 'venue_candidates_debug.json'));
  const seed = readJson<Record<string, unknown>>(path.join(outputDir, 'venue_seed.json'));
  const imageQueue = readJson<Record<string, unknown>>(path.join(outputDir, 'stage_03_final_vision_queue.json'));
  const selectedImagesFile = readJson<Record<string, unknown>>(path.join(outputDir, 'stage_04_selected_images.json'));
  const pipelineReport = readJson<Record<string, unknown>>(path.join(outputDir, 'dashboard_pipeline_run_report.json'));
  const imageCandidates = arrayField<ImageCandidateLike>(imageQueue?.queue);
  const selectedHeroImages = arrayField<SelectedHeroLike>(selectedImagesFile?.selected_images);
  const imagePreviews = imagePreviewByVenue(imageCandidates, selectedHeroImages);
  const reportExists = existsSync(path.join(outputDir, 'venue_seed_report.md'));
  const editorialExists = existsSync(path.join(outputDir, 'stage_00b_editorial_source_enrichment_report.md'));

  const selected = arrayField<CandidateLike>(debug?.selected);
  const eligible = arrayField<CandidateLike>(debug?.eligible_not_selected);
  const rejected = arrayField<CandidateLike>(debug?.rejected);

  writeJson(response, 200, {
    batch_id: batchId,
    exists: Boolean(debug || seed),
    report_exists: reportExists,
    editorial_report_exists: editorialExists,
    summary: debug ? {
      total_candidates_discovered: debug.total_candidates_discovered,
      candidates_after_dedupe: debug.candidates_after_dedupe,
      candidates_after_hard_filters: debug.candidates_after_hard_filters,
      selected_count: debug.selected_count,
      rejected_count: debug.rejected_count,
      already_known_excluded_count: arrayField(debug.already_known_excluded).length,
      warnings: debug.warnings || [],
    } : null,
    lanes: countBy(selected, selectionLane),
    types: countBy(selected, (candidate) => candidate.type || 'unknown'),
    neighborhoods: countBy(selected, (candidate) => candidate.neighborhood || 'unknown'),
    flags: countFlags(selected),
    image_summary: {
      candidate_count: imageCandidates.length,
      venues_with_candidates: Object.keys(imagePreviews).length,
      selected_hero_count: selectedHeroImages.length,
    },
    pipeline_report: pipelineReport ? {
      phase: pipelineReport.phase,
      generated_at: pipelineReport.generated_at,
      steps: pipelineReport.steps || [],
    } : null,
    selected: selected.map((candidate) => candidateCard(candidate, imagePreviews)),
    eligible_not_selected: eligible.slice(0, 80).map((candidate) => candidateCard(candidate, imagePreviews)),
    rejected: rejected.slice(0, 80).map((candidate) => ({
      name: candidate.name || 'unknown',
      neighborhood: candidate.neighborhood || 'unknown',
      reasons: candidate.rejection_reasons || [],
    })),
  });
}

function artifact(url: URL, response: ServerResponse): void {
  const batchId = cleanBatchId(url.searchParams.get('batch') || '');
  const file = url.searchParams.get('file') || '';
  const allowed = new Set([
    'venue_seed_report.md',
    'stage_00b_editorial_source_enrichment_report.md',
    'dashboard_with_images.html',
    'connect_selected_images_report.md',
    'dashboard_pipeline_run_report.md',
    'pipeline_control_panel.html',
    'quality_gate_report.md',
    'approval_manifest_report.md',
    'publication_review_report.md',
    'venue_seed.json',
    'venue_candidates_debug.json',
  ]);
  if (!batchId || !allowed.has(file)) return writeJson(response, 400, { error: 'invalid_artifact' });
  const filePath = path.join(BATCHES_DIR, batchId, file);
  if (!existsSync(filePath)) return writeJson(response, 404, { error: 'artifact_not_found' });
  response.writeHead(200, { 'Content-Type': contentTypeFor(file) });
  response.end(readFileSync(filePath));
}

function candidateCard(candidate: CandidateLike, imagePreviews: Record<string, Record<string, unknown>[]>): Record<string, unknown> {
  const name = candidate.name || 'unknown';
  return {
    name,
    neighborhood: candidate.neighborhood || 'unknown',
    type: candidate.type || 'unknown',
    score: candidate.candidate_score || 0,
    lane: selectionLane(candidate),
    flags: selectionFlags(candidate),
    best_query_rank: candidate.best_query_rank || null,
    images: imagePreviews[name] || [],
  };
}

function imagePreviewByVenue(
  candidates: ImageCandidateLike[],
  selectedHeroes: SelectedHeroLike[] = [],
): Record<string, Record<string, unknown>[]> {
  const grouped: Record<string, Record<string, unknown>[]> = {};
  const selectedUrlsByVenue: Record<string, Set<string>> = {};
  for (const hero of selectedHeroes) {
    const venue = hero.venue_name || hero.selected_image?.venue_name || 'unknown';
    const url = hero.selected_image?.resolved_image_url || '';
    if (!url) continue;
    if (!selectedUrlsByVenue[venue]) selectedUrlsByVenue[venue] = new Set();
    selectedUrlsByVenue[venue].add(url);
    grouped[venue] = [{
      url,
      source_url: hero.selected_image?.source_url || '',
      source_type: hero.selected_image?.source_type || 'unknown',
      rights_risk: hero.selected_image?.rights_risk || 'unknown',
      width: hero.selected_image?.width || null,
      height: hero.selected_image?.height || null,
      score: hero.selection_score || 0,
      flags: hero.selected_image?.risk_flags || [],
      selected_hero: true,
      scene_type: hero.selected_image?.vision?.scene_type || '',
      quality: hero.selected_image?.vision?.quality || '',
    }];
  }
  for (const candidate of candidates) {
    const venue = candidate.venue_name || 'unknown';
    if (!grouped[venue]) grouped[venue] = [];
    if (grouped[venue].length >= 3) continue;
    if (selectedUrlsByVenue[venue]?.has(candidate.resolved_image_url || '')) continue;
    grouped[venue].push({
      url: candidate.resolved_image_url || '',
      source_url: candidate.source_url || '',
      source_type: candidate.source_type || 'unknown',
      rights_risk: candidate.rights_risk || 'unknown',
      width: candidate.width || null,
      height: candidate.height || null,
      score: candidate.pre_m3_score || 0,
      flags: candidate.risk_flags || [],
    });
  }
  return grouped;
}

function selectionLane(candidate: CandidateLike): string {
  const signals = candidate.source_signals || [];
  const lanes = candidate.discovery_lanes || [];
  if (signals.includes('editorial_mention_confirmed')) return 'local_editorial_anchor';
  if (signals.includes('editorial_source_query_candidate')) return 'local_editorial_anchor';
  if (lanes.includes('top_rated') && (candidate.best_query_rank || 99) <= 10) return 'google_topboard';
  if (signals.includes('curated_allowlist')) return 'curated_anchor';
  return 'korantis_discovery';
}

function selectionFlags(candidate: CandidateLike): string[] {
  const flags: string[] = [];
  const signals = candidate.source_signals || [];
  if (signals.includes('soft_chain_review_required') || (candidate.scores?.generic_chain_penalty || 0) > 0) flags.push('popular_but_review');
  if (candidate.type === 'rooftop_bar') flags.push('rooftop_attribute_review');
  if (candidate.neighborhood === 'citywide') flags.push('needs_neighborhood_resolution');
  return flags;
}

function countFlags(candidates: CandidateLike[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const candidate of candidates) {
    for (const flag of selectionFlags(candidate)) counts[flag] = (counts[flag] || 0) + 1;
  }
  return counts;
}

function countBy<T>(items: T[], getter: (item: T) => string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const key = getter(item) || 'unknown';
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])));
}

function defaultCordobaTypeMix(count: number): string {
  const cafes = Math.max(4, Math.round(count * 0.12));
  const restaurants = Math.max(6, Math.round(count * 0.16));
  const wine = Math.max(5, Math.round(count * 0.14));
  const cocktails = Math.max(5, Math.round(count * 0.16));
  const bars = Math.max(1, count - cafes - restaurants - wine - cocktails);
  return `bars=${bars},cocktails=${cocktails},wine=${wine},restaurants=${restaurants},cafes=${cafes}`;
}

function suggestedBatchId(): string {
  const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '').slice(0, 12);
  return `batch_cordoba_acquisition_${stamp}`;
}

function latestBatchIdWithSeed(): string | null {
  if (!existsSync(BATCHES_DIR)) return null;
  const batches = readdirSync(BATCHES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const debugPath = path.join(BATCHES_DIR, entry.name, 'venue_candidates_debug.json');
      const seedPath = path.join(BATCHES_DIR, entry.name, 'venue_seed.json');
      const reportPath = path.join(BATCHES_DIR, entry.name, 'venue_seed_report.md');
      const filePath = existsSync(debugPath) ? debugPath : existsSync(seedPath) ? seedPath : existsSync(reportPath) ? reportPath : '';
      return filePath ? { id: entry.name, mtimeMs: statSync(filePath).mtimeMs } : null;
    })
    .filter((entry): entry is { id: string; mtimeMs: number } => Boolean(entry))
    .sort((a, b) => b.mtimeMs - a.mtimeMs);
  return batches[0]?.id || null;
}

function appendLog(text: string): void {
  for (const line of text.split(/\r?\n/).filter(Boolean)) {
    runState.log.push(line);
  }
  if (runState.log.length > MAX_LOG_LINES) runState.log = runState.log.slice(-MAX_LOG_LINES);
}

async function readBody(request: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  if (chunks.length === 0) return {};
  try {
    const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

function readJson<T>(filePath: string): T | null {
  if (!existsSync(filePath)) return null;
  try {
    return JSON.parse(readFileSync(filePath, 'utf8')) as T;
  } catch {
    return null;
  }
}

function arrayField<T>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
}

function stringField(body: Record<string, unknown>, key: string): string {
  const value = body[key];
  return typeof value === 'string' ? value.trim() : '';
}

function positiveInt(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(parsed)));
}

function cleanBatchId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 96) || suggestedBatchId();
}

function shellQuote(value: string): string {
  return /\s/.test(value) ? `"${value.replace(/"/g, '\\"')}"` : value;
}

function contentTypeFor(file: string): string {
  if (file.endsWith('.json')) return 'application/json; charset=utf-8';
  if (file.endsWith('.html')) return 'text/html; charset=utf-8';
  return 'text/markdown; charset=utf-8';
}

function writeJson(response: ServerResponse, status: number, data: unknown): void {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(data, null, 2));
}

function sendHtml(response: ServerResponse): void {
  const initialBatchId = latestBatchIdWithSeed() || suggestedBatchId();
  response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  response.end(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Korantis Venue Acquisition</title>
  <style>
    :root { color-scheme: light; --bg:#f7f7f3; --ink:#181816; --muted:#68655f; --line:#dedbd2; --card:#fff; --accent:#0f766e; --bad:#b42318; --warn:#9a6700; }
    * { box-sizing: border-box; }
    body { margin: 0; background: var(--bg); color: var(--ink); font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif; }
    header { padding: 22px 28px 16px; border-bottom: 1px solid var(--line); background: #fff; display:flex; justify-content:space-between; gap:16px; align-items:flex-start; }
    h1 { margin: 0; font-size: 24px; letter-spacing: 0; }
    p { color: var(--muted); line-height: 1.45; }
    main { display: grid; grid-template-columns: 400px 1fr; gap: 18px; padding: 18px; }
    .card { background: var(--card); border: 1px solid var(--line); border-radius: 8px; padding: 16px; }
    label { display:block; font-size: 12px; font-weight: 700; color: var(--muted); margin: 14px 0 6px; text-transform: uppercase; }
    input, textarea, select { width: 100%; border: 1px solid var(--line); border-radius: 6px; padding: 10px; font: inherit; background: #fff; color: var(--ink); }
    textarea { min-height: 88px; resize: vertical; }
    button { border: 1px solid var(--line); border-radius: 6px; background: #fff; color: var(--ink); padding: 10px 12px; cursor: pointer; font-weight: 700; }
    button.primary { background: var(--accent); border-color: var(--accent); color: white; }
    button:disabled { opacity: .55; cursor: wait; }
    .row { display:grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .actions { display:flex; gap: 8px; flex-wrap: wrap; margin-top: 16px; }
    .pill-grid { display:grid; grid-template-columns: repeat(4, minmax(110px, 1fr)); gap:10px; margin-bottom: 14px; }
    .pill { border:1px solid var(--line); border-radius:8px; padding:10px; background:#fbfbf8; }
    .pill b { display:block; font-size:20px; }
    .tabs { display:flex; gap:8px; margin: 14px 0; }
    .tabs button.active { background:#181816; color:#fff; }
    table { width:100%; border-collapse: collapse; font-size: 13px; }
    th, td { text-align:left; border-bottom:1px solid var(--line); padding:8px; vertical-align: top; }
    th { color: var(--muted); font-size: 11px; text-transform: uppercase; }
    .lane { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size:12px; }
    .flag { color: var(--warn); font-size:12px; }
    .thumbs { display:flex; gap:8px; align-items:flex-start; flex-wrap:wrap; min-width:210px; }
    .thumb { width: 92px; }
    .thumb img { width:92px; height:68px; object-fit:cover; border-radius:6px; border:1px solid var(--line); background:#eee; display:block; }
    .thumb span { display:block; margin-top:3px; color:var(--muted); font-size:10px; line-height:1.2; }
    .gallery { display:grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap:12px; }
    .venue-tile { border:1px solid var(--line); border-radius:8px; overflow:hidden; background:#fff; }
    .venue-tile img { width:100%; aspect-ratio: 4 / 3; object-fit:cover; display:block; background:#eee; }
    .venue-tile div { padding:10px; }
    .venue-tile b { display:block; margin-bottom:4px; }
    .venue-tile span { color:var(--muted); font-size:12px; }
    .log { background:#181816; color:#f6f4ee; border-radius:8px; padding:12px; height:240px; overflow:auto; white-space:pre-wrap; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size:12px; }
    .links a { display:inline-block; margin-right:12px; color: var(--accent); font-weight:700; }
    @media (max-width: 980px) { main { grid-template-columns: 1fr; } .pill-grid { grid-template-columns: repeat(2, 1fr); } }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>Venue Acquisition Dashboard</h1>
      <p>Run Cordoba seeds with Google topboard, local editorial anchors, and Korantis discovery lanes. No publishing.</p>
    </div>
    <button onclick="refreshAll()">Refresh</button>
  </header>
  <main>
    <section class="card">
      <h2>Run Seed</h2>
      <label>Batch ID</label>
      <input id="batchId" value="${initialBatchId}">
      <div class="row">
        <div>
          <label>City</label>
          <input id="city" value="Cordoba Argentina">
        </div>
        <div>
          <label>Count</label>
          <input id="count" type="number" value="50" min="1" max="200">
        </div>
      </div>
      <label>Mode</label>
      <select id="mode">
        <option value="fresh">Fresh topboard, ignore known venues</option>
        <option value="next">Next batch, exclude known venues</option>
      </select>
      <label>Type Mix</label>
      <input id="typeMix" value="bars=24,cocktails=8,wine=7,restaurants=8,cafes=6">
      <label>Neighborhoods</label>
      <textarea id="neighborhoods">${DEFAULT_CORDOBA_NEIGHBORHOODS.join(',')}</textarea>
      <div class="row">
        <div>
          <label>Max Google Queries</label>
          <input id="maxQueries" type="number" value="110">
        </div>
        <div>
          <label>Max Source Queries</label>
          <input id="maxSourceQueries" type="number" value="48">
        </div>
      </div>
      <label><input id="useVision" type="checkbox" style="width:auto"> Run vision preselection now</label>
      <p>Vision uses <code>KORANTIS_VISION_PROVIDER</code>. Set it to <code>mimo</code> to use Xiaomi MiMo; otherwise the legacy MiniMax path is used.</p>
      <div class="actions">
        <button class="primary" id="runButton" onclick="runSeed()">Run acquisition seed</button>
        <button onclick="loadBatch()">Load batch</button>
      </div>
      <hr style="border:0;border-top:1px solid var(--line);margin:18px 0;">
      <h2>Run Pipeline</h2>
      <label>Phase</label>
      <select id="pipelinePhase">
        <option value="images">Images + vision only</option>
        <option value="editorial-quality">Editorial + quality + review</option>
        <option value="safe-full">Safe full prep</option>
        <option value="auto-publish">Auto review + publish</option>
      </select>
      <div class="row">
        <div>
          <label>Image candidates</label>
          <input id="maxCandidatesPerVenue" type="number" value="6" min="1" max="28">
        </div>
        <div>
          <label>Vision images</label>
          <input id="maxImagesPerVenue" type="number" value="3" min="1" max="10">
        </div>
      </div>
      <label><input id="skipOfficialImages" type="checkbox" checked style="width:auto"> Fast image mode: Google Places only</label>
      <label><input id="forcePipeline" type="checkbox" style="width:auto"> Force rerun existing outputs</label>
      <label><input id="skipStage08" type="checkbox" style="width:auto"> Skip Supabase staging dry-run</label>
      <div class="actions">
        <button class="primary" id="pipelineButton" onclick="runPipeline()">Run selected phase</button>
        <button id="autoPublishButton" onclick="runAutoPublish()">Auto review + publish</button>
      </div>
    </section>
    <section>
      <div class="card">
        <h2 id="statusTitle">Ready</h2>
        <p id="statusText">No active run.</p>
        <div class="log" id="log"></div>
      </div>
      <div class="card" style="margin-top:18px;">
        <h2>Batch Result</h2>
        <div class="links" id="artifactLinks"></div>
        <div class="pill-grid" id="summary"></div>
        <div class="tabs">
          <button class="active" onclick="showTab('selected')">Selected</button>
          <button onclick="showTab('images')">Images</button>
          <button onclick="showTab('eligible')">Omitted</button>
          <button onclick="showTab('rejected')">Rejected</button>
        </div>
        <div id="tableHost"></div>
      </div>
    </section>
  </main>
  <script>
    let batch = null;
    let activeTab = 'selected';
    let timer = null;

    async function runSeed() {
      const payload = {
        batch_id: value('batchId'),
        city: value('city'),
        count: Number(value('count')),
        mode: value('mode'),
        type_mix: value('typeMix'),
        neighborhoods: value('neighborhoods'),
        max_queries: Number(value('maxQueries')),
        max_source_queries: Number(value('maxSourceQueries')),
        use_vision: document.getElementById('useVision').checked
      };
      const res = await fetch('/api/run-seed', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) return alert(data.error || 'run failed');
      document.getElementById('batchId').value = data.batch_id;
      startPolling();
    }

    async function runPipeline() {
      const payload = {
        batch_id: value('batchId'),
        phase: value('pipelinePhase'),
        max_candidates_per_venue: Number(value('maxCandidatesPerVenue')),
        max_images_per_venue: Number(value('maxImagesPerVenue')),
        skip_official_images: document.getElementById('skipOfficialImages').checked,
        force: document.getElementById('forcePipeline').checked,
        skip_stage_08: document.getElementById('skipStage08').checked
      };
      const res = await fetch('/api/run-pipeline', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) return alert(data.error || 'pipeline failed');
      document.getElementById('batchId').value = data.batch_id;
      startPolling();
    }

    async function runAutoPublish() {
      document.getElementById('pipelinePhase').value = 'auto-publish';
      document.getElementById('forcePipeline').checked = true;
      await runPipeline();
    }

    function startPolling() {
      clearInterval(timer);
      timer = setInterval(refreshAll, 2000);
      refreshAll();
    }

    async function refreshAll() {
      const state = await (await fetch('/api/state')).json();
      document.getElementById('runButton').disabled = state.running;
      document.getElementById('pipelineButton').disabled = state.running;
      document.getElementById('autoPublishButton').disabled = state.running;
      document.getElementById('statusTitle').textContent = state.running ? 'Running' : (state.exit_code === 0 ? 'Complete' : 'Ready');
      document.getElementById('statusText').textContent = state.batch_id ? state.batch_id : 'No active run.';
      document.getElementById('log').textContent = (state.log || []).join('\\n');
      if (state.batch_id) document.getElementById('batchId').value = state.batch_id;
      if (!state.running && timer) { clearInterval(timer); timer = null; }
      await loadBatch();
    }

    async function loadBatch() {
      const id = value('batchId');
      if (!id) return;
      const res = await fetch('/api/batch/' + encodeURIComponent(id));
      batch = await res.json();
      renderBatch();
    }

    function renderBatch() {
      if (!batch || !batch.exists) {
        document.getElementById('summary').innerHTML = '<p>No batch artifacts yet.</p>';
        document.getElementById('tableHost').innerHTML = '';
        document.getElementById('artifactLinks').innerHTML = '';
        return;
      }
      const s = batch.summary || {};
      document.getElementById('artifactLinks').innerHTML =
        link('venue_seed_report.md', 'Seed report') +
        link('stage_00b_editorial_source_enrichment_report.md', 'Editorial source report') +
        link('dashboard_with_images.html', 'Image dashboard') +
        link('connect_selected_images_report.md', 'Image connect report') +
        link('dashboard_pipeline_run_report.md', 'Pipeline report') +
        link('quality_gate_report.md', 'Quality report') +
        link('publication_review_report.md', 'Publication review') +
        link('pipeline_control_panel.html', 'Control panel') +
        link('venue_seed.json', 'Seed JSON') +
        link('venue_candidates_debug.json', 'Debug JSON');
      const laneText = Object.entries(batch.lanes || {}).map(([k,v]) => k + ': ' + v).join('<br>');
      const imageSummary = batch.image_summary || {};
      document.getElementById('summary').innerHTML = [
        pill('Discovered', s.total_candidates_discovered || 0),
        pill('After filters', s.candidates_after_hard_filters || 0),
        pill('Selected', s.selected_count || 0),
        pill('Known excluded', s.already_known_excluded_count || 0),
        pill('Image candidates', imageSummary.candidate_count || 0),
        pill('Venues with images', imageSummary.venues_with_candidates || 0),
        pill('Selected heroes', imageSummary.selected_hero_count || 0),
        pill('Pipeline phase', batch.pipeline_report ? batch.pipeline_report.phase : 'none'),
        pill('Lanes', laneText || 'none'),
        pill('Neighborhoods', Object.entries(batch.neighborhoods || {}).map(([k,v]) => k + ': ' + v).join('<br>') || 'none'),
        pill('Types', Object.entries(batch.types || {}).map(([k,v]) => k + ': ' + v).join('<br>') || 'none'),
        pill('Flags', Object.entries(batch.flags || {}).map(([k,v]) => k + ': ' + v).join('<br>') || 'none')
      ].join('');
      renderTable();
    }

    function showTab(tab) {
      activeTab = tab;
      document.querySelectorAll('.tabs button').forEach(button => button.classList.remove('active'));
      event.target.classList.add('active');
      renderTable();
    }

    function renderTable() {
      const rows = activeTab === 'selected' ? batch.selected : activeTab === 'eligible' ? batch.eligible_not_selected : batch.rejected;
      if (activeTab === 'images') {
        const imageRows = batch.selected || [];
        document.getElementById('tableHost').innerHTML = '<div class="gallery">' +
          imageRows.map(row => {
            const image = (row.images || [])[0];
            const imageHtml = image && image.url ? '<img loading="lazy" src="' + escAttr(image.url) + '" referrerpolicy="no-referrer">' : '';
            return '<article class="venue-tile">' + imageHtml + '<div><b>' + esc(row.name) + '</b><span>' + esc(row.neighborhood) + ' · ' + esc(row.type) + '</span><br><span>' + esc(image ? image.source_type : 'no image') + ' · score ' + esc(image ? image.score : 0) + '</span></div></article>';
          }).join('') +
          '</div>';
        return;
      }
      if (!rows || rows.length === 0) {
        document.getElementById('tableHost').innerHTML = '<p>No rows.</p>';
        return;
      }
      if (activeTab === 'rejected') {
        document.getElementById('tableHost').innerHTML = '<table><thead><tr><th>Name</th><th>Neighborhood</th><th>Reasons</th></tr></thead><tbody>' +
          rows.map(row => '<tr><td>' + esc(row.name) + '</td><td>' + esc(row.neighborhood) + '</td><td>' + esc((row.reasons || []).join(', ')) + '</td></tr>').join('') +
          '</tbody></table>';
        return;
      }
      document.getElementById('tableHost').innerHTML = '<table><thead><tr><th>Images</th><th>Name</th><th>Neighborhood</th><th>Type</th><th>Lane</th><th>Score</th><th>Flags</th></tr></thead><tbody>' +
        rows.map(row => '<tr><td>' + renderThumbs(row.images || []) + '</td><td>' + esc(row.name) + '</td><td>' + esc(row.neighborhood) + '</td><td>' + esc(row.type) + '</td><td class="lane">' + esc(row.lane) + '</td><td>' + row.score + '</td><td class="flag">' + esc((row.flags || []).join(', ')) + '</td></tr>').join('') +
        '</tbody></table>';
    }

    function renderThumbs(images) {
      if (!images || images.length === 0) return '<span class="flag">No image</span>';
      return '<div class="thumbs">' + images.map(image => '<a class="thumb" target="_blank" rel="noreferrer" href="' + escAttr(image.url) + '"><img loading="lazy" src="' + escAttr(image.url) + '" referrerpolicy="no-referrer"><span>' + esc(image.source_type || 'image') + ' · ' + esc(image.rights_risk || '') + '</span></a>').join('') + '</div>';
    }

    function link(file, label) {
      return '<a target="_blank" href="/api/artifact?batch=' + encodeURIComponent(value('batchId')) + '&file=' + encodeURIComponent(file) + '">' + label + '</a>';
    }
    function pill(label, value) { return '<div class="pill"><span>' + label + '</span><b>' + value + '</b></div>'; }
    function value(id) { return document.getElementById(id).value.trim(); }
    function esc(value) { return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
    function escAttr(value) { return esc(value); }
    refreshAll();
  </script>
</body>
</html>`.replace(/\u00c2\u00b7/g, ' - ').replace(/\u00b7/g, ' - '));
}
