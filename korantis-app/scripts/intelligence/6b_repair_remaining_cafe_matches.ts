import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '..', '..', '.env.local') });
import { readFileSync, writeFileSync } from 'fs';
import type { ScoredCandidateVenue } from '../discovery/types';

const TARGET_NAMES = ['Cuervo Cafe', 'LAB Tostadores de Cafe', 'Lattente'];
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

type AliasConfig = Record<string, {
  aliases: string[];
  preferred_addresses: string[];
  notes: string;
}>;

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
  repair?: Record<string, unknown>;
  cafe_repair?: CafeRepairInfo;
};

type EnrichmentFile = {
  generatedAt: string;
  city: string;
  country: string;
  dryRun: boolean;
  maxCandidates: number;
  googleCallsMade: number;
  apiErrors: string[];
  matchRepairAdditionalCalls?: number;
  records: EnrichmentRecord[];
};

type CafeRepairInfo = {
  attempted: boolean;
  before_status: MatchStatus;
  before_confidence: number | null;
  after_status: MatchStatus;
  after_confidence: number | null;
  selected_place_id: string | null;
  selected_address: string | null;
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

function categoryCompatible(place: GooglePlace): boolean {
  const types = [place.primaryType || '', ...(place.types || [])].map(normalizeText);
  return ['cafe', 'coffee_shop', 'bakery', 'food', 'store'].some((term) => types.some((type) => type.includes(term)));
}

function queriesFor(candidate: ScoredCandidateVenue, aliases: string[]): string[] {
  return Array.from(new Set([
    `${candidate.venue_name} ${candidate.district} Buenos Aires`,
    `${candidate.venue_name} CABA`,
    `${candidate.venue_name} Palermo Buenos Aires`,
    `${candidate.venue_name} café Buenos Aires`,
    ...aliases.flatMap((alias) => [
      `${alias} Buenos Aires`,
      `${alias} Palermo`,
      `${alias} CABA`,
      `${alias} cafe Buenos Aires`,
    ]),
  ]));
}

function scorePlace(candidate: ScoredCandidateVenue, place: GooglePlace, aliases: string[], preferredAddresses: string[], branchCount: number): MatchInfo {
  const googleName = place.displayName?.text || '';
  const address = place.formattedAddress || '';
  const normalizedGoogleName = normalizeText(googleName);
  const normalizedAddress = normalizeText(address);
  const allNames = [candidate.venue_name, candidate.canonical_name, ...candidate.aliases, ...aliases];
  const reasons: string[] = [];
  const warnings: string[] = [];
  let confidence = 0;

  const exact = allNames.some((name) => normalizeText(name) === normalizedGoogleName);
  const near = allNames.some((name) => {
    const normalized = normalizeText(name);
    return normalized.includes(normalizedGoogleName) || normalizedGoogleName.includes(normalized) || tokenOverlap(name, googleName) >= 0.62;
  });
  const bestOverlap = Math.max(...allNames.map((name) => tokenOverlap(name, googleName)));

  if (exact) {
    confidence += 48;
    reasons.push('exact accent-insensitive alias match');
  } else if (near) {
    confidence += 42;
    reasons.push('near exact normalized alias match');
  } else {
    confidence += Math.round(bestOverlap * 40);
    if (bestOverlap < 0.35) warnings.push('name mismatch');
  }

  if (normalizedAddress.includes('buenos aires') || normalizedAddress.includes('caba') || normalizedAddress.includes('cdad autonoma')) {
    confidence += 22;
    reasons.push('Buenos Aires/CABA address compatibility');
  } else {
    warnings.push('city not explicit');
  }

  if (categoryCompatible(place)) {
    confidence += 18;
    reasons.push('Google type compatibility');
    reasons.push('source category compatibility');
  } else {
    warnings.push('category ambiguity');
  }

  const preferredAddress = preferredAddresses.find((preferred) => normalizedAddress.includes(normalizeText(preferred)));
  if (preferredAddress) {
    confidence += 12;
    reasons.push(`preferred branch/address match: ${preferredAddress}`);
  }

  if (!normalizedAddress.includes(normalizeText(candidate.district))) warnings.push('district absent from formattedAddress');
  if (branchCount > 1) warnings.push('multiple branches');

  const types = [place.primaryType || '', ...(place.types || [])].map(normalizeText);
  if (types.some((type) => ['store', 'bakery'].includes(type))) warnings.push('retail/store type risk');

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

function classify(scored: Array<{ place: GooglePlace; match: MatchInfo }>): MatchStatus {
  if (scored.length === 0) return 'unmatched';
  const [top, second] = scored;
  if (top.match.match_confidence < 70) return 'unmatched';
  const closeSecond = second && top.place.id !== second.place.id && top.match.match_confidence - second.match.match_confidence < 8;
  if (closeSecond && !top.match.match_reasons.some((reason) => reason.startsWith('preferred branch/address match'))) return 'ambiguous_match';
  if (top.match.match_warnings.includes('name mismatch')) return 'ambiguous_match';
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

async function repairCafe(record: EnrichmentRecord, candidate: ScoredCandidateVenue, config: AliasConfig, apiKey: string | undefined): Promise<{ record: EnrichmentRecord; calls: number; errors: string[] }> {
  const state: ApiState = { calls: 0, errors: [] };
  const aliasEntry = config[candidate.venue_name] || { aliases: [], preferred_addresses: [], notes: '' };
  const queries = queriesFor(candidate, aliasEntry.aliases);
  const beforeConfidence = record.match?.match_confidence ?? null;

  if (!apiKey) {
    return {
      record: {
        ...record,
        cafe_repair: {
          attempted: true,
          before_status: record.status,
          before_confidence: beforeConfidence,
          after_status: record.status,
          after_confidence: beforeConfidence,
          selected_place_id: record.google_place_id,
          selected_address: record.match?.formatted_address || null,
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
    const branchCount = new Map<string, number>();
    for (const query of queries) {
      const places = await searchPlaces(query, apiKey, state);
      for (const place of places) {
        if (!place.id) continue;
        placeById.set(place.id, place);
        branchCount.set(normalizeText(place.displayName?.text || ''), (branchCount.get(normalizeText(place.displayName?.text || '')) || 0) + 1);
      }
    }

    const scored = [...placeById.values()]
      .map((place) => ({ place, match: scorePlace(candidate, place, aliasEntry.aliases, aliasEntry.preferred_addresses, branchCount.get(normalizeText(place.displayName?.text || '')) || 1) }))
      .sort((a, b) => b.match.match_confidence - a.match.match_confidence);
    const status = classify(scored);
    const top = scored[0] || null;
    let googleData: GooglePlace | null = null;
    let placeId = top?.place.id || null;

    if (status === 'matched' && placeId) {
      googleData = await fetchDetails(placeId, apiKey, state);
      placeId = googleData.id || placeId;
    }

    return {
      record: {
        ...record,
        status,
        match: top?.match || record.match,
        search_candidates: scored.map((item) => item.match),
        google_place_id: placeId || record.google_place_id,
        google_data: googleData || record.google_data,
        error: status === 'unmatched' ? 'no confident cafe match after alias repair' : null,
        cafe_repair: {
          attempted: true,
          before_status: record.status,
          before_confidence: beforeConfidence,
          after_status: status,
          after_confidence: top?.match.match_confidence ?? null,
          selected_place_id: placeId,
          selected_address: top?.match.formatted_address || null,
          queries,
          additional_google_calls: state.calls,
          decision_reason: status === 'matched'
            ? 'matched through cafe alias repair'
            : status === 'ambiguous_match'
              ? 'still ambiguous after cafe alias repair'
              : 'still unmatched after cafe alias repair',
        },
      },
      calls: state.calls,
      errors: state.errors,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      record: {
        ...record,
        cafe_repair: {
          attempted: true,
          before_status: record.status,
          before_confidence: beforeConfidence,
          after_status: record.status,
          after_confidence: beforeConfidence,
          selected_place_id: record.google_place_id,
          selected_address: record.match?.formatted_address || null,
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

function report(records: EnrichmentRecord[], calls: number, errors: string[]): string {
  const targetRecords = records.filter((record) => TARGET_NAMES.includes(record.candidate_name));
  const repaired = targetRecords.filter((record) => record.cafe_repair?.before_status !== 'matched' && record.status === 'matched');
  const stillAmbiguous = targetRecords.filter((record) => record.status === 'ambiguous_match');
  const stillUnmatched = targetRecords.filter((record) => record.status === 'unmatched');

  return [
    '# Venue Intelligence Cafe Match Repair Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Summary',
    '',
    `- Target cafes: ${TARGET_NAMES.length}`,
    `- Newly confident cafe matches: ${repaired.length}`,
    `- Still ambiguous: ${stillAmbiguous.length}`,
    `- Still unmatched: ${stillUnmatched.length}`,
    `- Additional Google calls: ${calls}`,
    `- API errors: ${errors.length}`,
    '',
    '## Cafe Decisions',
    '',
    ...targetRecords.map((record) => `- ${record.candidate_name}: ${record.cafe_repair?.before_status || 'n/a'} ${record.cafe_repair?.before_confidence ?? 'n/a'} -> ${record.status} ${record.cafe_repair?.after_confidence ?? record.match?.match_confidence ?? 'n/a'}; ${record.match?.google_name || 'none'}; address: ${record.match?.formatted_address || 'none'}; reasons: ${record.match?.match_reasons.join('; ') || 'none'}; warnings: ${record.match?.match_warnings.join('; ') || 'none'}`),
    '',
    '## API Errors',
    '',
    ...(errors.length ? errors.map((error) => `- ${error}`) : ['- None']),
  ].join('\n');
}

async function main() {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const candidates = readJson<PilotCandidateFile>(path.join(process.cwd(), 'data', 'venue_intelligence_pilot_candidates.json')).candidates;
  const aliases = readJson<AliasConfig>(path.join(process.cwd(), 'data', 'discovery', 'venue_aliases.json'));
  const enrichment = readJson<EnrichmentFile>(path.join(process.cwd(), 'data', 'venue_intelligence_pilot_google_enrichment_repaired.json'));
  const candidateByName = new Map(candidates.map((candidate) => [candidate.venue_name, candidate]));
  const outputRecords: EnrichmentRecord[] = [];
  const errors: string[] = [];
  let calls = 0;

  console.warn('Controlled cafe match repair will process only Cuervo Cafe, LAB Tostadores de Cafe, and Lattente.');

  for (const record of enrichment.records) {
    if (!TARGET_NAMES.includes(record.candidate_name)) {
      outputRecords.push(record);
      continue;
    }

    const candidate = candidateByName.get(record.candidate_name);
    if (!candidate) {
      outputRecords.push(record);
      continue;
    }

    const repaired = await repairCafe(record, candidate, aliases, apiKey);
    outputRecords.push(repaired.record);
    calls += repaired.calls;
    errors.push(...repaired.errors);
  }

  const output: EnrichmentFile = {
    ...enrichment,
    generatedAt: new Date().toISOString(),
    googleCallsMade: enrichment.googleCallsMade + calls,
    apiErrors: [...enrichment.apiErrors, ...errors],
    records: outputRecords,
  };
  writeFileSync(path.join(process.cwd(), 'data', 'venue_intelligence_google_enrichment_final_pilot.json'), JSON.stringify(output, null, 2));

  const markdown = report(outputRecords, calls, errors);
  writeFileSync(path.join(process.cwd(), 'data', 'venue_intelligence_cafe_match_repair_report.md'), markdown);
  console.log(markdown);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
