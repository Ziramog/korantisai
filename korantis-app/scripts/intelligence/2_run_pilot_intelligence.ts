import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '..', '..', '.env.local') });
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
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
import { culturalRelevanceScore, ratingQualityScore, reviewCountLogScore } from './scoring/cultural_relevance';
import { classifySourceType, sourceAuthorityScore } from './scoring/source_authority';
import { computeIntentScoresV0 } from './scoring/intent_scores';
import { computeEligibilityV0 } from './scoring/eligibility';
import { clampScore, weightedAverage } from './scoring/utils';

type PilotCandidateFile = {
  candidates: ScoredCandidateVenue[];
};

type StagingVenue = {
  id: string;
  name: string;
  canonical_data: Record<string, unknown> | null;
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

function notEvaluatedPhoto(): PhotoIntelligence {
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
    warnings: ['photo intelligence not evaluated in E.2 dry-run'],
  };
}

function googleNumber(canonical: Record<string, unknown> | null | undefined, keys: string[]) {
  for (const key of keys) {
    const value = canonical?.[key];
    if (typeof value === 'number') return value;
  }
  return null;
}

function googleString(canonical: Record<string, unknown> | null | undefined, keys: string[]) {
  for (const key of keys) {
    const value = canonical?.[key];
    if (typeof value === 'string') return value;
  }
  return null;
}

function googleArray(canonical: Record<string, unknown> | null | undefined, key: string) {
  const value = canonical?.[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
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

async function loadExistingStaging(candidates: ScoredCandidateVenue[]) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return new Map<string, StagingVenue>();

  const names = Array.from(new Set(candidates.flatMap((candidate) => [candidate.venue_name, ...candidate.aliases])));
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await supabase
    .from('staging_venues')
    .select('id,name,canonical_data')
    .in('name', names);

  if (error || !data) return new Map<string, StagingVenue>();
  return new Map(data.map((row) => [row.name.toLowerCase(), row as StagingVenue]));
}

async function main() {
  const weights = sourceWeights();
  const file = JSON.parse(readFileSync(path.join(process.cwd(), 'data', 'venue_intelligence_pilot_candidates.json'), 'utf8')) as PilotCandidateFile;
  const stagingByName = await loadExistingStaging(file.candidates);
  const outputs: Array<VenueIntelligence & { venue_name: string; diagnostics: Record<string, boolean> }> = [];

  for (const candidate of file.candidates) {
    const staging = [candidate.venue_name, ...candidate.aliases]
      .map((name) => stagingByName.get(name.toLowerCase()))
      .find(Boolean);
    const canonical = staging?.canonical_data || null;
    const rating = googleNumber(canonical, ['rating']);
    const reviewCount = googleNumber(canonical, ['userRatingCount', 'review_count']) || 0;
    const googlePlaceId = googleString(canonical, ['place_id', 'id']) || staging?.id || null;
    const googleDataMissing = !canonical;
    const signals = signalsFor(candidate);
    const experience = experienceFor(candidate, signals);
    const photo = notEvaluatedPhoto();
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
      photo_evidence: [],
      review_evidence: [],
      google_evidence: {
        rating,
        review_count: reviewCount,
        price_level: canonical?.priceLevel as string | number | null | undefined,
        primary_type: googleString(canonical, ['primaryType', 'primary_type']),
        types: googleArray(canonical, 'types'),
        business_status: googleString(canonical, ['businessStatus', 'business_status']),
      },
      constraints: ['photo intelligence not evaluated', ...(googleDataMissing ? ['google data missing'] : [])],
    };
    const experienceQuality = weightedAverage([
      [signals.design_signal, 0.22],
      [signals.specialty_signal, 0.18],
      [signals.community_signal, 0.16],
      [experience.conversation_signal, 0.16],
      [experience.long_stay_signal, 0.10],
      [100 - signals.mainstream_signal, 0.18],
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
    const eligibility = computeEligibilityV0({
      category: candidate.category as VenueCategory,
      scores: baseScores,
      signals,
      experience_signals: experience,
      photo_intelligence: photo,
      evidence,
      intent_scores: intentScores,
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

    outputs.push({
      candidate_id: candidate.candidate_id,
      google_place_id: googlePlaceId,
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
        google_data_missing: googleDataMissing,
        rating_missing: rating == null,
        userRatingCount_missing: reviewCount <= 0,
        photos_missing: true,
        source_mentions_missing: candidate.merged_sources.length === 0,
        insufficient_final_eligibility_evidence: true,
      },
    });
  }

  writeFileSync(path.join(process.cwd(), 'data', 'venue_intelligence_pilot_output.json'), JSON.stringify({
    generatedAt: new Date().toISOString(),
    count: outputs.length,
    outputs,
  }, null, 2));

  const missingGoogle = outputs.filter((output) => output.diagnostics.google_data_missing);
  const missingRating = outputs.filter((output) => output.diagnostics.rating_missing);
  const missingReviewCount = outputs.filter((output) => output.diagnostics.userRatingCount_missing);
  const missingPhotos = outputs.filter((output) => output.diagnostics.photos_missing);
  const missingSources = outputs.filter((output) => output.diagnostics.source_mentions_missing);
  const insufficientFinal = outputs.filter((output) => output.diagnostics.insufficient_final_eligibility_evidence);

  function topBy(label: keyof VenueIntelligence['intent_scores']) {
    return [...outputs]
      .sort((a, b) => b.intent_scores[label] - a.intent_scores[label])
      .slice(0, 5)
      .map((output) => `- ${output.venue_name}: ${output.intent_scores[label]} (${output.district})`);
  }

  const report = [
    '# Venue Intelligence Pilot Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Scope',
    '',
    '- Controlled dry-run over 16 Phase D.7 discovery candidates.',
    '- No Google API calls.',
    '- No LLM or vision calls.',
    '- No publication or staging promotion.',
    '',
    '## Candidates Selected',
    '',
    ...outputs.map((output) => `- ${output.venue_name} (${output.category}, ${output.district}) - discovery ${output.scores.discovery_score}, consensus ${output.scores.consensus_score}, sources ${output.evidence.source_evidence.length}`),
    '',
    '## Missing Data Diagnostics',
    '',
    `- Candidates missing Google data: ${missingGoogle.length}`,
    `- Candidates missing rating: ${missingRating.length}`,
    `- Candidates missing userRatingCount: ${missingReviewCount.length}`,
    `- Candidates missing photos/photo intelligence: ${missingPhotos.length}`,
    `- Candidates missing source mentions: ${missingSources.length}`,
    `- Candidates with insufficient evidence for final eligibility: ${insufficientFinal.length}`,
    '',
    '## Eligibility Results',
    '',
    ...outputs.map((output) => `- ${output.venue_name}: ${output.eligibility.status} - ${output.eligibility.reasons.join('; ') || 'no reasons'}; warnings: ${output.eligibility.warnings.join('; ') || 'none'}`),
    '',
    '## Top Likely Work Venues',
    '',
    ...topBy('work_score'),
    '',
    '## Top Likely Classic City Venues',
    '',
    ...topBy('classic_city_score'),
    '',
    '## Top Likely Premium Destination Venues',
    '',
    ...topBy('premium_destination_score'),
    '',
    '## Top Likely Generic/Mainstream Risks',
    '',
    ...[...outputs].sort((a, b) => b.signals.mainstream_signal - a.signals.mainstream_signal).slice(0, 5).map((output) => `- ${output.venue_name}: mainstream ${output.signals.mainstream_signal}, chain ${output.signals.chain_signal}`),
    '',
    '## Interpretation',
    '',
    'All pilot outputs remain dry-run intelligence. Because photo intelligence was not evaluated, final eligibility is intentionally not active even when discovery, source authority, and intent signals are strong.',
  ].join('\n');

  writeFileSync(path.join(process.cwd(), 'data', 'venue_intelligence_pilot_report.md'), report);
  console.log(report);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
