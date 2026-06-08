import { readFileSync, writeFileSync } from 'fs';
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
  retried_at?: string;
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
  retry_summary?: {
    generated_at: string;
    retry_venues: string[];
    minimax_calls_made: number;
    retry_successes: number;
    retry_failures: number;
  };
}

export async function retryFailedEditorial(batchName: string): Promise<Stage05Result> {
  loadLocalEnv();

  const config = minimaxTextConfigFromEnv();
  if (!config.apiKey) throw new Error('missing MINIMAX_API_KEY; Stage 05B did not call MiniMax M2.7');
  if (!config.model) throw new Error('missing MINIMAX_TEXT_MODEL; configure MiniMax M2.7 text model before Stage 05B');

  const outputDir = path.join(process.cwd(), 'data', 'batches', batchName);
  const batchResult = readJson<BatchResult>(path.join(outputDir, 'batch_result_with_editorial.json'));
  const stage05 = readJson<Stage05Result>(path.join(outputDir, 'stage_05_editorial_results.json'));
  const failedRecords = stage05.results.filter((result) => !result.success);
  const failedNames = new Set(failedRecords.map((record) => normalizeVenueName(record.venue_name)));
  let minimaxCallsMade = 0;
  const updatedResults = stage05.results.map((result) => ({ ...result }));
  const updatedCandidates = batchResult.candidates.map((candidate) => cloneCandidate(candidate));

  for (const candidate of updatedCandidates) {
    if (!failedNames.has(normalizeVenueName(candidate.venue_name))) continue;

    const resultIndex = updatedResults.findIndex((result) => normalizeVenueName(result.venue_name) === normalizeVenueName(candidate.venue_name));
    try {
      const response = await callMinimaxTextJson({
        system: buildRetrySystemPrompt(),
        prompt: buildVenuePrompt(candidate.venue, batchResult.config.allowedMoodTags),
        config,
        maxTokens: 1200,
      });
      minimaxCallsMade += 1;

      if (!response.json) {
        updatedResults[resultIndex] = {
          venue_name: candidate.venue_name,
          success: false,
          model_used: response.model_used,
          error: 'editorial_invalid_json',
          retried_at: new Date().toISOString(),
        };
        continue;
      }

      const editorial = normalizeEditorialJson(response.json, batchResult.config.allowedMoodTags);
      applyEditorialToVenue(candidate.venue, editorial, response.model_used);
      updatedResults[resultIndex] = {
        venue_name: candidate.venue_name,
        success: true,
        model_used: response.model_used,
        editorial,
        retried_at: new Date().toISOString(),
      };
    } catch (error) {
      updatedResults[resultIndex] = {
        venue_name: candidate.venue_name,
        success: false,
        model_used: config.model,
        error: redactSecrets(error instanceof Error ? error.message : String(error)),
        retried_at: new Date().toISOString(),
      };
      continue;
    }
  }

  const pipelineConfig = mergePipelineConfig(batchResult.config);
  const rescoredCandidates = updatedCandidates.map((candidate) => {
    const staging = scoreAndStage(candidate.venue, pipelineConfig);
    return {
      ...candidate,
      status: staging.status,
      staging_score: staging.staging_score,
      review_reason: staging.review_reason,
      errors: staging.errors,
      warnings: staging.warnings,
    };
  });

  const finishedAt = new Date().toISOString();
  const updatedBatch: BatchResult = {
    ...batchResult,
    generated_at: finishedAt,
    summary: buildSummary(rescoredCandidates),
    stage_statuses: [
      ...batchResult.stage_statuses,
      {
        stage: '05b_retry_failed_editorial',
        status: 'completed',
        notes: `Retried ${failedRecords.length} failed editorial record(s); no successful records were rerun.`,
      },
      {
        stage: '06_score_and_stage',
        status: 'completed',
        notes: 'Re-scored after Stage 05B retry.',
      },
    ],
    candidates: rescoredCandidates,
    mood_distribution: countMoodTags(rescoredCandidates),
    neighborhood_distribution: countNeighborhoods(rescoredCandidates),
    cost_placeholder: {
      estimated_usd: null,
      notes: 'Stage 05B called MiniMax text only for failed records. No M3, Supabase, Cloudinary, publication, or deploy calls.',
    },
    runtime_placeholder: {
      ...batchResult.runtime_placeholder,
      finished_at: finishedAt,
    },
  };

  const updatedStage05: Stage05Result = {
    ...stage05,
    generated_at: finishedAt,
    minimax_called: stage05.minimax_called || minimaxCallsMade > 0,
    successful_generations: updatedResults.filter((result) => result.success).length,
    failed_generations: updatedResults.filter((result) => !result.success).length,
    invalid_json_count: updatedResults.filter((result) => result.error === 'editorial_invalid_json').length,
    mood_distribution: updatedBatch.mood_distribution,
    evidence_confidence_distribution: bucketEvidenceConfidence(rescoredCandidates),
    status_counts_after_scoring: updatedBatch.summary,
    remaining_blockers_by_venue: Object.fromEntries(rescoredCandidates.map((candidate) => [candidate.venue_name, candidate.errors])),
    results: updatedResults,
    retry_summary: {
      generated_at: finishedAt,
      retry_venues: failedRecords.map((record) => record.venue_name),
      minimax_calls_made: minimaxCallsMade,
      retry_successes: updatedResults.filter((result) => result.retried_at && result.success).length,
      retry_failures: updatedResults.filter((result) => result.retried_at && !result.success).length,
    },
  };

  writeFileSync(path.join(outputDir, 'batch_result_with_editorial.json'), `${JSON.stringify(updatedBatch, null, 2)}\n`, 'utf8');
  writeFileSync(path.join(outputDir, 'stage_05_editorial_results.json'), `${JSON.stringify(updatedStage05, null, 2)}\n`, 'utf8');
  writeFileSync(path.join(outputDir, 'stage_05_report.md'), buildStage05Report(updatedStage05), 'utf8');
  generateDashboard(updatedBatch, outputDir, 'dashboard_with_editorial.html');

  console.log(`Stage 05B retried venues: ${failedRecords.map((record) => record.venue_name).join(', ') || 'none'}`);
  console.log(`Stage 05B MiniMax calls made: ${minimaxCallsMade}`);
  console.log(`Updated Stage 05 results written to ${path.join(outputDir, 'stage_05_editorial_results.json')}`);
  console.log(`Updated batch result with editorial written to ${path.join(outputDir, 'batch_result_with_editorial.json')}`);

  return updatedStage05;
}

function buildRetrySystemPrompt(): string {
  return [
    'You are retrying a failed strict-JSON editorial generation for Korantis venue staging.',
    'Return exactly one valid JSON object and no surrounding text.',
    'Use double quotes for all JSON keys and strings.',
    'Use only the provided facts and image metadata.',
    'Do not invent awards, exact menu items, prices, booking policies, Michelin, 50 Best, or claims of being the best/iconic unless explicitly present.',
  ].join(' ');
}

function buildVenuePrompt(venue: VenueComplete, allowedTags: readonly MoodTag[]): string {
  const hero = venue.hero_image || venue.images.hero;
  return JSON.stringify({
    output_schema: {
      tagline: 'string <= 80 chars',
      description_short: 'string, 1-2 concise grounded sentences',
      mood_tags: `array, 2-5 values from: ${allowedTags.join(', ')}`,
      moments: 'array, 2-5 short occasions',
      best_for: 'array, 2-5 short labels',
      not_for: 'array, 1-3 short labels or []',
      primary_atmosphere: 'string',
      evidence_confidence: 'number 0-1',
      mood_confidence: 'number 0-1',
      editorial_notes: 'string',
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
    constraints: [
      'Mood tags must exactly match allowed tag strings.',
      'If image vision exists, ground atmosphere in scene_type, atmosphere_signal, quality, and visual_reason.',
      'Keep evidence confidence honest and based only on supplied fields.',
    ],
  }, null, 2);
}

function normalizeEditorialJson(value: Record<string, unknown>, allowedTags: readonly MoodTag[]): EditorialJson {
  const allowed = new Set<string>(allowedTags);
  const moodTags = stringArray(value.mood_tags)
    .filter((tag): tag is MoodTag => allowed.has(tag))
    .slice(0, 5);
  if (moodTags.length < 2) throw new Error('editorial_invalid_mood_tags');

  const tagline = clamp(stringValue(value.tagline), 80);
  const description = stringValue(value.grounded_description) || stringValue(value.description_short);
  if (tagline.length < 12) throw new Error('editorial_missing_or_short_tagline');
  if (description.length < 80) throw new Error('editorial_missing_description');

  return {
    tagline,
    description_short: stringValue(value.description_short) || description,
    mood_tags: moodTags,
    moments: stringArray(value.moments).slice(0, 5),
    best_for: stringArray(value.best_for).slice(0, 5),
    not_for: stringArray(value.not_for).slice(0, 3),
    primary_atmosphere: stringValue(value.primary_atmosphere),
    evidence_confidence: clampNumber(value.evidence_confidence, 0, 1),
    mood_confidence: clampNumber(value.mood_confidence, 0, 1),
    editorial_notes: stringValue(value.editorial_notes),
    grounded_description: description,
  };
}

function applyEditorialToVenue(venue: VenueComplete, editorial: EditorialJson, modelUsed: string): void {
  venue.editorial = {
    ...venue.editorial,
    tagline: editorial.tagline,
    description: editorial.grounded_description,
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
      `stage_05b_model_used:${modelUsed}`,
      `stage_05b_evidence_confidence:${editorial.evidence_confidence}`,
      `stage_05b_editorial_notes:${editorial.editorial_notes}`,
      `stage_05b_best_for:${editorial.best_for.join(', ')}`,
      `stage_05b_not_for:${editorial.not_for.join(', ')}`,
      `stage_05b_primary_atmosphere:${editorial.primary_atmosphere}`,
    ],
    warnings: (venue.evidence.warnings || []).filter((warning) => warning !== 'stub_evidence_pending'),
  };
  venue.pipeline_notes = [
    ...(venue.pipeline_notes || []),
    `Stage 05B MiniMax text retry generated with ${modelUsed}.`,
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
    result.retry_summary ? `- Stage 05B retry calls made: ${result.retry_summary.minimax_calls_made}` : '',
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
    '- No successful editorial records were rerun by Stage 05B.',
    '- No M3 calls were made.',
    '- No Supabase writes were made.',
    '- No Cloudinary uploads were made.',
    '- No publication or deploy path was run.',
    '- Protected consumer UI files were not touched.',
  ].filter(Boolean);
  return `${redactSecrets(lines.join('\n'))}\n`;
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

function cloneCandidate(candidate: ReviewQueueItem): ReviewQueueItem {
  return JSON.parse(JSON.stringify(candidate)) as ReviewQueueItem;
}

function normalizeVenueName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, 'utf8')) as T;
}

const currentFile = path.resolve(fileURLToPath(import.meta.url));
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : '';

if (currentFile === invokedFile) {
  const batchName = process.argv[2];
  if (!batchName) {
    console.error('Usage: npx tsx pipeline/stages/05b_retry_failed_editorial.ts <batch_id>');
    process.exitCode = 1;
  } else {
    retryFailedEditorial(batchName).catch((error: unknown) => {
      const message = redactSecrets(error instanceof Error ? error.message : String(error));
      console.error(`Stage 05B retry failed: ${message}`);
      process.exitCode = 1;
    });
  }
}
