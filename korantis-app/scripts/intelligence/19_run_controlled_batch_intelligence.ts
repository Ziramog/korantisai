import * as path from 'path';
import { writeFileSync } from 'fs';
import type {
  DerivedArchetype,
  EvidenceObject,
  IntelligenceScores,
  IntentScores,
  PhotoEvidence,
  VenueCategory,
  VenueIntelligence,
} from './types';
import type { ExperienceEvidenceItem, ExperienceEvidenceSource } from './experience_evidence/types';
import {
  type BatchCandidate,
  type BatchGoogleRecord,
  type VenueVisionResult,
  evidenceFor,
  experienceFor,
  photoFromVision,
  scoresFor,
  signalsFor,
} from './controlled_batch_utils';
import { aggregateExperienceEvidence } from './experience_evidence/aggregate_signals';
import { extractTextSignals } from './experience_evidence/extract_text_signals';
import { computeEligibilityV0 } from './scoring/eligibility';
import { computeIntentScoresV0 } from './scoring/intent_scores';
import { computeWorkIntentSplit, type WorkIntentSplit } from './scoring/work_intent';
import { weightedAverage } from './scoring/utils';
import { VENUE_INTELLIGENCE_VERSION } from './types';
import { readJson } from './controlled_batch_utils';

type BatchFile = {
  candidates: BatchCandidate[];
};

type EnrichmentFile = {
  records: BatchGoogleRecord[];
};

type VisionFile = {
  venues: VenueVisionResult[];
};

type ControlledBatchOutput = VenueIntelligence & {
  venue_name: string;
  candidate_status: string;
  match_status: string;
  work_intent: WorkIntentSplit;
  diagnostics: {
    google_match_status: string;
    google_match_confidence: number | null;
    vision_status: string;
    photos_evaluated: number;
    evidence_gaps: string[];
    experience_evidence_strength: number;
  };
};

function clampScore(value: number): number {
  if (Number.isNaN(value) || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function sourceType(sourceName: string, rawType: string): ExperienceEvidenceSource {
  const source = sourceName.toLowerCase();
  if (rawType === 'community' || source.includes('reddit')) return 'community';
  if (source.includes('tripadvisor') || source.includes('timeout') || source.includes('eater')) return 'travel';
  if (source.includes('blog')) return 'blog';
  return 'editorial';
}

function photoEvidence(vision: VenueVisionResult | undefined): PhotoEvidence[] {
  return (vision?.photo_results || []).map((photo) => ({
    photo_reference: photo.photo_reference,
    signals: [
      ...(photo.interior_visible ? ['interior'] : []),
      ...(photo.seating_visible ? ['seating'] : []),
      ...(photo.people_staying_visible ? ['people_staying'] : []),
      ...(photo.storefront_only ? ['storefront_only'] : []),
      ...(photo.product_only ? ['product_only'] : []),
      ...(photo.menu_only ? ['menu_only'] : []),
    ],
    score: clampScore(photo.atmosphere_score),
  }));
}

function visionEvidenceText(vision: VenueVisionResult | undefined): string {
  if (!vision || vision.photo_results.length === 0) return '';
  const parts = [
    vision.aggregation.interior_confidence >= 30 ? 'interior visible' : '',
    vision.aggregation.seating_confidence >= 30 ? 'seating tables chairs visible' : '',
    vision.aggregation.long_stay_visual_signal >= 55 ? 'long stay spatial depth' : '',
    vision.aggregation.design_visual_signal >= 60 ? 'design atmosphere' : '',
    vision.photo_results.some((photo) => photo.people_staying_visible) ? 'people staying' : '',
    vision.photo_results.some((photo) => photo.counter_only) ? 'counter only' : '',
    vision.photo_results.some((photo) => photo.product_only) ? 'product only' : '',
    vision.photo_results.some((photo) => photo.storefront_only && !photo.interior_visible) ? 'storefront only' : '',
  ];
  return parts.filter(Boolean).join('. ');
}

function experienceItems(candidate: BatchCandidate, google: BatchGoogleRecord | undefined, vision: VenueVisionResult | undefined): ExperienceEvidenceItem[] {
  const collectedAt = new Date().toISOString();
  const sourceItems = candidate.merged_sources.map((mention, index) => ({
    id: `controlled_${candidate.candidate_id}_source_${index}`,
    candidate_id: candidate.candidate_id,
    venue_name: candidate.venue_name,
    source: mention.source,
    source_type: sourceType(mention.source, mention.source_type),
    text: mention.context,
    structured_data: {
      district: mention.district,
      category: mention.category,
      rank_position: mention.rank_position,
    },
    url: mention.source_url,
    confidence: 72,
    collected_at: collectedAt,
  }));
  const googleItem: ExperienceEvidenceItem | null = google?.google_data ? {
    id: `controlled_${candidate.candidate_id}_google_metadata`,
    candidate_id: candidate.candidate_id,
    venue_name: candidate.venue_name,
    source: 'Google Places metadata',
    source_type: 'google_metadata',
    text: [
      google.google_data.displayName?.text || candidate.venue_name,
      google.google_data.primaryType || '',
      ...(google.google_data.types || []),
      google.google_data.formattedAddress || '',
    ].join(' '),
    structured_data: {
      rating: google.google_data.rating ?? null,
      userRatingCount: google.google_data.userRatingCount ?? null,
      priceLevel: google.google_data.priceLevel ?? null,
    },
    confidence: 70,
    collected_at: collectedAt,
  } : null;
  const visionText = visionEvidenceText(vision);
  const visionItem: ExperienceEvidenceItem | null = visionText ? {
    id: `controlled_${candidate.candidate_id}_vision`,
    candidate_id: candidate.candidate_id,
    venue_name: candidate.venue_name,
    source: 'OpenAI photo vision',
    source_type: 'vision',
    text: visionText,
    structured_data: {
      aggregation: vision?.aggregation,
      photos_evaluated: vision?.photos_evaluated || 0,
    },
    confidence: 82,
    collected_at: collectedAt,
  } : null;

  return [
    ...sourceItems,
    ...(googleItem ? [googleItem] : []),
    ...(visionItem ? [visionItem] : []),
  ];
}

function eligibilityScore(scores: IntelligenceScores, intentScores: IntentScores, signals: ControlledBatchOutput['signals']): number {
  return weightedAverage([
    [scores.discovery_score, 0.16],
    [scores.cultural_relevance_score, 0.12],
    [scores.experience_quality_score, 0.22],
    [scores.photo_quality_score, 0.20],
    [Math.max(...Object.values(intentScores).filter((value): value is number => typeof value === 'number')), 0.16],
    [signals.chain_signal >= 70 ? 20 : 80, 0.14],
  ]);
}

function derivedArchetypes(intentScores: IntentScores): DerivedArchetype[] {
  const names: Partial<Record<keyof IntentScores, string>> = {
    work_score: 'work',
    reading_score: 'reading',
    date_score: 'date',
    conversation_score: 'conversation',
    brunch_score: 'brunch',
    dinner_score: 'dinner',
    wine_score: 'wine',
    cocktail_score: 'cocktail',
    classic_city_score: 'classic city',
    hidden_gem_score: 'hidden gem',
    premium_destination_score: 'premium destination',
    quick_stop_score: 'quick stop',
  };
  return Object.entries(names)
    .map(([key, name]) => ({ name: name as string, confidence: intentScores[key as keyof IntentScores] || 0 }))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);
}

function constraintsFor(google: BatchGoogleRecord | undefined, vision: VenueVisionResult | undefined): string[] {
  const constraints = [
    ...(google?.status !== 'matched' ? [`google match status: ${google?.status || 'missing'}`] : []),
    ...(google?.match?.match_warnings || []),
    ...(vision ? [] : ['photo vision missing']),
    ...(vision?.aggregation.warnings || []),
  ];
  return Array.from(new Set(constraints));
}

function topBy(outputs: ControlledBatchOutput[], key: keyof IntentScores, filter?: (output: ControlledBatchOutput) => boolean): string[] {
  const rows = outputs
    .filter(filter || (() => true))
    .sort((a, b) => (b.intent_scores[key] || 0) - (a.intent_scores[key] || 0))
    .slice(0, 5);
  return rows.length ? rows.map((output) => `- ${output.venue_name}: ${output.intent_scores[key] || 0} (${output.eligibility.status})`) : ['- None'];
}

function recommendation(outputs: ControlledBatchOutput[], googleRecords: BatchGoogleRecord[], visionRecords: VenueVisionResult[]): string {
  const matched = googleRecords.filter((record) => record.status === 'matched').length;
  const active = outputs.filter((output) => output.eligibility.status === 'active').length;
  const photoFailures = visionRecords.filter((venue) => !venue.aggregation.acceptable_hero_photo).length;
  const evidenceGapCount = outputs.filter((output) => output.diagnostics.evidence_gaps.length > 0).length;

  if (matched < 24) return 'B) Improve matching before scaling';
  if (photoFailures > 5) return 'D) Improve photo quality/vision before scaling';
  if (active >= 22 && evidenceGapCount <= 10) return 'A) Proceed to broader controlled enrichment';
  if (active >= 15) return 'C) Improve evidence depth, then expand';
  return 'E) Hold scaling until eligibility calibration improves';
}

function report(outputs: ControlledBatchOutput[], googleRecords: BatchGoogleRecord[], visionRecords: VenueVisionResult[]): string {
  const matched = googleRecords.filter((record) => record.status === 'matched');
  const ambiguous = googleRecords.filter((record) => record.status === 'ambiguous_match');
  const unmatched = googleRecords.filter((record) => record.status === 'unmatched');
  const active = outputs.filter((output) => output.eligibility.status === 'active');
  const pending = outputs.filter((output) => output.eligibility.status === 'pending_review');
  const rejected = outputs.filter((output) => output.eligibility.status === 'rejected');
  const categoryCounts = ['cafe', 'restaurant', 'wine_bar', 'cocktail_bar'].map((category) => {
    const count = active.filter((output) => output.category === category).length;
    return `- ${category}: ${count}`;
  });
  const photoFailures = visionRecords.filter((venue) => !venue.aggregation.acceptable_hero_photo);
  const matchingFailures = [...ambiguous, ...unmatched];
  const gaps = outputs.flatMap((output) => output.diagnostics.evidence_gaps.map((gap) => `${output.venue_name}: ${gap}`));

  return [
    '# Controlled Batch 30 Intelligence Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Summary',
    '',
    `- Selected candidates: ${googleRecords.length}`,
    `- Matched: ${matched.length}`,
    `- Ambiguous: ${ambiguous.length}`,
    `- Unmatched: ${unmatched.length}`,
    `- Photo vision venues: ${visionRecords.length}`,
    `- Active: ${active.length}`,
    `- Pending review: ${pending.length}`,
    `- Rejected: ${rejected.length}`,
    `- Readiness recommendation: ${recommendation(outputs, googleRecords, visionRecords)}`,
    '',
    '## Active By Category',
    '',
    ...categoryCounts,
    '',
    '## Status By Venue',
    '',
    ...outputs.map((output) => `- ${output.venue_name}: ${output.eligibility.status}, eligibility ${output.scores.eligibility_score}, match ${output.match_status}, photo ${output.photo_intelligence.photo_quality_score}, reasons ${output.eligibility.reasons.join('; ') || 'none'}, warnings ${output.eligibility.warnings.join('; ') || 'none'}`),
    '',
    '## Strongest Work Cafes',
    '',
    ...topBy(outputs, 'work_score', (output) => output.category === 'cafe'),
    '',
    '## Strongest Dinner Venues',
    '',
    ...topBy(outputs, 'dinner_score'),
    '',
    '## Strongest Wine Venues',
    '',
    ...topBy(outputs, 'wine_score'),
    '',
    '## Strongest Cocktail Venues',
    '',
    ...topBy(outputs, 'cocktail_score'),
    '',
    '## Strongest Premium Destinations',
    '',
    ...topBy(outputs, 'premium_destination_score'),
    '',
    '## Generic/Mainstream Risks',
    '',
    ...(outputs.filter((output) => output.signals.mainstream_signal >= 60 || output.signals.tourist_signal >= 85)
      .map((output) => `- ${output.venue_name}: mainstream ${output.signals.mainstream_signal}, tourist ${output.signals.tourist_signal}`)
      .concat(outputs.some((output) => output.signals.mainstream_signal >= 60 || output.signals.tourist_signal >= 85) ? [] : ['- None'])),
    '',
    '## Photo Failures',
    '',
    ...(photoFailures.length ? photoFailures.map((venue) => `- ${venue.venue_name}: ${venue.aggregation.warnings.join('; ') || 'no acceptable hero'}`) : ['- None']),
    '',
    '## Matching Failures',
    '',
    ...(matchingFailures.length ? matchingFailures.map((record) => `- ${record.candidate_name}: ${record.status}; ${record.error || record.match?.match_warnings.join('; ') || 'needs review'}`) : ['- None']),
    '',
    '## Evidence Gaps',
    '',
    ...(gaps.length ? gaps.map((gap) => `- ${gap}`) : ['- None']),
  ].join('\n');
}

function main() {
  const batch = readJson<BatchFile>(path.join(process.cwd(), 'data', 'controlled_batch_30_candidates.json'));
  const enrichment = readJson<EnrichmentFile>(path.join(process.cwd(), 'data', 'controlled_batch_30_google_enrichment.json'));
  const vision = readJson<VisionFile>(path.join(process.cwd(), 'data', 'controlled_batch_30_photo_vision.json'));
  const googleByCandidate = new Map(enrichment.records.map((record) => [record.candidate_id, record]));
  const visionByCandidate = new Map(vision.venues.map((venue) => [venue.candidate_id, venue]));

  const outputs: ControlledBatchOutput[] = batch.candidates.map((candidate) => {
    const googleRecord = googleByCandidate.get(candidate.candidate_id);
    const google = googleRecord?.status === 'matched' ? googleRecord.google_data : null;
    const visionRecord = visionByCandidate.get(candidate.candidate_id);
    const signals = signalsFor(candidate);
    const experience = experienceFor(candidate, signals);
    const photo = photoFromVision(visionRecord);
    const constraints = constraintsFor(googleRecord, visionRecord);
    const scores = scoresFor(candidate, google, signals, experience, photo);
    const evidence: EvidenceObject = {
      ...evidenceFor(candidate, google, constraints),
      photo_evidence: photoEvidence(visionRecord),
    };
    const baseIntentScores = computeIntentScoresV0({
      category: candidate.category as VenueCategory,
      scores,
      signals,
      experience_signals: experience,
      photo_intelligence: photo,
      evidence,
    });
    const items = experienceItems(candidate, googleRecord, visionRecord);
    const bundle = {
      candidate_id: candidate.candidate_id,
      venue_name: candidate.venue_name,
      items,
      extractions: items.map(extractTextSignals),
    };
    const aggregate = aggregateExperienceEvidence(bundle);
    const workIntent = computeWorkIntentSplit({
      signal_scores: aggregate.signal_scores,
      constraints: aggregate.constraints,
      baseline: {
        seating_confidence: photo.seating_confidence,
        quiet_signal: experience.quiet_signal,
        long_stay_signal: experience.long_stay_signal,
        quick_stop_score: baseIntentScores.quick_stop_score,
        counter_only_risk: photo.counter_only_risk,
      },
    });
    const intentScores: IntentScores = {
      ...baseIntentScores,
      work_score: workIntent.derived_work_score,
      work_possible_score: workIntent.work_possible_score,
      work_recommended_score: workIntent.work_recommended_score,
      work_risk_score: workIntent.work_risk_score,
    };
    const scoresWithEligibility = {
      ...scores,
      eligibility_score: eligibilityScore(scores, intentScores, signals),
    };
    const eligibility = computeEligibilityV0({
      category: candidate.category as VenueCategory,
      scores: scoresWithEligibility,
      signals,
      experience_signals: experience,
      photo_intelligence: photo,
      evidence,
      intent_scores: intentScores,
    });

    return {
      venue_name: candidate.venue_name,
      candidate_id: candidate.candidate_id,
      google_place_id: google?.id || googleRecord?.google_place_id || null,
      city: 'buenos_aires',
      district: candidate.district,
      category: candidate.category as VenueCategory,
      scores: scoresWithEligibility,
      signals,
      experience_signals: experience,
      intent_scores: intentScores,
      photo_intelligence: photo,
      eligibility,
      derived_archetypes: derivedArchetypes(intentScores),
      evidence,
      version: VENUE_INTELLIGENCE_VERSION,
      candidate_status: candidate.status,
      match_status: googleRecord?.status || 'missing',
      work_intent: workIntent,
      diagnostics: {
        google_match_status: googleRecord?.status || 'missing',
        google_match_confidence: googleRecord?.match?.match_confidence ?? null,
        vision_status: visionRecord?.vision_status || 'missing',
        photos_evaluated: visionRecord?.photos_evaluated || 0,
        evidence_gaps: aggregate.evidence_gaps,
        experience_evidence_strength: aggregate.evidence_strength_score,
      },
    };
  });

  const output = {
    generatedAt: new Date().toISOString(),
    count: outputs.length,
    diagnostics: {
      active: outputs.filter((venue) => venue.eligibility.status === 'active').length,
      pending_review: outputs.filter((venue) => venue.eligibility.status === 'pending_review').length,
      rejected: outputs.filter((venue) => venue.eligibility.status === 'rejected').length,
    },
    outputs,
  };
  const markdown = report(outputs, enrichment.records, vision.venues);

  writeFileSync(path.join(process.cwd(), 'data', 'controlled_batch_30_intelligence.json'), JSON.stringify(output, null, 2));
  writeFileSync(path.join(process.cwd(), 'data', 'controlled_batch_30_intelligence.md'), markdown);
  console.log(markdown);
}

main();
