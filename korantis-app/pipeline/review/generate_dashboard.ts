import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import type { BatchResult, ReviewQueueItem } from '../types';

export function generateDashboard(batch: BatchResult, outputDir: string, fileName = 'dashboard.html'): string {
  mkdirSync(outputDir, { recursive: true });
  const html = renderDashboard(batch);
  const filePath = path.join(outputDir, fileName);
  writeFileSync(filePath, html, 'utf8');
  return filePath;
}

function renderDashboard(batch: BatchResult): string {
  const readyForDbStaging = batch.candidates.filter((item) => item.status === 'ready_for_db_staging');
  const needsReview = batch.candidates.filter((item) => item.status === 'needs_review');
  const blocked = batch.candidates.filter((item) => item.status === 'blocked');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Korantis Batch Review - ${escapeHtml(batch.batch_id)}</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #0d0f10;
      --panel: #171a1c;
      --panel-soft: #202427;
      --border: #343a3f;
      --text: #f1eee7;
      --muted: #a7a097;
      --gold: #c8a96a;
      --green: #74b892;
      --red: #d97b73;
      --blue: #7ba7d9;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.45;
    }
    header, main { max-width: 1440px; margin: 0 auto; padding: 24px; }
    header { border-bottom: 1px solid var(--border); }
    h1, h2, h3, p { margin: 0; }
    h1 { font-size: 24px; font-weight: 650; }
    h2 { margin: 36px 0 16px; font-size: 18px; }
    h3 { font-size: 15px; }
    .muted { color: var(--muted); }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 12px;
      margin-top: 18px;
    }
    .stat, .card, .section-panel {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 8px;
    }
    .stat { padding: 16px; }
    .stat strong { display: block; margin-top: 6px; font-size: 24px; }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 14px;
    }
    .card { overflow: hidden; }
    .image {
      height: 150px;
      background: var(--panel-soft);
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--muted);
      font-size: 13px;
    }
    .image img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .card-body { padding: 14px; display: grid; gap: 8px; }
    .meta { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
    .badge {
      display: inline-flex;
      align-items: center;
      min-height: 24px;
      padding: 0 8px;
      border-radius: 999px;
      border: 1px solid var(--border);
      color: var(--muted);
      font-size: 12px;
    }
    .badge.ready_for_db_staging { color: var(--green); border-color: rgba(116, 184, 146, .5); }
    .badge.auto_staged { color: var(--green); border-color: rgba(116, 184, 146, .5); }
    .badge.needs_review { color: var(--gold); border-color: rgba(200, 169, 106, .5); }
    .badge.blocked { color: var(--red); border-color: rgba(217, 123, 115, .5); }
    .score { color: var(--blue); font-variant-numeric: tabular-nums; }
    .section-panel { padding: 14px; margin-bottom: 12px; }
    .dist {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 14px;
    }
    .button-row { display: flex; gap: 8px; margin-top: 10px; }
    button {
      border: 1px solid var(--border);
      background: var(--panel-soft);
      color: var(--muted);
      border-radius: 6px;
      padding: 8px 10px;
      cursor: not-allowed;
    }
  </style>
</head>
<body>
  <header>
    <p class="muted">Korantis Defensive Staging Review</p>
    <h1>${escapeHtml(batch.batch_id)} - ${escapeHtml(batch.city)}</h1>
    <div class="summary">
      ${renderStat('Input', batch.summary.input)}
      ${renderStat('Ready for DB staging', batch.summary.ready_for_db_staging ?? 0)}
      ${renderStat('Auto staged', batch.summary.auto_staged)}
      ${renderStat('Needs review', batch.summary.needs_review)}
      ${renderStat('Blocked', batch.summary.blocked)}
      ${renderStat('Cost', batch.cost_placeholder.estimated_usd ?? 'pending')}
      ${renderStat('Runtime', `${batch.runtime_placeholder.duration_ms} ms`)}
    </div>
  </header>
  <main>
    <h2>Venue Preview</h2>
    <section class="grid">${batch.candidates.map(renderVenueCard).join('')}</section>
    <h2>Ready For DB Staging</h2>
    ${renderIssueSection(readyForDbStaging, 'No DB-staging-ready candidates.')}
    <h2>Needs Review</h2>
    ${renderIssueSection(needsReview, 'No needs-review candidates.')}
    <h2>Blocked</h2>
    ${renderIssueSection(blocked, 'No blocked candidates.')}
    <h2>Distribution</h2>
    <section class="dist">
      ${renderDistribution('Mood distribution', batch.mood_distribution)}
      ${renderDistribution('Neighborhood distribution', batch.neighborhood_distribution)}
    </section>
  </main>
</body>
</html>`;
}

function renderStat(label: string, value: string | number): string {
  return `<div class="stat"><span class="muted">${escapeHtml(label)}</span><strong>${escapeHtml(String(value))}</strong></div>`;
}

function renderVenueCard(item: ReviewQueueItem): string {
  const hero = item.venue.images.hero;
  const image = hero?.resolved_image_url
    ? `<img src="${escapeHtml(hero.resolved_image_url)}" alt="">`
    : 'No hero image';
  const moodTags = item.venue.editorial.mood_tags.map((tag) => `<span class="badge">${escapeHtml(tag)}</span>`).join('');

  return `<article class="card">
    <div class="image">${image}</div>
    <div class="card-body">
      <div class="meta"><span class="badge ${item.status}">${escapeHtml(item.status)}</span><span class="score">Score ${item.staging_score}</span></div>
      <h3>${escapeHtml(item.venue_name)}</h3>
      <p class="muted">${escapeHtml(item.venue.raw.neighborhood || 'Unknown neighborhood')} / ${escapeHtml(item.venue.raw.type || 'unknown')}</p>
      <div class="meta">${moodTags || '<span class="badge">no moods</span>'}</div>
      <p class="muted">${escapeHtml(item.review_reason)}</p>
      <div class="button-row"><button disabled>Approve</button><button disabled>Reject</button><button disabled>Open Detail</button></div>
    </div>
  </article>`;
}

function renderIssueSection(items: ReviewQueueItem[], emptyText: string): string {
  if (items.length === 0) {
    return `<section class="section-panel muted">${escapeHtml(emptyText)}</section>`;
  }
  return items.map((item) => `<section class="section-panel">
    <h3>${escapeHtml(item.venue_name)} <span class="score">${item.staging_score}</span></h3>
    <p class="muted">${escapeHtml(item.review_reason)}</p>
    <p class="muted">Errors: ${escapeHtml(item.errors.join(', ') || 'none')}</p>
    <p class="muted">Warnings: ${escapeHtml(item.warnings.join(', ') || 'none')}</p>
  </section>`).join('');
}

function renderDistribution(title: string, distribution: Record<string, number>): string {
  const rows = Object.entries(distribution)
    .sort((a, b) => b[1] - a[1])
    .map(([key, value]) => `<p>${escapeHtml(key)} <span class="score">${value}</span></p>`)
    .join('');
  return `<section class="section-panel"><h3>${escapeHtml(title)}</h3>${rows || '<p class="muted">none</p>'}</section>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
