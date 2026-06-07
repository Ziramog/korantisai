import type { VenueInput, VenueRaw, VenueType } from '../types';

const GOOGLE_PLACES_TEXT_SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';

const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.googleMapsUri',
  'places.types',
  'places.primaryType',
  'places.rating',
  'places.userRatingCount',
  'places.priceLevel',
  'places.regularOpeningHours',
  'places.photos',
  'places.websiteUri',
  'places.nationalPhoneNumber',
  'places.internationalPhoneNumber',
  'places.businessStatus',
].join(',');

type OperationalStatus = VenueRaw['operational_status'];

interface GooglePlaceDisplayName {
  text?: string;
  languageCode?: string;
}

interface GooglePlaceLocation {
  latitude?: number;
  longitude?: number;
}

interface GoogleOpeningHours {
  weekdayDescriptions?: string[];
}

interface GooglePlacePhoto {
  name?: string;
  widthPx?: number;
  heightPx?: number;
  authorAttributions?: Array<{
    displayName?: string;
    uri?: string;
    photoUri?: string;
  }>;
}

interface GooglePlace {
  id?: string;
  displayName?: GooglePlaceDisplayName;
  formattedAddress?: string;
  location?: GooglePlaceLocation;
  googleMapsUri?: string;
  types?: string[];
  primaryType?: string;
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  regularOpeningHours?: GoogleOpeningHours;
  photos?: GooglePlacePhoto[];
  websiteUri?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  businessStatus?: string;
}

interface GooglePlacesError {
  code?: number;
  message?: string;
  status?: string;
}

interface GooglePlacesSearchResponse {
  places?: GooglePlace[];
  error?: GooglePlacesError;
}

export interface GooglePlacesLookupOptions {
  apiKey?: string;
  city: string;
  languageCode?: string;
  regionCode?: string;
}

export interface GooglePlacesLookupResult {
  venue: VenueRaw;
  found: boolean;
  missing_fields: string[];
  warnings: string[];
  error?: string;
}

export interface GooglePlacesTextCandidate {
  place_id?: string;
  name: string;
  address?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  google_maps_url?: string;
  google_place_types: string[];
  primary_type?: string;
  rating?: number;
  user_ratings_total?: number;
  website_url?: string;
  phone?: string;
  business_status?: string;
  photos: Array<{
    reference?: string;
    width?: number;
    height?: number;
  }>;
  raw_google_place: Record<string, unknown>;
}

export async function findBestGooglePlace(
  input: VenueInput,
  options: GooglePlacesLookupOptions,
): Promise<GooglePlacesLookupResult> {
  const base = buildBaseVenueRaw(input, options.city);
  const apiKey = options.apiKey?.trim();

  if (!apiKey) {
    return buildFailure(base, 'missing GOOGLE_PLACES_API_KEY', ['google_places_api_key_missing']);
  }

  const textQuery = buildTextQuery(input, options.city);
  const body = {
    textQuery,
    languageCode: options.languageCode || 'en',
    regionCode: options.regionCode || 'AR',
    maxResultCount: 3,
  };

  let response: Response;
  try {
    response = await fetch(GOOGLE_PLACES_TEXT_SEARCH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': FIELD_MASK,
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    return buildFailure(base, `google_places_request_failed: ${formatUnknownError(error)}`, [
      'google_places_request_failed',
    ]);
  }

  const parsed = await parsePlacesResponse(response);
  if (!response.ok) {
    const message = parsed.error?.message || `HTTP ${response.status}`;
    return buildFailure(base, `google_places_http_${response.status}: ${message}`, [
      `google_places_http_${response.status}`,
    ]);
  }

  const candidates = parsed.places || [];
  const place = candidates[0];
  if (!place) {
    return buildFailure(base, `no Google Places match for query "${textQuery}"`, ['google_places_no_match']);
  }

  const venue = mapPlaceToVenueRaw(input, options.city, place, textQuery, candidates.length);
  const missingFields = getMissingFields(venue);
  const warnings = buildWarnings(venue, missingFields);
  venue.extraction_warnings = warnings;

  return {
    venue,
    found: true,
    missing_fields: missingFields,
    warnings,
  };
}

export async function searchGooglePlacesText(
  textQuery: string,
  options: GooglePlacesLookupOptions & { maxResultCount?: number },
): Promise<{ candidates: GooglePlacesTextCandidate[]; error?: string }> {
  const apiKey = options.apiKey?.trim();
  if (!apiKey) return { candidates: [], error: 'missing GOOGLE_PLACES_API_KEY' };

  const body = {
    textQuery,
    languageCode: options.languageCode || 'en',
    regionCode: options.regionCode || 'AR',
    maxResultCount: Math.min(Math.max(options.maxResultCount || 10, 1), 20),
  };

  let response: Response;
  try {
    response = await fetch(GOOGLE_PLACES_TEXT_SEARCH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': FIELD_MASK,
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    return { candidates: [], error: `google_places_request_failed: ${formatUnknownError(error)}` };
  }

  const parsed = await parsePlacesResponse(response);
  if (!response.ok) {
    return { candidates: [], error: parsed.error?.message || `google_places_http_${response.status}` };
  }

  return {
    candidates: (parsed.places || []).map((place) => mapPlaceToTextCandidate(place)),
  };
}

export function buildBaseVenueRaw(input: VenueInput, city: string): VenueRaw {
  return {
    input,
    name: input.name,
    city,
    address: input.address,
    neighborhood: input.neighborhood,
    type: input.type,
    coordinates: input.coordinates,
    google_maps_url: input.google_maps_url,
    operational_status: 'unknown',
    raw_reviews: [],
  };
}

function mapPlaceToTextCandidate(place: GooglePlace): GooglePlacesTextCandidate {
  return {
    place_id: place.id,
    name: place.displayName?.text || '',
    address: place.formattedAddress,
    coordinates:
      typeof place.location?.latitude === 'number' && typeof place.location.longitude === 'number'
        ? {
            lat: place.location.latitude,
            lng: place.location.longitude,
          }
        : undefined,
    google_maps_url: place.googleMapsUri,
    google_place_types: place.types || [],
    primary_type: place.primaryType,
    rating: place.rating,
    user_ratings_total: place.userRatingCount,
    website_url: place.websiteUri,
    phone: place.internationalPhoneNumber || place.nationalPhoneNumber,
    business_status: place.businessStatus,
    photos: (place.photos || []).map((photo) => ({
      reference: photo.name,
      width: photo.widthPx,
      height: photo.heightPx,
    })),
    raw_google_place: { place },
  };
}

function mapPlaceToVenueRaw(
  input: VenueInput,
  city: string,
  place: GooglePlace,
  textQuery: string,
  candidateCount: number,
): VenueRaw {
  const types = place.types || [];
  const name = place.displayName?.text || input.name;
  const hours = place.regularOpeningHours?.weekdayDescriptions?.join('; ');
  const phone = place.internationalPhoneNumber || place.nationalPhoneNumber;
  const operationalStatus = mapBusinessStatus(place.businessStatus);

  return {
    input,
    name,
    city,
    place_id: place.id,
    address: place.formattedAddress || input.address,
    neighborhood: input.neighborhood,
    type: inferVenueType(types, place.primaryType, input.type),
    coordinates:
      typeof place.location?.latitude === 'number' && typeof place.location.longitude === 'number'
        ? {
            lat: place.location.latitude,
            lng: place.location.longitude,
          }
        : input.coordinates,
    google_maps_url: place.googleMapsUri || input.google_maps_url,
    google_place_types: types,
    website_url: place.websiteUri,
    hours,
    price_hint: place.priceLevel,
    rating: place.rating,
    user_ratings_total: place.userRatingCount,
    price_level: mapPriceLevel(place.priceLevel),
    phone,
    business_status: place.businessStatus,
    operational_status: operationalStatus,
    extraction_confidence: computeMatchConfidence(input, city, name, place.formattedAddress, types),
    extraction_warnings: [],
    raw_google_place: {
      query: textQuery,
      candidate_count: candidateCount,
      place,
    },
    raw_reviews: [],
  };
}

function buildFailure(base: VenueRaw, error: string, warnings: string[]): GooglePlacesLookupResult {
  return {
    venue: {
      ...base,
      extraction_error: error,
      extraction_warnings: warnings,
    },
    found: false,
    missing_fields: getMissingFields(base),
    warnings,
    error,
  };
}

function buildTextQuery(input: VenueInput, city: string): string {
  return [input.name, input.neighborhood, input.address, city].filter(Boolean).join(' ');
}

async function parsePlacesResponse(response: Response): Promise<GooglePlacesSearchResponse> {
  const text = await response.text();
  if (!text.trim()) return {};

  try {
    const parsed = JSON.parse(text) as unknown;
    if (isRecord(parsed)) {
      return parsed as GooglePlacesSearchResponse;
    }
  } catch {
    return {
      error: {
        message: text.slice(0, 500),
      },
    };
  }

  return {};
}

function inferVenueType(types: string[], primaryType?: string, fallback?: VenueType): VenueType {
  const allTypes = new Set([primaryType, ...types].filter(Boolean));
  if (allTypes.has('cocktail_bar')) return 'cocktail_bar';
  if (allTypes.has('bar')) return 'bar';
  if (allTypes.has('wine_bar')) return 'wine_bar';
  if (allTypes.has('cafe')) return 'cafe';
  if (allTypes.has('coffee_shop')) return 'coffee_shop';
  if (allTypes.has('fine_dining_restaurant')) return 'fine_dining';
  if (allTypes.has('restaurant')) return 'restaurant';
  return fallback || 'unknown';
}

function mapBusinessStatus(status?: string): OperationalStatus {
  if (status === 'OPERATIONAL') return 'operational';
  if (status === 'CLOSED_TEMPORARILY') return 'temporarily_closed';
  if (status === 'CLOSED_PERMANENTLY') return 'closed';
  return 'unknown';
}

function mapPriceLevel(priceLevel?: string): number | undefined {
  const levels: Record<string, number> = {
    PRICE_LEVEL_FREE: 0,
    PRICE_LEVEL_INEXPENSIVE: 1,
    PRICE_LEVEL_MODERATE: 2,
    PRICE_LEVEL_EXPENSIVE: 3,
    PRICE_LEVEL_VERY_EXPENSIVE: 4,
  };
  return priceLevel ? levels[priceLevel] : undefined;
}

function computeMatchConfidence(
  input: VenueInput,
  city: string,
  matchedName: string,
  address?: string,
  types?: string[],
): number {
  const inputName = normalizeText(input.name);
  const candidateName = normalizeText(matchedName);
  const normalizedAddress = normalizeText(address || '');
  let score = 0.25;

  if (candidateName === inputName) score += 0.45;
  else if (candidateName.includes(inputName) || inputName.includes(candidateName)) score += 0.3;

  if (input.neighborhood && normalizedAddress.includes(normalizeText(input.neighborhood))) score += 0.1;
  if (normalizedAddress.includes(normalizeText(city))) score += 0.1;
  if (types && types.length > 0) score += 0.05;
  if (address) score += 0.05;

  return Math.min(1, Number(score.toFixed(2)));
}

function getMissingFields(venue: VenueRaw): string[] {
  const missing: string[] = [];
  if (!venue.place_id) missing.push('place_id');
  if (!venue.address) missing.push('address');
  if (!venue.coordinates) missing.push('coordinates');
  if (!venue.google_maps_url) missing.push('google_maps_url');
  if (!venue.type || venue.type === 'unknown') missing.push('type');
  if (typeof venue.rating !== 'number') missing.push('rating');
  if (typeof venue.user_ratings_total !== 'number') missing.push('user_ratings_total');
  if (!venue.website_url) missing.push('website_url');
  if (!venue.hours) missing.push('hours');
  return missing;
}

function buildWarnings(venue: VenueRaw, missingFields: string[]): string[] {
  const warnings = missingFields.map((field) => `missing_${field}`);
  if ((venue.extraction_confidence || 0) < 0.65) warnings.push('low_match_confidence');
  if (venue.operational_status !== 'operational') warnings.push(`business_status_${venue.business_status || 'unknown'}`);
  return warnings;
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function formatUnknownError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
