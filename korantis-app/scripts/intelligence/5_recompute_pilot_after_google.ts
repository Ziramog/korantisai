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
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  primaryType?: string;
  types?: string[];
  businessStatus?: string;
  regularOpeningHours?: Record<string, unknown>;
  websiteUri?: string;
  googleMapsUri?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  photos?: Array<{ name?: string; widthPx?: number; heightPx?: number }>;
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

type PhotoInputsFile = {
  venues: Array<{
    candidate_id: string;
    venue_name: string;
    photo_count: number;
    enough_photo_material_for_vision: boolean;
  }>;
};

type PreviousPilotFile = {
  outputs?: Array<VenueIntelligence & { venue_name?: string }>;
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
    dinner_signal: clampScore(restaurant ? 82 : wine ? 55 : cocktail ? 42 : 18),
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

function notEvaluatedPhoto(photoCount: number): PhotoIntelligence {
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
    warnings: [`photo intelligence not evaluated in E.3 dry-run; ${photoCount} Google photo references available`],
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

function main() {
  const weights = sourceWeights();
  const candidates = readJson<PilotCandidateFile>(path.join(process.cwd(), 'data', 'venue_intelligence_pilot_candidates.json')).candidates;
  const enrichment = readJson<EnrichmentFile>(path.join(process.cwd(), 'data', 'venue_intelligence_pilot_google_enrichment.json'));
  const photoInputs = readJson<PhotoInputsFile>(path.join(process.cwd(), 'data', 'venue_intelligence_photo_inputs.json'));
  const previousFile = existsSync(path.join(process.cwd(), 'data', 'venue_intelligence_pilot_output.json'))
    ? readJson<PreviousPilotFile>(path.join(process.cwd(), 'data', 'venue_intelligence_pilot_output.json'))
    : { outputs: [] };
  const previousByCandidate = new Map((previousFile.outputs || []).map((output) => [output.candidate_id, output]));
  const enrichmentByCandidate = new Map(enrichment.records.map((record) => [record.candidate_id, record]));
  const photoByCandidate = new Map(photoInputs.venues.map((venue) => [venue.candidate_id, venue]));

  const outputs = candidates.map((candidate) => {
    const enriched = enrichmentByCandidate.get(candidate.candidate_id);
    const google = enriched?.status === 'matched' ? enriched.google_data : null;
    const photoCount = photoByCandidate.get(candidate.candidate_id)?.photo_count || 0;
    const previous = previousByCandidate.get(candidate.candidate_id);
    const previousRating = previous?.evidence.google_evidence.rating ?? null;
    const previousReviewCount = previous?.evidence.google_evidence.review_count ?? 0;
    const rating = typeof google?.rating === 'number' ? google.rating : previousRating;
    const reviewCount = typeof google?.userRatingCount === 'number' ? google.userRatingCount : previousReviewCount;
    const signals = signalsFor(candidate);
    const experience = experienceFor(candidate, signals);
    const photo = notEvaluatedPhoto(photoCount);
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
        price_level: google?.priceLevel,
        primary_type: google?.primaryType || null,
        types: google?.types || [],
        business_status: google?.businessStatus || null,
      },
      constraints: [
        'photo intelligence not evaluated',
        ...(enriched?.status !== 'matched' ? [`google enrichment status: ${enriched?.status || 'missing'}`] : []),
      ],
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
    const googleDataPresent = Boolean(google) || previousReviewCount > 0 || previousRating != null;

    return {
      candidate_id: candidate.candidate_id,
      google_place_id: google?.id || previous?.google_place_id || null,
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
        google_enrichment_status: enriched?.status || 'missing',
        google_data_present: googleDataPresent,
        rating_present: rating != null,
        userRatingCount_present: reviewCount > 0,
        photo_references: photoCount,
        vision_missing: true,
        google_data_source: google ? 'e3_enrichment' : googleDataPresent ? 'previous_pilot_evidence' : 'missing',
        before_cultural_relevance_score: previous?.scores.cultural_relevance_score ?? null,
        after_cultural_relevance_score: cultural,
        cultural_relevance_delta: previous ? cultural - previous.scores.cultural_relevance_score : null,
      },
    };
  });

  writeFileSync(path.join(process.cwd(), 'data', 'venue_intelligence_pilot_after_google.json'), JSON.stringify({
    generatedAt: new Date().toISOString(),
    count: outputs.length,
    outputs,
  }, null, 2));

  const highReview = outputs.filter((output) => output.evidence.google_evidence.review_count >= 5000);
  const materialChanges = outputs.filter((output) => Math.abs(output.diagnostics.cultural_relevance_delta || 0) >= 10);
  const blockedByVision = outputs.filter((output) => output.diagnostics.vision_missing);
  const visionTargets = [...outputs]
    .filter((output) => output.diagnostics.photo_references > 0)
    .sort((a, b) => (
      b.scores.cultural_relevance_score + b.scores.discovery_score + b.scores.source_authority_score + b.diagnostics.photo_references -
      (a.scores.cultural_relevance_score + a.scores.discovery_score + a.scores.source_authority_score + a.diagnostics.photo_references)
    ))
    .slice(0, 8);

  const report = [
    '# Venue Intelligence Pilot After Google Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Summary',
    '',
    `- Candidates recomputed: ${outputs.length}`,
    `- Candidates with Google data: ${outputs.filter((output) => output.diagnostics.google_data_present).length}`,
    `- Candidates with rating: ${outputs.filter((output) => output.diagnostics.rating_present).length}`,
    `- Candidates with userRatingCount: ${outputs.filter((output) => output.diagnostics.userRatingCount_present).length}`,
    `- Candidates still blocked by missing vision: ${blockedByVision.length}`,
    `- Candidates eligible/active: ${outputs.filter((output) => output.eligibility.status === 'active').length}`,
    '',
    '## Before/After Cultural Relevance',
    '',
    ...outputs.map((output) => `- ${output.venue_name}: ${output.diagnostics.before_cultural_relevance_score ?? 'n/a'} -> ${output.diagnostics.after_cultural_relevance_score} (delta ${output.diagnostics.cultural_relevance_delta ?? 'n/a'})`),
    '',
    '## Very High Review Count',
    '',
    ...(highReview.length ? highReview.map((output) => `- ${output.venue_name}: ${output.evidence.google_evidence.review_count} reviews, rating ${output.evidence.google_evidence.rating ?? 'n/a'}`) : ['- None']),
    '',
    '## Material Intelligence Changes',
    '',
    ...(materialChanges.length ? materialChanges.map((output) => `- ${output.venue_name}: cultural relevance delta ${output.diagnostics.cultural_relevance_delta}`) : ['- None']),
    '',
    '## Still Blocked By Missing Vision',
    '',
    ...blockedByVision.map((output) => `- ${output.venue_name}: ${output.diagnostics.photo_references} photo refs, status ${output.eligibility.status}`),
    '',
    '## Likely Next Best Vision Targets',
    '',
    ...(visionTargets.length ? visionTargets.map((output) => `- ${output.venue_name}: discovery ${output.scores.discovery_score}, cultural ${output.scores.cultural_relevance_score}, photo refs ${output.diagnostics.photo_references}`) : ['- None']),
    '',
    '## Final Recommendation',
    '',
    'Do not publish or scale. Run vision evaluation on the matched candidates with photo references, then recompute eligibility. Google enrichment improves cultural relevance where matches are confident, but missing vision correctly blocks active eligibility.',
  ].join('\n');

  writeFileSync(path.join(process.cwd(), 'data', 'venue_intelligence_pilot_after_google_report.md'), report);
  console.log(report);
}

main();
