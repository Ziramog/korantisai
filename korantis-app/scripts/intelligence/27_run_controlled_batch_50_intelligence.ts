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
  readJson,
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

type BatchFile = {
  candidates: BatchCandidate[];
};

type EnrichmentFile = {
  googleCallsMade: number;
  records: BatchGoogleRecord[];
};

type VisionFile = {
  venues: VenueVisionResult[];
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

type WorkIntentStatus = 'supported' | 'under_evidenced';

type Batch50Output = VenueIntelligence & {
  venue_name: string;
  match_status: string;
  work_intent: WorkIntentSplit;
  work_intent_status: WorkIntentStatus;
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

function experienceItems(candidate: BatchCandidate, google: BatchGoogleRecord | undefined, vision: VenueVisionResult | undefined, practicalRecords: PracticalEvidenceImport[]): ExperienceEvidenceItem[] {
  const collectedAt = new Date().toISOString();
  const sourceItems: ExperienceEvidenceItem[] = candidate.merged_sources.map((mention, index) => ({
    id: `controlled_50_${candidate.candidate_id}_source_${index}`,
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
    id: `controlled_50_${candidate.candidate_id}_google_metadata`,
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
    id: `controlled_50_${candidate.candidate_id}_vision`,
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
    id: `controlled_50_${candidate.candidate_id}_practical_${index}`,
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

function eligibilityScore(scores: IntelligenceScores, intentScores: IntentScores, signals: Batch50Output['signals']): number {
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
  return Array.from(new Set([
    ...(google?.status !== 'matched' ? [`google match status: ${google?.status || 'missing'}`] : []),
    ...(google?.match?.match_warnings || []),
    ...(vision ? [] : ['photo vision missing']),
    ...(vision?.aggregation.warnings || []),
  ]));
}

function workIntentStatus(gaps: string[], practicalRecords: PracticalEvidenceImport[]): WorkIntentStatus {
  if (practicalRecords.length === 0) return 'under_evidenced';
  if (gaps.some((gap) => gap.includes('missing review text') || gap.includes('work/practical') || gap.includes('quiet'))) return 'under_evidenced';
  return 'supported';
}

function countBy(outputs: Batch50Output[], selector: (output: Batch50Output) => string): Record<string, number> {
  return outputs.reduce((acc, output) => {
    const key = selector(output);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

function topBy(outputs: Batch50Output[], key: keyof IntentScores, filter?: (output: Batch50Output) => boolean): string[] {
  const rows = outputs
    .filter(filter || (() => true))
    .sort((a, b) => (b.intent_scores[key] || 0) - (a.intent_scores[key] || 0))
    .slice(0, 7);
  return rows.length ? rows.map((output) => `- ${output.venue_name}: ${output.intent_scores[key] || 0} (${output.eligibility.status})`) : ['- None'];
}

function decision(outputs: Batch50Output[], enrichment: EnrichmentFile, vision: VisionFile): string {
  const matchRate = enrichment.records.filter((record) => record.status === 'matched').length / enrichment.records.length;
  const visionCoverage = vision.venues.length / enrichment.records.length;
  const heroRate = vision.venues.length ? vision.venues.filter((venue) => venue.aggregation.acceptable_hero_photo).length / vision.venues.length : 0;
  const photoFailures = vision.venues.filter((venue) => !venue.aggregation.acceptable_hero_photo).length;
  const unmatched = enrichment.records.filter((record) => record.status !== 'matched').length;
  const rejected = outputs.filter((output) => output.eligibility.status === 'rejected').length;
  const underEvidencedCafe = outputs.filter((output) => output.category === 'cafe' && output.work_intent_status === 'under_evidenced').length;

  if (matchRate < 0.9 || unmatched > 0) return 'C) Improve matching';
  if (visionCoverage < 0.95 || heroRate < 0.85 || photoFailures > 0) return 'D) Improve photo intelligence';
  if (underEvidencedCafe > 0) return 'B) Improve practical evidence sources';
  if (rejected > outputs.length * 0.25) return 'E) Adjust scoring';
  return 'F) Begin staging persistence for active candidates only';
}

function report(outputs: Batch50Output[], enrichment: EnrichmentFile, vision: VisionFile): string {
  const matched = enrichment.records.filter((record) => record.status === 'matched');
  const failures = enrichment.records.filter((record) => record.status !== 'matched');
  const active = outputs.filter((output) => output.eligibility.status === 'active');
  const pending = outputs.filter((output) => output.eligibility.status === 'pending_review');
  const rejected = outputs.filter((output) => output.eligibility.status === 'rejected');
  const photoFailures = vision.venues.filter((venue) => !venue.aggregation.acceptable_hero_photo);
  const underEvidencedCafes = outputs.filter((output) => output.category === 'cafe' && output.work_intent_status === 'under_evidenced');
  const byActiveCategory = countBy(active, (output) => output.category);
  const byActiveDistrict = countBy(active, (output) => output.district);
  const finalDecision = decision(outputs, enrichment, vision);

  return [
    '# Controlled Batch 50 Intelligence Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Summary',
    '',
    `- Selected candidates: ${enrichment.records.length}`,
    `- Matched: ${matched.length}`,
    `- Ambiguous/unmatched: ${failures.length}`,
    `- Google calls: ${enrichment.googleCallsMade}`,
    `- Photo vision coverage: ${vision.venues.length}/${enrichment.records.length}`,
    `- Hero accepted/failed: ${vision.venues.filter((venue) => venue.aggregation.acceptable_hero_photo).length}/${photoFailures.length}`,
    `- Active / pending_review / rejected: ${active.length} / ${pending.length} / ${rejected.length}`,
    `- Decision: ${finalDecision}`,
    '',
    '## Active By Category',
    '',
    ...(Object.entries(byActiveCategory).map(([category, count]) => `- ${category}: ${count}`).concat(Object.keys(byActiveCategory).length ? [] : ['- None'])),
    '',
    '## Active By District',
    '',
    ...(Object.entries(byActiveDistrict).sort(([, a], [, b]) => b - a).map(([district, count]) => `- ${district}: ${count}`).concat(Object.keys(byActiveDistrict).length ? [] : ['- None'])),
    '',
    '## Pending / Rejected Reasons',
    '',
    ...[...pending, ...rejected].map((output) => `- ${output.venue_name}: ${output.eligibility.status}; ${output.eligibility.reasons.join('; ') || 'none'}; warnings ${output.eligibility.warnings.join('; ') || 'none'}`),
    '',
    '## Matching Failures',
    '',
    ...(failures.length ? failures.map((record) => `- ${record.candidate_name}: ${record.status}; ${record.match?.match_warnings.join('; ') || record.error || 'none'}`) : ['- None']),
    '',
    '## Photo Failures',
    '',
    ...(photoFailures.length ? photoFailures.map((venue) => `- ${venue.venue_name}: ${venue.aggregation.warnings.join('; ') || 'no acceptable hero'}`) : ['- None']),
    '',
    '## Generic/Mainstream Risks',
    '',
    ...(outputs.filter((output) => output.signals.mainstream_signal >= 60 || output.signals.tourist_signal >= 85)
      .map((output) => `- ${output.venue_name}: mainstream ${output.signals.mainstream_signal}, tourist ${output.signals.tourist_signal}`)
      .concat(outputs.some((output) => output.signals.mainstream_signal >= 60 || output.signals.tourist_signal >= 85) ? [] : ['- None'])),
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
    '## Strongest Classic City Venues',
    '',
    ...topBy(outputs, 'classic_city_score'),
    '',
    '## Strongest Premium Destinations',
    '',
    ...topBy(outputs, 'premium_destination_score'),
    '',
    '## Cafes With work_intent_status under_evidenced',
    '',
    ...(underEvidencedCafes.length ? underEvidencedCafes.map((output) => `- ${output.venue_name}: work ${output.intent_scores.work_score}, label ${output.work_intent.work_label}`) : ['- None']),
    '',
    '## Evidence Gaps',
    '',
    ...outputs.flatMap((output) => output.diagnostics.evidence_gaps.map((gap) => `- ${output.venue_name}: ${gap}`)).slice(0, 120),
    '',
    '## 100-Candidate Readiness',
    '',
    finalDecision === 'A) Process 100 candidates'
      ? '- Ready for 100 candidates.'
      : `- Not ready for 100 candidates. Recommendation: ${finalDecision}.`,
  ].join('\n');
}

function main() {
  const batch = readJson<BatchFile>(path.join(process.cwd(), 'data', 'controlled_batch_50_candidates.json'));
  const enrichment = readJson<EnrichmentFile>(path.join(process.cwd(), 'data', 'controlled_batch_50_google_enrichment.json'));
  const vision = readJson<VisionFile>(path.join(process.cwd(), 'data', 'controlled_batch_50_photo_vision.json'));
  const practicalByVenue = practicalEvidenceByVenue();
  const googleByCandidate = new Map(enrichment.records.map((record) => [record.candidate_id, record]));
  const visionByCandidate = new Map(vision.venues.map((venue) => [venue.candidate_id, venue]));

  const outputs: Batch50Output[] = batch.candidates.map((candidate) => {
    const googleRecord = googleByCandidate.get(candidate.candidate_id);
    const google = googleRecord?.status === 'matched' ? googleRecord.google_data : null;
    const visionRecord = visionByCandidate.get(candidate.candidate_id);
    const practicalRecords = practicalByVenue.get(candidate.venue_name) || [];
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
      match_status: googleRecord?.status || 'missing',
      work_intent: workIntent,
      work_intent_status: workIntentStatus(aggregate.evidence_gaps, practicalRecords),
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

  writeFileSync(path.join(process.cwd(), 'data', 'controlled_batch_50_intelligence.json'), JSON.stringify({
    generatedAt: new Date().toISOString(),
    count: outputs.length,
    outputs,
  }, null, 2));

  const markdown = report(outputs, enrichment, vision);
  writeFileSync(path.join(process.cwd(), 'data', 'controlled_batch_50_intelligence_report.md'), markdown);
  console.log(markdown);
}

main();
