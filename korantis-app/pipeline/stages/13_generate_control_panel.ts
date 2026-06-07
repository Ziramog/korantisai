import { existsSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

interface StageFile {
  label: string;
  path: string;
  required: boolean;
}

interface PanelSummary {
  batch_id: string;
  generated_at: string;
  files: Array<{
    label: string;
    path: string;
    exists: boolean;
    size_bytes: number;
  }>;
  counts: Record<string, unknown>;
  commands: Record<string, string>;
}

export function generateControlPanel(batchName: string): PanelSummary {
  const outputDir = path.join(process.cwd(), 'data', 'batches', batchName);
  const files = stageFiles(outputDir);
  const summary: PanelSummary = {
    batch_id: batchName,
    generated_at: new Date().toISOString(),
    files: files.map((file) => {
      const exists = existsSync(file.path);
      return {
        label: file.label,
        path: file.path,
        exists,
        size_bytes: exists ? readFileSync(file.path).byteLength : 0,
      };
    }),
    counts: readCounts(outputDir),
    commands: {
      full_batch_dry_run: `npx tsx pipeline/run_full_batch.ts ${batchName} --max-images-per-venue 4`,
      publication_review: `npx tsx pipeline/stages/09_generate_publication_review.ts ${batchName}`,
      public_projection_dry_run: `npx tsx pipeline/stages/11_project_to_public.ts ${batchName} --dry-run`,
      cloudinary_dry_run: `npx tsx pipeline/stages/10_materialize_cloudinary.ts ${batchName} --dry-run`,
      cloudinary_apply: `npx tsx pipeline/stages/10_materialize_cloudinary.ts ${batchName} --apply`,
      public_projection_apply_hidden: `npx tsx pipeline/stages/11_project_to_public.ts ${batchName} --apply`,
      activation_future: `npx tsx pipeline/stages/12_activate_public_venues.ts ${batchName} --apply`,
    },
  };

  writeFileSync(path.join(outputDir, 'pipeline_control_panel.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  writeFileSync(path.join(outputDir, 'pipeline_control_panel.html'), renderHtml(summary), 'utf8');

  console.log(`Pipeline control panel written to ${path.join(outputDir, 'pipeline_control_panel.html')}`);
  console.log(`Pipeline control panel JSON written to ${path.join(outputDir, 'pipeline_control_panel.json')}`);
  console.log(`Control panel summary: batch=${batchName}, files=${summary.files.filter((file) => file.exists).length}/${summary.files.length}`);
  return summary;
}

function stageFiles(outputDir: string): StageFile[] {
  return [
    ['Venue seed', 'venue_seed_report.md', true],
    ['Stage 01 raw venues', 'stage_01_report.md', true],
    ['Stage 02 sources', 'stage_02_source_discovery_report.md', true],
    ['Stage 03 images', 'stage_03_report.md', true],
    ['Stage 04 M3 vision', 'stage_04_report.md', true],
    ['Selected image connector', 'connect_selected_images_report.md', true],
    ['Stage 05 editorial', 'stage_05_report.md', true],
    ['Stage 06 quality gate', 'quality_gate_report.md', true],
    ['Stage 07 approval manifest', 'approval_manifest_report.md', true],
    ['Stage 08 staging dry-run', 'supabase_staging_dry_run_report.md', false],
    ['Stage 09 publication review', 'publication_review_report.md', true],
    ['Reviewed decision manifest', 'publication_decision_manifest.reviewed.json', true],
    ['Stage 10 Cloudinary', 'cloudinary_materialization_report.md', false],
    ['Stage 11 public projection', 'public_projection_report.md', true],
    ['Stage 11 apply', 'public_projection_apply_report.md', false],
  ].map(([label, relativePath, required]) => ({
    label: String(label),
    path: path.join(outputDir, String(relativePath)),
    required: Boolean(required),
  }));
}

function readCounts(outputDir: string): Record<string, unknown> {
  return {
    quality_gate: readJsonSummary(path.join(outputDir, 'batch_result_quality_gated.json'), (data) => data.summary),
    decision_manifest: readJsonSummary(path.join(outputDir, 'publication_decision_manifest.reviewed.json'), (data) => {
      const decisions = Array.isArray(data.decisions) ? data.decisions as Array<{ publication_decision: string }> : [];
      return {
        total: decisions.length,
        approved: decisions.filter((decision) => decision.publication_decision === 'approve').length,
        paused: decisions.filter((decision) => decision.publication_decision === 'pause').length,
        rejected: decisions.filter((decision) => decision.publication_decision === 'reject').length,
      };
    }),
    cloudinary: readJsonSummary(path.join(outputDir, 'cloudinary_materialization_result.json'), (data) => ({
      mode: data.mode,
      considered: data.images_considered,
      uploaded: data.uploaded,
      skipped_existing: data.skipped_existing,
      errors: data.errors,
    })),
    public_projection: readJsonSummary(path.join(outputDir, 'public_projection_dry_run.json'), (data) => data.stage_11_public_projection),
  };
}

function readJsonSummary(filePath: string, selector: (data: Record<string, unknown>) => unknown): unknown {
  if (!existsSync(filePath)) return null;
  try {
    return selector(JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, unknown>);
  } catch {
    return null;
  }
}

function renderHtml(summary: PanelSummary): string {
  const data = JSON.stringify(summary).replace(/</g, '\\u003c');
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Korantis Pipeline Control - ${escapeHtml(summary.batch_id)}</title>
  <style>
    :root { color-scheme: dark; --bg:#10100e; --panel:#1b1a16; --line:#3d382f; --text:#f7f0df; --muted:#b5aa96; --green:#74c98f; --gold:#d6b365; --red:#e07b72; --blue:#8ab7ef; }
    * { box-sizing: border-box; }
    body { margin:0; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif; background: radial-gradient(circle at 15% 0%, #2b2a1d, var(--bg) 34rem); color:var(--text); }
    header, main { max-width: 1440px; margin:0 auto; padding:24px; }
    header { position: sticky; top:0; z-index:10; background:rgba(16,16,14,.92); backdrop-filter: blur(12px); border-bottom:1px solid var(--line); }
    h1, h2, h3, p { margin:0; }
    h1 { font-size:26px; }
    .muted { color:var(--muted); }
    .grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap:14px; margin-top:18px; }
    .card { border:1px solid var(--line); background:rgba(27,26,22,.9); border-radius:16px; padding:16px; }
    .stat strong { display:block; font-size:28px; margin-top:6px; }
    .ok { color:var(--green); }
    .warn { color:var(--gold); }
    .bad { color:var(--red); }
    code, textarea { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; }
    .file { display:flex; justify-content:space-between; gap:12px; padding:10px 0; border-bottom:1px solid rgba(255,255,255,.07); }
    .file:last-child { border-bottom:0; }
    .cmd { width:100%; min-height:44px; border:1px solid var(--line); border-radius:10px; background:#111; color:var(--text); padding:10px; resize:vertical; }
    button { border:1px solid var(--line); background:#252219; color:var(--text); border-radius:999px; padding:7px 10px; cursor:pointer; }
    button:hover { border-color:var(--blue); }
    a { color:var(--blue); }
  </style>
</head>
<body>
  <header>
    <p class="muted">Korantis pipeline control panel</p>
    <h1>${escapeHtml(summary.batch_id)}</h1>
    <p class="muted">Generated ${escapeHtml(summary.generated_at)}. This panel does not write to Supabase, Cloudinary, or public activation.</p>
  </header>
  <main>
    <section class="grid" id="stats"></section>
    <section class="grid">
      <article class="card">
        <h2>Commands</h2>
        <div id="commands"></div>
      </article>
      <article class="card">
        <h2>Files</h2>
        <div id="files"></div>
      </article>
    </section>
  </main>
  <script>
    const data = ${data};
    const counts = data.counts || {};
    const stats = [
      ['Quality ready', counts.quality_gate?.ready_for_db_staging ?? 'n/a'],
      ['Quality blocked', counts.quality_gate?.blocked ?? 'n/a'],
      ['Approved', counts.decision_manifest?.approved ?? 'n/a'],
      ['Cloudinary uploaded', counts.cloudinary?.uploaded ?? 'n/a'],
      ['Public projected', counts.public_projection?.approved_projected ?? 'n/a'],
    ];
    document.getElementById('stats').innerHTML = stats.map(([label, value]) => '<article class="card stat"><span class="muted">' + label + '</span><strong>' + value + '</strong></article>').join('');
    document.getElementById('commands').innerHTML = Object.entries(data.commands).map(([key, command]) => '<div class="card"><p class="muted">' + key + '</p><textarea class="cmd" readonly>' + command + '</textarea><button onclick="navigator.clipboard.writeText(' + JSON.stringify(command) + ')">Copy</button></div>').join('');
    document.getElementById('files').innerHTML = data.files.map(file => '<div class="file"><span>' + file.label + '</span><span class="' + (file.exists ? 'ok' : 'bad') + '">' + (file.exists ? 'ready' : 'missing') + '</span></div>').join('');
  </script>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char] || char));
}

const isDirectRun = process.argv[1] ? fileURLToPath(import.meta.url) === path.resolve(process.argv[1]) : false;

if (isDirectRun) {
  const [, , batchName] = process.argv;
  if (!batchName) {
    console.error('Usage: npx tsx pipeline/stages/13_generate_control_panel.ts <batch_id>');
    process.exit(1);
  }

  try {
    generateControlPanel(batchName);
  } catch (error) {
    console.error(`Control panel generation failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
