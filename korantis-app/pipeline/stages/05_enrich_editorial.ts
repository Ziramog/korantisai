import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { mergePipelineConfig } from '../config';
import { generateDashboard } from '../review/generate_dashboard';
import { scoreAndStage } from './06_score_and_stage';
import type { BatchResult, MoodTag, ReviewQueueItem, VenueComplete } from '../types';

interface EnrichmentSummary {
  venue_name: string;
  tagline: string;
  description: string;
  mood_tags: MoodTag[];
  evidence_confidence: number;
  evidence_explanation: string;
  before_errors: string[];
  remaining_blockers: string[];
  status: string;
  score_before: number;
  score_after: number;
}

interface EnrichmentResult {
  batch_result: BatchResult;
  report_markdown: string;
  summaries: EnrichmentSummary[];
}

const MAX_TAGLINE_LENGTH = 80;

export function enrichEditorialContent(batchName: string): EnrichmentResult {
  const outputDir = path.join(process.cwd(), 'data', 'batches', batchName);
  const inputPath = path.join(outputDir, 'batch_result_with_images.json');
  const input = readJson<BatchResult>(inputPath);
  const config = mergePipelineConfig(input.config);
  const startedAt = new Date();
  const summaries: EnrichmentSummary[] = [];

  const candidates: ReviewQueueItem[] = input.candidates.map((candidate) => {
    const venue = enrichVenue(candidate.venue);
    const staging = scoreAndStage(venue, config);
    const summary: EnrichmentSummary = {
      venue_name: venue.raw.name,
      tagline: venue.editorial.tagline || '',
      description: venue.editorial.description || '',
      mood_tags: venue.editorial.mood_tags,
      evidence_confidence: venue.evidence.confidence,
      evidence_explanation: venue.evidence.factual_notes?.find((note) => note.startsWith('evidence_confidence:')) || '',
      before_errors: candidate.errors,
      remaining_blockers: staging.errors,
      status: staging.status,
      score_before: candidate.staging_score,
      score_after: staging.staging_score,
    };
    summaries.push(summary);

    return {
      batch_id: input.batch_id,
      venue_name: venue.raw.name,
      status: staging.status,
      staging_score: staging.staging_score,
      review_reason: staging.review_reason,
      errors: staging.errors,
      warnings: staging.warnings,
      venue,
    };
  });

  const finishedAt = new Date();
  const batchResult: BatchResult = {
    ...input,
    generated_at: finishedAt.toISOString(),
    summary: buildSummary(candidates),
    stage_statuses: [
      ...input.stage_statuses,
      { stage: '05_enrich_editorial', status: 'completed', notes: 'Deterministic local enrichment from Stage 01/04 evidence only. No model calls.' },
      { stage: '06_score_and_stage', status: 'completed', notes: 'Re-scored after editorial enrichment.' },
    ],
    candidates,
    mood_distribution: countMoodTags(candidates),
    neighborhood_distribution: countNeighborhoods(candidates),
    cost_placeholder: {
      estimated_usd: null,
      notes: 'No M3, MiniMax, Supabase, Cloudinary, publication, or deploy calls were made by Stage 05.',
    },
    runtime_placeholder: {
      started_at: startedAt.toISOString(),
      finished_at: finishedAt.toISOString(),
      duration_ms: finishedAt.getTime() - startedAt.getTime(),
    },
  };

  const report = buildReport(input.batch_id, summaries);
  writeFileSync(path.join(outputDir, 'batch_result_enriched.json'), `${JSON.stringify(batchResult, null, 2)}\n`, 'utf8');
  generateDashboard(batchResult, outputDir, 'dashboard_enriched.html');
  writeFileSync(path.join(outputDir, 'editorial_enrichment_report.md'), report, 'utf8');

  console.log(`Enriched batch result written to ${path.join(outputDir, 'batch_result_enriched.json')}`);
  console.log(`Enriched dashboard written to ${path.join(outputDir, 'dashboard_enriched.html')}`);
  console.log(`Editorial report written to ${path.join(outputDir, 'editorial_enrichment_report.md')}`);
  console.log(
    `Stage 05 summary: venues=${summaries.length}, blockers_resolved=${countResolvedContentBlockers(summaries)}, still_blocked=${summaries.filter((item) => item.remaining_blockers.length > 0).length}`,
  );

  return {
    batch_result: batchResult,
    report_markdown: report,
    summaries,
  };
}

function enrichVenue(venue: VenueComplete): VenueComplete {
  const hero = venue.hero_image || venue.images.hero;
  const classification = hero?.classification;
  const moodTags = chooseMoodTags(venue);
  const evidence = computeEvidenceConfidence(venue);
  const tagline = buildTagline(venue);
  const description = buildDescription(venue);
  const moments = chooseMoments(venue);

  return {
    ...venue,
    evidence: {
      ...venue.evidence,
      confidence: evidence.confidence,
      sources: dedupeSources([
        ...venue.evidence.sources,
        venue.raw.google_maps_url
          ? {
              source_url: venue.raw.google_maps_url,
              source_type: 'google_places',
              evidence_text: `Stage 01 matched ${venue.raw.name} with confidence ${venue.raw.extraction_confidence ?? 'unknown'}.`,
              confidence: venue.raw.extraction_confidence,
            }
          : null,
        hero
          ? {
              source_url: hero.source_url,
              source_type: hero.source_type,
              evidence_text: `Stage 04 ${classification?.model_used || 'vision'} selected ${classification?.scene || 'hero'} with ${classification?.quality || 'unknown'} quality.`,
              confidence: hero.usable ? 0.8 : 0.4,
            }
          : null,
      ]),
      factual_notes: [
        ...(venue.evidence.factual_notes || []),
        `evidence_confidence:${evidence.confidence.toFixed(2)} - ${evidence.explanation}`,
      ],
      warnings: evidence.confidence >= 0.3
        ? (venue.evidence.warnings || []).filter((warning) => warning !== 'stub_evidence_pending')
        : [...new Set([...(venue.evidence.warnings || []), 'insufficient_editorial_evidence'])],
    },
    editorial: {
      tagline,
      description,
      description_short: description,
      mood_tags: moodTags,
      mood_confidence: classification ? 0.78 : 0.62,
      moments,
      warnings: buildEditorialWarnings(venue),
    },
    pipeline_notes: [
      ...(venue.pipeline_notes || []),
      'Stage 05 editorial enrichment generated locally from Stage 01 factual data and Stage 04 image metadata only.',
    ],
  };
}

function buildTagline(venue: VenueComplete): string {
  const atmosphere = venue.hero_image?.classification?.atmosphere_signal;
  const typeLabel = typeLabelFor(venue.raw.type || 'unknown');
  const neighborhood = venue.raw.neighborhood || venue.raw.city;
  const candidates = [
    atmosphere === 'dark_intimate' ? `${venue.raw.name}: intimate ${typeLabel} energy in ${neighborhood}` : '',
    atmosphere === 'warm_cozy' ? `${venue.raw.name}: warm ${typeLabel} character in ${neighborhood}` : '',
    atmosphere === 'bright_airy' ? `${venue.raw.name}: bright ${typeLabel} stop in ${neighborhood}` : '',
    `${venue.raw.name}: ${typeLabel} in ${neighborhood}`,
  ].filter(Boolean);

  return clampTagline(candidates[0]);
}

function buildDescription(venue: VenueComplete): string {
  const hero = venue.hero_image;
  const classification = hero?.classification;
  const typeLabel = typeLabelFor(venue.raw.type || 'unknown');
  const neighborhood = venue.raw.neighborhood || venue.raw.city;
  const ratingText = typeof venue.raw.rating === 'number' && venue.raw.user_ratings_total
    ? `Google Places support is strong, with ${venue.raw.rating.toFixed(1)} stars across ${venue.raw.user_ratings_total.toLocaleString('en-US')} reviews.`
    : 'Google Places support is present, but public review context is limited.';

  if (hero && classification) {
    const atmosphere = atmospherePhrase(classification.atmosphere_signal);
    const scene = scenePhrase(classification.scene);
    return `${venue.raw.name} is a ${typeLabel} in ${neighborhood} with ${atmosphere}. The selected ${scene} image shows usable venue atmosphere; ${ratingText}`;
  }

  return `${venue.raw.name} is a ${typeLabel} in ${neighborhood} with verified basic venue data but no usable Stage 04 hero image yet. ${ratingText}`;
}

function chooseMoodTags(venue: VenueComplete): MoodTag[] {
  const tags = new Set<MoodTag>();
  const atmosphere = venue.hero_image?.classification?.atmosphere_signal;
  const type = venue.raw.type;

  if (atmosphere === 'dark_intimate') {
    tags.add('intimate');
    tags.add('late_night');
    tags.add('cinematic');
  }
  if (atmosphere === 'warm_cozy') {
    tags.add('warm');
    tags.add('intimate');
  }
  if (atmosphere === 'bright_airy') {
    tags.add('social');
    tags.add('work_friendly');
  }
  if (atmosphere === 'energetic') {
    tags.add('lively');
    tags.add('social');
  }
  if (type === 'cocktail_bar' || type === 'bar' || type === 'wine_bar') {
    tags.add('late_night');
    tags.add('social');
  }
  if (type === 'cafe' || type === 'coffee_shop') {
    tags.add('historic');
    tags.add('warm');
  }
  if (type === 'restaurant' || type === 'bistro') {
    tags.add('date_night');
    tags.add('warm');
  }

  return [...tags].slice(0, 4);
}

function chooseMoments(venue: VenueComplete): string[] {
  const type = venue.raw.type;
  if (type === 'cocktail_bar' || type === 'bar' || type === 'wine_bar') {
    return ['after-work drinks', 'late-night plans'];
  }
  if (type === 'cafe' || type === 'coffee_shop') {
    return ['afternoon coffee', 'classic city stop'];
  }
  return ['dinner plans', 'date-night option'];
}

function computeEvidenceConfidence(venue: VenueComplete): { confidence: number; explanation: string } {
  let score = 0;
  const notes: string[] = [];

  if ((venue.raw.extraction_confidence || 0) >= 0.85) {
    score += 0.22;
    notes.push('high Stage 01 match confidence');
  }
  if (venue.raw.google_maps_url && venue.raw.address && venue.raw.coordinates) {
    score += 0.18;
    notes.push('maps address and coordinates present');
  }
  if (venue.raw.website_url) {
    score += 0.1;
    notes.push('official website present');
  }
  if ((venue.raw.user_ratings_total || 0) >= 100) {
    score += 0.12;
    notes.push('substantial Google review volume');
  }
  if (venue.hero_image?.classification?.is_hero_usable) {
    score += 0.18;
    notes.push('Stage 04 usable hero metadata present');
  }
  if (venue.hero_image?.classification?.quality === 'high') {
    score += 0.08;
    notes.push('high-quality selected image');
  }

  const confidence = Math.min(0.88, Math.max(0.3, Number(score.toFixed(2))));
  return {
    confidence,
    explanation: notes.join('; ') || 'limited local evidence only',
  };
}

function buildEditorialWarnings(venue: VenueComplete): string[] {
  const warnings = new Set<string>(venue.editorial.warnings || []);
  warnings.delete('stub_editorial_pending');
  if (!venue.hero_image?.classification) warnings.add('no_stage_04_atmosphere_signal');
  return [...warnings];
}

function dedupeSources(sources: Array<VenueComplete['evidence']['sources'][number] | null>): VenueComplete['evidence']['sources'] {
  const seen = new Set<string>();
  const result: VenueComplete['evidence']['sources'] = [];
  for (const source of sources) {
    if (!source) continue;
    const key = `${source.source_type}:${source.source_url}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(source);
  }
  return result;
}

function typeLabelFor(type: string): string {
  const labels: Record<string, string> = {
    cocktail_bar: 'cocktail bar',
    wine_bar: 'wine bar',
    coffee_shop: 'coffee shop',
    fine_dining: 'fine dining restaurant',
    cafe: 'cafe',
    restaurant: 'restaurant',
    bar: 'bar',
    bistro: 'bistro',
    parrilla: 'parrilla',
    plant_based: 'plant-based spot',
  };
  return labels[type] || 'venue';
}

function atmospherePhrase(signal?: string): string {
  const phrases: Record<string, string> = {
    dark_intimate: 'a dark, intimate atmosphere',
    warm_cozy: 'a warm, cozy atmosphere',
    bright_airy: 'a bright, airy feel',
    energetic: 'an energetic social feel',
    minimal: 'a minimal visual character',
    lush: 'a lush visual character',
    industrial: 'an industrial edge',
  };
  return phrases[signal || ''] || 'a locally verified setting';
}

function scenePhrase(scene?: string): string {
  const phrases: Record<string, string> = {
    hero_interior: 'interior',
    gallery_atmosphere: 'atmosphere',
    hero_exterior: 'exterior',
  };
  return phrases[scene || ''] || 'venue';
}

function clampTagline(value: string): string {
  if (value.length <= MAX_TAGLINE_LENGTH) return value;
  return value.slice(0, MAX_TAGLINE_LENGTH - 1).trimEnd();
}

function buildReport(batchId: string, summaries: EnrichmentSummary[]): string {
  const blockerCounts = countBlockers(summaries);
  const lines = [
    '# Stage 05 Editorial Enrichment Report',
    '',
    `- Batch: ${batchId}`,
    `- Venues processed: ${summaries.length}`,
    `- Venues with content blockers resolved: ${summaries.filter((item) => contentBlockersResolved(item)).length}`,
    `- Venues still blocked: ${summaries.filter((item) => item.remaining_blockers.length > 0).length}`,
    '',
    '## Venue Enrichment',
    '',
    '| Venue | Tagline | Mood Tags | Evidence Confidence | Score Before | Score After | Status | Remaining Blockers |',
    '| --- | --- | --- | ---: | ---: | ---: | --- | --- |',
    ...summaries.map((item) =>
      `| ${escapeTable(item.venue_name)} | ${escapeTable(item.tagline)} | ${item.mood_tags.join(', ')} | ${item.evidence_confidence.toFixed(2)} | ${item.score_before} | ${item.score_after} | ${item.status} | ${escapeTable(item.remaining_blockers.join(', ') || 'none')} |`,
    ),
    '',
    '## Remaining Blocker Counts',
    '',
    ...entriesOrNone(blockerCounts),
    '',
    '## Evidence Notes',
    '',
    ...summaries.map((item) => `- ${item.venue_name}: ${item.evidence_explanation.replace(/^evidence_confidence:[^-]+ - /, '')}`),
    '',
    '## Safety',
    '',
    '- No M3, MiniMax, Supabase, Cloudinary, publication, deploy, or consumer UI calls were made.',
    '- No image was approved for publication.',
  ];

  return `${lines.join('\n')}\n`;
}

function contentBlockersResolved(item: EnrichmentSummary): boolean {
  return !item.remaining_blockers.some((blocker) =>
    ['missing_or_short_tagline', 'missing_description', 'fewer_than_two_mood_tags', 'evidence_confidence_below_minimum'].includes(blocker),
  );
}

function countResolvedContentBlockers(summaries: EnrichmentSummary[]): number {
  return summaries.reduce((count, item) => {
    const before = new Set(item.before_errors);
    const after = new Set(item.remaining_blockers);
    for (const blocker of ['missing_or_short_tagline', 'missing_description', 'fewer_than_two_mood_tags', 'evidence_confidence_below_minimum']) {
      if (before.has(blocker) && !after.has(blocker)) count += 1;
    }
    return count;
  }, 0);
}

function countBlockers(summaries: EnrichmentSummary[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of summaries) {
    for (const blocker of item.remaining_blockers) {
      counts[blocker] = (counts[blocker] || 0) + 1;
    }
  }
  return counts;
}

function entriesOrNone(values: Record<string, number>): string[] {
  const entries = Object.entries(values);
  return entries.length > 0 ? entries.map(([key, value]) => `- ${key}: ${value}`) : ['- none'];
}

function buildSummary(items: ReviewQueueItem[]): BatchResult['summary'] {
  return {
    input: items.length,
    auto_staged: items.filter((item) => item.status === 'auto_staged').length,
    needs_review: items.filter((item) => item.status === 'needs_review').length,
    blocked: items.filter((item) => item.status === 'blocked').length,
    approved: items.filter((item) => item.status === 'approved').length,
    rejected: items.filter((item) => item.status === 'rejected').length,
    staged: items.filter((item) => item.status === 'staged').length,
    published: items.filter((item) => item.status === 'published').length,
  };
}

function countMoodTags(items: ReviewQueueItem[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    for (const tag of item.venue.editorial.mood_tags) {
      counts[tag] = (counts[tag] || 0) + 1;
    }
  }
  return counts;
}

function countNeighborhoods(items: ReviewQueueItem[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const neighborhood = item.venue.raw.neighborhood || 'unknown';
    counts[neighborhood] = (counts[neighborhood] || 0) + 1;
  }
  return counts;
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, 'utf8')) as T;
}

function escapeTable(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

const currentFile = path.resolve(fileURLToPath(import.meta.url));
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : '';

if (currentFile === invokedFile) {
  const batchName = process.argv[2];
  if (!batchName) {
    console.error('Usage: npx tsx pipeline/stages/05_enrich_editorial.ts <batch_id>');
    process.exitCode = 1;
  } else {
    try {
      enrichEditorialContent(batchName);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Stage 05 editorial enrichment failed: ${message}`);
      process.exitCode = 1;
    }
  }
}
