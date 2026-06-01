export type CircadianDaypart =
  | 'morning'
  | 'midday'
  | 'afternoon'
  | 'golden_hour'
  | 'night'
  | 'late_night';

export type VenueCategoryKind =
  | 'cafe'
  | 'restaurant'
  | 'wine_bar'
  | 'cocktail_bar'
  | 'bar'
  | 'other';

export type CircadianVenue = {
  name: string;
  category: string;
  atmosphere?: string;
  quality?: number;
  tags?: string[];
  tagline?: string;
  narrative?: string;
};

export type CircadianRankingDebug = {
  baseScore: number;
  circadianBias: number;
  finalDisplayScore: number;
  daypart: CircadianDaypart;
  categoryKind: VenueCategoryKind;
};

type RankedCandidate = CircadianVenue & {
  scoreFinal: string;
  originalIndex: number;
  rankingDebug?: CircadianRankingDebug;
};

const PRACTICAL_SIGNALS = [
  'work',
  'laptop',
  'reading',
  'study',
  'focus',
  'quiet',
  'slow',
];

const FOOD_SIGNALS = [
  'restaurant',
  'dining',
  'lunch',
  'brunch',
  'cuisine',
  'parrilla',
  'tapas',
  'bakery',
  'food',
  'kitchen',
  'menu',
];

const DATE_APERITIVO_SIGNALS = [
  'date',
  'aperitivo',
  'wine',
  'cocktail',
  'terrace',
  'patio',
  'rooftop',
  'outdoor',
  'sunset',
];

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

function venueText(venue: CircadianVenue) {
  return normalizeText([
    venue.name,
    venue.category,
    venue.atmosphere,
    venue.tagline,
    venue.narrative,
    ...(venue.tags || []),
  ].filter(Boolean).join(' '));
}

function hasAny(haystack: string, needles: string[]) {
  return needles.some((needle) => haystack.includes(needle));
}

export function getCircadianDaypart(hour: number): CircadianDaypart {
  if (hour >= 7 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 15) return 'midday';
  if (hour >= 15 && hour < 17.5) return 'afternoon';
  if (hour >= 17.5 && hour < 20) return 'golden_hour';
  if (hour >= 20 || hour < 1) return 'night';
  return 'late_night';
}

export function getVenueCategoryKind(venue: CircadianVenue): VenueCategoryKind {
  const category = normalizeText(venue.category);
  const text = venueText(venue);

  if (hasAny(text, ['wine bar', 'vino', 'malbec'])) return 'wine_bar';
  if (hasAny(text, ['cocktail', 'speakeasy', 'mixology', 'verne club'])) return 'cocktail_bar';
  if (hasAny(text, ['gin & tapas', 'gin bar'])) return 'bar';
  if (hasAny(text, ['sky bar', 'backroom bar', 'fly bar']) || normalizeText(venue.name).endsWith(' bar')) return 'bar';

  if (hasAny(category, ['wine bar', 'vino', 'malbec'])) return 'wine_bar';
  if (hasAny(category, ['cocktail', 'speakeasy', 'mixology'])) return 'cocktail_bar';
  if (hasAny(category, ['restaurant', 'dining', 'parrilla', 'cuisine', 'tapas', 'asian fusion'])) return 'restaurant';
  if (hasAny(category, ['cafe', 'coffee', 'roastery', 'espresso', 'bakery', 'brunch'])) return 'cafe';
  if (hasAny(category, ['bar', 'lounge', 'gin'])) return 'bar';

  if (hasAny(text, ['restaurant', 'dining', 'parrilla', 'cuisine', 'tapas', 'asian fusion'])) return 'restaurant';
  if (hasAny(text, ['cafe', 'coffee', 'roastery', 'espresso', 'bakery', 'brunch'])) return 'cafe';
  if (hasAny(text, ['bar', 'lounge', 'gin'])) return 'bar';

  return 'other';
}

export function hasExplicitCategoryIntent(searchQuery: string, selectedPills: string[] = []) {
  const text = normalizeText([searchQuery, ...selectedPills].join(' '));
  return hasAny(text, [
    'cafe',
    'coffee',
    'espresso',
    'brunch',
    'restaurant',
    'lunch',
    'dinner',
    'wine',
    'cocktail',
    'bar',
    'work',
    'laptop',
    'study',
  ]);
}

export function getCircadianCategoryBias(daypart: CircadianDaypart, venue: CircadianVenue) {
  const text = venueText(venue);
  const kind = getVenueCategoryKind(venue);
  const hasFoodSignal = hasAny(text, FOOD_SIGNALS);
  const hasPracticalSignal = hasAny(text, PRACTICAL_SIGNALS);
  const hasDateAperitivoSignal = hasAny(text, DATE_APERITIVO_SIGNALS);
  const hasLateSignal = hasAny(text, ['late night', 'late-night', 'midnight', 'after midnight']);
  const isCoffeeOnly = kind === 'cafe' && !hasFoodSignal;
  const isWorkCafe = kind === 'cafe' && hasPracticalSignal;

  let bias = 0;

  if (daypart === 'morning') {
    if (kind === 'cafe') bias += 0.06;
    if (hasAny(text, ['breakfast', 'brunch', 'bakery'])) bias += 0.03;
    if (hasPracticalSignal) bias += 0.02;
  }

  if (daypart === 'midday') {
    if (kind === 'restaurant') bias += 0.08;
    if (hasAny(text, ['lunch', 'brunch', 'casual dining', 'dining', 'parrilla', 'cuisine'])) bias += 0.05;
    if (kind === 'cafe' && hasFoodSignal) bias += 0.015;
    if (isCoffeeOnly) bias -= 0.05;
    if (kind === 'cocktail_bar') bias -= 0.08;
    if (kind === 'bar') bias -= 0.04;
  }

  if (daypart === 'afternoon') {
    if (kind === 'cafe') bias += 0.05;
    if (hasPracticalSignal) bias += 0.03;
    if (kind === 'wine_bar') bias += 0.02;
  }

  if (daypart === 'golden_hour') {
    if (kind === 'wine_bar' || kind === 'cocktail_bar' || kind === 'bar') bias += 0.07;
    if (hasDateAperitivoSignal) bias += 0.03;
    if (isCoffeeOnly) bias -= 0.025;
  }

  if (daypart === 'night') {
    if (kind === 'restaurant') bias += 0.07;
    if (kind === 'wine_bar' || kind === 'cocktail_bar' || kind === 'bar') bias += 0.08;
    if (isWorkCafe) bias -= 0.06;
    else if (kind === 'cafe') bias -= 0.035;
  }

  if (daypart === 'late_night') {
    if (kind === 'cocktail_bar' || kind === 'bar') bias += 0.08;
    if (hasLateSignal) bias += 0.06;
    if (kind === 'restaurant' && !hasLateSignal) bias -= 0.02;
    if (kind === 'cafe' && !hasLateSignal) bias -= 0.08;
  }

  const quality = venue.quality ?? 0.8;
  const positiveQualityMultiplier = quality < 0.7 ? 0.35 : 1;
  const adjustedBias = bias > 0 ? bias * positiveQualityMultiplier : bias;

  return Math.max(-0.1, Math.min(0.1, adjustedBias));
}

function canSafelyPromote(candidate: RankedCandidate, displaced: RankedCandidate) {
  const candidateScore = Number.parseFloat(candidate.scoreFinal);
  const displacedScore = Number.parseFloat(displaced.scoreFinal);
  const quality = candidate.quality ?? 0.8;
  return quality >= 0.75 && candidateScore >= displacedScore - 0.2;
}

function replaceLowestCafeWithBestKind(
  top: RankedCandidate[],
  pool: RankedCandidate[],
  kinds: VenueCategoryKind[],
) {
  const cafeIndex = [...top]
    .map((candidate, index) => ({ candidate, index }))
    .filter(({ candidate }) => getVenueCategoryKind(candidate) === 'cafe')
    .sort((a, b) => Number.parseFloat(a.candidate.scoreFinal) - Number.parseFloat(b.candidate.scoreFinal))[0]?.index;

  if (cafeIndex === undefined) return false;

  const currentIds = new Set(top.map((candidate) => candidate.name));
  const replacement = pool.find((candidate) => {
    if (currentIds.has(candidate.name)) return false;
    if (!kinds.includes(getVenueCategoryKind(candidate))) return false;
    return canSafelyPromote(candidate, top[cafeIndex]);
  });

  if (!replacement) return false;
  top[cafeIndex] = replacement;
  return true;
}

export function applyCircadianMixGuardrail<T extends RankedCandidate>(
  ranked: T[],
  daypart: CircadianDaypart,
  hasExplicitIntent: boolean,
) {
  if (hasExplicitIntent || ranked.length <= 10) return ranked;
  if (daypart !== 'midday' && daypart !== 'night') return ranked;

  const top = ranked.slice(0, 10);
  const pool = ranked;

  if (daypart === 'midday') {
    const eligibleRestaurants = pool.filter((candidate) => getVenueCategoryKind(candidate) === 'restaurant').length;
    const targetRestaurants = eligibleRestaurants >= 4 ? 4 : eligibleRestaurants;

    while (
      top.filter((candidate) => getVenueCategoryKind(candidate) === 'restaurant').length < targetRestaurants
    ) {
      if (!replaceLowestCafeWithBestKind(top, pool, ['restaurant'])) break;
    }

    while (top.filter((candidate) => getVenueCategoryKind(candidate) === 'cafe').length > 4) {
      if (!replaceLowestCafeWithBestKind(top, pool, ['restaurant', 'wine_bar', 'other'])) break;
    }
  }

  if (daypart === 'night') {
    const nightKinds: VenueCategoryKind[] = ['restaurant', 'wine_bar', 'cocktail_bar', 'bar'];
    const eligibleNightVenues = pool.filter((candidate) => nightKinds.includes(getVenueCategoryKind(candidate))).length;
    const targetNightVenues = Math.min(6, eligibleNightVenues);

    while (top.filter((candidate) => nightKinds.includes(getVenueCategoryKind(candidate))).length < targetNightVenues) {
      if (!replaceLowestCafeWithBestKind(top, pool, nightKinds)) break;
    }
  }

  const selectedNames = new Set(top.map((candidate) => candidate.name));
  const remainder = ranked.filter((candidate) => !selectedNames.has(candidate.name));

  return [...top, ...remainder];
}
