import {
  categoryDisplayLabel,
  isNormalizedVenueCategory,
  type NormalizedVenueCategory,
} from '../../src/lib/categories/venueCategories';

export type CategoryNormalizationInput = {
  venue_name: string;
  current_category?: string | null;
  display_category?: string | null;
  google_primary_type?: string | null;
  google_types?: string[];
  source_categories?: string[];
  source_contexts?: string[];
  intent_scores?: Partial<Record<string, number>>;
  signals?: Partial<Record<string, number>>;
};

export type CategoryNormalizationProposal = {
  venue: string;
  current_category: string;
  proposed_normalized_category: NormalizedVenueCategory;
  proposed_display_category_en: string;
  proposed_display_category_es: string;
  confidence: number;
  reasons: string[];
  warnings: string[];
};

function normalizeText(value: string | null | undefined) {
  return (value || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

function includesAny(value: string, terms: string[]) {
  return terms.some((term) => value.includes(term));
}

function maxScore(scores: Array<number | undefined>) {
  return Math.max(0, ...scores.filter((score): score is number => typeof score === 'number'));
}

function evidenceText(input: CategoryNormalizationInput) {
  return normalizeText([
    input.venue_name,
    input.current_category,
    input.display_category,
    input.google_primary_type,
    ...(input.google_types || []),
    ...(input.source_categories || []),
    ...(input.source_contexts || []),
  ].join(' '));
}

function categoryText(input: CategoryNormalizationInput) {
  return normalizeText([
    input.current_category,
    input.display_category,
    ...(input.source_categories || []),
  ].join(' '));
}

function googleText(input: CategoryNormalizationInput) {
  return normalizeText([
    input.google_primary_type,
    ...(input.google_types || []),
  ].join(' '));
}

function sourceText(input: CategoryNormalizationInput) {
  return normalizeText([
    ...(input.source_categories || []),
    ...(input.source_contexts || []),
  ].join(' '));
}

function confidenceFrom(reasons: string[], warnings: string[]) {
  return Math.max(50, Math.min(98, 68 + (reasons.length * 10) - (warnings.length * 8)));
}

export function normalizeVenueCategory(input: CategoryNormalizationInput): CategoryNormalizationProposal {
  const current = input.current_category || input.display_category || 'unknown';
  const text = evidenceText(input);
  const category = categoryText(input);
  const google = googleText(input);
  const source = sourceText(input);
  const intents = input.intent_scores || {};
  const signals = input.signals || {};
  const reasons: string[] = [];
  const warnings: string[] = [];

  let proposed: NormalizedVenueCategory = 'restaurant';

  const wineSignal = maxScore([intents.wine_score]) >= 70 || includesAny(text, ['wine bar', 'vino', 'vinoteca', 'malbec']);
  const cocktailSignal = maxScore([intents.cocktail_score]) >= 70 || includesAny(text, ['cocktail', 'coctel', 'speakeasy', 'mixology', 'cocteleria']);
  const parrillaSignal = includesAny(text, ['parrilla', 'asado', 'steakhouse']);
  const premiumSignal = maxScore([intents.premium_destination_score, signals.luxury_signal]) >= 70 || includesAny(text, ['fine dining', 'premium', 'chef', 'alta cocina']);
  const specialtyCoffeeSignal = includesAny(text, ['specialty coffee', 'cafe de especialidad', 'coffee_shop', 'espresso', 'roastery', 'tostador']);
  const classicCafeSignal = includesAny(text, ['historic cafe', 'grand cafe', 'cafe notable', 'confiteria', 'notable', 'classic cafe']);
  const bakeryCafeSignal = includesAny(text, ['bakery', 'panaderia', 'patisserie', 'pasteleria']);
  const brunchSignal = maxScore([intents.brunch_score]) >= 70 || includesAny(text, ['brunch']);
  const genericBarSignal = includesAny(category, ['bar', 'lounge', 'gin']) || includesAny(google, ['bar', 'night_club']);
  const nameBarSignal = normalizeText(input.venue_name).endsWith(' bar') || includesAny(normalizeText(input.venue_name), ['sky bar', 'backroom bar', 'fly bar']);
  const restaurantSignal = includesAny(category, ['restaurant', 'dining', 'cuisine', 'fusion']) || includesAny(google, ['restaurant']);
  const cafeSignal = includesAny(category, ['cafe', 'coffee']) || includesAny(google, ['cafe', 'coffee_shop']);

  if (wineSignal) {
    proposed = 'wine_bar';
    reasons.push('wine signal from category/source/google/intent');
  } else if (cocktailSignal) {
    proposed = 'cocktail_bar';
    reasons.push('cocktail/speakeasy signal from category/source/google/intent');
  } else if (parrillaSignal) {
    proposed = 'parrilla';
    reasons.push('parrilla/asado signal');
  } else if (premiumSignal && restaurantSignal) {
    proposed = 'premium_restaurant';
    reasons.push('premium restaurant signal');
  } else if (classicCafeSignal) {
    proposed = 'classic_cafe';
    reasons.push('historic/classic cafe signal');
  } else if (specialtyCoffeeSignal) {
    proposed = 'specialty_cafe';
    reasons.push('specialty coffee signal');
  } else if (bakeryCafeSignal && cafeSignal) {
    proposed = 'bakery_cafe';
    reasons.push('bakery cafe signal');
  } else if (brunchSignal) {
    proposed = 'brunch';
    reasons.push('brunch signal');
  } else if (genericBarSignal || nameBarSignal) {
    proposed = 'bar';
    reasons.push('bar/lounge signal');
  } else if (cafeSignal) {
    proposed = 'cafe';
    reasons.push('cafe signal');
  } else if (restaurantSignal) {
    proposed = 'restaurant';
    reasons.push('restaurant signal');
  } else if (isNormalizedVenueCategory(normalizeText(current))) {
    proposed = normalizeText(current) as NormalizedVenueCategory;
    reasons.push('already normalized category');
  } else {
    warnings.push('weak category evidence; defaulted to restaurant');
  }

  if (includesAny(normalizeText(input.venue_name), [' bar']) && proposed === 'restaurant') {
    warnings.push('venue name contains Bar but normalized as restaurant');
  }

  if (includesAny(google, ['bar', 'night_club']) && proposed === 'restaurant') {
    warnings.push('Google types suggest bar but normalized as restaurant');
  }

  if (source.includes('wine_bar') && proposed !== 'wine_bar') {
    warnings.push('source category suggests wine_bar');
  }

  if (source.includes('cocktail_bar') && proposed !== 'cocktail_bar') {
    warnings.push('source category suggests cocktail_bar');
  }

  return {
    venue: input.venue_name,
    current_category: current,
    proposed_normalized_category: proposed,
    proposed_display_category_en: categoryDisplayLabel(proposed, 'en'),
    proposed_display_category_es: categoryDisplayLabel(proposed, 'es'),
    confidence: confidenceFrom(reasons, warnings),
    reasons,
    warnings,
  };
}
