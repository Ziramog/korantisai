import { existsSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { mergePipelineConfig } from '../config';
import { generateDashboard } from '../review/generate_dashboard';
import { callMinimaxTextJson, minimaxTextConfigFromEnv, redactSecrets } from '../utils/minimax_text';
import { loadLocalEnv } from './01_extract_data';
import { scoreAndStage } from './06_score_and_stage';
import type { BatchResult, MoodTag, ReviewQueueItem, VenueComplete } from '../types';

interface EditorialJson {
  tagline: string;
  description_short: string;
  mood_tags: MoodTag[];
  moments: string[];
  best_for: string[];
  not_for: string[];
  primary_atmosphere: string;
  evidence_confidence: number;
  mood_confidence: number;
  editorial_notes: string;
  grounded_description: string;
}

interface EditorialResultRecord {
  venue_name: string;
  success: boolean;
  model_used: string;
  editorial?: EditorialJson;
  error?: string;
}

interface Stage05Result {
  batch_id: string;
  generated_at: string;
  minimax_called: boolean;
  model_used: string;
  venues_processed: number;
  successful_generations: number;
  failed_generations: number;
  invalid_json_count: number;
  mood_distribution: Record<string, number>;
  evidence_confidence_distribution: Record<string, number>;
  status_counts_after_scoring: BatchResult['summary'];
  remaining_blockers_by_venue: Record<string, string[]>;
  results: EditorialResultRecord[];
}

interface ConfirmedEditorialMention {
  source_name: string;
  source_kind: string;
  source_url: string;
  matched_text_snippet: string;
  match_confidence: number;
}

export async function runStage05EditorialGeneration(batchName: string): Promise<Stage05Result> {
  loadLocalEnv();

  const config = minimaxTextConfigFromEnv();
  if (!config.apiKey) throw new Error('missing MINIMAX_API_KEY; Stage 05 did not call MiniMax M2.7');
  if (!config.model) throw new Error('missing MINIMAX_TEXT_MODEL; configure MiniMax M2.7 text model before Stage 05');

  const outputDir = path.join(process.cwd(), 'data', 'batches', batchName);
  const input = readJson<BatchResult>(path.join(outputDir, 'batch_result_with_images.json'));
  const confirmedEditorialMentions = readConfirmedEditorialMentions(outputDir);
  const pipelineConfig = mergePipelineConfig(input.config);
  const editorialResults: EditorialResultRecord[] = [];
  let minimaxCalled = false;
  let invalidJsonCount = 0;

  const enrichedCandidates: ReviewQueueItem[] = [];
  for (const candidate of input.candidates) {
    const venue = cloneVenue(candidate.venue);
    try {
      const response = await callMinimaxTextJson({
        system: buildSystemPrompt(),
        prompt: buildVenuePrompt(venue, pipelineConfig.allowedMoodTags, confirmedEditorialMentions.get(normalizeName(venue.raw.name)) || []),
        config,
        maxTokens: 1300,
      });
      minimaxCalled = true;
      if (!response.json) {
        invalidJsonCount += 1;
        editorialResults.push({
          venue_name: candidate.venue_name,
          success: false,
          model_used: response.model_used,
          error: 'editorial_invalid_json',
        });
      } else {
        const editorial = normalizeEditorialJson(response.json, pipelineConfig.allowedMoodTags);
        applyEditorialToVenue(venue, editorial, response.model_used);
        editorialResults.push({
          venue_name: candidate.venue_name,
          success: true,
          model_used: response.model_used,
          editorial,
        });
      }
    } catch (error) {
      editorialResults.push({
        venue_name: candidate.venue_name,
        success: false,
        model_used: config.model,
        error: redactSecrets(error instanceof Error ? error.message : String(error)),
      });
    }

    const staging = scoreAndStage(venue, pipelineConfig);
    enrichedCandidates.push({
      batch_id: input.batch_id,
      venue_name: venue.raw.name,
      status: staging.status,
      staging_score: staging.staging_score,
      review_reason: staging.review_reason,
      errors: staging.errors,
      warnings: staging.warnings,
      venue,
    });
  }

  const finishedAt = new Date();
  const batchResult: BatchResult = {
    ...input,
    generated_at: finishedAt.toISOString(),
    summary: buildSummary(enrichedCandidates),
    stage_statuses: [
      ...input.stage_statuses,
      {
        stage: '05_generate_editorial',
        status: 'completed',
        notes: `MiniMax text editorial generation completed with model ${config.model}.`,
      },
      {
        stage: '06_score_and_stage',
        status: 'completed',
        notes: 'Re-scored after MiniMax M2.7 editorial generation.',
      },
    ],
    candidates: enrichedCandidates,
    mood_distribution: countMoodTags(enrichedCandidates),
    neighborhood_distribution: countNeighborhoods(enrichedCandidates),
    cost_placeholder: {
      estimated_usd: null,
      notes: 'Stage 05 called MiniMax text only. No M3, Supabase, Cloudinary, publication, or deploy calls.',
    },
    runtime_placeholder: {
      started_at: input.runtime_placeholder.started_at,
      finished_at: finishedAt.toISOString(),
      duration_ms: Date.now() - new Date(input.runtime_placeholder.started_at).getTime(),
    },
  };

  const result: Stage05Result = {
    batch_id: input.batch_id,
    generated_at: finishedAt.toISOString(),
    minimax_called: minimaxCalled,
    model_used: config.model,
    venues_processed: input.candidates.length,
    successful_generations: editorialResults.filter((item) => item.success).length,
    failed_generations: editorialResults.filter((item) => !item.success).length,
    invalid_json_count: invalidJsonCount,
    mood_distribution: batchResult.mood_distribution,
    evidence_confidence_distribution: bucketEvidenceConfidence(enrichedCandidates),
    status_counts_after_scoring: batchResult.summary,
    remaining_blockers_by_venue: Object.fromEntries(enrichedCandidates.map((candidate) => [candidate.venue_name, candidate.errors])),
    results: editorialResults,
  };

  writeFileSync(path.join(outputDir, 'stage_05_editorial_results.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  writeFileSync(path.join(outputDir, 'stage_05_report.md'), buildStage05Report(result), 'utf8');
  writeFileSync(path.join(outputDir, 'batch_result_with_editorial.json'), `${JSON.stringify(batchResult, null, 2)}\n`, 'utf8');
  generateDashboard(batchResult, outputDir, 'dashboard_with_editorial.html');

  console.log(`Stage 05 editorial results written to ${path.join(outputDir, 'stage_05_editorial_results.json')}`);
  console.log(`Stage 05 report written to ${path.join(outputDir, 'stage_05_report.md')}`);
  console.log(`Batch result with editorial written to ${path.join(outputDir, 'batch_result_with_editorial.json')}`);
  console.log(`Dashboard with editorial written to ${path.join(outputDir, 'dashboard_with_editorial.html')}`);
  console.log(
    `Stage 05 summary: venues=${result.venues_processed}, successful=${result.successful_generations}, failed=${result.failed_generations}, minimax_called=${result.minimax_called}`,
  );

  return result;
}

function buildSystemPrompt(): string {
  return [
    'You are generating grounded editorial metadata for Korantis venue staging.',
    'Return strict JSON only. Do not include markdown.',
    'Use only the provided venue facts and image vision metadata.',
    'Do not invent awards, menu items, prices, booking policies, Michelin, 50 Best, or claims of being the best/iconic unless explicitly present.',
    'Keep copy concise, atmospheric, and suitable for a venue discovery app.',
  ].join(' ');
}

function buildVenuePrompt(venue: VenueComplete, allowedTags: readonly MoodTag[], confirmedEditorialMentions: ConfirmedEditorialMention[]): string {
  const hero = venue.hero_image || venue.images.hero;
  const payload = {
    required_schema: {
      tagline: 'string, max 80 chars',
      description_short: 'string, 1-2 concise grounded sentences',
      mood_tags: `array of 2-5 allowed tags only: ${allowedTags.join(', ')}`,
      moments: 'array of 2-5 short suggested occasions',
      best_for: 'array of 2-5 short labels',
      not_for: 'array of 1-3 short labels when useful, otherwise []',
      primary_atmosphere: 'short string grounded in inputs',
      evidence_confidence: 'number 0-1',
      mood_confidence: 'number 0-1',
      editorial_notes: 'short explanation of grounding',
      grounded_description: 'string, 1-2 grounded sentences',
    },
    venue: {
      name: venue.raw.name,
      category_type: venue.raw.type,
      neighborhood: venue.raw.neighborhood,
      address: venue.raw.address,
      city: venue.raw.city,
      rating: venue.raw.rating,
      review_count: venue.raw.user_ratings_total,
      website: venue.raw.website_url,
      phone: venue.raw.phone,
      hours: venue.raw.hours,
      extraction_confidence: venue.raw.extraction_confidence,
      operational_status: venue.raw.operational_status,
    },
    selected_image_vision: hero?.classification ? {
      scene_type: hero.classification.scene,
      shows_space: hero.classification.shows_space,
      atmosphere_signal: hero.classification.atmosphere_signal,
      visual_reason: extractVisualReason(hero.notes || ''),
      quality: hero.classification.quality,
      model_used: hero.classification.model_used,
    } : null,
    confirmed_editorial_mentions: confirmedEditorialMentions.map((mention) => ({
      source_name: mention.source_name,
      source_kind: mention.source_kind,
      source_url: mention.source_url,
      evidence_snippet: mention.matched_text_snippet,
      match_confidence: mention.match_confidence,
    })),
    constraints: [
      'Tagline must be <= 80 characters.',
      'Mood tags must come only from allowed tags.',
      'If no selected image vision is present, avoid visual atmosphere claims and lower mood confidence.',
      'Only mention guide/editorial recognition when confirmed_editorial_mentions contains a matching source URL and snippet.',
      'Evidence confidence should reflect only supplied fields.',
    ],
  };
  return JSON.stringify(payload, null, 2);
}

function normalizeEditorialJson(value: Record<string, unknown>, allowedTags: readonly MoodTag[]): EditorialJson {
  const allowed = new Set<string>(allowedTags);
  const moodTags = stringArray(value.mood_tags)
    .filter((tag): tag is MoodTag => allowed.has(tag))
    .slice(0, 5);
  if (moodTags.length < 2) throw new Error('editorial_invalid_mood_tags');

  return {
    tagline: clamp(stringValue(value.tagline), 80),
    description_short: stringValue(value.description_short),
    mood_tags: moodTags,
    moments: stringArray(value.moments).slice(0, 5),
    best_for: stringArray(value.best_for).slice(0, 5),
    not_for: stringArray(value.not_for).slice(0, 3),
    primary_atmosphere: stringValue(value.primary_atmosphere),
    evidence_confidence: clampNumber(value.evidence_confidence, 0, 1),
    mood_confidence: clampNumber(value.mood_confidence, 0, 1),
    editorial_notes: stringValue(value.editorial_notes),
    grounded_description: stringValue(value.grounded_description) || stringValue(value.description_short),
  };
}

function applyEditorialToVenue(venue: VenueComplete, editorial: EditorialJson, modelUsed: string): void {
  venue.editorial = {
    ...venue.editorial,
    tagline: editorial.tagline,
    description: editorial.grounded_description || editorial.description_short,
    description_short: editorial.description_short,
    mood_tags: editorial.mood_tags,
    mood_confidence: editorial.mood_confidence,
    moments: editorial.moments,
    warnings: [],
  };
  venue.evidence = {
    ...venue.evidence,
    confidence: editorial.evidence_confidence,
    factual_notes: [
      ...(venue.evidence.factual_notes || []),
      `stage_05_model_used:${modelUsed}`,
      `stage_05_evidence_confidence:${editorial.evidence_confidence}`,
      `stage_05_editorial_notes:${editorial.editorial_notes}`,
      `stage_05_best_for:${editorial.best_for.join(', ')}`,
      `stage_05_not_for:${editorial.not_for.join(', ')}`,
      `stage_05_primary_atmosphere:${editorial.primary_atmosphere}`,
    ],
    warnings: (venue.evidence.warnings || []).filter((warning) => warning !== 'stub_evidence_pending'),
  };
  venue.pipeline_notes = [
    ...(venue.pipeline_notes || []),
    `Stage 05 MiniMax text editorial generated with ${modelUsed}.`,
  ];
}

function buildStage05Report(result: Stage05Result): string {
  const lines = [
    '# Stage 05 Editorial + Mood Generation Report',
    '',
    `- Batch: ${result.batch_id}`,
    `- Generated: ${result.generated_at}`,
    `- Model: ${result.model_used}`,
    `- MiniMax M2.7 called: ${result.minimax_called ? 'yes' : 'no'}`,
    `- Venues processed: ${result.venues_processed}`,
    `- Successful editorial generations: ${result.successful_generations}`,
    `- Failed editorial generations: ${result.failed_generations}`,
    `- Invalid JSON count: ${result.invalid_json_count}`,
    '',
    '## Mood Distribution',
    '',
    ...entriesOrNone(result.mood_distribution),
    '',
    '## Evidence Confidence Distribution',
    '',
    ...entriesOrNone(result.evidence_confidence_distribution),
    '',
    '## Status Counts After Scoring',
    '',
    ...Object.entries(result.status_counts_after_scoring).map(([key, value]) => `- ${key}: ${value}`),
    '',
    '## Remaining Blockers Per Venue',
    '',
    ...Object.entries(result.remaining_blockers_by_venue).map(([venue, blockers]) => `- ${venue}: ${blockers.join(', ') || 'none'}`),
    '',
    '## Failures',
    '',
    ...(result.results.filter((item) => !item.success).length > 0
      ? result.results.filter((item) => !item.success).map((item) => `- ${item.venue_name}: ${item.error || 'unknown_error'}`)
      : ['- none']),
    '',
    '## Safety',
    '',
    '- No M3 calls were made.',
    '- No Supabase writes were made.',
    '- No Cloudinary uploads were made.',
    '- No publication or deploy path was run.',
    '- Protected consumer UI files were not touched.',
  ];
  return `${redactSecrets(lines.join('\n'))}\n`;
}

function readConfirmedEditorialMentions(outputDir: string): Map<string, ConfirmedEditorialMention[]> {
  const filePath = path.join(outputDir, 'stage_00b_editorial_source_enrichment.json');
  const mentions = new Map<string, ConfirmedEditorialMention[]>();
  if (!existsSync(filePath)) return mentions;
  try {
    const data = readJson<{ candidates?: Array<Record<string, unknown>> }>(filePath);
    for (const candidate of data.candidates || []) {
      if (candidate.verification_status !== 'confirmed') continue;
      const venueName = stringValue(candidate.venue_name);
      const confirmed = Array.isArray(candidate.confirmed_editorial_mentions) ? candidate.confirmed_editorial_mentions : [];
      for (const item of confirmed) {
        if (!isRecord(item)) continue;
        const mention: ConfirmedEditorialMention = {
          source_name: stringValue(item.source_name),
          source_kind: stringValue(item.source_kind),
          source_url: stringValue(item.source_url),
          matched_text_snippet: stringValue(item.matched_text_snippet),
          match_confidence: clampNumber(item.match_confidence, 0, 1),
        };
        if (!mention.source_url || !mention.matched_text_snippet) continue;
        const key = normalizeName(venueName);
        mentions.set(key, [...(mentions.get(key) || []), mention]);
      }
    }
  } catch {
    return mentions;
  }
  return mentions;
}

function buildSummary(items: ReviewQueueItem[]): BatchResult['summary'] {
  return {
    input: items.length,
    ready_for_db_staging: items.filter((item) => item.status === 'ready_for_db_staging').length,
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

function bucketEvidenceConfidence(items: ReviewQueueItem[]): Record<string, number> {
  const buckets = { low: 0, medium: 0, high: 0 };
  for (const item of items) {
    const value = item.venue.evidence.confidence;
    if (value < 0.3) buckets.low += 1;
    else if (value < 0.7) buckets.medium += 1;
    else buckets.high += 1;
  }
  return buckets;
}

function entriesOrNone(values: Record<string, number>): string[] {
  const entries = Object.entries(values);
  return entries.length > 0 ? entries.map(([key, value]) => `- ${key}: ${value}`) : ['- none'];
}

function extractVisualReason(notes: string): string {
  const marker = 'visual_reason=';
  const index = notes.indexOf(marker);
  return index >= 0 ? notes.slice(index + marker.length).trim() : '';
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string').map((entry) => entry.trim()).filter(Boolean) : [];
}

function clamp(value: string, maxLength: number): string {
  return value.length <= maxLength ? value : value.slice(0, maxLength).trimEnd();
}

function clampNumber(value: unknown, min: number, max: number): number {
  const parsed = typeof value === 'number' && Number.isFinite(value) ? value : min;
  return Math.min(max, Math.max(min, parsed));
}

function cloneVenue(venue: VenueComplete): VenueComplete {
  return JSON.parse(JSON.stringify(venue)) as VenueComplete;
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, 'utf8')) as T;
}

const currentFile = path.resolve(fileURLToPath(import.meta.url));
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : '';

if (currentFile === invokedFile) {
  const batchName = process.argv[2];
  if (!batchName) {
    console.error('Usage: npx tsx pipeline/stages/05_generate_editorial.ts <batch_id>');
    process.exitCode = 1;
  } else {
    runStage05EditorialGeneration(batchName).catch((error: unknown) => {
      const message = redactSecrets(error instanceof Error ? error.message : String(error));
      console.error(`Stage 05 editorial generation failed: ${message}`);
      process.exitCode = 1;
    });
  }
}
