export const NORMALIZED_VENUE_CATEGORIES = [
  'cafe',
  'specialty_cafe',
  'classic_cafe',
  'restaurant',
  'parrilla',
  'wine_bar',
  'cocktail_bar',
  'bar',
  'bakery_cafe',
  'brunch',
  'premium_restaurant',
] as const;

export type NormalizedVenueCategory = typeof NORMALIZED_VENUE_CATEGORIES[number];

export type VenueCategoryDefinition = {
  id: NormalizedVenueCategory;
  displayEn: string;
  displayEs: string;
  parent: 'cafe' | 'restaurant' | 'bar';
};

export const VENUE_CATEGORY_DEFINITIONS: Record<NormalizedVenueCategory, VenueCategoryDefinition> = {
  cafe: {
    id: 'cafe',
    displayEn: 'Cafe',
    displayEs: 'Café',
    parent: 'cafe',
  },
  specialty_cafe: {
    id: 'specialty_cafe',
    displayEn: 'Specialty Coffee',
    displayEs: 'Café de especialidad',
    parent: 'cafe',
  },
  classic_cafe: {
    id: 'classic_cafe',
    displayEn: 'Classic Cafe',
    displayEs: 'Café notable',
    parent: 'cafe',
  },
  restaurant: {
    id: 'restaurant',
    displayEn: 'Restaurant',
    displayEs: 'Restaurante',
    parent: 'restaurant',
  },
  parrilla: {
    id: 'parrilla',
    displayEn: 'Parrilla',
    displayEs: 'Parrilla',
    parent: 'restaurant',
  },
  wine_bar: {
    id: 'wine_bar',
    displayEn: 'Wine Bar',
    displayEs: 'Wine bar',
    parent: 'bar',
  },
  cocktail_bar: {
    id: 'cocktail_bar',
    displayEn: 'Cocktail Bar',
    displayEs: 'Coctelería',
    parent: 'bar',
  },
  bar: {
    id: 'bar',
    displayEn: 'Bar',
    displayEs: 'Bar',
    parent: 'bar',
  },
  bakery_cafe: {
    id: 'bakery_cafe',
    displayEn: 'Bakery Cafe',
    displayEs: 'Café y panadería',
    parent: 'cafe',
  },
  brunch: {
    id: 'brunch',
    displayEn: 'Brunch',
    displayEs: 'Brunch',
    parent: 'restaurant',
  },
  premium_restaurant: {
    id: 'premium_restaurant',
    displayEn: 'Premium Restaurant',
    displayEs: 'Restaurante premium',
    parent: 'restaurant',
  },
};

export function categoryDisplayLabel(category: NormalizedVenueCategory, locale: 'en' | 'es' = 'en') {
  const definition = VENUE_CATEGORY_DEFINITIONS[category];
  return locale === 'es' ? definition.displayEs : definition.displayEn;
}

export function isNormalizedVenueCategory(value: string): value is NormalizedVenueCategory {
  return (NORMALIZED_VENUE_CATEGORIES as readonly string[]).includes(value);
}

