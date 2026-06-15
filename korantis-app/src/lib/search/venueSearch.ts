import type { Venue } from '@/app/data/venues';

export type VenueSearchOptions = {
  query?: string;
  selectedPills?: string[];
};

const LOCATION_PILLS = new Set([
  'palermo',
  'chacarita',
  'villa crespo',
  'recoleta',
  'belgrano',
  'microcentro',
]);

const MOOD_ALIASES: Record<string, string[]> = {
  calm: [
    'calm',
    'calmo',
    'tranquilo',
    'tranquila',
    'quiet',
    'silencioso',
    'silenciosa',
    'minimal',
    'pausa',
    'slow',
    'lento',
    'lenta',
    'focused',
    'foco',
    'morning',
    'manana',
  ],
  intimate: [
    'intimate',
    'intimo',
    'intima',
    'date',
    'cita',
    'romantic',
    'romantico',
    'romantica',
    'cozy',
    'warm',
    'calido',
    'calida',
    'candlelit',
    'dim',
  ],
  social: [
    'social',
    'friends',
    'amigos',
    'amigas',
    'group',
    'grupo',
    'lively',
    'vibrante',
    'wine',
    'vino',
    'bar',
    'meet',
    'encuentro',
  ],
  energetic: [
    'energetic',
    'energia',
    'energico',
    'energica',
    'late night',
    'late-night',
    'noche',
    'cocktail',
    'cocktails',
    'coctel',
    'cocteleria',
    'speakeasy',
    'fiesta',
    'buzzing',
  ],
  hidden: [
    'hidden',
    'hidden gem',
    'escondido',
    'escondida',
    'refugio',
    'secreto',
    'secreta',
    'speakeasy',
    'subterraneo',
    'underground',
  ],
  'work-friendly': [
    'work',
    'trabajo',
    'trabajar',
    'laptop',
    'productive',
    'productivo',
    'productiva',
    'focused',
    'foco',
    'study',
    'estudiar',
    'leer',
    'lectura',
    'cafe',
    'coffee',
  ],
};

const QUERY_ALIASES: Record<string, string[]> = {
  cafe: ['coffee', 'specialty coffee', 'cafeteria', 'cafe de especialidad', 'espresso', 'bakery'],
  coffee: ['cafe', 'specialty coffee', 'cafeteria', 'cafe de especialidad', 'espresso', 'bakery'],
  cafeteria: ['cafe', 'coffee', 'specialty coffee', 'bakery'],
  restaurante: ['restaurant', 'dinner', 'cena', 'almuerzo', 'lunch', 'comer', 'parrilla'],
  restaurant: ['restaurante', 'dinner', 'cena', 'almuerzo', 'lunch', 'comer', 'parrilla'],
  bar: ['cocktail', 'cocktails', 'coctel', 'cocteleria', 'wine', 'vino', 'noche', 'night'],
  cocktail: ['bar', 'cocktails', 'coctel', 'cocteleria', 'speakeasy', 'noche'],
  coctel: ['bar', 'cocktail', 'cocktails', 'cocteleria', 'speakeasy', 'noche'],
  vino: ['wine', 'bar', 'natural wine', 'social'],
  wine: ['vino', 'bar', 'natural wine', 'social'],
  cita: ['date', 'intimate', 'intimo', 'romantic', 'romantico'],
  date: ['cita', 'intimate', 'intimo', 'romantic', 'romantico'],
  leer: ['read', 'reading', 'quiet', 'calm', 'work-friendly', 'trabajar'],
  read: ['leer', 'lectura', 'quiet', 'calm', 'work-friendly', 'trabajar'],
  trabajar: ['work', 'laptop', 'work-friendly', 'productive', 'productivo', 'cafe'],
  work: ['trabajar', 'laptop', 'work-friendly', 'productive', 'productivo', 'cafe'],
};

const QUERY_STOPWORDS = new Set([
  'a',
  'al',
  'and',
  'de',
  'del',
  'el',
  'en',
  'for',
  'la',
  'las',
  'los',
  'of',
  'para',
  'the',
  'y',
]);

const CATEGORY_INTENTS = [
  {
    keys: ['cafe', 'coffee', 'cafeteria', 'especialidad', 'specialty'],
    aliases: ['cafe', 'coffee', 'specialty coffee', 'cafe de especialidad', 'bakery', 'roastery'],
  },
  {
    keys: ['restaurante', 'restaurant', 'comer', 'cena', 'dinner', 'almuerzo', 'lunch', 'parrilla'],
    aliases: ['restaurante', 'restaurant', 'parrilla', 'bistro', 'bistrot', 'dining'],
  },
  {
    keys: ['bar', 'cocktail', 'cocktails', 'coctel', 'cocteleria'],
    aliases: ['bar', 'cocktail', 'cocktails', 'coctel', 'cocteleria', 'speakeasy'],
  },
  {
    keys: ['vino', 'wine'],
    aliases: ['vino', 'wine', 'natural wine', 'wine bar'],
  },
];

export function normalizeSearchText(value: string | null | undefined): string {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[_/-]+/g, ' ')
    .replace(/[^a-z0-9\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(value: string | null | undefined): string[] {
  const normalized = normalizeSearchText(value);
  return normalized ? normalized.split(' ') : [];
}

function meaningfulQueryTerms(value: string | null | undefined): string[] {
  return tokenize(value).filter((term) => !QUERY_STOPWORDS.has(term));
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function venueFields(venue: Venue): string[] {
  return [
    venue.name,
    venue.category,
    venue.category_es,
    venue.location,
    venue.atmosphere,
    venue.tagline,
    venue.tagline_es,
    venue.narrative,
    venue.narrative_es,
    ...(venue.tags || []),
    ...(venue.tags_es || []),
  ].filter((value): value is string => typeof value === 'string' && value.length > 0);
}

function primaryVenueFields(venue: Venue): string[] {
  return [
    venue.name,
    venue.category,
    venue.category_es,
    ...(venue.tags || []),
    ...(venue.tags_es || []),
  ].filter((value): value is string => typeof value === 'string' && value.length > 0);
}

function venueBlob(venue: Venue): string {
  return normalizeSearchText(venueFields(venue).join(' '));
}

function venueTokenSet(venue: Venue): Set<string> {
  return new Set(tokenize(venueFields(venue).join(' ')));
}

function primaryVenueBlob(venue: Venue): string {
  return normalizeSearchText(primaryVenueFields(venue).join(' '));
}

function primaryVenueTokenSet(venue: Venue): Set<string> {
  return new Set(tokenize(primaryVenueFields(venue).join(' ')));
}

function termMatches(blob: string, tokens: Set<string>, rawTerm: string): boolean {
  const term = normalizeSearchText(rawTerm);
  if (!term) return false;
  if (term.includes(' ')) return blob.includes(term);
  if (term.length <= 3) return tokens.has(term);
  return tokens.has(term) || blob.includes(term);
}

function expandedTerms(rawQuery: string): string[] {
  const terms = meaningfulQueryTerms(rawQuery);
  const expansions = terms.flatMap((term) => QUERY_ALIASES[term] || []);
  return unique([...terms, normalizeSearchText(rawQuery), ...expansions.map(normalizeSearchText)]);
}

function categoryIntentAliases(rawQuery: string): string[] {
  const queryTerms = meaningfulQueryTerms(rawQuery);
  const matches = CATEGORY_INTENTS
    .filter((intent) => intent.keys.some((key) => queryTerms.includes(key)))
    .flatMap((intent) => intent.aliases);

  return unique(matches.map(normalizeSearchText));
}

export function venueMatchesQuery(venue: Venue, query?: string): boolean {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return true;

  const blob = venueBlob(venue);
  const tokens = venueTokenSet(venue);
  const categoryAliases = categoryIntentAliases(normalizedQuery);

  if (categoryAliases.length > 0) {
    const primaryBlob = primaryVenueBlob(venue);
    const primaryTokens = primaryVenueTokenSet(venue);
    const hasPrimaryCategoryMatch = categoryAliases.some((term) => termMatches(primaryBlob, primaryTokens, term));
    if (!hasPrimaryCategoryMatch) return false;
  }

  if (blob.includes(normalizedQuery)) return true;

  const queryTokens = meaningfulQueryTerms(normalizedQuery);
  if (queryTokens.length > 1 && queryTokens.every((term) => termMatches(blob, tokens, term))) {
    return true;
  }

  return expandedTerms(normalizedQuery).some((term) => termMatches(blob, tokens, term));
}

export function venueMatchesMoodPills(venue: Venue, selectedPills: string[] = []): boolean {
  const activeMoodPills = selectedPills.filter((pill) => !LOCATION_PILLS.has(normalizeSearchText(pill)));
  if (activeMoodPills.length === 0) return true;

  const blob = venueBlob(venue);
  const tokens = venueTokenSet(venue);

  return activeMoodPills.some((pill) => {
    const normalizedPill = normalizeSearchText(pill);
    const aliases = MOOD_ALIASES[normalizedPill] || [normalizedPill];
    return aliases.some((alias) => termMatches(blob, tokens, alias));
  });
}

export function filterVenuesBySearchAndMood<T extends Venue>(
  venues: T[],
  { query, selectedPills = [] }: VenueSearchOptions,
): T[] {
  return venues.filter((venue) => (
    venueMatchesQuery(venue, query) && venueMatchesMoodPills(venue, selectedPills)
  ));
}

export function scoreVenueSearchMatch(
  venue: Venue,
  query?: string,
  selectedPills: string[] = [],
): number {
  const normalizedQuery = normalizeSearchText(query);
  const blob = venueBlob(venue);
  const tokens = venueTokenSet(venue);
  const name = normalizeSearchText(venue.name);
  const location = normalizeSearchText(venue.location);
  const category = normalizeSearchText([venue.category, venue.category_es].join(' '));
  const tags = normalizeSearchText([...(venue.tags || []), ...(venue.tags_es || [])].join(' '));
  let score = 0;

  if (normalizedQuery) {
    const terms = expandedTerms(normalizedQuery);

    if (name === normalizedQuery) score += 100;
    else if (name.startsWith(normalizedQuery)) score += 80;
    else if (name.includes(normalizedQuery)) score += 65;

    if (location.includes(normalizedQuery)) score += 45;
    if (category.includes(normalizedQuery)) score += 40;
    if (tags.includes(normalizedQuery)) score += 35;

    if (terms.some((term) => termMatches(category, new Set(tokenize(category)), term))) score += 70;
    if (terms.some((term) => termMatches(tags, new Set(tokenize(tags)), term))) score += 45;

    const matchedTerms = terms.filter((term) => termMatches(blob, tokens, term)).length;
    score += Math.min(35, matchedTerms * 8);
  }

  if (selectedPills.length > 0 && venueMatchesMoodPills(venue, selectedPills)) {
    score += 20;
  }

  return score;
}
