import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { mergePipelineConfig } from './config';
import { generateDashboard } from './review/generate_dashboard';
import { extractVenueData, loadLocalEnv } from './stages/01_extract_data';
import { scoreAndStage } from './stages/06_score_and_stage';
import type { BatchInput, BatchResult, ReviewQueueItem, VenueComplete, VenueRaw } from './types';

const batchName = process.argv[2] || 'batch_003_ba';
const inputPath = path.join(process.cwd(), 'pipeline', 'input', `${batchName}.json`);
const startedAt = new Date();

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Batch run failed: ${message}`);
  process.exitCode = 1;
});

async function main(): Promise<void> {
  loadLocalEnv();

  const input = readBatchInput(inputPath);
  const config = mergePipelineConfig(input.config_overrides);
  const outputDir = path.join(process.cwd(), 'data', 'batches', input.batch_id);
  mkdirSync(outputDir, { recursive: true });

  const stageStatuses: BatchResult['stage_statuses'] = [
    { stage: '01_extract_data', status: 'skipped', notes: 'Prebuilt VenueComplete records supplied.' },
    { stage: '02_collect_evidence', status: 'skipped', notes: 'Stubbed for MVP; no external APIs called.' },
    { stage: '03_discover_images', status: 'skipped', notes: 'Stubbed for MVP; no scraping or image download performed.' },
    { stage: '04_classify_images', status: 'skipped', notes: 'Stubbed for MVP; M3 not called.' },
    { stage: '05_generate_editorial', status: 'skipped', notes: 'Stubbed for MVP; no LLM called.' },
    { stage: '06_score_and_stage', status: 'completed', notes: 'Deterministic local scoring completed.' },
    { stage: '07_stage_to_supabase', status: 'skipped', notes: 'No Supabase writes in MVP.' },
    { stage: '08_promote_staged', status: 'skipped', notes: 'No publication path in MVP.' },
  ];

  const venues = await materializeVenueRecords(input, stageStatuses);
  const candidates: ReviewQueueItem[] = venues.map((venue) => {
    const staging = scoreAndStage(venue, config);
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
    batch_id: input.batch_id,
    city: input.city,
    generated_at: finishedAt.toISOString(),
    status: 'completed',
    summary: buildSummary(candidates),
    stage_statuses: stageStatuses,
    config,
    candidates,
    mood_distribution: countMoodTags(candidates),
    neighborhood_distribution: countNeighborhoods(candidates),
    cost_placeholder: {
      estimated_usd: null,
      notes: 'Cost tracking placeholder. Google Places may run for Stage 01 only when no prebuilt records are supplied.',
    },
    runtime_placeholder: {
      started_at: startedAt.toISOString(),
      finished_at: finishedAt.toISOString(),
      duration_ms: finishedAt.getTime() - startedAt.getTime(),
    },
  };

  writeFileSync(path.join(outputDir, 'batch_result.json'), `${JSON.stringify(batchResult, null, 2)}\n`, 'utf8');
  generateDashboard(batchResult, outputDir);

  console.log(`Batch result written to ${path.join(outputDir, 'batch_result.json')}`);
  console.log(`Dashboard written to ${path.join(outputDir, 'dashboard.html')}`);
}

function readBatchInput(filePath: string): BatchInput {
  const parsed = JSON.parse(readFileSync(filePath, 'utf8')) as BatchInput;
  validateBatchInput(parsed);
  return parsed;
}

function validateBatchInput(input: BatchInput): void {
  const errors: string[] = [];
  const hasPrebuiltVenues = Array.isArray(input.prebuilt_venues) && input.prebuilt_venues.length > 0;
  const hasVenueSeeds = Array.isArray(input.venues) && input.venues.length > 0;

  if (!input.batch_id) errors.push('batch_id is required');
  if (!input.city) errors.push('city is required');
  if (!hasPrebuiltVenues && !hasVenueSeeds) errors.push('venues or prebuilt_venues must be a non-empty array');
  for (const [index, venue] of (input.venues || []).entries()) {
    if (!venue.name) errors.push(`venues[${index}].name is required`);
  }
  for (const [index, venue] of (input.prebuilt_venues || []).entries()) {
    if (!venue.raw?.name) errors.push(`prebuilt_venues[${index}].raw.name is required`);
  }
  if (errors.length > 0) {
    throw new Error(`Invalid batch input: ${errors.join('; ')}`);
  }
}

async function materializeVenueRecords(
  input: BatchInput,
  stageStatuses: BatchResult['stage_statuses'],
): Promise<VenueComplete[]> {
  if (input.prebuilt_venues && input.prebuilt_venues.length > 0) {
    return input.prebuilt_venues;
  }

  const extraction = await extractVenueData(input.venues || [], input.city, {
    batchId: input.batch_id,
    apiKey: process.env.GOOGLE_PLACES_API_KEY,
  });
  const stageStatus = stageStatuses.find((stage) => stage.stage === '01_extract_data');
  if (stageStatus) {
    stageStatus.status = extraction.api_key_present && extraction.venues_found > 0 ? 'completed' : 'failed';
    stageStatus.notes = `Google Places extraction requested=${extraction.venues_requested}, found=${extraction.venues_found}, failed=${extraction.venues_failed}.`;
  }

  return extraction.raw_venues.map((venue) => createStubVenueFromRaw(venue));
}

function createStubVenueFromRaw(raw: VenueRaw): VenueComplete {
  return {
    raw,
    evidence: {
      confidence: 0,
      sources: [],
      contact: {
        website: raw.website_url,
        phone: raw.phone,
      },
      warnings: ['stub_evidence_pending'],
    },
    images: {
      candidates: [],
      has_hero_image: false,
      spatial_candidate_count: 0,
      product_candidate_count: 0,
      warnings: ['stub_images_pending'],
    },
    editorial: {
      mood_tags: [],
      mood_confidence: 0,
      warnings: ['stub_editorial_pending'],
    },
    review_count: 0,
    pipeline_notes: ['Stage 01 raw extraction is available. Stages 02-05 remain stubbed.'],
  };
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
