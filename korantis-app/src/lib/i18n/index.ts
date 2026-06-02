import { en } from './dictionaries/en';
import { es } from './dictionaries/es';
import venueContentEs from './venueContentEs.json';
import type { Locale, TranslationParams, VenueDisplayFields } from './types';

export type { Locale, TranslationParams, VenueDisplayFields } from './types';

const dictionaries = { en, es } as const;
const STORAGE_KEY = 'korantis.locale';
const CHANGE_EVENT = 'korantis:locale-change';

const tagTranslations: Record<string, string> = {
  quiet: 'tranquilo',
  lively: 'animado',
  romantic: 'romántico',
  intimate: 'íntimo',
  creative: 'creativo',
  work: 'trabajo',
  reading: 'lectura',
  date: 'cita',
  dinner: 'cena',
  wine: 'vino',
  cocktail: 'coctelería',
  cocktails: 'coctelería',
  brunch: 'brunch',
  coffee: 'café',
  cafe: 'café',
  'specialty coffee': 'café de especialidad',
  specialty: 'especialidad',
  classic: 'clásico',
  'hidden gem': 'joya oculta',
  hidden: 'oculto',
  premium: 'premium',
  local: 'local',
  tourist: 'turístico',
  heritage: 'histórico',
  historic: 'histórico',
  design: 'diseño',
  night: 'noche',
  'late night': 'noche larga',
  solo: 'solo',
  friends: 'amigos',
  'long stay': 'estadía larga',
  'quick stop': 'parada rápida',
  'soft work': 'trabajo liviano',
  warm: 'cálido',
  'natural light': 'luz natural',
  botanical: 'botánico',
  jazz: 'jazz',
  books: 'libros',
  speakeasy: 'bar oculto',
  vinyl: 'vinilo',
  tango: 'tango',
  pastries: 'pastelería',
  rooftop: 'terraza',
  industrial: 'industrial',
  minimal: 'minimalista',
  roastery: 'tostaduría',
  'slow pace': 'ritmo lento',
  atmospheric: 'atmosférico',
  morning: 'mañana',
  afternoon: 'tarde',
  evening: 'tarde noche',
  daylight: 'luz de día',
  sunset: 'atardecer',
  outdoor: 'exterior',
  rustic: 'rústico',
  espresso: 'espresso',
  sunny: 'soleado',
  focused: 'concentrado',
  loud: 'ruidoso',
  formal: 'formal',
  visual: 'visual',
  raw: 'crudo',
  authentic: 'auténtico',
};

const categoryTranslations: Record<string, string> = {
  cafe: 'Café',
  café: 'Café',
  'coffee & bakery': 'Café y panadería',
  'bakery & cafe': 'Panadería y café',
  'bakery & café': 'Panadería y café',
  'specialty coffee': 'Café de especialidad',
  'coffee shop': 'Cafetería',
  'coffee roastery': 'Tostaduría de café',
  'roastery & cafe': 'Tostaduría y café',
  'roastery & café': 'Tostaduría y café',
  restaurant: 'Restaurante',
  'classic parrilla': 'Parrilla clásica',
  'jewish cuisine': 'Cocina judía',
  'asian fusion': 'Fusión asiática',
  'wine bar': 'Bar de vinos',
  'wine bar & dining': 'Bar de vinos y cocina',
  'cocktail bar': 'Bar de coctelería',
  'cocktail vault': 'Bar de coctelería',
  speakeasy: 'Bar oculto',
  'speakeasy bar': 'Bar oculto',
  'rooftop lounge': 'Terraza',
  'historic grand cafe': 'Gran café histórico',
  'historic grand café': 'Gran café histórico',
  'historic tango bar': 'Bar histórico de tango',
  'bookshop & cafe': 'Librería y café',
  'bookshop & café': 'Librería y café',
  'brunch & coffee': 'Brunch y café',
};

const intentTranslations: Record<string, string> = {
  work: 'trabajo',
  'soft work': 'trabajo liviano',
  reading: 'lectura',
  date: 'cita',
  dinner: 'cena',
  wine: 'vino',
  cocktail: 'coctelería',
  coffee: 'café',
  brunch: 'brunch',
  friends: 'amigos',
  solo: 'solo',
  'quick stop': 'parada rápida',
  'long stay': 'estadía larga',
};

type VenueContentEs = {
  id: string;
  tagline_es?: string;
  narrative_es?: string;
  tags_es?: string[];
};

const venueContentEsById = venueContentEs as Record<string, VenueContentEs>;

export function normalizeLocale(locale: string | null | undefined): Locale {
  return locale === 'es' ? 'es' : 'en';
}

export function getLocale(): Locale {
  if (typeof window === 'undefined') return 'en';
  return normalizeLocale(window.localStorage.getItem(STORAGE_KEY));
}

export function setLocale(locale: Locale) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, locale);
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

export function subscribeLocale(listener: () => void) {
  if (typeof window === 'undefined') return () => {};

  window.addEventListener(CHANGE_EVENT, listener);
  window.addEventListener('storage', listener);

  return () => {
    window.removeEventListener(CHANGE_EVENT, listener);
    window.removeEventListener('storage', listener);
  };
}

export function t(key: string, locale: Locale, params?: TranslationParams): string {
  const dictionary = dictionaries[locale] || dictionaries.en;
  const template = dictionary[key] || dictionaries.en[key] || key;

  if (!params) return template;

  return Object.entries(params).reduce(
    (value, [paramKey, paramValue]) =>
      value.replaceAll(`{${paramKey}}`, String(paramValue)),
    template,
  );
}

function applyCapitalization(source: string, translated: string) {
  if (!source) return translated;
  if (source.toUpperCase() === source) return translated.toUpperCase();
  if (source[0] === source[0].toUpperCase()) {
    return translated.charAt(0).toUpperCase() + translated.slice(1);
  }
  return translated;
}

function translateFromMap(value: string, locale: Locale, map: Record<string, string>) {
  if (locale === 'en') return value;
  const normalized = value.trim().toLowerCase();
  const translated = map[normalized];
  return translated ? applyCapitalization(value.trim(), translated) : value;
}

export function translateTag(tag: string, locale: Locale) {
  return translateFromMap(tag, locale, tagTranslations);
}

export function translateIntent(intent: string, locale: Locale) {
  return translateFromMap(intent, locale, intentTranslations);
}

export function translateVenueField(
  value: string | null | undefined,
  locale: Locale,
  context: 'category' | 'tag' | 'intent' | 'atmosphere' | 'description' = 'description',
) {
  if (!value) return '';
  if (context === 'atmosphere') {
    const atmosphereKey = value.trim().toLowerCase().replaceAll(' ', '-');
    return t(atmosphereKey, locale);
  }
  if (locale === 'en') return value;
  if (context === 'category') return translateFromMap(value, locale, categoryTranslations);
  if (context === 'tag') return translateTag(value, locale);
  if (context === 'intent') return translateIntent(value, locale);
  return value;
}

export function localizeVenueForDisplay<
  TVenue extends {
    id?: string | null;
    category?: string | null;
    category_es?: string | null;
    tags?: string[] | null;
    tags_es?: string[] | null;
    intents?: string[] | null;
    atmosphere?: string | null;
    tagline?: string | null;
    tagline_es?: string | null;
    narrative?: string | null;
    narrative_es?: string | null;
  },
>(venue: TVenue, locale: Locale): VenueDisplayFields<TVenue> {
  const spanishFallback = locale === 'es' && venue.id
    ? venueContentEsById[venue.id]
    : null;

  const displayCategory =
    locale === 'es' && venue.category_es
      ? venue.category_es
      : translateVenueField(venue.category, locale, 'category');

  const displayTags = locale === 'es' && venue.tags_es?.length
    ? venue.tags_es
    : locale === 'es' && spanishFallback?.tags_es?.length
      ? spanishFallback.tags_es
      : (venue.tags || []).map((tag) => translateTag(tag, locale));
  const displayIntents = (venue.intents || []).map((intent) =>
    translateIntent(intent, locale),
  );
  const displayTagline =
    locale === 'es' && venue.tagline_es
      ? venue.tagline_es
      : locale === 'es' && spanishFallback?.tagline_es
        ? spanishFallback.tagline_es
        : venue.tagline || '';
  const displayDescription =
    locale === 'es' && venue.narrative_es
      ? venue.narrative_es
      : locale === 'es' && spanishFallback?.narrative_es
        ? spanishFallback.narrative_es
        : venue.narrative || '';

  return {
    ...venue,
    displayCategory,
    displayTags,
    displayIntents,
    displayAtmosphere: translateVenueField(venue.atmosphere, locale, 'atmosphere'),
    displayTagline,
    displayDescription,
  };
}
