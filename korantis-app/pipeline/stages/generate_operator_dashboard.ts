import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { BatchResult, ReviewQueueItem } from '../types';

interface OperatorSummary {
  batch_id: string;
  generated_at: string;
  source_files: Record<string, boolean>;
  venue_acquisition: {
    total: number;
    found: number;
    failed: number;
    ready_for_db_staging: number;
    needs_review: number;
    blocked: number;
    primary_blockers: Record<string, number>;
  };
  gallery_enrichment: {
    candidates_found: number;
    candidates_rejected: number;
    final_vision_queue: number;
    selected_heroes: number;
    venues_with_hero: number;
    venues_without_hero: string[];
    source_breakdown: Record<string, number>;
  };
  staging_sync: {
    dry_run_approved: number;
    dry_run_blocked: number;
    applied: boolean;
    applied_venues: number;
    selected_hero_rows: number;
    image_rights_status: string;
  };
  venues: OperatorVenueRow[];
  next_actions: string[];
}

interface OperatorVenueRow {
  name: string;
  neighborhood: string;
  type: string;
  status: string;
  score: number;
  has_hero: boolean;
  hero_source: string;
  image_rights_status: string;
  mood_tags: string[];
  blockers: string[];
  warnings: string[];
  gallery_candidates: number;
  selected_hero: boolean;
  next_action: string;
}

interface Stage03Summary extends Record<string, unknown> {
  candidates_found?: number;
  input_count?: number;
  candidates_rejected?: number;
  rejected_count?: number;
  final_queue_size?: number;
  source_breakdown?: Record<string, number>;
}

interface Stage03QueueItem {
  venue_name?: string;
  source_type?: string;
}

interface DryRunArtifact {
  approved_count?: number;
  blocked_count?: number;
  venue_mappings?: Array<{
    venue_name?: string;
    image_rights_status?: string;
  }>;
  apply_preflight?: {
    partial_writes_detected?: {
      selected_hero_images_for_approved_venues?: number;
    };
  };
}

interface ApplyArtifact {
  mode?: string;
  approved_count?: number;
  venue_ids_synced?: string[];
  safety_checks?: Record<string, boolean>;
}

export function generateOperatorDashboard(batchName: string): OperatorSummary {
  const outputDir = path.join(process.cwd(), 'data', 'batches', batchName);
  mkdirSync(outputDir, { recursive: true });

  const batch = readFirstExisting<BatchResult>(outputDir, [
    'batch_result_quality_gated.json',
    'batch_result_with_editorial.json',
    'batch_result_enriched.json',
    'batch_result_with_images.json',
    'batch_result.json',
  ]);
  if (!batch) throw new Error(`No batch result found for ${batchName}`);

  const stage01 = readOptional<Record<string, unknown>>(outputDir, 'stage_01_raw_venues.json');
  const stage03 = readOptional<Record<string, unknown>>(outputDir, 'stage_03_final_vision_queue.json');
  const stage04 = readOptional<Record<string, unknown>>(outputDir, 'stage_04_selected_images.json');
  const dryRun = readOptional<DryRunArtifact>(outputDir, 'supabase_staging_dry_run.json');
  const apply = readOptional<ApplyArtifact>(outputDir, 'supabase_staging_apply_result.json');
  const stage03Queue = getStage03Queue(stage03);
  const stage03Summary = getObject<Stage03Summary>(stage03, 'summary') || {};
  const stage04Selected = getSelectedHeroCount(stage04);
  const galleryCandidatesByVenue = countBy(stage03Queue.map((item) => item.venue_name || 'unknown'));
  const sourceBreakdown = stage03Summary.source_breakdown || countBy(stage03Queue.map((item) => item.source_type || 'unknown'));
  const rows = batch.candidates.map((candidate) =>
    buildVenueRow(candidate, galleryCandidatesByVenue[candidate.venue_name] || 0, hasSelectedHero(stage04, candidate.venue_name)),
  );
  const blockers = countBy(batch.candidates.flatMap((candidate) => candidate.errors));
  const venuesWithoutHero = rows.filter((row) => !row.has_hero).map((row) => row.name);

  const summary: OperatorSummary = {
    batch_id: batch.batch_id,
    generated_at: new Date().toISOString(),
    source_files: {
      batch_result_quality_gated: existsSync(path.join(outputDir, 'batch_result_quality_gated.json')),
      stage_01_raw_venues: Boolean(stage01),
      stage_03_final_vision_queue: Boolean(stage03),
      stage_04_selected_images: Boolean(stage04),
      supabase_staging_dry_run: Boolean(dryRun),
      supabase_staging_apply_result: Boolean(apply),
    },
    venue_acquisition: {
      total: batch.summary.input,
      found: countFoundVenues(batch),
      failed: Math.max(0, batch.summary.input - countFoundVenues(batch)),
      ready_for_db_staging: batch.summary.ready_for_db_staging ?? 0,
      needs_review: batch.summary.needs_review,
      blocked: batch.summary.blocked,
      primary_blockers: blockers,
    },
    gallery_enrichment: {
      candidates_found: numberValue(stage03Summary.candidates_found, numberValue(stage03Summary.input_count)),
      candidates_rejected: numberValue(stage03Summary.candidates_rejected, numberValue(stage03Summary.rejected_count)),
      final_vision_queue: numberValue(stage03Summary.final_queue_size, stage03Queue.length),
      selected_heroes: stage04Selected,
      venues_with_hero: rows.filter((row) => row.has_hero).length,
      venues_without_hero: venuesWithoutHero,
      source_breakdown: sourceBreakdown,
    },
    staging_sync: {
      dry_run_approved: dryRun?.approved_count || 0,
      dry_run_blocked: dryRun?.blocked_count || 0,
      applied: apply?.mode === 'apply',
      applied_venues: apply?.approved_count || apply?.venue_ids_synced?.length || 0,
      selected_hero_rows: dryRun?.apply_preflight?.partial_writes_detected?.selected_hero_images_for_approved_venues || 0,
      image_rights_status: summarizeImageRights(rows),
    },
    venues: rows,
    next_actions: buildNextActions(rows, apply?.mode === 'apply'),
  };

  writeFileSync(path.join(outputDir, 'batch_status_summary.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  writeFileSync(path.join(outputDir, 'operator_dashboard.html'), renderOperatorDashboard(summary), 'utf8');
  console.log(`Operator summary written to ${path.join(outputDir, 'batch_status_summary.json')}`);
  console.log(`Operator dashboard written to ${path.join(outputDir, 'operator_dashboard.html')}`);
  console.log(
    `Operator summary: venues=${summary.venue_acquisition.total}, ready=${summary.venue_acquisition.ready_for_db_staging}, blocked=${summary.venue_acquisition.blocked}, selected_heroes=${summary.gallery_enrichment.selected_heroes}`,
  );

  return summary;
}

function buildVenueRow(candidate: ReviewQueueItem, galleryCandidates: number, selectedHero: boolean): OperatorVenueRow {
  const hero = candidate.venue.hero_image || candidate.venue.images.hero;
  return {
    name: candidate.venue_name,
    neighborhood: candidate.venue.raw.neighborhood || candidate.venue.raw.input.neighborhood || 'unknown',
    type: candidate.venue.raw.type || 'unknown',
    status: candidate.status,
    score: candidate.staging_score,
    has_hero: Boolean(hero),
    hero_source: hero?.source_type || 'none',
    image_rights_status: hero?.publication_status || 'not_applicable',
    mood_tags: candidate.venue.editorial.mood_tags || [],
    blockers: candidate.errors,
    warnings: candidate.warnings,
    gallery_candidates: galleryCandidates,
    selected_hero: selectedHero,
    next_action: nextActionForVenue(candidate, Boolean(hero), selectedHero),
  };
}

function nextActionForVenue(candidate: ReviewQueueItem, hasHero: boolean, selectedHero: boolean): string {
  if (candidate.status === 'blocked' && candidate.errors.includes('no_hero_image')) {
    return 'Retry gallery enrichment with better official/interior sources.';
  }
  if (candidate.status === 'blocked') return `Fix blocker: ${candidate.errors[0] || 'unknown'}.`;
  if (!hasHero || !selectedHero) return 'Review gallery selection before staging.';
  if (candidate.status === 'ready_for_db_staging') return 'Ready for staging; image rights still require review before publication.';
  return 'Review manually.';
}

function buildNextActions(rows: OperatorVenueRow[], applied: boolean): string[] {
  const actions: string[] = [];
  const blocked = rows.filter((row) => row.status === 'blocked');
  if (blocked.length > 0) actions.push(`Resolve blocked venues: ${blocked.map((row) => `${row.name} (${row.blockers.join(', ')})`).join('; ')}.`);
  if (!applied) actions.push('Run Stage 08 dry-run, verify index/preflight, then apply only approved venues when ready.');
  if (applied) actions.push('Verify staging rows, then prepare the 50-venue Buenos Aires batch in dry-run mode.');
  actions.push('Do not publish public.venues until image rights and editorial review are complete.');
  return actions;
}

function renderOperatorDashboard(summary: OperatorSummary): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Korantis Operator Dashboard - ${escapeHtml(summary.batch_id)}</title>
  <style>
    :root {
      --bg: #f4efe5;
      --ink: #1e1c18;
      --muted: #746d61;
      --panel: #fffaf0;
      --line: #d6cabb;
      --green: #216b4b;
      --red: #9c342f;
      --gold: #8c6418;
      --blue: #265f82;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: radial-gradient(circle at top left, #fff7df, var(--bg) 40%, #eee3d2);
      color: var(--ink);
      font-family: Georgia, "Times New Roman", serif;
      line-height: 1.45;
    }
    header, main { max-width: 1320px; margin: 0 auto; padding: 28px; }
    h1, h2, h3, p { margin: 0; }
    h1 { font-size: clamp(28px, 4vw, 48px); line-height: 1; letter-spacing: -0.04em; }
    h2 { margin: 28px 0 12px; font-size: 22px; letter-spacing: -0.02em; }
    h3 { font-size: 16px; }
    .muted { color: var(--muted); }
    .topline { text-transform: uppercase; letter-spacing: .14em; font-size: 12px; color: var(--muted); margin-bottom: 10px; }
    .lanes { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-top: 22px; }
    .lane, .card, .panel {
      background: color-mix(in srgb, var(--panel) 88%, white);
      border: 1px solid var(--line);
      box-shadow: 0 14px 40px rgba(46, 36, 22, .08);
      border-radius: 18px;
    }
    .lane { padding: 20px; min-height: 210px; }
    .lane strong { display: block; margin-top: 10px; font-size: 46px; line-height: 1; }
    .metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 16px; }
    .metric { border-top: 1px solid var(--line); padding-top: 10px; }
    .metric span { display: block; color: var(--muted); font-size: 12px; }
    .metric b { font-size: 22px; }
    .cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(245px, 1fr)); gap: 12px; }
    .card { padding: 14px; display: grid; gap: 8px; }
    .status { display: inline-flex; width: fit-content; padding: 4px 8px; border-radius: 999px; border: 1px solid var(--line); font-size: 12px; }
    .ready_for_db_staging { color: var(--green); border-color: color-mix(in srgb, var(--green) 45%, white); }
    .blocked { color: var(--red); border-color: color-mix(in srgb, var(--red) 45%, white); }
    .needs_review { color: var(--gold); border-color: color-mix(in srgb, var(--gold) 45%, white); }
    .tags { display: flex; flex-wrap: wrap; gap: 5px; }
    .tag { padding: 3px 7px; border-radius: 999px; background: #eadfce; color: var(--muted); font-size: 12px; }
    .panel { padding: 16px; margin-top: 12px; }
    .split { display: grid; grid-template-columns: 1.2fr .8fr; gap: 16px; }
    ul { margin: 8px 0 0; padding-left: 20px; }
    code { background: #eadfce; padding: 1px 4px; border-radius: 4px; }
    @media (max-width: 840px) {
      header, main { padding: 18px; }
      .lanes, .split { grid-template-columns: 1fr; }
      .metrics { grid-template-columns: repeat(2, 1fr); }
    }
  </style>
</head>
<body>
  <header>
    <p class="topline">Korantis Operator Dashboard</p>
    <h1>${escapeHtml(summary.batch_id)}</h1>
    <p class="muted">Two operating lanes: venue acquisition and gallery enrichment. Generated ${escapeHtml(summary.generated_at)}.</p>
    <section class="lanes">
      <article class="lane">
        <p class="topline">Objective 1</p>
        <h2>Venue Acquisition</h2>
        <strong>${summary.venue_acquisition.ready_for_db_staging}/${summary.venue_acquisition.total}</strong>
        <p class="muted">venues ready for DB staging</p>
        <div class="metrics">
          ${renderMetric('Found', summary.venue_acquisition.found)}
          ${renderMetric('Blocked', summary.venue_acquisition.blocked)}
          ${renderMetric('Needs review', summary.venue_acquisition.needs_review)}
        </div>
      </article>
      <article class="lane">
        <p class="topline">Objective 2</p>
        <h2>Gallery Enrichment</h2>
        <strong>${summary.gallery_enrichment.selected_heroes}/${summary.venue_acquisition.total}</strong>
        <p class="muted">selected heroes, publication rights still locked</p>
        <div class="metrics">
          ${renderMetric('M3 queue', summary.gallery_enrichment.final_vision_queue)}
          ${renderMetric('Candidates', summary.gallery_enrichment.candidates_found)}
          ${renderMetric('Rejected', summary.gallery_enrichment.candidates_rejected)}
        </div>
      </article>
    </section>
  </header>
  <main>
    <section class="split">
      <div>
        <h2>Venue Worklist</h2>
        <section class="cards">${summary.venues.map(renderVenueCard).join('')}</section>
      </div>
      <aside>
        <h2>Next Actions</h2>
        <section class="panel"><ul>${summary.next_actions.map((action) => `<li>${escapeHtml(action)}</li>`).join('')}</ul></section>
        <h2>Staging Sync</h2>
        <section class="panel">
          <p><b>Dry-run approved:</b> ${summary.staging_sync.dry_run_approved}</p>
          <p><b>Dry-run blocked:</b> ${summary.staging_sync.dry_run_blocked}</p>
          <p><b>Applied:</b> ${summary.staging_sync.applied ? 'yes' : 'no'}</p>
          <p><b>Applied venues:</b> ${summary.staging_sync.applied_venues}</p>
          <p><b>Selected hero rows:</b> ${summary.staging_sync.selected_hero_rows}</p>
          <p><b>Image rights:</b> <code>${escapeHtml(summary.staging_sync.image_rights_status)}</code></p>
        </section>
        <h2>Source Files</h2>
        <section class="panel">${Object.entries(summary.source_files).map(([key, value]) => `<p>${escapeHtml(key)}: <b>${value ? 'yes' : 'no'}</b></p>`).join('')}</section>
      </aside>
    </section>
  </main>
</body>
</html>`;
}

function renderMetric(label: string, value: number): string {
  return `<div class="metric"><span>${escapeHtml(label)}</span><b>${value}</b></div>`;
}

function renderVenueCard(row: OperatorVenueRow): string {
  return `<article class="card">
    <span class="status ${escapeHtml(row.status)}">${escapeHtml(row.status)}</span>
    <h3>${escapeHtml(row.name)} <span class="muted">${row.score}</span></h3>
    <p class="muted">${escapeHtml(row.neighborhood)} / ${escapeHtml(row.type)}</p>
    <p>Hero: <b>${row.has_hero ? 'yes' : 'no'}</b> / Source: ${escapeHtml(row.hero_source)}</p>
    <p>Gallery candidates: <b>${row.gallery_candidates}</b> / Selected: <b>${row.selected_hero ? 'yes' : 'no'}</b></p>
    <p>Rights: <code>${escapeHtml(row.image_rights_status)}</code></p>
    <div class="tags">${row.mood_tags.length > 0 ? row.mood_tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('') : '<span class="tag">no moods</span>'}</div>
    <p class="muted">Blockers: ${escapeHtml(row.blockers.join(', ') || 'none')}</p>
    <p>${escapeHtml(row.next_action)}</p>
  </article>`;
}

function countFoundVenues(batch: BatchResult): number {
  return batch.candidates.filter((candidate) => !candidate.venue.raw.extraction_error).length;
}

function getStage03Queue(stage03: Record<string, unknown> | null): Stage03QueueItem[] {
  if (!stage03) return [];
  const queue = stage03.queue;
  return Array.isArray(queue) ? queue.filter(isRecord).map((item) => ({
    venue_name: stringFrom(item.venue_name),
    source_type: stringFrom(item.source_type),
  })) : [];
}

function getSelectedHeroCount(stage04: Record<string, unknown> | null): number {
  if (!stage04) return 0;
  for (const key of ['selected_images', 'results', 'items']) {
    const value = stage04[key];
    if (Array.isArray(value)) return value.length;
  }
  const selections = Object.values(stage04).filter((value) => isRecord(value) && typeof value.resolved_image_url === 'string');
  return selections.length;
}

function hasSelectedHero(stage04: Record<string, unknown> | null, venueName: string): boolean {
  if (!stage04) return false;
  const candidates: Record<string, unknown>[] = [];
  for (const value of Object.values(stage04)) {
    if (Array.isArray(value)) candidates.push(...value.filter(isRecord));
    if (isRecord(value)) candidates.push(value);
  }
  return candidates.some((item) => normalizeName(stringFrom(item.venue_name)) === normalizeName(venueName));
}

function summarizeImageRights(rows: OperatorVenueRow[]): string {
  const statuses = new Set(rows.filter((row) => row.has_hero).map((row) => row.image_rights_status));
  if (statuses.size === 0) return 'none';
  if (statuses.size === 1) return [...statuses][0];
  return [...statuses].sort().join(', ');
}

function countBy(values: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const value of values) counts[value] = (counts[value] || 0) + 1;
  return counts;
}

function getObject<T extends Record<string, unknown>>(source: Record<string, unknown> | null, key: string): T | null {
  if (!source) return null;
  const value = source[key];
  return isRecord(value) ? value as T : null;
}

function numberValue(value: unknown, fallback = 0): number {
  return typeof value === 'number' ? value : fallback;
}

function readFirstExisting<T>(outputDir: string, fileNames: string[]): T | null {
  for (const fileName of fileNames) {
    const filePath = path.join(outputDir, fileName);
    if (existsSync(filePath)) return readJson<T>(filePath);
  }
  return null;
}

function readOptional<T>(outputDir: string, fileName: string): T | null {
  const filePath = path.join(outputDir, fileName);
  if (!existsSync(filePath)) return null;
  return readJson<T>(filePath);
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, 'utf8')) as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function stringFrom(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function normalizeName(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
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
    console.error('Usage: npx tsx pipeline/stages/generate_operator_dashboard.ts <batch_id>');
    process.exitCode = 1;
  } else {
    try {
      generateOperatorDashboard(batchName);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Operator dashboard generation failed: ${message}`);
      process.exitCode = 1;
    }
  }
}
