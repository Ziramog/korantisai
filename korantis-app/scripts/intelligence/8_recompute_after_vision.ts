import * as path from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import type { ScoredCandidateVenue, SourceMention } from '../discovery/types';
import {
  VENUE_INTELLIGENCE_VERSION,
  type EvidenceObject,
  type ExperienceSignals,
  type IntelligenceScores,
  type PhotoIntelligence,
  type SourceType,
  type VenueCategory,
  type VenueIntelligence,
  type VenueSignals,
} from './types';
import type { VenuePhotoVisionAggregation } from './photo_vision_contract';
import { culturalRelevanceScore, ratingQualityScore, reviewCountLogScore } from './scoring/cultural_relevance';
import { classifySourceType, sourceAuthorityScore } from './scoring/source_authority';
import { computeIntentScoresV0 } from './scoring/intent_scores';
import { computeEligibilityV0 } from './scoring/eligibility';
import { clampScore, weightedAverage } from './scoring/utils';

type PilotCandidateFile = {
  candidates: ScoredCandidateVenue[];
};

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
};

type VenueVisionResult = {
  candidate_id: string;
  google_place_id: string | null;
  venue_name: string;
  vision_status: 'evaluated' | 'dry_run' | 'partial_error';
  photos_evaluated: number;
  photo_results: PhotoVisionResult[];
  aggregation: VenuePhotoVisionAggregation;
  errors: string[];
};

type VisionFile = {
  venues: VenueVisionResult[];
};

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(file, 'utf8')) as T;
}

function sourceWeights() {
  const file = path.join(process.cwd(), 'data', 'discovery', 'source_weights.json');
  return existsSync(file) ? readJson<Record<string, number>>(file) : {};
}

function textFor(candidate: ScoredCandidateVenue) {
  return [
    candidate.venue_name,
    candidate.canonical_name,
    candidate.category,
    candidate.district,
    candidate.sources.join(' '),
    candidate.merged_sources.map((mention) => mention.context).join(' '),
  ].join(' ').toLowerCase();
}

function hasAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function signalsFor(candidate: ScoredCandidateVenue): VenueSignals {
  const text = textFor(candidate);
  const communityMentions = candidate.merged_sources.filter((mention) => mention.source_type === 'community').length;
  const premiumMentions = candidate.sources.filter((source) => ['Michelin', "World's Best Bars", '50 Best Discovery'].includes(source)).length;

  return {
    heritage_signal: clampScore((hasAny(text, ['heritage', 'historic', 'classic', 'traditional', 'federal', 'galgos', 'biela']) ? 70 : 0) + (['San Telmo', 'Microcentro', 'Recoleta', 'Retiro'].includes(candidate.district) ? 12 : 0)),
    landmark_signal: clampScore((hasAny(text, ['landmark', 'classic', 'confiteria', 'tortoni', 'destination']) ? 70 : 0) + premiumMentions * 6),
    tourist_signal: clampScore((hasAny(text, ['tourist', 'travel', 'waterfront', 'hotel', 'landmark']) ? 58 : 0) + (candidate.sources.includes('Tripadvisor') ? 18 : 0)),
    local_signal: clampScore((hasAny(text, ['local', 'neighborhood', 'community']) ? 45 : 0) + communityMentions * 12),
    community_signal: clampScore(communityMentions * 26 + (candidate.sources.includes('Reddit') ? 22 : 0)),
    specialty_signal: clampScore(
      (candidate.category === 'cafe' && hasAny(text, ['specialty', 'coffee', 'tostadores', 'espresso']) ? 85 : 0) ||
      (candidate.category === 'wine_bar' && hasAny(text, ['wine', 'cava', 'malbec', 'natural wine']) ? 85 : 0) ||
      (candidate.category === 'cocktail_bar' && hasAny(text, ['cocktail', 'bar', 'vermouth', 'speakeasy']) ? 82 : 0) ||
      (candidate.category === 'restaurant' && hasAny(text, ['michelin', '50 best', 'creative', 'asado', 'grill']) ? 65 : 0)
    ),
    design_signal: clampScore(hasAny(text, ['design', 'polished', 'garden', 'speakeasy', 'waterfront', 'hotel', 'modern']) ? 72 : 35),
    novelty_signal: clampScore((hasAny(text, ['creative', 'modern', 'independent', 'natural wine', 'emerging']) ? 65 : 0) + (['Chacarita', 'Villa Crespo', 'Colegiales'].includes(candidate.district) ? 14 : 0)),
    independent_signal: clampScore(hasAny(text, ['independent', 'creative', 'neighborhood', 'community']) ? 72 : 35),
    mainstream_signal: clampScore(hasAny(text, ['chain', 'generic', 'tourist-heavy', 'popular grill']) ? 82 : candidate.sources.includes('Tripadvisor') && candidate.source_count <= 2 ? 50 : 20),
    luxury_signal: clampScore(premiumMentions * 25 + (hasAny(text, ['premium', 'luxury', 'hotel', 'fine dining', 'destination']) ? 35 : 0)),
    hidden_signal: clampScore((candidate.discovery_score < 75 && communityMentions > 0 && !hasAny(text, ['tourist', 'landmark'])) ? 68 : 20),
    chain_signal: clampScore(hasAny(text, ['chain', 'generic']) ? 85 : 0),
  };
}

function experienceFor(candidate: ScoredCandidateVenue, signals: VenueSignals): ExperienceSignals {
  const cafe = candidate.category === 'cafe';
  const restaurant = candidate.category === 'restaurant';
  const wine = candidate.category === 'wine_bar';
  const cocktail = candidate.category === 'cocktail_bar';

  return {
    quiet_signal: clampScore(cafe ? 58 : wine ? 45 : 25),
    lively_signal: clampScore(cocktail ? 85 : restaurant ? 62 : 45),
    intimate_signal: clampScore(wine ? 78 : cocktail ? 68 : restaurant ? 55 : 35),
    social_signal: clampScore(cocktail ? 86 : restaurant ? 72 : wine ? 70 : 52),
    romantic_signal: clampScore(wine ? 72 : restaurant ? 62 : cocktail ? 60 : 28),
    work_friendly_signal: clampScore(cafe ? 76 : 12),
    reading_signal: clampScore(cafe ? 74 : 10),
    conversation_signal: clampScore(wine || restaurant ? 76 : cocktail ? 64 : 58),
    long_stay_signal: clampScore(cafe ? 68 : wine ? 54 : restaurant ? 42 : 32),
    quick_stop_signal: clampScore(cafe ? 46 : 18),
    morning_signal: clampScore(cafe ? 84 : 12),
    afternoon_signal: clampScore(cafe || wine ? 68 : 35),
    golden_hour_signal: clampScore(wine ? 70 : signals.design_signal > 65 ? 58 : 30),
    night_signal: clampScore(cocktail ? 90 : wine ? 76 : restaurant ? 72 : 15),
    late_night_signal: clampScore(cocktail ? 76 : restaurant ? 35 : 5),
    creative_signal: clampScore(Math.max(signals.novelty_signal, signals.design_signal)),
    formal_signal: clampScore(signals.luxury_signal > 60 ? 78 : restaurant ? 50 : 20),
    casual_signal: clampScore(cafe ? 78 : cocktail ? 62 : wine ? 58 : 52),
  };
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

function sourceEvidence(mentions: SourceMention[], weights: Record<string, number>) {
  return mentions.map((mention) => ({
    source: mention.source,
    source_type: classifySourceType(mention.source) as SourceType,
    source_weight: weights[mention.source] || 50,
    signal: mention.context,
    context: mention.context,
    rank_position: mention.rank_position,
  }));
}

function deriveArchetypes(signals: VenueSignals, scores: IntelligenceScores) {
  const archetypes = [];
  if (signals.heritage_signal >= 75 && signals.landmark_signal >= 65) archetypes.push({ name: 'classic_city_landmark', confidence: clampScore((signals.heritage_signal + scores.cultural_relevance_score) / 2) });
  if (signals.specialty_signal >= 80 && signals.community_signal >= 60) archetypes.push({ name: 'specialty_work_or_category_venue', confidence: clampScore((signals.specialty_signal + signals.community_signal) / 2) });
  if (signals.luxury_signal >= 70 && scores.source_authority_score >= 80) archetypes.push({ name: 'premium_destination', confidence: clampScore((signals.luxury_signal + scores.source_authority_score) / 2) });
  if (signals.hidden_signal >= 65 && signals.tourist_signal < 45) archetypes.push({ name: 'hidden_gem_candidate', confidence: signals.hidden_signal });
  if (signals.mainstream_signal >= 80 || signals.chain_signal >= 70) archetypes.push({ name: 'generic_mainstream_risk', confidence: Math.max(signals.mainstream_signal, signals.chain_signal) });
  return archetypes;
}

function topBy(outputs: Array<VenueIntelligence & { venue_name: string }>, key: keyof VenueIntelligence['intent_scores']) {
  return [...outputs]
    .sort((a, b) => b.intent_scores[key] - a.intent_scores[key])
    .slice(0, 5)
    .map((output) => `- ${output.venue_name}: ${output.intent_scores[key]} (${output.eligibility.status})`);
}

function main() {
  const weights = sourceWeights();
  const candidates = readJson<PilotCandidateFile>(path.join(process.cwd(), 'data', 'venue_intelligence_pilot_candidates.json')).candidates;
  const enrichmentPath = existsSync(path.join(process.cwd(), 'data', 'venue_intelligence_pilot_google_enrichment_repaired.json'))
    ? path.join(process.cwd(), 'data', 'venue_intelligence_pilot_google_enrichment_repaired.json')
    : path.join(process.cwd(), 'data', 'venue_intelligence_pilot_google_enrichment.json');
  const enrichment = readJson<EnrichmentFile>(enrichmentPath);
  const vision = existsSync(path.join(process.cwd(), 'data', 'venue_intelligence_photo_vision_results.json'))
    ? readJson<VisionFile>(path.join(process.cwd(), 'data', 'venue_intelligence_photo_vision_results.json'))
    : { venues: [] };
  const enrichmentByCandidate = new Map(enrichment.records.map((record) => [record.candidate_id, record]));
  const visionByCandidate = new Map(vision.venues.map((record) => [record.candidate_id, record]));

  const outputs = candidates.map((candidate) => {
    const enriched = enrichmentByCandidate.get(candidate.candidate_id);
    const google = enriched?.status === 'matched' ? enriched.google_data : null;
    const visionResult = visionByCandidate.get(candidate.candidate_id);
    const rating = typeof google?.rating === 'number' ? google.rating : null;
    const reviewCount = typeof google?.userRatingCount === 'number' ? google.userRatingCount : 0;
    const signals = signalsFor(candidate);
    const experience = experienceFor(candidate, signals);
    const photo = photoIntelligenceFor(visionResult);
    const sourceAuthority = sourceAuthorityScore({ sources: candidate.sources, sourceWeights: weights });
    const cultural = reviewCount > 0
      ? culturalRelevanceScore({
          reviewCount,
          rating,
          sourceAuthorityScore: sourceAuthority,
          heritageSignal: signals.heritage_signal,
          landmarkSignal: signals.landmark_signal,
        })
      : 0;
    const evidence: EvidenceObject = {
      source_evidence: sourceEvidence(candidate.merged_sources, weights),
      photo_evidence: (visionResult?.photo_results || []).map((photoResult) => ({
        photo_reference: photoResult.photo_reference,
        signals: [
          ...(photoResult.interior_visible ? ['interior'] : []),
          ...(photoResult.seating_visible ? ['seating'] : []),
          ...(photoResult.people_staying_visible ? ['people_staying'] : []),
        ],
        score: Math.max(0, Math.min(100, Math.round((photoResult as PhotoVisionResult & { atmosphere_score?: number }).atmosphere_score || 0))),
      })),
      review_evidence: [],
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
    const experienceQuality = weightedAverage([
      [signals.design_signal, 0.18],
      [signals.specialty_signal, 0.14],
      [signals.community_signal, 0.12],
      [experience.conversation_signal, 0.12],
      [experience.long_stay_signal, 0.08],
      [photo.design_visual_signal, 0.14],
      [photo.long_stay_visual_signal, 0.10],
      [100 - signals.mainstream_signal, 0.12],
    ]);
    const baseScores: IntelligenceScores = {
      discovery_score: candidate.discovery_score,
      consensus_score: candidate.consensus_score,
      cultural_relevance_score: cultural,
      review_count_log_score: reviewCountLogScore(reviewCount),
      rating_quality_score: ratingQualityScore(rating),
      source_authority_score: sourceAuthority,
      experience_quality_score: experienceQuality,
      photo_quality_score: photo.photo_quality_score,
      eligibility_score: 0,
    };
    const intentScores = computeIntentScoresV0({
      category: candidate.category as VenueCategory,
      scores: baseScores,
      signals,
      experience_signals: experience,
      photo_intelligence: photo,
      evidence,
    });
    const eligibilityScore = weightedAverage([
      [baseScores.discovery_score, 0.16],
      [baseScores.cultural_relevance_score, 0.12],
      [baseScores.experience_quality_score, 0.22],
      [baseScores.photo_quality_score, 0.20],
      [Math.max(...Object.values(intentScores)), 0.16],
      [signals.chain_signal >= 70 ? 20 : 80, 0.14],
    ]);
    const scores = { ...baseScores, eligibility_score: eligibilityScore };
    const eligibility = computeEligibilityV0({
      category: candidate.category as VenueCategory,
      scores,
      signals,
      experience_signals: experience,
      photo_intelligence: photo,
      evidence,
      intent_scores: intentScores,
    });

    return {
      candidate_id: candidate.candidate_id,
      google_place_id: google?.id || enriched?.google_place_id || null,
      city: candidate.city,
      district: candidate.district,
      category: candidate.category as VenueCategory,
      scores,
      signals,
      experience_signals: experience,
      intent_scores: intentScores,
      photo_intelligence: photo,
      eligibility,
      derived_archetypes: deriveArchetypes(signals, scores),
      evidence,
      version: VENUE_INTELLIGENCE_VERSION,
      venue_name: candidate.venue_name,
      diagnostics: {
        google_match_status: enriched?.status || 'missing',
        vision_status: visionResult?.vision_status || 'missing',
        photos_evaluated: visionResult?.photos_evaluated || 0,
      },
    };
  });

  writeFileSync(path.join(process.cwd(), 'data', 'venue_intelligence_after_vision.json'), JSON.stringify({
    generatedAt: new Date().toISOString(),
    count: outputs.length,
    outputs,
  }, null, 2));

  const confident = outputs.filter((output) => output.diagnostics.google_match_status === 'matched');
  const needRepair = outputs.filter((output) => output.diagnostics.google_match_status !== 'matched');
  const acceptableHero = outputs.filter((output) => output.photo_intelligence.acceptable_hero_photo);
  const photoFail = outputs.filter((output) => output.diagnostics.vision_status !== 'missing' && !output.photo_intelligence.acceptable_hero_photo);
  const active = outputs.filter((output) => output.eligibility.status === 'active');
  const pending = outputs.filter((output) => output.eligibility.status === 'pending_review');
  const rejected = outputs.filter((output) => output.eligibility.status === 'rejected');

  const report = [
    '# Venue Intelligence After Vision Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## 1. Confident Google Matches',
    '',
    ...(confident.length ? confident.map((output) => `- ${output.venue_name}`) : ['- None']),
    '',
    '## 2. Still Needs Match Repair',
    '',
    ...(needRepair.length ? needRepair.map((output) => `- ${output.venue_name}: ${output.diagnostics.google_match_status}`) : ['- None']),
    '',
    '## 3. Acceptable Hero Photos',
    '',
    ...(acceptableHero.length ? acceptableHero.map((output) => `- ${output.venue_name}: ${output.photo_intelligence.hero_photo_reference}`) : ['- None']),
    '',
    '## 4. Photo Intelligence Failures',
    '',
    ...(photoFail.length ? photoFail.map((output) => `- ${output.venue_name}: ${output.photo_intelligence.warnings.join('; ') || 'no acceptable hero photo'}`) : ['- None']),
    '',
    '## 5. Eligibility Status',
    '',
    `- Active: ${active.length}`,
    `- Pending review: ${pending.length}`,
    `- Rejected: ${rejected.length}`,
    '',
    ...outputs.map((output) => `- ${output.venue_name}: ${output.eligibility.status}; reasons: ${output.eligibility.reasons.join('; ') || 'none'}; warnings: ${output.eligibility.warnings.join('; ') || 'none'}`),
    '',
    '## 6. Strongest Venues By Intent',
    '',
    '### Work',
    '',
    ...topBy(outputs, 'work_score'),
    '',
    '### Dinner',
    '',
    ...topBy(outputs, 'dinner_score'),
    '',
    '### Wine',
    '',
    ...topBy(outputs, 'wine_score'),
    '',
    '### Cocktail',
    '',
    ...topBy(outputs, 'cocktail_score'),
    '',
    '### Premium Destination',
    '',
    ...topBy(outputs, 'premium_destination_score'),
    '',
    '### Classic City',
    '',
    ...topBy(outputs, 'classic_city_score'),
    '',
    '## 7. Before Scaling Beyond 16',
    '',
    '- Resolve remaining non-confident Google matches.',
    '- Run vision for newly repaired matches with photo references.',
    '- Review active decisions manually before any publication layer is used.',
    '- Do not generate atmosphere copy or publish until editorial review confirms the full loop quality.',
  ].join('\n');

  writeFileSync(path.join(process.cwd(), 'data', 'venue_intelligence_after_vision_report.md'), report);
  console.log(report);
}

main();
