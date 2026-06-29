import type { Venue } from '@/features/venues/api/venue-schema';

export const NEUTRAL_TASTE_VECTOR = [0, 0, 0, 0, 0, 0, 0, 0] as const;

export const ATMOSPHERE_VECTORS: Record<string, number[]> = {
  morning: [0.8, -0.3, -0.4, 0.8, 0.6, -0.2, -0.7, -0.4],
  afternoon: [0.2, 0.1, 0.1, 0.5, 0.2, 0.4, 0.1, 0.1],
  'golden-hour': [0, 0.6, 0.5, 0.2, -0.3, 0.6, 0.3, 0.3],
  night: [-0.7, 0.8, 0.8, -0.7, -0.6, -0.4, 0.5, 0.6],
  'late-night': [-0.9, 0.5, 0.9, -0.9, -0.8, -0.6, 0.4, 0.7],
  dawn: [-0.4, -0.5, -0.2, 0.3, 0.8, 0.2, -0.5, -0.5],
};

const ATMOSPHERE_PEAKS: Record<string, number> = {
  'late-night': 2.5,
  dawn: 6.5,
  morning: 9.5,
  afternoon: 14.5,
  'golden-hour': 18,
  night: 21.5,
};

type Daypart = 'morning' | 'midday' | 'afternoon' | 'golden_hour' | 'night' | 'late_night';
type CategoryKind = 'cafe' | 'restaurant' | 'wine_bar' | 'cocktail_bar' | 'bar' | 'other';

export type RankedVenue = Venue & {
  scoreFinal: number;
  scoreBreakdown: { circadian: number; taste: number; context: number; memory: number };
};

export function rankVenues(
  venues: Venue[],
  options: { hour: number; tasteVector: number[]; savedIds: ReadonlySet<string> },
): RankedVenue[] {
  const coldStart = options.tasteVector.every((value) => value === 0);
  const daypart = getDaypart(options.hour);

  const ranked = venues.map((venue, originalIndex) => {
    const peak = ATMOSPHERE_PEAKS[venue.atmosphere];
    const circadian = 1 - circularTimeDistance(options.hour, peak ?? options.hour + 6) / 12;
    const vector = venue.tasteVector.length === 8 ? venue.tasteVector : ATMOSPHERE_VECTORS[venue.atmosphere] ?? [...NEUTRAL_TASTE_VECTOR];
    const taste = (cosineSimilarity(options.tasteVector, vector) + 1) / 2;
    const context = normalizeQuality(venue.quality);
    const memory = options.savedIds.has(venue.id) ? 1 : 0;
    const base = 0.4 * circadian + (coldStart ? 0 : 0.4 * taste) + 0.2 * context + (coldStart ? 0.03 : 0) + 0.1 * memory;
    const scoreFinal = clamp(base + categoryBias(daypart, venue), 0, 1.2);
    return { ...venue, scoreFinal, scoreBreakdown: { circadian, taste, context, memory }, originalIndex };
  }).sort((a, b) => Math.abs(b.scoreFinal - a.scoreFinal) < 0.0001 ? a.originalIndex - b.originalIndex : b.scoreFinal - a.scoreFinal);

  return applyMixGuardrail(ranked, daypart).map(({ originalIndex: _originalIndex, ...venue }) => {
    void _originalIndex;
    return venue;
  });
}

export function learnTasteVector(current: number[], venue: Venue, rate = 0.15) {
  const target = venue.tasteVector.length === 8 ? venue.tasteVector : ATMOSPHERE_VECTORS[venue.atmosphere];
  if (!target) return current;
  return current.map((value, index) => clamp(value + rate * (target[index] - value), -1, 1));
}

function getDaypart(hour: number): Daypart {
  if (hour >= 7 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 15) return 'midday';
  if (hour >= 15 && hour < 17.5) return 'afternoon';
  if (hour >= 17.5 && hour < 20) return 'golden_hour';
  if (hour >= 20 || hour < 1) return 'night';
  return 'late_night';
}

function getCategoryKind(venue: Venue): CategoryKind {
  const text = normalize([venue.name, venue.category, venue.tagline, venue.narrative, ...venue.tags].join(' '));
  if (/wine bar|vino|malbec/.test(text)) return 'wine_bar';
  if (/cocktail|speakeasy|mixology/.test(text)) return 'cocktail_bar';
  if (/restaurant|dining|parrilla|cuisine|tapas|bistro/.test(text)) return 'restaurant';
  if (/cafe|coffee|roastery|espresso|bakery|brunch/.test(text)) return 'cafe';
  if (/bar|lounge|gin/.test(text)) return 'bar';
  return 'other';
}

function categoryBias(daypart: Daypart, venue: Venue) {
  const text = normalize([venue.name, venue.category, venue.atmosphere, venue.tagline, venue.narrative, ...venue.tags].join(' '));
  const kind = getCategoryKind(venue);
  const practical = /work|laptop|reading|study|focus|quiet|slow/.test(text);
  const food = /restaurant|dining|lunch|brunch|cuisine|parrilla|tapas|bakery|food|kitchen|menu/.test(text);
  const aperitivo = /date|aperitivo|wine|cocktail|terrace|patio|rooftop|outdoor|sunset/.test(text);
  const late = /late night|late-night|midnight|after midnight/.test(text);
  let bias = 0;

  if (daypart === 'morning') {
    if (kind === 'cafe') bias += 0.06;
    if (/breakfast|brunch|bakery/.test(text)) bias += 0.03;
    if (practical) bias += 0.02;
  } else if (daypart === 'midday') {
    if (kind === 'restaurant') bias += 0.08;
    if (/lunch|brunch|dining|parrilla|cuisine/.test(text)) bias += 0.05;
    if (kind === 'cafe' && !food) bias -= 0.05;
    if (kind === 'cocktail_bar') bias -= 0.08;
    if (kind === 'bar') bias -= 0.04;
  } else if (daypart === 'afternoon') {
    if (kind === 'cafe') bias += 0.05;
    if (practical) bias += 0.03;
    if (kind === 'wine_bar') bias += 0.02;
  } else if (daypart === 'golden_hour') {
    if (['wine_bar', 'cocktail_bar', 'bar'].includes(kind)) bias += 0.07;
    if (aperitivo) bias += 0.03;
    if (kind === 'cafe' && !food) bias -= 0.025;
  } else if (daypart === 'night') {
    if (kind === 'restaurant') bias += 0.07;
    if (['wine_bar', 'cocktail_bar', 'bar'].includes(kind)) bias += 0.08;
    if (kind === 'cafe') bias -= practical ? 0.06 : 0.035;
  } else {
    if (['cocktail_bar', 'bar'].includes(kind)) bias += 0.08;
    if (late) bias += 0.06;
    if (kind === 'cafe' && !late) bias -= 0.08;
  }

  const multiplier = normalizeQuality(venue.quality) < 0.7 && bias > 0 ? 0.35 : 1;
  return clamp(bias * multiplier, -0.1, 0.1);
}

function applyMixGuardrail<T extends RankedVenue & { originalIndex: number }>(ranked: T[], daypart: Daypart): T[] {
  if (ranked.length <= 10 || !['midday', 'night'].includes(daypart)) return ranked;
  const top = ranked.slice(0, 10);
  const desired = daypart === 'midday' ? ['restaurant'] : ['restaurant', 'wine_bar', 'cocktail_bar', 'bar'];
  const target = daypart === 'midday' ? Math.min(4, ranked.filter((venue) => desired.includes(getCategoryKind(venue))).length) : Math.min(6, ranked.filter((venue) => desired.includes(getCategoryKind(venue))).length);

  while (top.filter((venue) => desired.includes(getCategoryKind(venue))).length < target) {
    const replaceIndex = [...top].map((venue, index) => ({ venue, index })).filter(({ venue }) => getCategoryKind(venue) === 'cafe').sort((a, b) => a.venue.scoreFinal - b.venue.scoreFinal)[0]?.index;
    if (replaceIndex === undefined) break;
    const ids = new Set(top.map((venue) => venue.id));
    const replacement = ranked.find((venue) => !ids.has(venue.id) && desired.includes(getCategoryKind(venue)) && normalizeQuality(venue.quality) >= 0.75 && venue.scoreFinal >= top[replaceIndex].scoreFinal - 0.2);
    if (!replacement) break;
    top[replaceIndex] = replacement;
  }

  const topIds = new Set(top.map((venue) => venue.id));
  return [...top, ...ranked.filter((venue) => !topIds.has(venue.id))];
}

function normalizeQuality(value: number) {
  if (!Number.isFinite(value)) return 0;
  return value > 1 ? clamp(value / 100, 0, 1) : clamp(value, 0, 1);
}

function circularTimeDistance(first: number, second: number) {
  const difference = Math.abs(first - second);
  return Math.min(difference, 24 - difference);
}

function cosineSimilarity(first: number[], second: number[]) {
  if (first.length !== second.length) return 0;
  let dot = 0;
  let normFirst = 0;
  let normSecond = 0;
  for (let index = 0; index < first.length; index += 1) {
    dot += first[index] * second[index];
    normFirst += first[index] ** 2;
    normSecond += second[index] ** 2;
  }
  if (normFirst === 0 || normSecond === 0) return 0;
  return dot / (Math.sqrt(normFirst) * Math.sqrt(normSecond));
}

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value));
}
