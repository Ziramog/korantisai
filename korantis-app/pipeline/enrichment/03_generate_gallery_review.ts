import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { escapeMd, safeString } from './utils/enrichment_types';

type GalleryRole =
  | 'hero_interior'
  | 'gallery_atmosphere'
  | 'gallery_bar_area'
  | 'gallery_seating'
  | 'gallery_terrace_rooftop'
  | 'gallery_exterior_context'
  | 'gallery_detail_texture'
  | 'supporting_food_drink'
  | 'rejected_generic'
  | 'rejected_quality'
  | 'rejected_irrelevant';

type GalleryReviewStatus = 'ready_for_gallery_review' | 'needs_more_spatial_images' | 'blocked_gallery_quality';
type GalleryDecision = 'pause' | 'approve_gallery' | 'reject_gallery';

interface GalleryImage {
  candidate_id: string;
  venue_id: string;
  venue_name: string;
  source_url?: string;
  resolved_image_url: string;
  source_type: string;
  source_origin: string;
  width: number;
  height: number;
  role: GalleryRole;
  quality_score: number;
  atmosphere_score: number;
  rights_status: string;
  rights_notes?: string;
  selection_score: number;
  selection_reason: string[];
  gallery_rank: number;
  raw_vision?: {
    scene_type?: string;
    visual_reason?: string;
    atmosphere_signal?: string;
    quality?: string;
    shows_space?: boolean;
    is_product_only?: boolean;
  };
}

interface VenueGallerySelection {
  venue_id: string;
  venue_name: string;
  current_hero_url?: string;
  selected_gallery_images: GalleryImage[];
  warnings: string[];
}

interface GalleryReviewEntry {
  venue_id: string;
  venue_name: string;
  current_hero_url?: string;
  status: GalleryReviewStatus;
  default_decision: GalleryDecision;
  selected_count: number;
  spatial_count: number;
  support_count: number;
  google_places_count: number;
  existing_cloudinary_count: number;
  warnings: string[];
  review_notes: string[];
  images: GalleryImage[];
}

interface GalleryReviewManifest {
  run_id: string;
  generated_at: string;
  mode: 'manual_gallery_review_manifest';
  total_venues: number;
  ready_for_gallery_review: number;
  needs_more_spatial_images: number;
  blocked_gallery_quality: number;
  total_images: number;
  safety: {
    no_supabase_writes: true;
    no_cloudinary_uploads: true;
    no_publication_changes: true;
    no_external_model_calls: true;
  };
  entries: GalleryReviewEntry[];
}

interface Options {
  runId: string;
}

const SPATIAL_ROLES = new Set<GalleryRole>([
  'hero_interior',
  'gallery_atmosphere',
  'gallery_bar_area',
  'gallery_seating',
  'gallery_terrace_rooftop',
  'gallery_exterior_context',
  'gallery_detail_texture',
]);

export async function generateGalleryReview(options: Options): Promise<GalleryReviewManifest> {
  const outputDir = path.join(process.cwd(), 'data', 'enrichment', options.runId);
  const selectionPath = path.join(outputDir, 'gallery_selection.json');
  if (!existsSync(selectionPath)) throw new Error(`Missing gallery selection: ${selectionPath}`);

  const selections = readJson<VenueGallerySelection[]>(selectionPath);
  const entries = selections.map(buildReviewEntry);
  const result: GalleryReviewManifest = {
    run_id: options.runId,
    generated_at: new Date().toISOString(),
    mode: 'manual_gallery_review_manifest',
    total_venues: entries.length,
    ready_for_gallery_review: entries.filter((entry) => entry.status === 'ready_for_gallery_review').length,
    needs_more_spatial_images: entries.filter((entry) => entry.status === 'needs_more_spatial_images').length,
    blocked_gallery_quality: entries.filter((entry) => entry.status === 'blocked_gallery_quality').length,
    total_images: entries.reduce((sum, entry) => sum + entry.images.length, 0),
    safety: {
      no_supabase_writes: true,
      no_cloudinary_uploads: true,
      no_publication_changes: true,
      no_external_model_calls: true,
    },
    entries,
  };

  mkdirSync(outputDir, { recursive: true });
  writeFileSync(path.join(outputDir, 'gallery_review_manifest.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  writeFileSync(path.join(outputDir, 'gallery_review_report.md'), buildReport(result), 'utf8');
  writeFileSync(path.join(outputDir, 'gallery_review_dashboard.html'), buildDashboard(result), 'utf8');

  console.log(`Gallery review manifest written to ${path.join(outputDir, 'gallery_review_manifest.json')}`);
  console.log(`Gallery review report written to ${path.join(outputDir, 'gallery_review_report.md')}`);
  console.log(`Gallery review dashboard written to ${path.join(outputDir, 'gallery_review_dashboard.html')}`);
  console.log(`E03 gallery review summary: venues=${result.total_venues}, ready=${result.ready_for_gallery_review}, needs_more_spatial=${result.needs_more_spatial_images}, blocked=${result.blocked_gallery_quality}, images=${result.total_images}`);
  return result;
}

function buildReviewEntry(selection: VenueGallerySelection): GalleryReviewEntry {
  const images = selection.selected_gallery_images || [];
  const spatialCount = images.filter((image) => SPATIAL_ROLES.has(image.role)).length;
  const supportCount = images.filter((image) => image.role === 'supporting_food_drink').length;
  const googlePlacesCount = images.filter((image) => image.rights_status === 'google_places_attribution_required').length;
  const existingCloudinaryCount = images.filter((image) => image.rights_status === 'existing_cloudinary_ok').length;
  const reviewNotes: string[] = [];
  let status: GalleryReviewStatus = 'ready_for_gallery_review';

  if (images.length === 0) {
    status = 'blocked_gallery_quality';
    reviewNotes.push('No selectable gallery images were found from existing classified assets.');
  } else if (spatialCount < 2 || images.length < 3) {
    status = 'needs_more_spatial_images';
    reviewNotes.push('Gallery is usable as a draft, but it lacks enough spatial/atmosphere images.');
  }
  if (supportCount > 0) reviewNotes.push('Food/drink images are included only as supporting assets, not as hero replacements.');
  if (googlePlacesCount > 0) reviewNotes.push('Google Places images require attribution/compliance review before public use.');

  return {
    venue_id: selection.venue_id,
    venue_name: selection.venue_name,
    current_hero_url: selection.current_hero_url,
    status,
    default_decision: 'pause',
    selected_count: images.length,
    spatial_count: spatialCount,
    support_count: supportCount,
    google_places_count: googlePlacesCount,
    existing_cloudinary_count: existingCloudinaryCount,
    warnings: selection.warnings || [],
    review_notes: reviewNotes,
    images,
  };
}

function buildReport(result: GalleryReviewManifest): string {
  return [
    `# Gallery Review Manifest - ${result.run_id}`,
    '',
    `- Generated: ${result.generated_at}`,
    `- Total venues: ${result.total_venues}`,
    `- Ready for gallery review: ${result.ready_for_gallery_review}`,
    `- Needs more spatial images: ${result.needs_more_spatial_images}`,
    `- Blocked gallery quality: ${result.blocked_gallery_quality}`,
    `- Total selected images: ${result.total_images}`,
    '',
    '## Venue Status',
    '',
    '| Venue | Status | Images | Spatial | Support | Warnings | Notes |',
    '| --- | --- | ---: | ---: | ---: | --- | --- |',
    ...result.entries.map((entry) =>
      [
        escapeMd(entry.venue_name),
        entry.status,
        String(entry.selected_count),
        String(entry.spatial_count),
        String(entry.support_count),
        escapeMd(entry.warnings.join(', ') || 'none'),
        escapeMd(entry.review_notes.join(' ') || 'none'),
      ].join(' | '),
    ).map((row) => `| ${row} |`),
    '',
    '## Safety',
    '',
    ...Object.entries(result.safety).map(([key, value]) => `- ${key}: ${value}`),
    '',
    '## Next Step',
    '',
    '- Open gallery_review_dashboard.html and manually approve, pause, or reject gallery images.',
    '- This stage does not apply changes. A later apply stage must consume a reviewed manifest explicitly.',
  ].join('\n') + '\n';
}

function buildDashboard(result: GalleryReviewManifest): string {
  const json = JSON.stringify(result).replace(/</g, '\\u003c');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Korantis Gallery Review - ${escapeHtml(result.run_id)}</title>
<style>
:root{--bg:#0b100c;--panel:#151912;--line:#33402f;--text:#f2ead7;--muted:#bdb39f;--good:#63d992;--warn:#e9c15f;--bad:#ff7777}
*{box-sizing:border-box}body{margin:0;background:linear-gradient(135deg,#070a08,#11170f);color:var(--text);font-family:Georgia,"Times New Roman",serif}
header{position:sticky;top:0;z-index:3;padding:18px 22px;background:rgba(9,13,10,.94);border-bottom:1px solid var(--line);backdrop-filter:blur(10px)}
h1{margin:0;font-size:28px}p{color:var(--muted)}button{background:#1c2419;color:var(--text);border:1px solid var(--line);border-radius:999px;padding:9px 14px;cursor:pointer}
button:hover{border-color:#d6c38f}.summary{display:grid;grid-template-columns:repeat(5,minmax(120px,1fr));gap:12px;margin-top:14px}.metric{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:14px}.metric strong{display:block;font-size:26px}
.toolbar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:14px}.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(420px,1fr));gap:18px;padding:22px}
.card{background:rgba(21,25,18,.94);border:1px solid var(--line);border-radius:18px;overflow:hidden}.card-head{padding:16px;border-bottom:1px solid var(--line)}
.card h2{margin:0 0 6px;font-size:20px}.bad{color:var(--bad)}.warn{color:var(--warn)}.good{color:var(--good)}
.images{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;padding:12px}.image{position:relative;background:#080a08;border:1px solid #263023;border-radius:12px;overflow:hidden}
.image img{display:block;width:100%;height:220px;object-fit:cover}.image figcaption{padding:8px;font-size:12px;color:var(--muted)}
.actions{display:flex;gap:8px;padding:0 16px 16px}.notes{padding:0 16px 16px;color:var(--muted);font-size:13px}
.decision{border-color:#665a38}.decision[data-decision="approve_gallery"]{border-color:var(--good)}.decision[data-decision="reject_gallery"]{border-color:var(--bad)}
textarea{width:100%;min-height:58px;background:#080a08;color:var(--text);border:1px solid var(--line);border-radius:10px;padding:8px}
@media(max-width:800px){.summary{grid-template-columns:repeat(2,1fr)}.cards{grid-template-columns:1fr;padding:12px}.images{grid-template-columns:1fr}.image img{height:260px}}
</style>
</head>
<body>
<header>
  <p>Korantis enrichment gallery review</p>
  <h1>${escapeHtml(result.run_id)}</h1>
  <div class="summary">
    <div class="metric"><span>Total venues</span><strong id="metric-total">${result.total_venues}</strong></div>
    <div class="metric"><span>Ready</span><strong class="good">${result.ready_for_gallery_review}</strong></div>
    <div class="metric"><span>Needs more spatial</span><strong class="warn">${result.needs_more_spatial_images}</strong></div>
    <div class="metric"><span>Blocked</span><strong class="bad">${result.blocked_gallery_quality}</strong></div>
    <div class="metric"><span>Images</span><strong>${result.total_images}</strong></div>
  </div>
  <div class="toolbar">
    <button id="download">Download reviewed JSON</button>
    <button id="approveReady">Approve ready only</button>
    <button id="pauseAll">Pause all</button>
    <span id="counts"></span>
  </div>
</header>
<main class="cards" id="cards"></main>
<script>
const manifest = ${json};
const decisions = new Map(manifest.entries.map(entry => [entry.venue_id, { decision: entry.default_decision, reviewer_notes: '' }]));
const cards = document.getElementById('cards');
const counts = document.getElementById('counts');

function statusClass(status){
  if(status === 'ready_for_gallery_review') return 'good';
  if(status === 'needs_more_spatial_images') return 'warn';
  return 'bad';
}
function setDecision(id, decision){
  const existing = decisions.get(id) || {};
  decisions.set(id, { ...existing, decision });
  document.querySelectorAll('[data-venue="'+id+'"]').forEach(node => node.dataset.decision = decision);
  renderCounts();
}
function renderCounts(){
  const values = [...decisions.values()];
  const approved = values.filter(item => item.decision === 'approve_gallery').length;
  const rejected = values.filter(item => item.decision === 'reject_gallery').length;
  const paused = values.filter(item => item.decision === 'pause').length;
  counts.textContent = 'Approved ' + approved + ' | Rejected ' + rejected + ' | Paused ' + paused;
}
function render(){
  cards.innerHTML = manifest.entries.map(entry => {
    const images = entry.images.map(image => '<figure class="image"><img src="'+image.resolved_image_url+'" loading="lazy" /><figcaption>'+image.role+' | score '+image.selection_score+' | '+image.rights_status+'</figcaption></figure>').join('');
    return '<section class="card decision" data-venue="'+entry.venue_id+'" data-decision="'+entry.default_decision+'"><div class="card-head"><h2>'+entry.venue_name+'</h2><p class="'+statusClass(entry.status)+'">'+entry.status+'</p><p>'+entry.selected_count+' images, '+entry.spatial_count+' spatial, '+entry.support_count+' support</p></div><div class="images">'+images+'</div><div class="notes">'+entry.review_notes.join('<br>')+'</div><div class="actions"><button onclick="setDecision(\\''+entry.venue_id+'\\',\\'approve_gallery\\')">Approve gallery</button><button onclick="setDecision(\\''+entry.venue_id+'\\',\\'pause\\')">Pause</button><button onclick="setDecision(\\''+entry.venue_id+'\\',\\'reject_gallery\\')">Reject</button></div><div class="notes"><textarea placeholder="Reviewer notes" oninput="decisions.get(\\''+entry.venue_id+'\\').reviewer_notes=this.value"></textarea></div></section>';
  }).join('');
  renderCounts();
}
document.getElementById('approveReady').onclick = () => manifest.entries.forEach(entry => setDecision(entry.venue_id, entry.status === 'ready_for_gallery_review' ? 'approve_gallery' : 'pause'));
document.getElementById('pauseAll').onclick = () => manifest.entries.forEach(entry => setDecision(entry.venue_id, 'pause'));
document.getElementById('download').onclick = () => {
  const reviewed = { ...manifest, reviewed_at: new Date().toISOString(), entries: manifest.entries.map(entry => ({ ...entry, reviewer_decision: decisions.get(entry.venue_id).decision, reviewer_notes: decisions.get(entry.venue_id).reviewer_notes })) };
  const blob = new Blob([JSON.stringify(reviewed, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = manifest.run_id + '_gallery_reviewed.json';
  a.click();
  URL.revokeObjectURL(url);
};
render();
</script>
</body>
</html>
`;
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, 'utf8')) as T;
}

function escapeHtml(value: string): string {
  return safeString(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseArgs(argv: string[]): Options {
  const runIdFlagIndex = argv.indexOf('--run-id');
  const runId = runIdFlagIndex >= 0 ? safeString(argv[runIdFlagIndex + 1]) : safeString(argv[0]);
  if (!runId) throw new Error('Usage: npx tsx pipeline/enrichment/03_generate_gallery_review.ts --run-id <run_id>');
  return { runId };
}

const isCli = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isCli) {
  generateGalleryReview(parseArgs(process.argv.slice(2))).catch((error: unknown) => {
    console.error(`E03 gallery review failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
