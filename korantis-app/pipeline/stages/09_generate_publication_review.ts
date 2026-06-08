import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { BatchResult, ReviewQueueItem } from '../types';

type PublicationDecision = 'approve' | 'reject' | 'pause';

interface ApprovalManifestVenue {
  venue_name: string;
  status: string;
  staging_score: number;
  blocker_reasons?: string[];
  warning_reasons?: string[];
  hero_image_url?: string;
  image_publication_status?: string;
}

interface ApprovalManifest {
  batch_id: string;
  approved_for_db_staging: ApprovalManifestVenue[];
  needs_review: ApprovalManifestVenue[];
  blocked: ApprovalManifestVenue[];
}

interface PublicationDecisionRecord {
  venue_name: string;
  current_status: string;
  publication_decision: PublicationDecision;
  publish_eligible: boolean;
  default_reason: string;
  reviewer_notes: string;
  staging_score: number;
  blockers: string[];
  warnings: string[];
  hero_image_url?: string;
  image_source_type?: string;
  image_publication_status: string;
  source_url?: string;
  tagline?: string;
  description?: string;
  mood_tags: string[];
  neighborhood?: string;
  venue_type?: string;
  rating?: number;
  review_count?: number;
  google_maps_url?: string;
}

interface PublicationDecisionManifest {
  batch_id: string;
  generated_at: string;
  status: 'review_pending';
  safety: {
    no_public_writes: true;
    no_supabase_writes: true;
    no_cloudinary_uploads: true;
    no_publication: true;
  };
  decisions: PublicationDecisionRecord[];
}

interface Stage09Result {
  batch_id: string;
  generated_at: string;
  total_venues: number;
  publish_eligible_count: number;
  blocked_count: number;
  default_paused_count: number;
  dashboard_path: string;
  decision_manifest_path: string;
  report_path: string;
}

export function generatePublicationReview(batchName: string): Stage09Result {
  const outputDir = path.join(process.cwd(), 'data', 'batches', batchName);
  const batchResult = readJson<BatchResult>(path.join(outputDir, 'batch_result_quality_gated.json'));
  const approvalManifest = readJson<ApprovalManifest>(path.join(outputDir, 'approval_manifest.json'));
  const generatedAt = new Date().toISOString();
  const decisions = batchResult.candidates.map((candidate) => buildDecision(candidate, approvalManifest));
  const manifest: PublicationDecisionManifest = {
    batch_id: batchResult.batch_id,
    generated_at: generatedAt,
    status: 'review_pending',
    safety: {
      no_public_writes: true,
      no_supabase_writes: true,
      no_cloudinary_uploads: true,
      no_publication: true,
    },
    decisions,
  };

  mkdirSync(outputDir, { recursive: true });
  const decisionManifestPath = path.join(outputDir, 'publication_decision_manifest.json');
  const dashboardPath = path.join(outputDir, 'publication_review_dashboard.html');
  const reportPath = path.join(outputDir, 'publication_review_report.md');
  writeFileSync(decisionManifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  writeFileSync(dashboardPath, renderDashboard(batchResult, manifest), 'utf8');
  writeFileSync(reportPath, buildReport(batchResult, manifest), 'utf8');

  const result: Stage09Result = {
    batch_id: batchResult.batch_id,
    generated_at: generatedAt,
    total_venues: decisions.length,
    publish_eligible_count: decisions.filter((decision) => decision.publish_eligible).length,
    blocked_count: decisions.filter((decision) => !decision.publish_eligible).length,
    default_paused_count: decisions.filter((decision) => decision.publication_decision === 'pause').length,
    dashboard_path: dashboardPath,
    decision_manifest_path: decisionManifestPath,
    report_path: reportPath,
  };

  console.log(`Publication review dashboard written to ${dashboardPath}`);
  console.log(`Publication decision manifest written to ${decisionManifestPath}`);
  console.log(`Publication review report written to ${reportPath}`);
  console.log(
    `Stage 09 summary: total=${result.total_venues}, publish_eligible=${result.publish_eligible_count}, blocked=${result.blocked_count}, default_paused=${result.default_paused_count}`,
  );

  return result;
}

function buildDecision(candidate: ReviewQueueItem, approvalManifest: ApprovalManifest): PublicationDecisionRecord {
  const hero = candidate.venue.hero_image || candidate.venue.images.hero;
  const inApprovedManifest = approvalManifest.approved_for_db_staging.some((venue) => normalizeName(venue.venue_name) === normalizeName(candidate.venue_name));
  const publishEligible =
    candidate.status === 'ready_for_db_staging' &&
    inApprovedManifest &&
    candidate.errors.length === 0 &&
    Boolean(hero?.resolved_image_url);

  return {
    venue_name: candidate.venue_name,
    current_status: candidate.status,
    publication_decision: 'pause',
    publish_eligible: publishEligible,
    default_reason: publishEligible
      ? 'Eligible for manual publication review. Default is pause until a reviewer approves.'
      : `Not eligible for publication review: ${candidate.errors.join(', ') || 'not approved for DB staging'}`,
    reviewer_notes: '',
    staging_score: candidate.staging_score,
    blockers: candidate.errors,
    warnings: candidate.warnings,
    hero_image_url: hero?.resolved_image_url,
    image_source_type: hero?.source_type,
    image_publication_status: hero?.publication_status || 'not_approved_for_publication',
    source_url: hero?.source_url,
    tagline: candidate.venue.editorial.tagline,
    description: candidate.venue.editorial.description || candidate.venue.editorial.description_short,
    mood_tags: candidate.venue.editorial.mood_tags,
    neighborhood: candidate.venue.raw.neighborhood,
    venue_type: candidate.venue.raw.type,
    rating: candidate.venue.raw.rating,
    review_count: candidate.venue.raw.user_ratings_total || candidate.venue.review_count,
    google_maps_url: candidate.venue.raw.google_maps_url,
  };
}

function renderDashboard(batchResult: BatchResult, manifest: PublicationDecisionManifest): string {
  const data = JSON.stringify(manifest).replace(/</g, '\\u003c');
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Korantis Publication Review - ${escapeHtml(batchResult.batch_id)}</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #0f1110;
      --panel: #191b18;
      --soft: #242720;
      --line: #3a3f34;
      --text: #f5f0e8;
      --muted: #aaa397;
      --green: #7ac48f;
      --red: #e17d72;
      --gold: #d8b76f;
      --blue: #83aee6;
    }
    * { box-sizing: border-box; }
    body { margin: 0; background: radial-gradient(circle at top left, #243022, var(--bg) 34rem); color: var(--text); font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    header, main { max-width: none; margin: 0 auto; padding: 10px 14px; }
    header { position: sticky; top: 0; z-index: 9; background: rgba(15,17,16,.96); backdrop-filter: blur(10px); border-bottom: 1px solid var(--line); }
    h1, h2, h3, p { margin: 0; }
    h1 { font-size: 15px; max-width: 420px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .muted { color: var(--muted); }
    .topbar { display: grid; grid-template-columns: minmax(260px, 1fr) auto; gap: 14px; align-items: center; }
    .summary { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 0; justify-content: flex-end; }
    .stat, .card, .tools, textarea { border: 1px solid var(--line); background: var(--panel); border-radius: 12px; }
    .stat { padding: 6px 9px; min-width: 82px; }
    .stat span { font-size: 11px; }
    .stat strong { display: inline; font-size: 15px; margin-left: 5px; }
    .tools { padding: 7px 8px; margin: 8px 0 0; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
    button { border: 1px solid var(--line); background: var(--soft); color: var(--text); border-radius: 999px; padding: 6px 10px; cursor: pointer; font-size: 12px; }
    button:hover { border-color: var(--gold); }
    button.active.approve { background: rgba(122,196,143,.2); border-color: var(--green); color: var(--green); }
    button.active.reject { background: rgba(225,125,114,.2); border-color: var(--red); color: var(--red); }
    button.active.pause { background: rgba(216,183,111,.2); border-color: var(--gold); color: var(--gold); }
    button:disabled { opacity: .38; cursor: not-allowed; }
    .filter.active { border-color: var(--blue); color: var(--blue); }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(520px, 1fr)); gap: 18px; align-items: start; }
    .card { overflow: hidden; }
    .image { height: 300px; background: var(--soft); display: grid; place-items: center; color: var(--muted); }
    .image img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .body { padding: 16px; display: grid; gap: 11px; }
    .row { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
    .badge { border: 1px solid var(--line); border-radius: 999px; padding: 4px 8px; color: var(--muted); font-size: 12px; }
    .eligible { color: var(--green); border-color: rgba(122,196,143,.55); }
    .blocked { color: var(--red); border-color: rgba(225,125,114,.55); }
    .score { color: var(--blue); }
    textarea { width: 100%; min-height: 118px; color: var(--text); padding: 10px; resize: vertical; line-height: 1.45; }
    .copy { border-left: 3px solid rgba(216,183,111,.55); padding: 8px 0 8px 10px; display: grid; gap: 6px; background: rgba(255,255,255,.02); border-radius: 8px; }
    .meta { display: grid; gap: 5px; }
    .hide { display: none; }
    .live-counter { position: fixed; right: 18px; bottom: 18px; z-index: 10; display: flex; gap: 8px; align-items: center; padding: 10px 12px; border: 1px solid var(--line); border-radius: 999px; background: rgba(15,17,16,.94); box-shadow: 0 12px 40px rgba(0,0,0,.35); }
    .live-counter strong { color: var(--green); }
    .small { font-size: 12px; }
    a { color: var(--blue); }
    @media (max-width: 900px) {
      header, main { padding: 12px; }
      .topbar { grid-template-columns: 1fr; }
      .summary { justify-content: flex-start; }
      .grid { grid-template-columns: 1fr; }
      .image { height: 230px; }
    }
  </style>
</head>
<body>
  <header>
    <div class="topbar">
      <div>
        <p class="muted small">Stage 09 review</p>
        <h1>${escapeHtml(batchResult.batch_id)}</h1>
      </div>
      <div class="summary">
        <div class="stat"><span class="muted">Total</span><strong id="total">0</strong></div>
        <div class="stat"><span class="muted">Eligible</span><strong id="eligible">0</strong></div>
        <div class="stat"><span class="muted">Approved</span><strong id="approved">0</strong></div>
        <div class="stat"><span class="muted">Rejected</span><strong id="rejected">0</strong></div>
        <div class="stat"><span class="muted">Paused</span><strong id="paused">0</strong></div>
      </div>
    </div>
    <div class="tools">
      <button onclick="downloadManifest()">Download decision JSON</button>
      <button onclick="approveAllEligible()">Approve all eligible</button>
      <button onclick="pauseAll()">Pause all</button>
      <button class="filter active" data-filter="all" onclick="setFilter('all')">All</button>
      <button class="filter" data-filter="eligible" onclick="setFilter('eligible')">Eligible only</button>
      <button class="filter" data-filter="blocked" onclick="setFilter('blocked')">Blocked</button>
      <button class="filter" data-filter="approved" onclick="setFilter('approved')">Approved</button>
      <button class="filter" data-filter="paused" onclick="setFilter('paused')">Paused</button>
    </div>
  </header>
  <main>
    <section class="grid" id="grid"></section>
  </main>
  <div class="live-counter">
    <span class="muted small">Live decisions</span>
    <span class="small">Approved <strong id="liveApproved">0</strong></span>
    <span class="small">Rejected <strong id="liveRejected">0</strong></span>
    <span class="small">Paused <strong id="livePaused">0</strong></span>
  </div>
  <script>
    const manifest = ${data};
    const decisions = manifest.decisions;
    let activeFilter = 'all';

    function render() {
      renderCounts();
      document.querySelectorAll('.filter').forEach(button => button.classList.toggle('active', button.dataset.filter === activeFilter));
      document.getElementById('grid').innerHTML = decisions.map((decision, index) => card(decision, index)).join('');
    }

    function renderCounts() {
      const approved = decisions.filter(d => d.publication_decision === 'approve').length;
      const rejected = decisions.filter(d => d.publication_decision === 'reject').length;
      const paused = decisions.filter(d => d.publication_decision === 'pause').length;
      document.getElementById('total').textContent = decisions.length;
      document.getElementById('eligible').textContent = decisions.filter(d => d.publish_eligible).length;
      document.getElementById('approved').textContent = approved;
      document.getElementById('rejected').textContent = rejected;
      document.getElementById('paused').textContent = paused;
      document.getElementById('liveApproved').textContent = approved;
      document.getElementById('liveRejected').textContent = rejected;
      document.getElementById('livePaused').textContent = paused;
    }

    function card(decision, index) {
      const hidden = matchesFilter(decision) ? '' : ' hide';
      const image = decision.hero_image_url ? '<img src="' + esc(decision.hero_image_url) + '" alt="">' : 'No hero image';
      const eligibleClass = decision.publish_eligible ? 'eligible' : 'blocked';
      const eligibleText = decision.publish_eligible ? 'publish review eligible' : 'blocked';
      return '<article class="card' + hidden + '" data-index="' + index + '">' +
        '<div class="image">' + image + '</div>' +
        '<div class="body">' +
        '<div class="row"><span class="badge ' + eligibleClass + '">' + eligibleText + '</span><span class="badge score">score ' + decision.staging_score + '</span><span class="badge">' + esc(decision.current_status) + '</span></div>' +
        '<h3>' + esc(decision.venue_name) + '</h3>' +
        '<div class="copy">' +
        '<p><strong>' + esc(decision.tagline || 'No tagline') + '</strong></p>' +
        '<p class="muted">' + esc(decision.description || 'No description') + '</p>' +
        '<p class="muted small">Mood: ' + esc((decision.mood_tags || []).join(', ') || 'none') + '</p>' +
        '</div>' +
        '<div class="meta">' +
        '<p class="muted small">' + esc(decision.default_reason) + '</p>' +
        '<p class="muted small">Place: ' + esc(decision.neighborhood || 'unknown') + ' / ' + esc(decision.venue_type || 'unknown') + ' / rating ' + esc(decision.rating || 'n/a') + ' / reviews ' + esc(decision.review_count || 'n/a') + '</p>' +
        '<p class="muted small">Image: ' + esc(decision.image_source_type || 'unknown') + ' / ' + esc(decision.image_publication_status) + '</p>' +
        '<p class="muted small">Warnings: ' + esc((decision.warnings || []).join(', ') || 'none') + '</p>' +
        '<p class="muted small">Blockers: ' + esc((decision.blockers || []).join(', ') || 'none') + '</p>' +
        '<p class="small">' +
        (decision.source_url ? '<a href="' + esc(decision.source_url) + '" target="_blank" rel="noreferrer">image source</a> ' : '') +
        (decision.google_maps_url ? '<a href="' + esc(decision.google_maps_url) + '" target="_blank" rel="noreferrer">google maps</a>' : '') +
        '</p>' +
        '</div>' +
        '<div class="row">' +
        '<button class="approve ' + active(decision, 'approve') + '" ' + (decision.publish_eligible ? '' : 'disabled') + ' onclick="setDecision(' + index + ', \\'approve\\')">Approve</button>' +
        '<button class="reject ' + active(decision, 'reject') + '" onclick="setDecision(' + index + ', \\'reject\\')">Reject</button>' +
        '<button class="pause ' + active(decision, 'pause') + '" onclick="setDecision(' + index + ', \\'pause\\')">Pause</button>' +
        '</div>' +
        '<textarea placeholder="Reviewer notes" oninput="setNotes(' + index + ', this.value)">' + esc(decision.reviewer_notes || '') + '</textarea>' +
        '</div>' +
      '</article>';
    }

    function active(decision, value) {
      return decision.publication_decision === value ? 'active' : '';
    }

    function matchesFilter(decision) {
      if (activeFilter === 'eligible') return decision.publish_eligible;
      if (activeFilter === 'blocked') return !decision.publish_eligible;
      if (activeFilter === 'approved') return decision.publication_decision === 'approve';
      if (activeFilter === 'paused') return decision.publication_decision === 'pause';
      return true;
    }

    function setFilter(value) {
      activeFilter = value;
      render();
    }

    function setDecision(index, value) {
      decisions[index].publication_decision = value;
      updateCard(index);
      renderCounts();
    }

    function setNotes(index, value) {
      decisions[index].reviewer_notes = value;
    }

    function approveAllEligible() {
      decisions.forEach(decision => {
        if (decision.publish_eligible) decision.publication_decision = 'approve';
      });
      render();
    }

    function pauseAll() {
      decisions.forEach(decision => decision.publication_decision = 'pause');
      render();
    }

    function updateCard(index) {
      const current = document.querySelector('[data-index="' + index + '"]');
      if (!current) {
        render();
        return;
      }
      const wrapper = document.createElement('div');
      wrapper.innerHTML = card(decisions[index], index);
      current.replaceWith(wrapper.firstElementChild);
    }

    function downloadManifest() {
      manifest.generated_at = new Date().toISOString();
      const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'publication_decision_manifest.reviewed.json';
      link.click();
      URL.revokeObjectURL(url);
    }

    function esc(value) {
      return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
    }

    render();
  </script>
</body>
</html>`;
}

function buildReport(batchResult: BatchResult, manifest: PublicationDecisionManifest): string {
  const eligible = manifest.decisions.filter((decision) => decision.publish_eligible);
  const blocked = manifest.decisions.filter((decision) => !decision.publish_eligible);
  return [
    '# Stage 09 Publication Review Report',
    '',
    `- Batch: ${batchResult.batch_id}`,
    `- Generated: ${manifest.generated_at}`,
    `- Total venues: ${manifest.decisions.length}`,
    `- Publish-review eligible: ${eligible.length}`,
    `- Blocked from publication review: ${blocked.length}`,
    `- Default decision: pause`,
    '',
    '## Safety',
    '',
    '- No public writes.',
    '- No Supabase writes.',
    '- No Cloudinary uploads.',
    '- No publication.',
    '- This stage only creates a review dashboard and a decision manifest.',
    '',
    '## Eligible Venues',
    '',
    ...eligible.map((decision) => `- ${decision.venue_name}: score ${decision.staging_score}; warnings ${decision.warnings.join(', ') || 'none'}`),
    '',
    '## Blocked Venues',
    '',
    ...(blocked.length > 0
      ? blocked.map((decision) => `- ${decision.venue_name}: ${decision.blockers.join(', ') || decision.default_reason}`)
      : ['- none']),
    '',
    '## Next Step',
    '',
    'Open `publication_review_dashboard.html`, choose approve/reject/pause, and download `publication_decision_manifest.reviewed.json`.',
  ].join('\n') + '\n';
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, 'utf8')) as T;
}

function normalizeName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const currentFile = path.resolve(fileURLToPath(import.meta.url));
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : '';

if (currentFile === invokedFile) {
  const batchName = process.argv[2];
  if (!batchName) {
    console.error('Usage: npx tsx pipeline/stages/09_generate_publication_review.ts <batch_id>');
    process.exitCode = 1;
  } else {
    try {
      generatePublicationReview(batchName);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Stage 09 publication review failed: ${message}`);
      process.exitCode = 1;
    }
  }
}
