import * as path from 'path';
import { existsSync, readFileSync } from 'fs';
import type { ScoredCandidateVenue, SourceMention } from '../discovery/types';
import type {
  EvidenceObject,
  ExperienceSignals,
  IntelligenceScores,
  PhotoIntelligence,
  SourceType,
  VenueSignals,
} from './types';
import { culturalRelevanceScore, ratingQualityScore, reviewCountLogScore } from './scoring/cultural_relevance';
import { classifySourceType, sourceAuthorityScore } from './scoring/source_authority';
import { clampScore, weightedAverage } from './scoring/utils';

export const CONTROLLED_BATCH_MAX = 30;

export type GooglePhoto = {
  name?: string;
  widthPx?: number;
  heightPx?: number;
  authorAttributions?: Array<Record<string, unknown>>;
};

export type GooglePlace = {
  id?: string;
  name?: string;
  displayName?: { text?: string; languageCode?: string };
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
  photos?: GooglePhoto[];
};

export type MatchStatus = 'matched' | 'ambiguous_match' | 'unmatched' | 'dry_run';

export type MatchInfo = {
  candidate_name: string;
  google_name: string;
  district: string;
  formatted_address: string;
  match_confidence: number;
  match_reasons: string[];
  match_warnings: string[];
};

export type BatchCandidate = ScoredCandidateVenue & {
  reason_selected: string;
  previously_processed: boolean;
};

export type BatchGoogleRecord = {
  candidate_id: string;
  candidate_name: string;
  category: string;
  district: string;
  status: MatchStatus;
  query: string;
  match: MatchInfo | null;
  search_candidates: MatchInfo[];
  google_place_id: string | null;
  google_data: GooglePlace | null;
  error: string | null;
};

export type PhotoVisionResult = {
  photo_reference: string;
  interior_visible: boolean;
  exterior_visible: boolean;
  seating_visible: boolean;
  people_staying_visible: boolean;
  counter_only: boolean;
  product_only: boolean;
  storefront_only: boolean;
  menu_only: boolean;
  natural_light_score: number;
  spatial_depth_score: number;
  design_quality_score: number;
  atmosphere_score: number;
  hero_suitability_score: number;
  card_suitability_score: number;
  warnings: string[];
};

export type VenueVisionAggregation = {
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

export type VenueVisionResult = {
  candidate_id: string;
  google_place_id: string | null;
  venue_name: string;
  vision_status: 'evaluated' | 'dry_run' | 'partial_error' | 'no_photos';
  model: string | null;
  photos_available: number;
  photos_evaluated: number;
  photo_results: PhotoVisionResult[];
  aggregation: VenueVisionAggregation;
  errors: string[];
};

export function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(file, 'utf8')) as T;
}

export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenOverlap(a: string, b: string): number {
  const aTokens = new Set(normalizeText(a).split(' ').filter((token) => token.length > 1));
  const bTokens = new Set(normalizeText(b).split(' ').filter((token) => token.length > 1));
  if (aTokens.size === 0 || bTokens.size === 0) return 0;
  return [...aTokens].filter((token) => bTokens.has(token)).length / Math.max(aTokens.size, bTokens.size);
}

export function categoryLabel(category: string): string {
  if (category === 'cafe') return 'cafe coffee';
  if (category === 'restaurant') return 'restaurant';
  if (category === 'wine_bar') return 'wine bar';
  if (category === 'cocktail_bar') return 'cocktail bar';
  return category;
}

export function categoryTerms(category: string): string[] {
  if (category === 'cafe') return ['cafe', 'coffee_shop', 'coffee', 'bakery', 'food'];
  if (category === 'restaurant') return ['restaurant', 'food'];
  if (category === 'wine_bar') return ['wine_bar', 'bar', 'restaurant', 'wine'];
  if (category === 'cocktail_bar') return ['bar', 'cocktail_bar', 'night_club'];
  return [];
}

export function candidateAliases(candidate: ScoredCandidateVenue): string[] {
  const aliasFile = path.join(process.cwd(), 'data', 'discovery', 'venue_aliases.json');
  const configured = existsSync(aliasFile) ? readJson<Record<string, { aliases?: string[] }>>(aliasFile) : {};
  return Array.from(new Set([
    candidate.venue_name,
    candidate.canonical_name,
    ...candidate.aliases,
    ...(configured[candidate.venue_name]?.aliases || []),
  ].filter(Boolean)));
}

export function scoreGoogleMatch(candidate: ScoredCandidateVenue, place: GooglePlace): MatchInfo {
  const googleName = place.displayName?.text || '';
  const address = place.formattedAddress || '';
  const normalizedAddress = normalizeText(address);
  const aliases = candidateAliases(candidate);
  const placeTypes = [place.primaryType || '', ...(place.types || [])].map(normalizeText);
  const reasons: string[] = [];
  const warnings: string[] = [];
  let confidence = 0;

  const exactAlias = aliases.some((alias) => normalizeText(alias) === normalizeText(googleName));
  const nearAlias = aliases.some((alias) => {
    const normalized = normalizeText(alias);
    const normalizedGoogle = normalizeText(googleName);
    return normalized.includes(normalizedGoogle) || normalizedGoogle.includes(normalized) || tokenOverlap(alias, googleName) >= 0.62;
  });

  if (exactAlias) {
    confidence += 48;
    reasons.push('exact normalized alias/name match');
  } else if (nearAlias) {
    confidence += 42;
    reasons.push('near normalized alias/name match');
  } else {
    const overlap = Math.max(...aliases.map((alias) => tokenOverlap(alias, googleName)));
    confidence += Math.round(overlap * 40);
    if (overlap < 0.35) warnings.push('name mismatch');
  }

  if (normalizedAddress.includes('buenos aires') || normalizedAddress.includes('caba') || normalizedAddress.includes('cdad autonoma')) {
    confidence += 22;
    reasons.push('Buenos Aires/CABA address');
  } else {
    warnings.push('city not explicit');
  }

  const compatible = categoryTerms(candidate.category).some((term) => placeTypes.some((type) => type.includes(normalizeText(term))));
  if (compatible) {
    confidence += 18;
    reasons.push('category-compatible type');
  } else {
    warnings.push('category ambiguity');
  }

  if (normalizedAddress.includes(normalizeText(candidate.district))) {
    confidence += 6;
    reasons.push('district explicit');
  } else {
    warnings.push('district absent from formattedAddress');
  }

  if (placeTypes.some((type) => ['lodging', 'hotel', 'shopping_mall', 'clothing_store', 'supermarket'].includes(type))) {
    confidence -= 18;
    warnings.push('hotel/retail type risk');
  }

  return {
    candidate_name: candidate.venue_name,
    google_name: googleName,
    district: candidate.district,
    formatted_address: address,
    match_confidence: clampScore(confidence),
    match_reasons: reasons,
    match_warnings: warnings,
  };
}

export function classifyMatch(scored: Array<{ place: GooglePlace; match: MatchInfo }>): MatchStatus {
  if (scored.length === 0) return 'unmatched';
  const [top, second] = scored;
  if (top.match.match_confidence < 62) return 'unmatched';
  const closeSecond = second && top.place.id !== second.place.id && top.match.match_confidence - second.match.match_confidence < 8;
  if (top.match.match_confidence < 76 || closeSecond || top.match.match_warnings.includes('name mismatch')) return 'ambiguous_match';
  return 'matched';
}

function hasAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
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

export function signalsFor(candidate: ScoredCandidateVenue): VenueSignals {
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

export function experienceFor(candidate: ScoredCandidateVenue, signals: VenueSignals): ExperienceSignals {
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

export function sourceWeights() {
  const file = path.join(process.cwd(), 'data', 'discovery', 'source_weights.json');
  return existsSync(file) ? readJson<Record<string, number>>(file) : {};
}

export function sourceEvidence(mentions: SourceMention[], weights: Record<string, number>) {
  return mentions.map((mention) => ({
    source: mention.source,
    source_type: classifySourceType(mention.source) as SourceType,
    source_weight: weights[mention.source] || 50,
    signal: mention.context,
    context: mention.context,
    rank_position: mention.rank_position,
  }));
}

export function photoFromVision(vision?: VenueVisionResult): PhotoIntelligence {
  if (!vision || vision.vision_status === 'dry_run' || vision.vision_status === 'no_photos') {
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
      warnings: [vision?.vision_status === 'no_photos' ? 'no photo references' : 'photo intelligence not evaluated'],
    };
  }

  const pct = (selector: (photo: PhotoVisionResult) => boolean) => (
    vision.photo_results.length ? Math.round((vision.photo_results.filter(selector).length / vision.photo_results.length) * 100) : 0
  );

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
    product_only_risk: pct((photo) => photo.product_only),
    storefront_only_risk: pct((photo) => photo.storefront_only),
    counter_only_risk: pct((photo) => photo.counter_only),
    evaluation_status: 'evaluated',
    warnings: vision.aggregation.warnings,
  };
}

export function scoresFor(candidate: ScoredCandidateVenue, google: GooglePlace | null, signals: VenueSignals, experience: ExperienceSignals, photo: PhotoIntelligence) {
  const weights = sourceWeights();
  const sourceAuthority = sourceAuthorityScore({ sources: candidate.sources, sourceWeights: weights });
  const rating = typeof google?.rating === 'number' ? google.rating : null;
  const reviewCount = typeof google?.userRatingCount === 'number' ? google.userRatingCount : 0;
  const cultural = reviewCount > 0
    ? culturalRelevanceScore({
        reviewCount,
        rating,
        sourceAuthorityScore: sourceAuthority,
        heritageSignal: signals.heritage_signal,
        landmarkSignal: signals.landmark_signal,
      })
    : 0;
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

  return {
    discovery_score: candidate.discovery_score,
    consensus_score: candidate.consensus_score,
    cultural_relevance_score: cultural,
    review_count_log_score: reviewCountLogScore(reviewCount),
    rating_quality_score: ratingQualityScore(rating),
    source_authority_score: sourceAuthority,
    experience_quality_score: experienceQuality,
    photo_quality_score: photo.photo_quality_score,
    eligibility_score: 0,
  } satisfies IntelligenceScores;
}

export function evidenceFor(candidate: ScoredCandidateVenue, google: GooglePlace | null, constraints: string[]): EvidenceObject {
  const weights = sourceWeights();
  return {
    source_evidence: sourceEvidence(candidate.merged_sources, weights),
    photo_evidence: [],
    review_evidence: [],
    google_evidence: {
      rating: typeof google?.rating === 'number' ? google.rating : null,
      review_count: typeof google?.userRatingCount === 'number' ? google.userRatingCount : 0,
      price_level: google?.priceLevel,
      primary_type: google?.primaryType || null,
      types: google?.types || [],
      business_status: google?.businessStatus || null,
    },
    constraints,
  };
}
