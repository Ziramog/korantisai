import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '..', '..', '.env.local') });
import { readFileSync, writeFileSync } from 'fs';
import type { ScoredCandidateVenue } from '../discovery/types';

const MAX_CANDIDATES = 16;
const CITY = 'Buenos Aires';
const COUNTRY = 'Argentina';
const TEXT_SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';
const DETAILS_URL = 'https://places.googleapis.com/v1/places';
const SEARCH_FIELD_MASK = [
  'places.id',
  'places.name',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.primaryType',
  'places.types',
  'places.businessStatus',
].join(',');
const DETAILS_FIELD_MASK = [
  'id',
  'name',
  'displayName',
  'formattedAddress',
  'location',
  'rating',
  'userRatingCount',
  'priceLevel',
  'primaryType',
  'types',
  'businessStatus',
  'regularOpeningHours',
  'websiteUri',
  'googleMapsUri',
  'nationalPhoneNumber',
  'internationalPhoneNumber',
  'photos',
].join(',');

type PilotCandidateFile = {
  candidates: ScoredCandidateVenue[];
};

type GoogleDisplayName = {
  text?: string;
  languageCode?: string;
};

type GoogleLocation = {
  latitude?: number;
  longitude?: number;
};

type GooglePhoto = {
  name?: string;
  widthPx?: number;
  heightPx?: number;
  authorAttributions?: Array<Record<string, unknown>>;
};

export type GooglePlace = {
  id?: string;
  name?: string;
  displayName?: GoogleDisplayName;
  formattedAddress?: string;
  location?: GoogleLocation;
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

type MatchStatus = 'matched' | 'unmatched' | 'ambiguous_match' | 'dry_run';

type MatchInfo = {
  candidate_name: string;
  google_name: string;
  district: string;
  formatted_address: string;
  match_confidence: number;
  match_reasons: string[];
  match_warnings: string[];
};

type EnrichmentRecord = {
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

type ApiState = {
  calls: number;
  errors: string[];
};

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(file, 'utf8')) as T;
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(value: string): string[] {
  return normalizeText(value).split(' ').filter((token) => token.length > 1);
}

function tokenOverlap(a: string, b: string): number {
  const aTokens = new Set(tokens(a));
  const bTokens = new Set(tokens(b));
  if (aTokens.size === 0 || bTokens.size === 0) return 0;
  const overlap = [...aTokens].filter((token) => bTokens.has(token)).length;
  return overlap / Math.max(aTokens.size, bTokens.size);
}

function categoryTerms(category: string): string[] {
  if (category === 'cafe') return ['cafe', 'coffee_shop', 'coffee', 'bakery'];
  if (category === 'restaurant') return ['restaurant', 'food'];
  if (category === 'wine_bar') return ['wine_bar', 'bar', 'restaurant', 'wine'];
  if (category === 'cocktail_bar') return ['bar', 'cocktail_bar', 'night_club'];
  return [];
}

function categoryLabel(category: string): string {
  if (category === 'cafe') return 'cafe coffee';
  if (category === 'restaurant') return 'restaurant';
  if (category === 'wine_bar') return 'wine bar';
  if (category === 'cocktail_bar') return 'cocktail bar';
  return category;
}

function scoreMatch(candidate: ScoredCandidateVenue, place: GooglePlace): MatchInfo {
  const googleName = place.displayName?.text || '';
  const address = place.formattedAddress || '';
  const placeTypes = [place.primaryType || '', ...(place.types || [])].map(normalizeText);
  const candidateName = normalizeText(candidate.venue_name);
  const normalizedGoogleName = normalizeText(googleName);
  const normalizedAddress = normalizeText(address);
  const reasons: string[] = [];
  const warnings: string[] = [];
  let confidence = 0;

  if (candidateName === normalizedGoogleName) {
    confidence += 45;
    reasons.push('exact normalized name match');
  } else if (candidateName.includes(normalizedGoogleName) || normalizedGoogleName.includes(candidateName)) {
    confidence += 38;
    reasons.push('close contained name match');
  } else {
    const overlap = tokenOverlap(candidate.venue_name, googleName);
    confidence += Math.round(overlap * 42);
    if (overlap >= 0.5) reasons.push('name token overlap');
    if (overlap < 0.35) warnings.push('name mismatch');
  }

  if (normalizedAddress.includes('buenos aires') || normalizedAddress.includes('caba')) {
    confidence += 20;
    reasons.push('same city/address contains Buenos Aires');
  } else {
    warnings.push('city not confirmed in address');
  }

  const districtOverlap = tokenOverlap(candidate.district, address);
  if (districtOverlap > 0 || normalizedAddress.includes(normalizeText(candidate.district))) {
    confidence += 15;
    reasons.push('district/address compatible');
  } else {
    warnings.push('district not confirmed in formatted address');
  }

  const expectedTerms = categoryTerms(candidate.category);
  const categoryCompatible = expectedTerms.some((term) => placeTypes.some((type) => type.includes(normalizeText(term))));
  if (categoryCompatible) {
    confidence += 15;
    reasons.push('category compatible with Google type');
  } else {
    warnings.push('category mismatch or not confirmed');
  }

  const riskyType = placeTypes.some((type) => ['lodging', 'hotel', 'store', 'shopping_mall', 'clothing_store', 'supermarket'].includes(type));
  if (riskyType) {
    confidence -= 20;
    warnings.push('hotel/retail/store type risk');
  }

  return {
    candidate_name: candidate.venue_name,
    google_name: googleName,
    district: candidate.district,
    formatted_address: address,
    match_confidence: Math.max(0, Math.min(100, Math.round(confidence))),
    match_reasons: reasons,
    match_warnings: warnings,
  };
}

function classifyMatch(scored: Array<{ place: GooglePlace; match: MatchInfo }>): MatchStatus {
  if (scored.length === 0) return 'unmatched';
  const [top, second] = scored;
  if (top.match.match_confidence < 55) return 'unmatched';
  const closeSecond = second && top.match.match_confidence - second.match.match_confidence < 10;
  if (top.match.match_confidence < 75 || closeSecond) return 'ambiguous_match';
  return 'matched';
}

async function googleFetch<T>(url: string, apiKey: string, fieldMask: string, state: ApiState, init?: RequestInit): Promise<T> {
  state.calls += 1;
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': fieldMask,
      ...(init?.headers || {}),
    },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${response.status} ${response.statusText}: ${body.slice(0, 300)}`);
  }
  return await response.json() as T;
}

async function searchPlaces(candidate: ScoredCandidateVenue, apiKey: string, state: ApiState): Promise<GooglePlace[]> {
  const query = `${candidate.venue_name} ${candidate.district} ${CITY} ${categoryLabel(candidate.category)}`;
  const response = await googleFetch<{ places?: GooglePlace[] }>(TEXT_SEARCH_URL, apiKey, SEARCH_FIELD_MASK, state, {
    method: 'POST',
    body: JSON.stringify({
      textQuery: query,
      languageCode: 'en',
      regionCode: 'AR',
      maxResultCount: 5,
    }),
  });
  return response.places || [];
}

async function fetchDetails(placeId: string, apiKey: string, state: ApiState): Promise<GooglePlace> {
  return await googleFetch<GooglePlace>(`${DETAILS_URL}/${encodeURIComponent(placeId)}`, apiKey, DETAILS_FIELD_MASK, state);
}

function outputReport(records: EnrichmentRecord[], state: ApiState, dryRun: boolean): string {
  const matched = records.filter((record) => record.status === 'matched');
  const unmatched = records.filter((record) => record.status === 'unmatched');
  const ambiguous = records.filter((record) => record.status === 'ambiguous_match');
  const withRating = records.filter((record) => typeof record.google_data?.rating === 'number');
  const withReviewCount = records.filter((record) => typeof record.google_data?.userRatingCount === 'number');
  const withPhotos = records.filter((record) => (record.google_data?.photos || []).length > 0);
  const withoutPhotos = records.filter((record) => record.status === 'matched' && (record.google_data?.photos || []).length === 0);

  return [
    '# Venue Intelligence Pilot Google Enrichment Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Scope',
    '',
    `- Input candidates: ${records.length}`,
    `- Dry run: ${dryRun ? 'yes' : 'no'}`,
    '- Google Places calls are limited to the 16 selected pilot candidates.',
    '- No database writes, publication, copy generation, or UI changes.',
    '',
    '## Summary',
    '',
    `- Matched candidates: ${matched.length}`,
    `- Unmatched candidates: ${unmatched.length}`,
    `- Ambiguous matches: ${ambiguous.length}`,
    `- Candidates with rating: ${withRating.length}`,
    `- Candidates with userRatingCount: ${withReviewCount.length}`,
    `- Candidates with photos: ${withPhotos.length}`,
    `- Candidates without photos: ${withoutPhotos.length}`,
    `- API errors: ${state.errors.length}`,
    `- Total Google calls made: ${state.calls}`,
    '',
    '## Matched Candidates',
    '',
    ...(matched.length ? matched.map((record) => `- ${record.candidate_name} -> ${record.match?.google_name} (${record.match?.match_confidence}) photos ${(record.google_data?.photos || []).length}`) : ['- None']),
    '',
    '## Ambiguous Matches',
    '',
    ...(ambiguous.length ? ambiguous.map((record) => `- ${record.candidate_name}: ${record.match?.google_name || 'none'} (${record.match?.match_confidence || 0}) warnings: ${record.match?.match_warnings.join('; ') || 'none'}`) : ['- None']),
    '',
    '## Unmatched Candidates',
    '',
    ...(unmatched.length ? unmatched.map((record) => `- ${record.candidate_name}: ${record.error || 'no confident Google match'}`) : ['- None']),
    '',
    '## API Errors',
    '',
    ...(state.errors.length ? state.errors.map((error) => `- ${error}`) : ['- None']),
  ].join('\n');
}

async function main() {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const file = readJson<PilotCandidateFile>(path.join(process.cwd(), 'data', 'venue_intelligence_pilot_candidates.json'));
  if (file.candidates.length > MAX_CANDIDATES) {
    throw new Error(`Refusing to process ${file.candidates.length} candidates. Max allowed is ${MAX_CANDIDATES}.`);
  }

  const dryRun = !apiKey;
  const state: ApiState = { calls: 0, errors: [] };
  const records: EnrichmentRecord[] = [];

  if (dryRun) {
    console.warn('GOOGLE_PLACES_API_KEY is missing. Running in dry-run mode with no Google calls.');
  } else {
    console.warn(`Controlled Google enrichment will make bounded calls for ${file.candidates.length} pilot candidates only.`);
  }

  for (const candidate of file.candidates) {
    const query = `${candidate.venue_name} ${candidate.district} ${CITY} ${categoryLabel(candidate.category)}`;
    if (dryRun || !apiKey) {
      records.push({
        candidate_id: candidate.candidate_id,
        candidate_name: candidate.venue_name,
        category: candidate.category,
        district: candidate.district,
        status: 'dry_run',
        query,
        match: null,
        search_candidates: [],
        google_place_id: null,
        google_data: null,
        error: 'missing GOOGLE_PLACES_API_KEY',
      });
      continue;
    }

    try {
      const places = await searchPlaces(candidate, apiKey, state);
      const scored = places
        .map((place) => ({ place, match: scoreMatch(candidate, place) }))
        .sort((a, b) => b.match.match_confidence - a.match.match_confidence);
      const status = classifyMatch(scored);
      const top = scored[0] || null;
      let googleData: GooglePlace | null = null;
      let googlePlaceId: string | null = top?.place.id || null;

      if (status === 'matched' && googlePlaceId) {
        googleData = await fetchDetails(googlePlaceId, apiKey, state);
        googlePlaceId = googleData.id || googlePlaceId;
      }

      records.push({
        candidate_id: candidate.candidate_id,
        candidate_name: candidate.venue_name,
        category: candidate.category,
        district: candidate.district,
        status,
        query,
        match: top?.match || null,
        search_candidates: scored.map((item) => item.match),
        google_place_id: googlePlaceId,
        google_data: googleData,
        error: null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      state.errors.push(`${candidate.venue_name}: ${message}`);
      records.push({
        candidate_id: candidate.candidate_id,
        candidate_name: candidate.venue_name,
        category: candidate.category,
        district: candidate.district,
        status: 'unmatched',
        query,
        match: null,
        search_candidates: [],
        google_place_id: null,
        google_data: null,
        error: message,
      });
    }
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    city: CITY,
    country: COUNTRY,
    dryRun,
    maxCandidates: MAX_CANDIDATES,
    googleCallsMade: state.calls,
    apiErrors: state.errors,
    records,
  };
  writeFileSync(path.join(process.cwd(), 'data', 'venue_intelligence_pilot_google_enrichment.json'), JSON.stringify(payload, null, 2));

  const report = outputReport(records, state, dryRun);
  writeFileSync(path.join(process.cwd(), 'data', 'venue_intelligence_pilot_google_enrichment_report.md'), report);
  console.log(report);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
