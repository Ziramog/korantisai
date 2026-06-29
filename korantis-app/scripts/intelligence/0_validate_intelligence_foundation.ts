import * as path from 'path';
import { writeFileSync } from 'fs';
import {
  VENUE_INTELLIGENCE_VERSION,
  type DerivedArchetype,
  type EvidenceObject,
  type ExperienceSignals,
  type IntelligenceScores,
  type PhotoIntelligence,
  type VenueCategory,
  type VenueIntelligence,
  type VenueSignals,
} from './types';
import { culturalRelevanceScore, ratingQualityScore, reviewCountLogScore } from './scoring/cultural_relevance';
import { sourceAuthorityScore } from './scoring/source_authority';
import { computeIntentScoresV0 } from './scoring/intent_scores';
import { computeEligibilityV0 } from './scoring/eligibility';
import { clampScore, weightedAverage } from './scoring/utils';

type MockVenue = {
  name: string;
  candidate_id: string;
  google_place_id: string;
  city: string;
  district: string;
  category: VenueCategory;
  rating: number | null;
  reviewCount: number;
  discoveryScore: number;
  consensusScore: number;
  signals: VenueSignals;
  experienceSignals: ExperienceSignals;
  photo: PhotoIntelligence;
  evidence: EvidenceObject;
  assumptions: string[];
};

function zeroSignals(): VenueSignals {
  return {
    heritage_signal: 0,
    landmark_signal: 0,
    tourist_signal: 0,
    local_signal: 0,
    community_signal: 0,
    specialty_signal: 0,
    design_signal: 0,
    novelty_signal: 0,
    independent_signal: 0,
    mainstream_signal: 0,
    luxury_signal: 0,
    hidden_signal: 0,
    chain_signal: 0,
  };
}

function zeroExperience(): ExperienceSignals {
  return {
    quiet_signal: 0,
    lively_signal: 0,
    intimate_signal: 0,
    social_signal: 0,
    romantic_signal: 0,
    work_friendly_signal: 0,
    reading_signal: 0,
    conversation_signal: 0,
    long_stay_signal: 0,
    quick_stop_signal: 0,
    dinner_signal: 0,
    morning_signal: 0,
    afternoon_signal: 0,
    golden_hour_signal: 0,
    night_signal: 0,
    late_night_signal: 0,
    creative_signal: 0,
    formal_signal: 0,
    casual_signal: 0,
  };
}

function photo(overrides: Partial<PhotoIntelligence>): PhotoIntelligence {
  return {
    acceptable_hero_photo: true,
    hero_photo_reference: 'mock-hero',
    best_card_photo_reference: 'mock-card',
    photo_quality_score: 70,
    interior_confidence: 70,
    seating_confidence: 70,
    natural_light_score: 60,
    long_stay_visual_signal: 55,
    design_visual_signal: 65,
    product_only_risk: 0,
    storefront_only_risk: 0,
    counter_only_risk: 0,
    evaluation_status: 'evaluated',
    warnings: [],
    ...overrides,
  };
}

function evidence(sources: string[], constraints: string[], reviewCount: number, rating: number | null): EvidenceObject {
  return {
    source_evidence: sources.map((source) => ({
      source,
      source_type: source.includes('Michelin') || source.includes('50 Best') ? 'premium_editorial' : source === 'Reddit' ? 'community' : 'local_editorial',
      source_weight: 0,
      signal: 'mock source signal',
      context: 'Dry-run mock evidence only.',
      rank_position: null,
    })),
    photo_evidence: [{ photo_reference: 'mock-hero', signals: ['interior_visible', 'seating_visible'], score: 75 }],
    review_evidence: [{ text: 'Mock review evidence only.', signals: ['service_signal', 'experience_signal'], rating }],
    google_evidence: {
      rating,
      review_count: reviewCount,
      types: [],
      business_status: 'OPERATIONAL',
    },
    constraints,
  };
}

function deriveArchetypes(signals: VenueSignals, scores: IntelligenceScores): DerivedArchetype[] {
  const archetypes: DerivedArchetype[] = [];
  if (signals.heritage_signal >= 80 && signals.landmark_signal >= 70) {
    archetypes.push({ name: 'classic_city_landmark', confidence: clampScore((signals.heritage_signal + scores.cultural_relevance_score) / 2) });
  }
  if (signals.specialty_signal >= 80 && signals.community_signal >= 70) {
    archetypes.push({ name: 'specialty_work_cafe', confidence: clampScore((signals.specialty_signal + signals.community_signal) / 2) });
  }
  if (signals.luxury_signal >= 75 && scores.source_authority_score >= 80) {
    archetypes.push({ name: 'premium_destination', confidence: clampScore((signals.luxury_signal + scores.source_authority_score) / 2) });
  }
  if (signals.mainstream_signal >= 80 || signals.chain_signal >= 70) {
    archetypes.push({ name: 'generic_mainstream_risk', confidence: Math.max(signals.mainstream_signal, signals.chain_signal) });
  }
  return archetypes;
}

function buildIntelligence(mock: MockVenue): VenueIntelligence {
  const sourceAuthority = sourceAuthorityScore({ sources: mock.evidence.source_evidence.map((source) => source.source) });
  const reviewLog = reviewCountLogScore(mock.reviewCount);
  const ratingQuality = ratingQualityScore(mock.rating);
  const cultural = culturalRelevanceScore({
    reviewCount: mock.reviewCount,
    rating: mock.rating,
    sourceAuthorityScore: sourceAuthority,
    heritageSignal: mock.signals.heritage_signal,
    landmarkSignal: mock.signals.landmark_signal,
  });
  const experienceQuality = weightedAverage([
    [mock.photo.photo_quality_score, 0.25],
    [mock.signals.design_signal, 0.18],
    [mock.signals.specialty_signal, 0.14],
    [mock.signals.community_signal, 0.14],
    [mock.experienceSignals.conversation_signal, 0.12],
    [mock.experienceSignals.long_stay_signal, 0.10],
    [100 - mock.signals.mainstream_signal, 0.07],
  ]);

  const baseScores: IntelligenceScores = {
    discovery_score: mock.discoveryScore,
    consensus_score: mock.consensusScore,
    cultural_relevance_score: cultural,
    review_count_log_score: reviewLog,
    rating_quality_score: ratingQuality,
    source_authority_score: sourceAuthority,
    experience_quality_score: experienceQuality,
    photo_quality_score: mock.photo.photo_quality_score,
    eligibility_score: 0,
  };

  const intentScores = computeIntentScoresV0({
    category: mock.category,
    scores: baseScores,
    signals: mock.signals,
    experience_signals: mock.experienceSignals,
    photo_intelligence: mock.photo,
    evidence: mock.evidence,
  });

  const eligibility = computeEligibilityV0({
    category: mock.category,
    scores: baseScores,
    signals: mock.signals,
    experience_signals: mock.experienceSignals,
    photo_intelligence: mock.photo,
    evidence: mock.evidence,
    intent_scores: intentScores,
  });

  const eligibilityScore = weightedAverage([
    [baseScores.discovery_score, 0.16],
    [baseScores.cultural_relevance_score, 0.12],
    [baseScores.experience_quality_score, 0.22],
    [baseScores.photo_quality_score, 0.20],
    [Math.max(...Object.values(intentScores)), 0.16],
    [mock.signals.chain_signal >= 70 ? 20 : 80, 0.14],
  ]);

  const scores = { ...baseScores, eligibility_score: eligibilityScore };

  return {
    candidate_id: mock.candidate_id,
    google_place_id: mock.google_place_id,
    city: mock.city,
    district: mock.district,
    category: mock.category,
    scores,
    signals: mock.signals,
    experience_signals: mock.experienceSignals,
    intent_scores: intentScores,
    photo_intelligence: mock.photo,
    eligibility,
    derived_archetypes: deriveArchetypes(mock.signals, scores),
    evidence: mock.evidence,
    version: VENUE_INTELLIGENCE_VERSION,
  };
}

function validateShape(intelligence: VenueIntelligence) {
  const requiredKeys: Array<keyof VenueIntelligence> = [
    'candidate_id',
    'google_place_id',
    'city',
    'district',
    'category',
    'scores',
    'signals',
    'experience_signals',
    'intent_scores',
    'photo_intelligence',
    'eligibility',
    'derived_archetypes',
    'evidence',
    'version',
  ];

  return requiredKeys.every((key) => key in intelligence) && intelligence.version === VENUE_INTELLIGENCE_VERSION;
}

const mocks: MockVenue[] = [
  {
    name: 'Classic landmark cafe',
    candidate_id: 'mock-classic-landmark-cafe',
    google_place_id: 'mock-google-classic',
    city: 'Buenos Aires',
    district: 'Microcentro',
    category: 'cafe',
    rating: 4.5,
    reviewCount: 28000,
    discoveryScore: 78,
    consensusScore: 88,
    signals: { ...zeroSignals(), heritage_signal: 96, landmark_signal: 94, tourist_signal: 88, local_signal: 55, mainstream_signal: 40 },
    experienceSignals: { ...zeroExperience(), lively_signal: 80, social_signal: 70, reading_signal: 35, conversation_signal: 55, quick_stop_signal: 65, morning_signal: 70, formal_signal: 45, casual_signal: 60 },
    photo: photo({ photo_quality_score: 78, seating_confidence: 68, long_stay_visual_signal: 35, design_visual_signal: 82 }),
    evidence: evidence(['Visit Buenos Aires', 'Culture Trip', 'Tripadvisor'], ['tourist-heavy', 'crowded at peak hours'], 28000, 4.5),
    assumptions: ['High review count', 'historic landmark signal', 'tourist-heavy constraints', 'not optimized for work'],
  },
  {
    name: 'Specialty work cafe',
    candidate_id: 'mock-specialty-work-cafe',
    google_place_id: 'mock-google-specialty',
    city: 'Buenos Aires',
    district: 'Palermo Soho',
    category: 'cafe',
    rating: 4.7,
    reviewCount: 950,
    discoveryScore: 86,
    consensusScore: 91,
    signals: { ...zeroSignals(), specialty_signal: 94, community_signal: 88, local_signal: 78, novelty_signal: 55, independent_signal: 82, tourist_signal: 18, design_signal: 72 },
    experienceSignals: { ...zeroExperience(), quiet_signal: 78, work_friendly_signal: 88, reading_signal: 82, long_stay_signal: 78, morning_signal: 85, afternoon_signal: 70, creative_signal: 84, casual_signal: 75 },
    photo: photo({ photo_quality_score: 84, seating_confidence: 86, natural_light_score: 82, long_stay_visual_signal: 82, design_visual_signal: 78 }),
    evidence: evidence(['Time Out', 'Reddit', 'Specialty Coffee Blog'], [], 950, 4.7),
    assumptions: ['Strong specialty coffee evidence', 'community signal', 'seating and light support work intent'],
  },
  {
    name: 'Premium destination restaurant',
    candidate_id: 'mock-premium-restaurant',
    google_place_id: 'mock-google-premium',
    city: 'Buenos Aires',
    district: 'Recoleta',
    category: 'restaurant',
    rating: 4.8,
    reviewCount: 6200,
    discoveryScore: 90,
    consensusScore: 95,
    signals: { ...zeroSignals(), luxury_signal: 88, design_signal: 82, specialty_signal: 72, local_signal: 65, landmark_signal: 45, tourist_signal: 38 },
    experienceSignals: { ...zeroExperience(), formal_signal: 86, dinner_signal: 0, night_signal: 78, intimate_signal: 72, conversation_signal: 74, romantic_signal: 68, social_signal: 62 },
    photo: photo({ photo_quality_score: 88, seating_confidence: 84, long_stay_visual_signal: 62, design_visual_signal: 90 }),
    evidence: evidence(['Michelin', '50 Best Discovery', 'Time Out'], ['reservation recommended'], 6200, 4.8),
    assumptions: ['Premium editorial authority', 'dinner destination', 'not intended as work-friendly'],
  },
  {
    name: 'Tourist-heavy venue',
    candidate_id: 'mock-tourist-heavy',
    google_place_id: 'mock-google-tourist',
    city: 'Buenos Aires',
    district: 'Puerto Madero',
    category: 'restaurant',
    rating: 4.4,
    reviewCount: 18000,
    discoveryScore: 68,
    consensusScore: 76,
    signals: { ...zeroSignals(), tourist_signal: 92, landmark_signal: 70, mainstream_signal: 72, local_signal: 25, design_signal: 58 },
    experienceSignals: { ...zeroExperience(), lively_signal: 82, social_signal: 76, dinner_signal: 0, conversation_signal: 45, formal_signal: 60, night_signal: 70, quick_stop_signal: 58 },
    photo: photo({ photo_quality_score: 72, seating_confidence: 74, design_visual_signal: 64 }),
    evidence: evidence(['Tripadvisor', 'Visit Buenos Aires', 'Wanderlog'], ['tourist-heavy', 'possible low local fit'], 18000, 4.4),
    assumptions: ['High public footprint', 'tourism-dominant evidence', 'local fit uncertain'],
  },
  {
    name: 'Generic mainstream venue',
    candidate_id: 'mock-generic-mainstream',
    google_place_id: 'mock-google-generic',
    city: 'Buenos Aires',
    district: 'Belgrano',
    category: 'cafe',
    rating: 4.2,
    reviewCount: 2400,
    discoveryScore: 42,
    consensusScore: 46,
    signals: { ...zeroSignals(), mainstream_signal: 92, chain_signal: 86, tourist_signal: 35, specialty_signal: 18, local_signal: 20 },
    experienceSignals: { ...zeroExperience(), lively_signal: 60, quick_stop_signal: 80, casual_signal: 65, work_friendly_signal: 25, reading_signal: 20, long_stay_signal: 18 },
    photo: photo({ acceptable_hero_photo: false, hero_photo_reference: null, photo_quality_score: 34, seating_confidence: 35, product_only_risk: 72, storefront_only_risk: 68, counter_only_risk: 70, warnings: ['product/storefront dominated photo set'] }),
    evidence: evidence(['Tripadvisor'], ['generic chain/mainstream signal', 'product-focused imagery'], 2400, 4.2),
    assumptions: ['High mainstream signal', 'weak experience quality', 'no acceptable hero photo'],
  },
];

const outputs = mocks.map((mock) => ({ mock, intelligence: buildIntelligence(mock) }));
const allShapesValid = outputs.every(({ intelligence }) => validateShape(intelligence));

const report = [
  '# Venue Intelligence Foundation Report',
  '',
  `Generated: ${new Date().toISOString()}`,
  '',
  '## Scope',
  '',
  '- Phase: E.0 / E.1 foundation only.',
  '- No real candidates processed.',
  '- No Google API calls.',
  '- No LLM or vision calls.',
  '- No publishing, staging promotion, or UI changes.',
  '',
  '## Shape Validation',
  '',
  `- VenueIntelligence contract valid for all mocks: ${allShapesValid ? 'yes' : 'no'}`,
  `- Version: ${VENUE_INTELLIGENCE_VERSION}`,
  '',
  '## Mock Venue Results',
  '',
  ...outputs.flatMap(({ mock, intelligence }) => [
    `### ${mock.name}`,
    '',
    `Assumptions: ${mock.assumptions.join('; ')}`,
    '',
    `Scores: discovery ${intelligence.scores.discovery_score}, consensus ${intelligence.scores.consensus_score}, cultural relevance ${intelligence.scores.cultural_relevance_score}, source authority ${intelligence.scores.source_authority_score}, photo quality ${intelligence.scores.photo_quality_score}, eligibility ${intelligence.scores.eligibility_score}`,
    '',
    `Intent scores: work ${intelligence.intent_scores.work_score}, reading ${intelligence.intent_scores.reading_score}, date ${intelligence.intent_scores.date_score}, dinner ${intelligence.intent_scores.dinner_score}, wine ${intelligence.intent_scores.wine_score}, cocktail ${intelligence.intent_scores.cocktail_score}, classic city ${intelligence.intent_scores.classic_city_score}, hidden gem ${intelligence.intent_scores.hidden_gem_score}, premium destination ${intelligence.intent_scores.premium_destination_score}, long stay ${intelligence.intent_scores.long_stay_score}, quick stop ${intelligence.intent_scores.quick_stop_score}`,
    '',
    `Eligibility: ${intelligence.eligibility.status}`,
    '',
    `Reasons: ${intelligence.eligibility.reasons.join('; ') || 'none'}`,
    '',
    `Warnings: ${intelligence.eligibility.warnings.join('; ') || 'none'}`,
    '',
    `Derived archetypes: ${intelligence.derived_archetypes.map((item) => `${item.name} (${item.confidence})`).join('; ') || 'none'}`,
    '',
  ]),
  '## Intentionally Scaffolded',
  '',
  '- Intent scores are deterministic v0 heuristics, not final ranking logic.',
  '- Eligibility decisions are dry-run scaffold outputs and do not update database status.',
  '- Photo intelligence uses mock structured inputs; no vision model was called.',
  '- Cultural relevance separates public footprint from experience quality.',
  '- Derived archetypes are versioned outputs from signals, not permanent editorial truth.',
].join('\n');

writeFileSync(path.join(process.cwd(), 'data', 'venue_intelligence_foundation_report.md'), report);
console.log(report);
