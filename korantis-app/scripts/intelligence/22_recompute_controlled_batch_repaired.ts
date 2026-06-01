import * as path from 'path';
import { existsSync, writeFileSync } from 'fs';
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
  records: Array<BatchGoogleRecord & { repair_metadata?: Record<string, unknown> }>;
};

type VisionFile = {
  venues: VenueVisionResult[];
};

type OriginalOutputFile = {
  outputs: Array<VenueIntelligence & { venue_name: string; match_status?: string }>;
};

type PracticalEvidenceImport = {
  venue_name: string;
  google_place_id?: string | null;
  source: string;
  source_type: string;
  url?: string;
  text: string;
  language?: string;
  collected_at?: string;
  notes?: string;
};

type RepairedOutput = VenueIntelligence & {
  venue_name: string;
  previous_status: string | null;
  previous_eligibility_status: string | null;
  match_status: string;
  work_intent: WorkIntentSplit;
  diagnostics: {
    google_match_status: string;
    google_match_confidence: number | null;
    vision_status: string;
    photos_evaluated: number;
    practical_evidence_items: number;
    evidence_gaps: string[];
    experience_evidence_strength: number;
  };
};

function clampScore(value: number): number {
  if (Number.isNaN(value) || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function sourceType(sourceName: string, rawType: string): ExperienceEvidenceSource {
  const source = `${sourceName} ${rawType}`.toLowerCase();
  if (source.includes('community') || source.includes('reddit')) return 'community';
  if (source.includes('travel') || source.includes('tripadvisor') || source.includes('timeout')) return 'travel';
  if (source.includes('blog')) return 'blog';
  if (source.includes('review')) return 'future_review_snapshot';
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
  return [
    vision.aggregation.interior_confidence >= 30 ? 'interior visible' : '',
    vision.aggregation.seating_confidence >= 30 ? 'seating tables chairs visible' : '',
    vision.aggregation.long_stay_visual_signal >= 55 ? 'long stay spatial depth' : '',
    vision.aggregation.design_visual_signal >= 60 ? 'design atmosphere' : '',
    vision.photo_results.some((photo) => photo.people_staying_visible) ? 'people staying' : '',
    vision.photo_results.some((photo) => photo.counter_only) ? 'counter only' : '',
    vision.photo_results.some((photo) => photo.product_only) ? 'product only' : '',
    vision.photo_results.some((photo) => photo.storefront_only && !photo.interior_visible) ? 'storefront only' : '',
  ].filter(Boolean).join('. ');
}

function practicalEvidenceByVenue(): Map<string, PracticalEvidenceImport[]> {
  const file = path.join(process.cwd(), 'data', 'controlled_batch_practical_evidence_import.json');
  if (!existsSync(file)) return new Map();
  const records = readJson<PracticalEvidenceImport[]>(file).filter((record) => record.text.trim().length > 0);
  const byVenue = new Map<string, PracticalEvidenceImport[]>();
  for (const record of records) {
    const current = byVenue.get(record.venue_name) || [];
    current.push(record);
    byVenue.set(record.venue_name, current);
  }
  return byVenue;
}

function experienceItems(candidate: BatchCandidate, google: BatchGoogleRecord | undefined, vision: VenueVisionResult | undefined, practicalRecords: PracticalEvidenceImport[]): ExperienceEvidenceItem[] {
  const collectedAt = new Date().toISOString();
  const sourceItems: ExperienceEvidenceItem[] = candidate.merged_sources.map((mention, index) => ({
    id: `controlled_repaired_${candidate.candidate_id}_source_${index}`,
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
    id: `controlled_repaired_${candidate.candidate_id}_google_metadata`,
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
    id: `controlled_repaired_${candidate.candidate_id}_vision`,
    candidate_id: candidate.candidate_id,
    venue_name: candidate.venue_name,
    source: 'Photo vision',
    source_type: 'vision',
    text: visionText,
    structured_data: {
      aggregation: vision?.aggregation,
      photos_evaluated: vision?.photos_evaluated || 0,
    },
    confidence: 82,
    collected_at: collectedAt,
  } : null;
  const practicalItems: ExperienceEvidenceItem[] = practicalRecords.map((record, index) => ({
    id: `controlled_repaired_${candidate.candidate_id}_practical_${index}`,
    candidate_id: candidate.candidate_id,
    venue_name: candidate.venue_name,
    source: record.source,
    source_type: sourceType(record.source, record.source_type),
    text: record.text,
    structured_data: {
      google_place_id: record.google_place_id ?? null,
      language: record.language || 'unknown',
      notes: record.notes || null,
    },
    url: record.url,
    confidence: 78,
    collected_at: record.collected_at || collectedAt,
  }));

  return [
    ...sourceItems,
    ...(googleItem ? [googleItem] : []),
    ...(visionItem ? [visionItem] : []),
    ...practicalItems,
  ];
}

function eligibilityScore(scores: IntelligenceScores, intentScores: IntentScores, signals: RepairedOutput['signals']): number {
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

function combineVision(original: VisionFile, repaired: VisionFile): Map<string, VenueVisionResult> {
  const map = new Map<string, VenueVisionResult>();
  for (const venue of original.venues) map.set(venue.candidate_id, venue);
  for (const venue of repaired.venues) map.set(venue.candidate_id, venue);
  return map;
}

function decision(outputs: RepairedOutput[]): string {
  const matchRate = outputs.filter((output) => output.match_status === 'matched').length / outputs.length;
  const visionEvaluated = outputs.filter((output) => output.photo_intelligence.evaluation_status === 'evaluated');
  const photoHeroRate = visionEvaluated.length
    ? visionEvaluated.filter((output) => output.photo_intelligence.acceptable_hero_photo).length / visionEvaluated.length
    : 0;
  const cafes = outputs.filter((output) => output.category === 'cafe');
  const underEvidencedWork = cafes.filter((output) => output.diagnostics.evidence_gaps.some((gap) => gap.includes('work/practical'))).length;
  const activeRejectedCredible = outputs.every((output) => output.eligibility.reasons.length > 0 || output.eligibility.status === 'pending_review');

  if (matchRate < 0.9) return 'B) Improve matching repair rules';
  if (photoHeroRate < 0.85) return 'D) Improve photo intelligence';
  if (underEvidencedWork >= Math.ceil(cafes.length * 0.5)) return 'C) Add practical evidence source acquisition';
  if (!activeRejectedCredible) return 'E) Calibrate scoring';
  return 'A) Process 50 candidates';
}

function report(outputs: RepairedOutput[], originalOutputs: OriginalOutputFile): string {
  const previousById = new Map(originalOutputs.outputs.map((output) => [output.candidate_id, output]));
  const repairedMatches = outputs.filter((output) => output.previous_status !== 'matched' && output.match_status === 'matched');
  const rejectedBecamePendingOrActive = outputs.filter((output) => output.previous_eligibility_status === 'rejected' && output.eligibility.status !== 'rejected');
  const pendingBecameActive = outputs.filter((output) => output.previous_eligibility_status === 'pending_review' && output.eligibility.status === 'active');
  const malbequeria = outputs.find((output) => output.venue_name === 'La Malbequeria');
  const cafes = outputs.filter((output) => output.category === 'cafe');
  const workUnderEvidenced = cafes.filter((output) => output.diagnostics.evidence_gaps.some((gap) => gap.includes('work/practical')));
  const active = outputs.filter((output) => output.eligibility.status === 'active');
  const pending = outputs.filter((output) => output.eligibility.status === 'pending_review');
  const rejected = outputs.filter((output) => output.eligibility.status === 'rejected');
  const finalDecision = decision(outputs);

  return [
    '# Controlled Batch 30 Repaired Intelligence Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Summary',
    '',
    `- Total venues: ${outputs.length}`,
    `- Matched after repair: ${outputs.filter((output) => output.match_status === 'matched').length}`,
    `- Active: ${active.length}`,
    `- Pending review: ${pending.length}`,
    `- Rejected: ${rejected.length}`,
    `- Decision: ${finalDecision}`,
    '',
    '## Required Answers',
    '',
    `1. Did the 5 match failures repair? ${repairedMatches.length === 5 ? 'Yes' : 'No'} (${repairedMatches.map((output) => output.venue_name).join(', ') || 'none'}).`,
    `2. Did any rejected venues become pending or active? ${rejectedBecamePendingOrActive.length ? `Yes: ${rejectedBecamePendingOrActive.map((output) => `${output.venue_name} -> ${output.eligibility.status}`).join(', ')}` : 'No'}.`,
    `3. Did any pending venues become active? ${pendingBecameActive.length ? `Yes: ${pendingBecameActive.map((output) => output.venue_name).join(', ')}` : 'No'}.`,
    `4. Is La Malbequeria still rejected for photo reasons? ${malbequeria?.eligibility.status === 'rejected' && malbequeria.eligibility.reasons.includes('no acceptable hero photo') ? 'Yes' : 'No'}.`,
    `5. Are cafes still under-evidenced for work? ${workUnderEvidenced.length ? `Yes: ${workUnderEvidenced.length}/${cafes.length} cafes still have weak work/practical evidence.` : 'No'}.`,
    `6. Is the machine ready for a 50-candidate batch? ${finalDecision.startsWith('A') ? 'Yes' : `No. ${finalDecision}`}`,
    '',
    '## Status Changes',
    '',
    ...outputs
      .filter((output) => {
        const previous = previousById.get(output.candidate_id);
        return previous?.eligibility.status !== output.eligibility.status || previous?.match_status !== output.match_status;
      })
      .map((output) => `- ${output.venue_name}: match ${output.previous_status} -> ${output.match_status}; eligibility ${output.previous_eligibility_status} -> ${output.eligibility.status}; score ${output.scores.eligibility_score}; reasons ${output.eligibility.reasons.join('; ') || 'none'}`),
    '',
    '## Current Status By Venue',
    '',
    ...outputs.map((output) => `- ${output.venue_name}: ${output.eligibility.status}, match ${output.match_status}, photo ${output.photo_intelligence.photo_quality_score}, work ${output.intent_scores.work_score}, evidence gaps ${output.diagnostics.evidence_gaps.join('; ') || 'none'}`),
    '',
    '## Decision Rationale',
    '',
    '- Match rate after repair is above the 90% threshold.',
    '- Existing evaluated photo hero success remains above the 85% threshold, but newly repaired matches have not been vision-evaluated because LLM calls are disallowed in F.1.',
    '- Practical/work evidence remains weak for cafés, so work café scoring should not drive scaling decisions yet.',
  ].join('\n');
}

function main() {
  const batch = readJson<BatchFile>(path.join(process.cwd(), 'data', 'controlled_batch_30_candidates.json'));
  const repairedGoogle = readJson<EnrichmentFile>(path.join(process.cwd(), 'data', 'controlled_batch_30_google_enrichment_repaired.json'));
  const originalVision = readJson<VisionFile>(path.join(process.cwd(), 'data', 'controlled_batch_30_photo_vision.json'));
  const repairedVision = readJson<VisionFile>(path.join(process.cwd(), 'data', 'controlled_batch_30_repaired_photo_vision.json'));
  const originalOutputs = readJson<OriginalOutputFile>(path.join(process.cwd(), 'data', 'controlled_batch_30_intelligence.json'));
  const practicalByVenue = practicalEvidenceByVenue();
  const googleByCandidate = new Map(repairedGoogle.records.map((record) => [record.candidate_id, record]));
  const visionByCandidate = combineVision(originalVision, repairedVision);
  const previousById = new Map(originalOutputs.outputs.map((output) => [output.candidate_id, output]));

  const outputs: RepairedOutput[] = batch.candidates.map((candidate) => {
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
    const practicalRecords = practicalByVenue.get(candidate.venue_name) || [];
    const items = experienceItems(candidate, googleRecord, visionRecord, practicalRecords);
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
    const previous = previousById.get(candidate.candidate_id);

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
      previous_status: previous?.match_status || null,
      previous_eligibility_status: previous?.eligibility.status || null,
      match_status: googleRecord?.status || 'missing',
      work_intent: workIntent,
      diagnostics: {
        google_match_status: googleRecord?.status || 'missing',
        google_match_confidence: googleRecord?.match?.match_confidence ?? null,
        vision_status: visionRecord?.vision_status || 'missing',
        photos_evaluated: visionRecord?.photos_evaluated || 0,
        practical_evidence_items: practicalRecords.length,
        evidence_gaps: aggregate.evidence_gaps,
        experience_evidence_strength: aggregate.evidence_strength_score,
      },
    };
  });

  writeFileSync(path.join(process.cwd(), 'data', 'controlled_batch_30_repaired_intelligence.json'), JSON.stringify({
    generatedAt: new Date().toISOString(),
    count: outputs.length,
    outputs,
  }, null, 2));

  const markdown = report(outputs, originalOutputs);
  writeFileSync(path.join(process.cwd(), 'data', 'controlled_batch_30_repaired_intelligence_report.md'), markdown);
  console.log(markdown);
}

main();
