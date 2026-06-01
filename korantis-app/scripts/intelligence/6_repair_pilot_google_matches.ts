import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '..', '..', '.env.local') });
import { readFileSync, writeFileSync } from 'fs';
import type { ScoredCandidateVenue } from '../discovery/types';

const MAX_CANDIDATES = 16;
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

type GooglePlace = {
  id?: string;
  name?: string;
  displayName?: { text?: string; languageCode?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
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
  photos?: Array<{ name?: string; widthPx?: number; heightPx?: number; authorAttributions?: Array<Record<string, unknown>> }>;
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
  repair?: RepairInfo;
};

type EnrichmentFile = {
  generatedAt: string;
  city: string;
  country: string;
  dryRun: boolean;
  maxCandidates: number;
  googleCallsMade: number;
  apiErrors: string[];
  records: EnrichmentRecord[];
};

type RepairInfo = {
  attempted: boolean;
  before_status: MatchStatus;
  before_confidence: number | null;
  after_status: MatchStatus;
  after_confidence: number | null;
  queries: string[];
  additional_google_calls: number;
  decision_reason: string;
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

function repairQueries(candidate: ScoredCandidateVenue): string[] {
  const queries = [
    `${candidate.venue_name} ${candidate.district} Buenos Aires`,
    `${candidate.venue_name} CABA`,
  ];
  if (candidate.district.toLowerCase().includes('palermo')) queries.push(`${candidate.venue_name} Palermo Buenos Aires`);
  if (candidate.category === 'cafe') queries.push(`${candidate.venue_name} café Buenos Aires`);
  if (candidate.category === 'wine_bar') queries.push(`${candidate.venue_name} wine bar Buenos Aires`);
  if (candidate.category === 'restaurant') queries.push(`${candidate.venue_name} restaurant Buenos Aires`);
  if (candidate.category === 'cocktail_bar') queries.push(`${candidate.venue_name} cocktail bar Buenos Aires`);
  return Array.from(new Set(queries));
}

function scoreMatch(candidate: ScoredCandidateVenue, place: GooglePlace, resultCountForPlaceId: number): MatchInfo {
  const googleName = place.displayName?.text || '';
  const address = place.formattedAddress || '';
  const placeTypes = [place.primaryType || '', ...(place.types || [])].map(normalizeText);
  const candidateNames = [candidate.venue_name, candidate.canonical_name, ...candidate.aliases];
  const normalizedGoogleName = normalizeText(googleName);
  const normalizedAddress = normalizeText(address);
  const reasons: string[] = [];
  const warnings: string[] = [];
  let confidence = 0;

  const exactAlias = candidateNames.some((name) => normalizeText(name) === normalizedGoogleName);
  const nearAlias = candidateNames.some((name) => {
    const normalized = normalizeText(name);
    return normalized.includes(normalizedGoogleName) || normalizedGoogleName.includes(normalized) || tokenOverlap(name, googleName) >= 0.66;
  });

  if (exactAlias) {
    confidence += 48;
    reasons.push('exact/near exact normalized name');
    if (candidate.aliases.some((alias) => normalizeText(alias) === normalizedGoogleName)) reasons.push('known alias match');
  } else if (nearAlias) {
    confidence += 42;
    reasons.push('near exact normalized name');
  } else {
    const overlap = Math.max(...candidateNames.map((name) => tokenOverlap(name, googleName)));
    confidence += Math.round(overlap * 38);
    if (overlap >= 0.45) reasons.push('name token overlap');
    if (overlap < 0.35) warnings.push('name mismatch');
  }

  if (normalizedAddress.includes('buenos aires') || normalizedAddress.includes('caba')) {
    confidence += 22;
    reasons.push('Buenos Aires/CABA address');
  } else {
    warnings.push('city not explicit');
  }

  const districtCompatible = tokenOverlap(candidate.district, address) > 0 || normalizedAddress.includes(normalizeText(candidate.district));
  if (districtCompatible) {
    confidence += 10;
    reasons.push('district compatible');
  } else {
    warnings.push('district not explicit');
  }

  const expectedTerms = categoryTerms(candidate.category);
  const categoryCompatible = expectedTerms.some((term) => placeTypes.some((type) => type.includes(normalizeText(term))));
  if (categoryCompatible) {
    confidence += 18;
    reasons.push('category-compatible type');
    reasons.push('source category match');
  } else {
    warnings.push('category ambiguity');
  }

  if (resultCountForPlaceId > 1) warnings.push('multiple branches');
  const retailRisk = placeTypes.some((type) => ['store', 'shopping_mall', 'clothing_store', 'supermarket'].includes(type));
  const hotelRisk = placeTypes.some((type) => ['lodging', 'hotel'].includes(type));
  if (retailRisk || hotelRisk) warnings.push('retail/store type risk');
  if (hotelRisk) confidence -= 18;

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
  if (top.match.match_confidence < 62) return 'unmatched';
  const closeSecond = second && top.place.id !== second.place.id && top.match.match_confidence - second.match.match_confidence < 6;
  if (top.match.match_confidence < 76 || closeSecond || top.match.match_warnings.includes('name mismatch')) return 'ambiguous_match';
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

async function searchPlaces(query: string, apiKey: string, state: ApiState): Promise<GooglePlace[]> {
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

async function repairRecord(record: EnrichmentRecord, candidate: ScoredCandidateVenue, apiKey: string | undefined): Promise<{ record: EnrichmentRecord; calls: number; errors: string[] }> {
  const state: ApiState = { calls: 0, errors: [] };
  const queries = repairQueries(candidate);
  const beforeConfidence = record.match?.match_confidence ?? null;

  if (!apiKey) {
    return {
      record: {
        ...record,
        repair: {
          attempted: true,
          before_status: record.status,
          before_confidence: beforeConfidence,
          after_status: record.status,
          after_confidence: beforeConfidence,
          queries,
          additional_google_calls: 0,
          decision_reason: 'missing GOOGLE_PLACES_API_KEY',
        },
      },
      calls: 0,
      errors: [],
    };
  }

  try {
    const placeById = new Map<string, GooglePlace>();
    const seenByPlace = new Map<string, number>();

    for (const query of queries) {
      const places = await searchPlaces(query, apiKey, state);
      for (const place of places) {
        if (!place.id) continue;
        seenByPlace.set(place.id, (seenByPlace.get(place.id) || 0) + 1);
        placeById.set(place.id, place);
      }
    }

    const scored = [...placeById.values()]
      .map((place) => ({ place, match: scoreMatch(candidate, place, seenByPlace.get(place.id || '') || 1) }))
      .sort((a, b) => b.match.match_confidence - a.match.match_confidence);
    const afterStatus = classifyMatch(scored);
    const top = scored[0] || null;
    let repairedRecord: EnrichmentRecord = {
      ...record,
      status: afterStatus,
      match: top?.match || record.match,
      search_candidates: scored.map((item) => item.match),
      google_place_id: top?.place.id || record.google_place_id,
      error: afterStatus === 'unmatched' ? 'no confident Google match after repair' : null,
      repair: {
        attempted: true,
        before_status: record.status,
        before_confidence: beforeConfidence,
        after_status: afterStatus,
        after_confidence: top?.match.match_confidence ?? null,
        queries,
        additional_google_calls: state.calls,
        decision_reason: afterStatus === 'matched'
          ? 'repaired to confident Google match'
          : afterStatus === 'ambiguous_match'
            ? 'still ambiguous after stricter query set'
            : 'still unmatched after stricter query set',
      },
    };

    if (afterStatus === 'matched' && top?.place.id) {
      const details = await fetchDetails(top.place.id, apiKey, state);
      repairedRecord = {
        ...repairedRecord,
        google_place_id: details.id || top.place.id,
        google_data: details,
        repair: repairedRecord.repair
          ? { ...repairedRecord.repair, additional_google_calls: state.calls }
          : repairedRecord.repair,
      };
    }

    return { record: repairedRecord, calls: state.calls, errors: state.errors };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      record: {
        ...record,
        repair: {
          attempted: true,
          before_status: record.status,
          before_confidence: beforeConfidence,
          after_status: record.status,
          after_confidence: beforeConfidence,
          queries,
          additional_google_calls: state.calls,
          decision_reason: `repair failed: ${message}`,
        },
      },
      calls: state.calls,
      errors: [`${record.candidate_name}: ${message}`],
    };
  }
}

function reportFor(records: EnrichmentRecord[], additionalCalls: number, errors: string[]): string {
  const totalMatched = records.filter((record) => record.status === 'matched');
  const repaired = records.filter((record) => record.repair?.attempted && record.repair.before_status !== 'matched' && record.status === 'matched');
  const stillAmbiguous = records.filter((record) => record.repair?.attempted && record.status === 'ambiguous_match');
  const stillUnmatched = records.filter((record) => record.repair?.attempted && record.status === 'unmatched');

  return [
    '# Venue Intelligence Pilot Match Repair Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Summary',
    '',
    `- Total confident matches after repair: ${totalMatched.length}`,
    `- Newly repaired matches: ${repaired.length}`,
    `- Still ambiguous: ${stillAmbiguous.length}`,
    `- Still unmatched: ${stillUnmatched.length}`,
    `- Additional Google calls: ${additionalCalls}`,
    `- API errors: ${errors.length}`,
    '',
    '## Repaired Matches',
    '',
    ...(repaired.length ? repaired.map((record) => `- ${record.candidate_name}: ${record.repair?.before_confidence ?? 'n/a'} -> ${record.repair?.after_confidence ?? 'n/a'}; ${record.match?.google_name}; reasons: ${record.match?.match_reasons.join('; ') || 'none'}; warnings: ${record.match?.match_warnings.join('; ') || 'none'}`) : ['- None']),
    '',
    '## Still Ambiguous',
    '',
    ...(stillAmbiguous.length ? stillAmbiguous.map((record) => `- ${record.candidate_name}: ${record.repair?.before_confidence ?? 'n/a'} -> ${record.repair?.after_confidence ?? 'n/a'}; ${record.repair?.decision_reason}; warnings: ${record.match?.match_warnings.join('; ') || 'none'}`) : ['- None']),
    '',
    '## Still Unmatched',
    '',
    ...(stillUnmatched.length ? stillUnmatched.map((record) => `- ${record.candidate_name}: ${record.repair?.decision_reason}`) : ['- None']),
    '',
    '## API Errors',
    '',
    ...(errors.length ? errors.map((error) => `- ${error}`) : ['- None']),
  ].join('\n');
}

async function main() {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const candidatesFile = readJson<PilotCandidateFile>(path.join(process.cwd(), 'data', 'venue_intelligence_pilot_candidates.json'));
  if (candidatesFile.candidates.length > MAX_CANDIDATES) {
    throw new Error(`Refusing to process ${candidatesFile.candidates.length} candidates. Max allowed is ${MAX_CANDIDATES}.`);
  }

  const enrichment = readJson<EnrichmentFile>(path.join(process.cwd(), 'data', 'venue_intelligence_pilot_google_enrichment.json'));
  const candidateById = new Map(candidatesFile.candidates.map((candidate) => [candidate.candidate_id, candidate]));
  const repairedRecords: EnrichmentRecord[] = [];
  const errors: string[] = [];
  let additionalCalls = 0;

  console.warn('Controlled match repair will only process ambiguous/unmatched records from the 16-candidate pilot.');

  for (const record of enrichment.records) {
    if (record.status === 'matched') {
      repairedRecords.push(record);
      continue;
    }

    const candidate = candidateById.get(record.candidate_id);
    if (!candidate) {
      repairedRecords.push(record);
      continue;
    }

    const repaired = await repairRecord(record, candidate, apiKey);
    repairedRecords.push(repaired.record);
    additionalCalls += repaired.calls;
    errors.push(...repaired.errors);
  }

  const output = {
    ...enrichment,
    generatedAt: new Date().toISOString(),
    googleCallsMade: enrichment.googleCallsMade + additionalCalls,
    matchRepairAdditionalCalls: additionalCalls,
    apiErrors: [...enrichment.apiErrors, ...errors],
    records: repairedRecords,
  };
  writeFileSync(path.join(process.cwd(), 'data', 'venue_intelligence_pilot_google_enrichment_repaired.json'), JSON.stringify(output, null, 2));

  const report = reportFor(repairedRecords, additionalCalls, errors);
  writeFileSync(path.join(process.cwd(), 'data', 'venue_intelligence_pilot_match_repair_report.md'), report);
  console.log(report);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
