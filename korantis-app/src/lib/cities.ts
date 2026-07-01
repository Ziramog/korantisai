export type CityCode = 'BUE' | 'COR' | 'NYC' | 'DXB' | 'CAT';

type CityBounds = {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
};

export type CityOption = {
  code: CityCode;
  name: string;
  aliases: string[];
  bounds: CityBounds;
};

export const CITY_OPTIONS: readonly CityOption[] = [
  {
    code: 'BUE',
    name: 'Buenos Aires',
    aliases: ['Buenos Aires', 'CABA', 'Ciudad Autonoma de Buenos Aires', 'buenos_aires'],
    bounds: { minLat: -34.8, maxLat: -34.4, minLng: -58.65, maxLng: -58.2 },
  },
  {
    code: 'COR',
    name: 'Cordoba',
    aliases: ['Cordoba', 'Cordoba Argentina', 'Cordoba Capital', 'cordoba_argentina'],
    bounds: { minLat: -31.55, maxLat: -31.25, minLng: -64.35, maxLng: -64.05 },
  },
  {
    code: 'NYC',
    name: 'New York',
    aliases: ['New York', 'New York City', 'NYC', 'new_york_city'],
    bounds: { minLat: 40.45, maxLat: 40.95, minLng: -74.3, maxLng: -73.65 },
  },
  {
    code: 'DXB',
    name: 'Dubai',
    aliases: ['Dubai'],
    bounds: { minLat: 24.75, maxLat: 25.45, minLng: 54.85, maxLng: 55.65 },
  },
  {
    code: 'CAT',
    name: 'Catamarca',
    aliases: ['Catamarca', 'Catamarca Argentina', 'San Fernando del Valle de Catamarca', 'catamarca_argentina'],
    bounds: { minLat: -28.65, maxLat: -28.25, minLng: -66.05, maxLng: -65.55 },
  },
] as const;

export const CITY_CODES = CITY_OPTIONS.map((city) => city.code);

export function cityDisplayName(code: CityCode): string {
  return CITY_OPTIONS.find((city) => city.code === code)?.name || code;
}

export function nextCityCode(code: CityCode): CityCode {
  const index = CITY_CODES.indexOf(code);
  return CITY_CODES[(index + 1) % CITY_CODES.length];
}

export function inferCityCodeFromVenue(
  venue: { city?: string | null; location?: string | null; id?: string | null; lat?: number | null; lng?: number | null },
): CityCode | null {
  const textSignals = [venue.city, venue.location, venue.id]
    .map((value) => normalizeCityName(value || ''))
    .filter(Boolean);

  for (const city of CITY_OPTIONS) {
    if (city.aliases.some((alias) => textSignals.some((signal) => signal.includes(normalizeCityName(alias))))) {
      return city.code;
    }
  }

  if (typeof venue.lat === 'number' && typeof venue.lng === 'number') {
    const city = CITY_OPTIONS.find((option) => coordinatesInsideBounds(venue.lat as number, venue.lng as number, option.bounds));
    return city?.code || null;
  }

  return null;
}

export function venueMatchesCity(
  venue: { city?: string | null; location?: string | null; id?: string | null; lat: number; lng: number },
  code: CityCode,
): boolean {
  const inferred = inferCityCodeFromVenue(venue);
  if (inferred) return inferred === code;

  const city = CITY_OPTIONS.find((option) => option.code === code);
  return Boolean(city && coordinatesInsideBounds(venue.lat, venue.lng, city.bounds));
}

function coordinatesInsideBounds(lat: number, lng: number, bounds: CityBounds): boolean {
  return lat >= bounds.minLat
    && lat <= bounds.maxLat
    && lng >= bounds.minLng
    && lng <= bounds.maxLng;
}

function normalizeCityName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}
