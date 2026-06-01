import * as path from 'path';
import { readFileSync, writeFileSync } from 'fs';
import {
  type EvidenceObject,
  type IntelligenceScores,
  type PhotoIntelligence,
  type VenueIntelligence,
} from './types';
import { culturalRelevanceScore, ratingQualityScore, reviewCountLogScore } from './scoring/cultural_relevance';
import { computeIntentScoresV0 } from './scoring/intent_scores';
import { computeEligibilityV0 } from './scoring/eligibility';
import { weightedAverage } from './scoring/utils';

type GooglePlace = {
  id?: string;
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  primaryType?: string;
  types?: string[];
  businessStatus?: string;
};

type EnrichmentRecord = {
  candidate_id: string;
  candidate_name: string;
  status: string;
  google_place_id: string | null;
  google_data: GooglePlace | null;
};

type EnrichmentFile = {
  records: EnrichmentRecord[];
};

type PhotoVisionResult = {
  photo_reference: string;
  interior_visible: boolean;
  seating_visible: boolean;
  people_staying_visible: boolean;
  counter_only: boolean;
  product_only: boolean;
  storefront_only: boolean;
  menu_only: boolean;
  natural_light_score: number;
  atmosphere_score: number;
};

type VenueVisionResult = {
  candidate_id: string;
  venue_name: string;
  vision_status: 'evaluated' | 'dry_run' | 'partial_error';
  photos_evaluated: number;
  photo_results: PhotoVisionResult[];
  aggregation: {
    acceptable_hero_photo: boolean;
    hero_photo_reference: string | null;
    best_card_photo_reference: string | null;
    photo_quality_score: number;
    interior_confidence: number;
    seating_confidence: number;
    long_stay_visual_signal: number;
    design_visual_signal: number;
    warnings: string[];
  };
};

type VisionFile = {
  venues: VenueVisionResult[];
};

type PreviousOutputFile = {
  outputs: Array<VenueIntelligence & { venue_name: string; diagnostics?: Record<string, unknown> }>;
};

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(file, 'utf8')) as T;
}

function riskPercent(vision: VenueVisionResult | undefined, selector: (photo: PhotoVisionResult) => boolean): number {
  if (!vision || vision.photo_results.length === 0) return 0;
  return Math.round((vision.photo_results.filter(selector).length / vision.photo_results.length) * 100);
}

function photoIntelligenceFor(vision: VenueVisionResult | undefined): PhotoIntelligence {
  if (!vision || vision.vision_status === 'dry_run') {
    return {
      acceptable_hero_photo: false,
      hero_photo_reference: null,
      best_card_photo_reference: null,
      photo_quality_score: 0,
      interior_confidence: 0,
      seating_confidence: 0,
      natural_light_score: 0,
      long_stay_visual_signal: 0,
      design_visual_signal: 0,
      product_only_risk: 0,
      storefront_only_risk: 0,
      counter_only_risk: 0,
      evaluation_status: 'not_evaluated',
      warnings: ['photo intelligence not evaluated'],
    };
  }

  return {
    acceptable_hero_photo: vision.aggregation.acceptable_hero_photo,
    hero_photo_reference: vision.aggregation.hero_photo_reference,
    best_card_photo_reference: vision.aggregation.best_card_photo_reference,
    photo_quality_score: vision.aggregation.photo_quality_score,
    interior_confidence: vision.aggregation.interior_confidence,
    seating_confidence: vision.aggregation.seating_confidence,
    natural_light_score: vision.photo_results.length ? Math.max(...vision.photo_results.map((photo) => photo.natural_light_score)) : 0,
    long_stay_visual_signal: vision.aggregation.long_stay_visual_signal,
    design_visual_signal: vision.aggregation.design_visual_signal,
    product_only_risk: riskPercent(vision, (photo) => photo.product_only),
    storefront_only_risk: riskPercent(vision, (photo) => photo.storefront_only),
    counter_only_risk: riskPercent(vision, (photo) => photo.counter_only),
    evaluation_status: 'evaluated',
    warnings: vision.aggregation.warnings,
  };
}

function photoEvidence(vision: VenueVisionResult | undefined) {
  return (vision?.photo_results || []).map((photo) => ({
    photo_reference: photo.photo_reference,
    signals: [
      ...(photo.interior_visible ? ['interior'] : []),
      ...(photo.seating_visible ? ['seating'] : []),
      ...(photo.people_staying_visible ? ['people_staying'] : []),
    ],
    score: Math.max(0, Math.min(100, Math.round(photo.atmosphere_score || 0))),
  }));
}

function experienceQuality(output: VenueIntelligence, photo: PhotoIntelligence): number {
  return weightedAverage([
    [output.signals.design_signal, 0.18],
    [output.signals.specialty_signal, 0.14],
    [output.signals.community_signal, 0.12],
    [output.experience_signals.conversation_signal, 0.12],
    [output.experience_signals.long_stay_signal, 0.08],
    [photo.design_visual_signal, 0.14],
    [photo.long_stay_visual_signal, 0.10],
    [100 - output.signals.mainstream_signal, 0.12],
  ]);
}

function eligibilityScore(scores: IntelligenceScores, output: VenueIntelligence): number {
  return weightedAverage([
    [scores.discovery_score, 0.16],
    [scores.cultural_relevance_score, 0.12],
    [scores.experience_quality_score, 0.22],
    [scores.photo_quality_score, 0.20],
    [Math.max(...Object.values(output.intent_scores)), 0.16],
    [output.signals.chain_signal >= 70 ? 20 : 80, 0.14],
  ]);
}

function topBy(outputs: Array<VenueIntelligence & { venue_name: string }>, key: keyof VenueIntelligence['intent_scores'], filter?: (output: VenueIntelligence & { venue_name: string }) => boolean) {
  return outputs
    .filter(filter || (() => true))
    .sort((a, b) => b.intent_scores[key] - a.intent_scores[key])
    .slice(0, 5)
    .map((output) => `- ${output.venue_name}: ${output.intent_scores[key]} (${output.eligibility.status})`);
}

function main() {
  const previous = readJson<PreviousOutputFile>(path.join(process.cwd(), 'data', 'venue_intelligence_after_vision.json'));
  const enrichment = readJson<EnrichmentFile>(path.join(process.cwd(), 'data', 'venue_intelligence_google_enrichment_final_pilot.json'));
  const primaryVision = readJson<VisionFile>(path.join(process.cwd(), 'data', 'venue_intelligence_photo_vision_results.json'));
  const additionalVision = readJson<VisionFile>(path.join(process.cwd(), 'data', 'venue_intelligence_additional_photo_vision_results.json'));
  const enrichmentByCandidate = new Map(enrichment.records.map((record) => [record.candidate_id, record]));
  const visionByCandidate = new Map<string, VenueVisionResult>();

  for (const venue of primaryVision.venues) visionByCandidate.set(venue.candidate_id, venue);
  for (const venue of additionalVision.venues) visionByCandidate.set(venue.candidate_id, venue);

  const outputs = previous.outputs.map((output) => {
    const enriched = enrichmentByCandidate.get(output.candidate_id || '');
    const google = enriched?.status === 'matched' ? enriched.google_data : null;
    const vision = visionByCandidate.get(output.candidate_id || '');
    const photo = photoIntelligenceFor(vision);
    const rating = typeof google?.rating === 'number' ? google.rating : null;
    const reviewCount = typeof google?.userRatingCount === 'number' ? google.userRatingCount : 0;
    const cultural = reviewCount > 0
      ? culturalRelevanceScore({
          reviewCount,
          rating,
          sourceAuthorityScore: output.scores.source_authority_score,
          heritageSignal: output.signals.heritage_signal,
          landmarkSignal: output.signals.landmark_signal,
        })
      : 0;
    const scores: IntelligenceScores = {
      ...output.scores,
      cultural_relevance_score: cultural,
      review_count_log_score: reviewCountLogScore(reviewCount),
      rating_quality_score: ratingQualityScore(rating),
      experience_quality_score: experienceQuality(output, photo),
      photo_quality_score: photo.photo_quality_score,
      eligibility_score: 0,
    };
    const evidence: EvidenceObject = {
      ...output.evidence,
      photo_evidence: photoEvidence(vision),
      google_evidence: {
        rating,
        review_count: reviewCount,
        price_level: google?.priceLevel,
        primary_type: google?.primaryType || null,
        types: google?.types || [],
        business_status: google?.businessStatus || null,
      },
      constraints: [
        ...(enriched?.status !== 'matched' ? [`google match status: ${enriched?.status || 'missing'}`] : []),
        ...(photo.evaluation_status === 'not_evaluated' ? ['photo intelligence not evaluated'] : []),
        ...photo.warnings,
      ],
    };
    const intentScores = computeIntentScoresV0({
      category: output.category,
      scores,
      signals: output.signals,
      experience_signals: output.experience_signals,
      photo_intelligence: photo,
      evidence,
    });
    const scoresWithEligibility = {
      ...scores,
      eligibility_score: eligibilityScore({ ...scores, eligibility_score: 0 }, { ...output, intent_scores: intentScores }),
    };
    const eligibility = computeEligibilityV0({
      category: output.category,
      scores: scoresWithEligibility,
      signals: output.signals,
      experience_signals: output.experience_signals,
      photo_intelligence: photo,
      evidence,
      intent_scores: intentScores,
    });

    return {
      ...output,
      google_place_id: google?.id || enriched?.google_place_id || output.google_place_id,
      scores: scoresWithEligibility,
      intent_scores: intentScores,
      photo_intelligence: photo,
      eligibility,
      evidence,
      diagnostics: {
        google_match_status: enriched?.status || 'missing',
        vision_status: vision?.vision_status || 'missing',
        photos_evaluated: vision?.photos_evaluated || 0,
      },
    };
  });

  writeFileSync(path.join(process.cwd(), 'data', 'venue_intelligence_final_pilot_output.json'), JSON.stringify({
    generatedAt: new Date().toISOString(),
    count: outputs.length,
    outputs,
  }, null, 2));

  const active = outputs.filter((output) => output.eligibility.status === 'active');
  const pending = outputs.filter((output) => output.eligibility.status === 'pending_review');
  const rejected = outputs.filter((output) => output.eligibility.status === 'rejected');
  const blockers = outputs.filter((output) => output.eligibility.status !== 'active').map((output) => {
    const reasons = [...output.eligibility.reasons, ...output.eligibility.warnings].filter(Boolean);
    return `- ${output.venue_name}: ${reasons.join('; ') || 'manual review still required'}`;
  });

  const report = [
    '# Venue Intelligence Final Pilot Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Active Venues',
    '',
    ...(active.length ? active.map((output) => `- ${output.venue_name}: eligibility ${output.scores.eligibility_score}, photo ${output.scores.photo_quality_score}, cultural ${output.scores.cultural_relevance_score}`) : ['- None']),
    '',
    '## Pending Review Venues',
    '',
    ...(pending.length ? pending.map((output) => `- ${output.venue_name}: ${output.eligibility.reasons.join('; ') || 'manual review'}; warnings: ${output.eligibility.warnings.join('; ') || 'none'}`) : ['- None']),
    '',
    '## Rejected Venues',
    '',
    ...(rejected.length ? rejected.map((output) => `- ${output.venue_name}: ${output.eligibility.reasons.join('; ') || 'rejected'}`) : ['- None']),
    '',
    '## Reason Per Venue',
    '',
    ...outputs.map((output) => `- ${output.venue_name}: ${output.eligibility.status}; reasons: ${output.eligibility.reasons.join('; ') || 'none'}; warnings: ${output.eligibility.warnings.join('; ') || 'none'}`),
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
    '## Remaining Blockers Before Scaling',
    '',
    ...(blockers.length ? blockers : ['- None']),
    '',
    '## Calibration Note',
    '',
    'Eligibility is now capable of returning active when hard gates pass. Warnings such as weak seating or product/menu-only minority photo presence no longer block active status by themselves.',
  ].join('\n');

  writeFileSync(path.join(process.cwd(), 'data', 'venue_intelligence_final_pilot_report.md'), report);
  console.log(report);
}

main();
