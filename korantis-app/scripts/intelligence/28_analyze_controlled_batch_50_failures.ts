import * as path from 'path';
import { writeFileSync } from 'fs';
import {
  type BatchCandidate,
  type BatchGoogleRecord,
  type VenueVisionResult,
  readJson,
} from './controlled_batch_utils';
import type { VenueIntelligence } from './types';

type BatchFile = { candidates: BatchCandidate[] };
type EnrichmentFile = { records: BatchGoogleRecord[] };
type VisionFile = { venues: VenueVisionResult[] };
type IntelligenceFile = { outputs: Array<VenueIntelligence & { venue_name: string; match_status?: string; diagnostics?: { evidence_gaps?: string[] } }> };

function classifyFailure(output: VenueIntelligence & { match_status?: string; diagnostics?: { evidence_gaps?: string[] } }, vision?: VenueVisionResult): string[] {
  const causes = new Set<string>();
  if (output.match_status !== 'matched') causes.add('matching');
  if (vision && !vision.aggregation.acceptable_hero_photo) causes.add('photo quality');
  if (output.diagnostics?.evidence_gaps?.length) causes.add('missing evidence');
  if (output.scores.discovery_score < 50 || output.scores.cultural_relevance_score < 45) causes.add('low discovery/cultural relevance');
  if (output.eligibility.reasons.some((reason) => reason.includes('category'))) causes.add('category mismatch');
  return [...causes];
}

function countBy<T>(items: T[], selector: (item: T) => string): Record<string, number> {
  return items.reduce((acc, item) => {
    const key = selector(item);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

function main() {
  const batch = readJson<BatchFile>(path.join(process.cwd(), 'data', 'controlled_batch_50_candidates.json'));
  const google = readJson<EnrichmentFile>(path.join(process.cwd(), 'data', 'controlled_batch_50_google_enrichment.json'));
  const vision = readJson<VisionFile>(path.join(process.cwd(), 'data', 'controlled_batch_50_photo_vision.json'));
  const intelligence = readJson<IntelligenceFile>(path.join(process.cwd(), 'data', 'controlled_batch_50_intelligence.json'));
  const candidatesById = new Map(batch.candidates.map((candidate) => [candidate.candidate_id, candidate]));
  const visionById = new Map(vision.venues.map((venue) => [venue.candidate_id, venue]));
  const unmatched = google.records.filter((record) => record.status === 'unmatched');
  const photoFailures = vision.venues.filter((venue) => !venue.aggregation.acceptable_hero_photo);
  const rejected = intelligence.outputs.filter((output) => output.eligibility.status === 'rejected');
  const pending = intelligence.outputs.filter((output) => output.eligibility.status === 'pending_review');
  const failedOutputs = intelligence.outputs.filter((output) => output.eligibility.status !== 'active');
  const enrichedFailures = failedOutputs.map((output) => {
    const candidate = candidatesById.get(output.candidate_id || '');
    const venueVision = visionById.get(output.candidate_id || '');
    return {
      candidate_id: output.candidate_id,
      venue_name: output.venue_name,
      category: output.category,
      district: output.district,
      status: output.eligibility.status,
      rejection_reasons: output.eligibility.reasons,
      warnings: output.eligibility.warnings,
      blockers: output.diagnostics?.evidence_gaps || [],
      causes: classifyFailure(output, venueVision),
      discovery_score: output.scores.discovery_score,
      cultural_relevance_score: output.scores.cultural_relevance_score,
      sources: candidate?.sources || [],
    };
  });

  const output = {
    generatedAt: new Date().toISOString(),
    unmatched: unmatched.map((record) => ({
      candidate_id: record.candidate_id,
      venue_name: record.candidate_name,
      category: record.category,
      district: record.district,
      confidence: record.match?.match_confidence ?? null,
      warnings: record.match?.match_warnings || [],
      top_match: record.match?.google_name || null,
    })),
    photoHeroFailures: photoFailures.map((venue) => ({
      candidate_id: venue.candidate_id,
      venue_name: venue.venue_name,
      photos_evaluated: venue.photos_evaluated,
      photo_quality_score: venue.aggregation.photo_quality_score,
      warnings: venue.aggregation.warnings,
    })),
    rejected: enrichedFailures.filter((failure) => failure.status === 'rejected'),
    pending_review: enrichedFailures.filter((failure) => failure.status === 'pending_review'),
    breakdown: {
      failureCategory: countBy(enrichedFailures, (failure) => failure.category),
      failureDistrict: countBy(enrichedFailures, (failure) => failure.district),
      cause: enrichedFailures.flatMap((failure) => failure.causes).reduce((acc, cause) => {
        acc[cause] = (acc[cause] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    },
  };

  writeFileSync(path.join(process.cwd(), 'data', 'controlled_batch_50_failure_analysis.json'), JSON.stringify(output, null, 2));

  const report = [
    '# Controlled Batch 50 Failure Analysis',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Summary',
    '',
    `- Unmatched candidates: ${unmatched.length}`,
    `- Photo hero failures: ${photoFailures.length}`,
    `- Rejected candidates: ${rejected.length}`,
    `- Pending review candidates: ${pending.length}`,
    '',
    '## Unmatched Candidates',
    '',
    ...output.unmatched.map((item) => `- ${item.venue_name}: ${item.category}, ${item.district}, confidence ${item.confidence ?? 'n/a'}, top ${item.top_match || 'none'}, warnings ${item.warnings.join('; ') || 'none'}`),
    '',
    '## Photo Hero Failures',
    '',
    ...output.photoHeroFailures.map((item) => `- ${item.venue_name}: photos ${item.photos_evaluated}, quality ${item.photo_quality_score}, warnings ${item.warnings.join('; ') || 'none'}`),
    '',
    '## Rejected Candidates',
    '',
    ...output.rejected.map((item) => `- ${item.venue_name}: causes ${item.causes.join(', ') || 'none'}; reasons ${item.rejection_reasons.join('; ') || 'none'}`),
    '',
    '## Pending Review Candidates',
    '',
    ...output.pending_review.map((item) => `- ${item.venue_name}: causes ${item.causes.join(', ') || 'none'}; blockers ${item.blockers.join('; ') || 'none'}; reasons ${item.rejection_reasons.join('; ') || 'none'}`),
    '',
    '## Category Breakdown',
    '',
    ...Object.entries(output.breakdown.failureCategory).map(([category, count]) => `- ${category}: ${count}`),
    '',
    '## District Breakdown',
    '',
    ...Object.entries(output.breakdown.failureDistrict).sort(([, a], [, b]) => b - a).map(([district, count]) => `- ${district}: ${count}`),
    '',
    '## Failure Cause Breakdown',
    '',
    ...Object.entries(output.breakdown.cause).map(([cause, count]) => `- ${cause}: ${count}`),
  ].join('\n');

  writeFileSync(path.join(process.cwd(), 'data', 'controlled_batch_50_failure_analysis.md'), report);
  console.log(report);
}

main();
