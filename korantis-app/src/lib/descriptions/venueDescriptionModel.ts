import type { Locale } from '@/lib/i18n';
import { translateVenueField } from '@/lib/i18n';
import { getVenueCategoryKind } from '@/lib/ranking/circadianRanking';

export type VenueDescriptionDisplay = {
  oneLiner: string;
  summary: string;
  bestFor: string[];
  goodToKnow: string[];
  priceLabel: string;
  energyLabel: string;
  noiseLabel: string;
  reservationHint: string;
  confidenceLabel: string;
  fieldsUsed: string[];
  fieldsMissing: string[];
};

type DescriptionVenue = {
  name: string;
  category: string;
  location?: string | null;
  atmosphere?: string | null;
  tags?: string[] | null;
  quality?: number | null;
  tagline?: string | null;
  narrative?: string | null;
  galleryImages?: Array<{ src?: string | null; source?: string | null; role?: string | null }> | null;
  heroImage?: string | null;
};

const MAX_ONE_LINER_LENGTH = 140;

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

function textFor(venue: DescriptionVenue) {
  return normalize([
    venue.name,
    venue.category,
    venue.location,
    venue.atmosphere,
    venue.tagline,
    venue.narrative,
    ...(venue.tags || []),
  ].filter(Boolean).join(' '));
}

function hasAny(haystack: string, needles: string[]) {
  return needles.some((needle) => haystack.includes(needle));
}

function sentenceJoin(parts: string[]) {
  return parts.filter(Boolean).join(' ');
}

function trimOneLiner(value: string) {
  if (value.length <= MAX_ONE_LINER_LENGTH) return value;
  return `${value.slice(0, MAX_ONE_LINER_LENGTH - 1).trimEnd()}.`;
}

function categoryLabel(venue: DescriptionVenue, locale: Locale) {
  const translated = translateVenueField(venue.category, locale, 'category');
  if (translated) return translated.toLowerCase();
  return locale === 'es' ? 'lugar' : 'place';
}

function districtLabel(venue: DescriptionVenue) {
  const location = venue.location || '';
  if (!location) return '';
  return location.split(',')[0]?.trim() || location;
}

function isClassicCafe(text: string) {
  return hasAny(text, ['classic', 'historic', 'heritage', 'grand cafe', 'la biela', 'tortoni', 'confiteria']);
}

function isSpecialtyCafe(text: string) {
  return hasAny(text, ['specialty', 'roastery', 'espresso', 'coffee roasters', 'lattente', 'cuervo', 'lab']);
}

function isBakeryCafe(text: string) {
  return hasAny(text, ['bakery', 'pastries', 'brunch', 'ninina']);
}

function isPremiumRestaurant(text: string) {
  return hasAny(text, ['premium', 'fine dining', 'michelin', 'mishiguene', 'anchoita', 'roux', 'julia']);
}

function isParrilla(text: string) {
  return hasAny(text, ['parrilla', 'meat', 'fire', 'don julio']);
}

function getEnergy(text: string, kind: string, atmosphere: string | null | undefined, locale: Locale) {
  if (hasAny(text, ['loud', 'punk', 'bustling', 'busy', 'social', 'lively', 'bar', 'cocktail', 'night'])) {
    return locale === 'es' ? 'energia social' : 'social energy';
  }
  if (hasAny(text, ['quiet', 'calm', 'reading', 'slow', 'soft', 'minimal'])) {
    return locale === 'es' ? 'energia calma' : 'calm energy';
  }
  if (kind === 'restaurant') return locale === 'es' ? 'ritmo de comida' : 'meal-paced energy';
  if (atmosphere === 'morning') return locale === 'es' ? 'ritmo de manana' : 'morning pace';
  return locale === 'es' ? 'energia moderada' : 'moderate energy';
}

function getNoise(text: string, locale: Locale) {
  if (hasAny(text, ['loud', 'bustling', 'busy', 'punk', 'social', 'lively'])) {
    return locale === 'es' ? 'probablemente mas ruidoso' : 'likely livelier';
  }
  if (hasAny(text, ['quiet', 'calm', 'reading', 'soft', 'minimal'])) {
    return locale === 'es' ? 'probablemente mas calmo' : 'likely calmer';
  }
  return locale === 'es' ? 'ruido no confirmado' : 'noise not confirmed';
}

function bestFor(kind: string, text: string, locale: Locale) {
  if (kind === 'cafe') {
    if (isClassicCafe(text)) {
      return locale === 'es'
        ? ['parada clasica', 'cafe', 'caracter porteno']
        : ['classic stop', 'coffee', 'city character'];
    }
    if (isBakeryCafe(text)) {
      return locale === 'es'
        ? ['brunch', 'cafe', 'pausa de tarde']
        : ['brunch', 'coffee', 'afternoon pause'];
    }

    const base = locale === 'es'
      ? ['cafe', 'lectura breve', 'encuentro corto']
      : ['coffee', 'short reading', 'brief meeting'];
    if (hasAny(text, ['work', 'laptop', 'study', 'focus'])) {
      base.push(locale === 'es' ? 'trabajo liviano' : 'light work');
    }
    return base.slice(0, 4);
  }

  if (kind === 'cocktail_bar' || kind === 'bar') {
    return locale === 'es'
      ? ['cita', 'grupo chico', 'salida nocturna']
      : ['date', 'small group', 'night out'];
  }

  if (kind === 'wine_bar') {
    return locale === 'es'
      ? ['aperitivo', 'cita tranquila', 'vino con comida']
      : ['aperitivo', 'quiet date', 'wine with food'];
  }

  if (kind === 'restaurant') {
    if (isParrilla(text)) {
      return locale === 'es'
        ? ['cena', 'carne y vino', 'comida planificada']
        : ['dinner', 'meat and wine', 'planned meal'];
    }
    if (isPremiumRestaurant(text)) {
      return locale === 'es'
        ? ['ocasion especial', 'cena planificada', 'grupo chico']
        : ['special occasion', 'planned dinner', 'small group'];
    }

    return locale === 'es'
      ? ['cena', 'almuerzo especial', 'grupo chico']
      : ['dinner', 'special lunch', 'small group'];
  }

  return locale === 'es'
    ? ['descubrimiento editorial', 'salida casual']
    : ['editorial discovery', 'casual outing'];
}

function occasionPhrase(kind: string, text: string, bestForValues: string[], locale: Locale) {
  if (kind === 'cafe') {
    if (isClassicCafe(text)) {
      return locale === 'es'
        ? 'para una parada clasica con caracter porteno'
        : 'for a traditional stop with city character';
    }
    if (isBakeryCafe(text)) {
      return locale === 'es'
        ? 'para brunch, cafe y una pausa de tarde'
        : 'for brunch, coffee, and an afternoon pause';
    }
    if (isSpecialtyCafe(text)) {
      return locale === 'es'
        ? 'para cafe de especialidad, una pausa corta o un encuentro simple'
        : 'for specialty coffee, a short pause, or a low-pressure meeting';
    }
    return locale === 'es'
      ? 'para cafe, una pausa corta o un encuentro sin demasiada presion'
      : 'for coffee, a short pause, or a low-pressure meeting';
  }

  if (kind === 'cocktail_bar') {
    return locale === 'es'
      ? 'para cocktails, citas y una salida mas producida'
      : 'for cocktails, dates, and a more produced night out';
  }

  if (kind === 'bar') {
    return locale === 'es'
      ? 'para una salida nocturna con mas escena que calma'
      : 'for a night out with more scene than quiet';
  }

  if (kind === 'wine_bar') {
    return locale === 'es'
      ? 'para aperitivo, vino y una conversacion mas tranquila'
      : 'for aperitivo, wine, and a quieter conversation';
  }

  if (kind === 'restaurant') {
    if (isParrilla(text)) {
      return locale === 'es'
        ? 'para carne, vino y una comida donde la mesa es el plan'
        : 'for meat, wine, and a meal where the table is the plan';
    }
    if (isPremiumRestaurant(text)) {
      return locale === 'es'
        ? 'para una comida planificada o una ocasion especial'
        : 'for a planned meal or special occasion';
    }
    return locale === 'es'
      ? 'para cena, almuerzo especial o grupo chico'
      : 'for dinner, a special lunch, or a small group';
  }

  return locale === 'es'
    ? `para ${bestForValues.slice(0, 2).join(' o ')}`
    : `for ${bestForValues.slice(0, 2).join(' or ')}`;
}

function decisionEnding(kind: string, text: string, locale: Locale) {
  if (kind === 'cocktail_bar' || kind === 'bar') {
    return locale === 'es'
      ? 'Mejor cuando buscas escena, barra y energia, no una conversacion larga en silencio.'
      : 'Best when you want scene, bar energy, and a night out, not a long quiet conversation.';
  }
  if (kind === 'wine_bar') {
    return locale === 'es'
      ? 'Mejor cuando queres vino y conversacion sin convertirlo en una cena apurada.'
      : 'Best when you want wine and conversation without turning it into a rushed dinner.';
  }
  if (kind === 'cafe') {
    if (isClassicCafe(text)) {
      return locale === 'es'
        ? 'Mejor para una parada clasica con caracter porteno, no tanto para esconderse en silencio.'
        : 'Best for a traditional stop with city character rather than a hidden quiet corner.';
    }
    if (isSpecialtyCafe(text)) {
      return locale === 'es'
        ? 'Usalo cuando el cafe importa mas que quedarse instalado durante horas.'
        : 'Use it when the coffee matters more than settling in for hours.';
    }
    return locale === 'es'
      ? 'Mejor para una pausa corta, cafe o un encuentro sin demasiada presion.'
      : 'Best for a short pause, coffee, or a low-pressure meeting.';
  }
  if (kind === 'restaurant') {
    if (isPremiumRestaurant(text)) {
      return locale === 'es'
        ? 'Mejor para una comida planificada o una ocasion especial que para improvisar.'
        : 'Better for a planned meal or special occasion than an improvised stop.';
    }
    return locale === 'es'
      ? 'Mejor cuando la comida es el plan, no solo una parada rapida.'
      : 'Best when the meal is the plan, not just a quick stop.';
  }

  return locale === 'es'
    ? 'Mejor cuando queres decidir por contexto y no solo por cercania.'
    : 'Best when you want to choose by context, not just proximity.';
}

function caveats(kind: string, text: string, locale: Locale) {
  const notes: string[] = [];

  if (kind === 'cafe' && hasAny(text, ['quick', 'counter', 'to go', 'takeaway', 'busy', 'bustling'])) {
    notes.push(locale === 'es'
      ? 'Mejor para una pausa corta que para quedarse mucho tiempo.'
      : 'Better for a short stop than a long stay.');
  }

  if (kind === 'cocktail_bar' || kind === 'bar') {
    notes.push(locale === 'es'
      ? 'Reserva no confirmada; conviene chequear antes si vas en horario fuerte.'
      : 'Reservation is not confirmed; check ahead if you are going at peak time.');
  }

  if (kind === 'restaurant') {
    notes.push(locale === 'es'
      ? 'La informacion de reserva no esta confirmada; conviene chequear antes.'
      : 'Reservation info is not confirmed; check before going.');
  }

  if (notes.length === 0) {
    notes.push(locale === 'es'
      ? 'Precio no confirmado.'
      : 'Price is not confirmed.');
  }

  return notes;
}

function contextSentence(
  venueName: string,
  category: string,
  place: string,
  kind: string,
  energyLabel: string,
  noiseLabel: string,
  locale: Locale,
) {
  const placePart = place ? ` ${place}` : '';

  if (locale === 'es') {
    if (kind === 'cocktail_bar' || kind === 'bar') {
      return `${venueName} es ${category}${placePart} con ${energyLabel}; ${noiseLabel}.`;
    }
    if (kind === 'wine_bar') {
      return `${venueName} funciona como ${category}${placePart}, con ${energyLabel} y foco en vino.`;
    }
    if (kind === 'restaurant') {
      return `${venueName} es ${category}${placePart}; la senal util es ${energyLabel} y ${noiseLabel}.`;
    }
    if (kind === 'cafe') {
      return `${venueName} es ${category}${placePart}, con ${energyLabel}; ${noiseLabel}.`;
    }
    return `${venueName} es ${category}${placePart}, con ${energyLabel}; ${noiseLabel}.`;
  }

  if (kind === 'cocktail_bar' || kind === 'bar') {
    return `${venueName} is a ${category}${placePart} with ${energyLabel}; ${noiseLabel}.`;
  }
  if (kind === 'wine_bar') {
    return `${venueName} works as a ${category}${placePart}, with ${energyLabel} and a wine-first pull.`;
  }
  if (kind === 'restaurant') {
    return `${venueName} is a ${category}${placePart}; the useful signal is ${energyLabel} and ${noiseLabel}.`;
  }
  if (kind === 'cafe') {
    return `${venueName} is a ${category}${placePart}, with ${energyLabel}; ${noiseLabel}.`;
  }
  return `${venueName} is a ${category}${placePart}, with ${energyLabel}; ${noiseLabel}.`;
}

function bestFitSentence(kind: string, bestForValues: string[], locale: Locale) {
  const fit = bestForValues.join(', ');

  if (locale === 'es') {
    if (kind === 'cocktail_bar' || kind === 'bar') return `Anda mejor para ${fit}.`;
    if (kind === 'wine_bar') return `Tiene mas sentido para ${fit}.`;
    if (kind === 'restaurant') return `Planificalo para ${fit}.`;
    if (kind === 'cafe') return `Usalo para ${fit}.`;
    return `Funciona mejor para ${fit}.`;
  }

  if (kind === 'cocktail_bar' || kind === 'bar') return `It makes most sense for ${fit}.`;
  if (kind === 'wine_bar') return `It is strongest for ${fit}.`;
  if (kind === 'restaurant') return `Plan it for ${fit}.`;
  if (kind === 'cafe') return `Use it for ${fit}.`;
  return `It works best for ${fit}.`;
}

function confidenceLabel(venue: DescriptionVenue, locale: Locale) {
  const hasImages = Boolean(venue.heroImage || venue.galleryImages?.some((image) => image.src));
  const hasTags = Boolean(venue.tags?.length);
  const hasText = Boolean(venue.tagline || venue.narrative);
  const quality = venue.quality || 0;

  if (hasImages && hasTags && hasText && quality >= 0.75) {
    return locale === 'es' ? 'confianza editorial alta' : 'high editorial confidence';
  }

  if (hasImages && (hasTags || hasText)) {
    return locale === 'es' ? 'confianza editorial media' : 'medium editorial confidence';
  }

  return locale === 'es' ? 'evidencia limitada' : 'limited evidence';
}

export function localizeVenueDescriptionForDisplay(
  venue: DescriptionVenue,
  locale: Locale,
): VenueDescriptionDisplay {
  const text = textFor(venue);
  const kind = getVenueCategoryKind(venue);
  const category = categoryLabel(venue, locale);
  const district = districtLabel(venue);
  const energyLabel = getEnergy(text, kind, venue.atmosphere, locale);
  const noiseLabel = getNoise(text, locale);
  const bestForValues = bestFor(kind, text, locale);
  const goodToKnowValues = caveats(kind, text, locale);
  const occasion = occasionPhrase(kind, text, bestForValues, locale);
  const ending = decisionEnding(kind, text, locale);
  const fieldsUsed = [
    'name',
    'category',
    venue.location ? 'location' : '',
    venue.atmosphere ? 'atmosphere' : '',
    venue.tags?.length ? 'tags' : '',
    typeof venue.quality === 'number' ? 'quality' : '',
    venue.heroImage || venue.galleryImages?.length ? 'image_presence' : '',
  ].filter(Boolean);
  const fieldsMissing = [
    'price_level',
    'reservation_availability',
    'opening_hours',
    'review_count',
    'verified_noise_level',
  ];

  const place = district
    ? (locale === 'es' ? `en ${district}` : `in ${district}`)
    : '';

  const oneLiner = locale === 'es'
    ? trimOneLiner(`${venue.name} es ${category} ${place} ${occasion}.`)
    : trimOneLiner(`${venue.name} is a ${category} ${place} ${occasion}.`);

  const summary = locale === 'es'
    ? sentenceJoin([
      contextSentence(venue.name, category, place, kind, energyLabel, noiseLabel, locale),
      bestFitSentence(kind, bestForValues, locale),
      goodToKnowValues[0],
      ending,
    ])
    : sentenceJoin([
      contextSentence(venue.name, category, place, kind, energyLabel, noiseLabel, locale),
      bestFitSentence(kind, bestForValues, locale),
      goodToKnowValues[0],
      ending,
    ]);

  return {
    oneLiner,
    summary,
    bestFor: bestForValues,
    goodToKnow: goodToKnowValues,
    priceLabel: locale === 'es' ? 'precio no confirmado' : 'price not confirmed',
    energyLabel,
    noiseLabel,
    reservationHint: locale === 'es'
      ? 'reserva no confirmada'
      : 'reservation not confirmed',
    confidenceLabel: confidenceLabel(venue, locale),
    fieldsUsed,
    fieldsMissing,
  };
}
