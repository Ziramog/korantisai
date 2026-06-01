import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '..', '..', '.env.local') });
import { existsSync, writeFileSync } from 'fs';
import {
  CONTROLLED_BATCH_MAX,
  type BatchCandidate,
  type BatchGoogleRecord,
  type GooglePlace,
  type MatchInfo,
  candidateAliases,
  categoryLabel,
  categoryTerms,
  normalizeText,
  readJson,
  scoreGoogleMatch,
  tokenOverlap,
} from './controlled_batch_utils';
import { clampScore } from './scoring/utils';

const TARGET_NAMES = new Set([
  'La Noire',
  'Cafe Registrado',
  'Oli Cafe',
  'Confiteria Las Violetas',
  'Aldos',
]);

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

type BatchFile = {
  candidates: BatchCandidate[];
};

type EnrichmentFile = {
  records: BatchGoogleRecord[];
};

type AliasConfig = Record<string, {
  aliases?: string[];
  preferred_addresses?: string[];
}>;

type RepairEvaluation = {
  place: GooglePlace;
  match: MatchInfo;
  before_confidence: number | null;
  after_confidence: number;
  promoted: boolean;
};

type ApiState = {
  calls: number;
  errors: string[];
};

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

function aliasConfig(): AliasConfig {
  const file = path.join(process.cwd(), 'data', 'discovery', 'venue_aliases.json');
  return existsSync(file) ? readJson<AliasConfig>(file) : {};
}

function isCabaAddress(address: string): boolean {
  const normalized = normalizeText(address);
  return normalized.includes('cdad autonoma de buenos aires') ||
    normalized.includes('ciudad autonoma de buenos aires') ||
    normalized.includes('caba') ||
    /\bc1\d{3}\b/.test(normalized);
}

function hasProvinceOrForeignRisk(address: string): boolean {
  const normalized = normalizeText(address);
  return normalized.includes('provincia de buenos aires') ||
    normalized.includes('chile') ||
    normalized.includes('uruguay');
}

function hasPreferredAddress(candidate: BatchCandidate, place: GooglePlace, aliases: AliasConfig): boolean {
  const preferred = aliases[candidate.venue_name]?.preferred_addresses || [];
  const address = normalizeText(place.formattedAddress || '');
  return preferred.some((value) => address.includes(normalizeText(value)));
}

function sourceCategoryCompatible(candidate: BatchCandidate): boolean {
  return candidate.merged_sources.some((mention) => mention.category === candidate.category);
}

function googleTypeCompatible(candidate: BatchCandidate, place: GooglePlace): boolean {
  const placeTypes = [place.primaryType || '', ...(place.types || [])].map(normalizeText);
  return categoryTerms(candidate.category).some((term) => placeTypes.some((type) => type.includes(normalizeText(term))));
}

function compact(value: string): string {
  return normalizeText(value).replace(/\s+/g, '');
}

function isExactOrNearAlias(candidate: BatchCandidate, place: GooglePlace): boolean {
  const name = place.displayName?.text || '';
  const normalizedName = normalizeText(name);
  const compactName = compact(name);
  return candidateAliases(candidate).some((alias) => {
    const normalizedAlias = normalizeText(alias);
    const compactAlias = compact(alias);
    return normalizedAlias === normalizedName ||
      normalizedAlias.includes(normalizedName) ||
      normalizedName.includes(normalizedAlias) ||
      compactAlias === compactName ||
      compactName.includes(compactAlias) ||
      tokenOverlap(alias, name) >= 0.55;
  });
}

function repairScore(candidate: BatchCandidate, place: GooglePlace, previous: BatchGoogleRecord | undefined, aliases: AliasConfig): RepairEvaluation {
  const base = scoreGoogleMatch(candidate, place);
  const warnings = new Set(base.match_warnings);
  const reasons = [...base.match_reasons];
  const caba = isCabaAddress(place.formattedAddress || '');
  const preferred = hasPreferredAddress(candidate, place, aliases);
  const nearAlias = isExactOrNearAlias(candidate, place);
  const categoryCompatible = googleTypeCompatible(candidate, place);
  const sourceCompatible = sourceCategoryCompatible(candidate);
  let confidence = base.match_confidence;

  if (caba && !base.match_reasons.includes('Buenos Aires/CABA address')) {
    confidence += 14;
    reasons.push('CABA address compatibility');
    warnings.delete('city not explicit');
  }

  if (preferred) {
    confidence += 16;
    reasons.push('preferred address match');
  }

  if (sourceCompatible) {
    confidence += 8;
    reasons.push('source category-compatible');
  }

  if (nearAlias && caba && categoryCompatible && warnings.has('district absent from formattedAddress')) {
    warnings.delete('district absent from formattedAddress');
    reasons.push('district absence ignored due strong name/CABA/category evidence');
    confidence += 4;
  }

  if (hasProvinceOrForeignRisk(place.formattedAddress || '') && !caba) {
    confidence -= 26;
    warnings.add('non-CABA address risk');
  }

  if (!categoryCompatible) warnings.add('category ambiguity');
  if (!nearAlias) warnings.add('name mismatch');

  const beforeConfidence = previous?.match?.match_confidence ?? null;
  const match = {
    ...base,
    match_confidence: clampScore(confidence),
    match_reasons: Array.from(new Set(reasons)),
    match_warnings: Array.from(warnings),
  };

  return {
    place,
    match,
    before_confidence: beforeConfidence,
    after_confidence: match.match_confidence,
    promoted: false,
  };
}

function classifyRepair(evaluations: RepairEvaluation[]): 'matched' | 'ambiguous_match' | 'unmatched' {
  if (!evaluations.length) return 'unmatched';
  const [top, second] = evaluations;
  const warnings = top.match.match_warnings;
  if (top.after_confidence < 76) return 'unmatched';
  if (warnings.includes('name mismatch') || warnings.includes('category ambiguity') || warnings.includes('non-CABA address risk')) return 'ambiguous_match';
  if (second && top.after_confidence - second.after_confidence < 8 && !top.match.match_reasons.includes('preferred address match')) return 'ambiguous_match';
  return 'matched';
}

function searchQueries(candidate: BatchCandidate, aliases: AliasConfig): string[] {
  const preferred = aliases[candidate.venue_name]?.preferred_addresses || [];
  const aliasList = [candidate.venue_name, ...(aliases[candidate.venue_name]?.aliases || [])].slice(0, 4);
  return Array.from(new Set([
    `${candidate.venue_name} Buenos Aires ${categoryLabel(candidate.category)}`,
    `${candidate.venue_name} CABA ${categoryLabel(candidate.category)}`,
    ...preferred.map((address) => `${candidate.venue_name} ${address} Buenos Aires`),
    ...aliasList.map((alias) => `${alias} Buenos Aires`),
  ]));
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

async function repairRecord(candidate: BatchCandidate, previous: BatchGoogleRecord, apiKey: string | undefined, aliases: AliasConfig, state: ApiState): Promise<BatchGoogleRecord & { repair_metadata?: Record<string, unknown> }> {
  if (!apiKey) {
    return {
      ...previous,
      error: 'missing GOOGLE_PLACES_API_KEY',
      repair_metadata: {
        attempted: true,
        dry_run: true,
        before_status: previous.status,
        after_status: previous.status,
      },
    };
  }

  const placesById = new Map<string, GooglePlace>();
  for (const query of searchQueries(candidate, aliases)) {
    try {
      for (const place of await searchPlaces(query, apiKey, state)) {
        if (place.id) placesById.set(place.id, place);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      state.errors.push(`${candidate.venue_name}: ${message}`);
    }
  }

  const evaluations = [...placesById.values()]
    .map((place) => repairScore(candidate, place, previous, aliases))
    .sort((a, b) => b.after_confidence - a.after_confidence);
  const status = classifyRepair(evaluations);
  const top = evaluations[0] || null;
  let googleData: GooglePlace | null = null;
  let googlePlaceId = top?.place.id || previous.google_place_id;

  if (status === 'matched' && googlePlaceId) {
    googleData = await fetchDetails(googlePlaceId, apiKey, state);
    googlePlaceId = googleData.id || googlePlaceId;
    if (top) top.promoted = previous.status !== 'matched';
  }

  return {
    ...previous,
    status,
    match: top?.match || previous.match,
    search_candidates: evaluations.map((item) => item.match),
    google_place_id: googlePlaceId || null,
    google_data: googleData,
    error: status === 'matched' ? null : `repair status: ${status}`,
    repair_metadata: {
      attempted: true,
      before_status: previous.status,
      after_status: status,
      before_confidence: previous.match?.match_confidence ?? null,
      after_confidence: top?.after_confidence ?? null,
      promoted: previous.status !== 'matched' && status === 'matched',
    },
  };
}

function report(original: BatchGoogleRecord[], repaired: Array<BatchGoogleRecord & { repair_metadata?: Record<string, unknown> }>, calls: number, errors: string[]): string {
  const targetRows = repaired.filter((record) => TARGET_NAMES.has(record.candidate_name));
  const originalById = new Map(original.map((record) => [record.candidate_id, record]));
  const repairedMatches = targetRows.filter((record) => originalById.get(record.candidate_id)?.status !== 'matched' && record.status === 'matched');
  const stillAmbiguous = targetRows.filter((record) => record.status === 'ambiguous_match');
  const stillUnmatched = targetRows.filter((record) => record.status === 'unmatched');

  return [
    '# Controlled Batch 30 Match Repair Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    `- Target venues: ${TARGET_NAMES.size}`,
    `- Repaired matches: ${repairedMatches.length}`,
    `- Still ambiguous: ${stillAmbiguous.length}`,
    `- Still unmatched: ${stillUnmatched.length}`,
    `- Total additional Google calls: ${calls}`,
    `- API errors: ${errors.length}`,
    '',
    '## Target Results',
    '',
    ...targetRows.map((record) => {
      const before = originalById.get(record.candidate_id);
      return `- ${record.candidate_name}: ${before?.status || 'missing'} -> ${record.status}; confidence ${before?.match?.match_confidence ?? 'n/a'} -> ${record.match?.match_confidence ?? 'n/a'}; reasons ${record.match?.match_reasons.join('; ') || 'none'}; warnings ${record.match?.match_warnings.join('; ') || 'none'}`;
    }),
    '',
    '## Repaired Matches',
    '',
    ...(repairedMatches.length ? repairedMatches.map((record) => `- ${record.candidate_name}: ${record.match?.google_name} (${record.google_place_id})`) : ['- None']),
    '',
    '## Still Ambiguous',
    '',
    ...(stillAmbiguous.length ? stillAmbiguous.map((record) => `- ${record.candidate_name}: ${record.match?.google_name || 'none'}; warnings ${record.match?.match_warnings.join('; ') || 'none'}`) : ['- None']),
    '',
    '## Still Unmatched',
    '',
    ...(stillUnmatched.length ? stillUnmatched.map((record) => `- ${record.candidate_name}: ${record.error || 'no match'}`) : ['- None']),
    '',
    '## API Errors',
    '',
    ...(errors.length ? errors.map((error) => `- ${error}`) : ['- None']),
  ].join('\n');
}

async function main() {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const batch = readJson<BatchFile>(path.join(process.cwd(), 'data', 'controlled_batch_30_candidates.json'));
  const enrichment = readJson<EnrichmentFile>(path.join(process.cwd(), 'data', 'controlled_batch_30_google_enrichment.json'));
  if (batch.candidates.length > CONTROLLED_BATCH_MAX || enrichment.records.length > CONTROLLED_BATCH_MAX) {
    throw new Error(`Refusing to process more than ${CONTROLLED_BATCH_MAX} controlled batch records.`);
  }

  const aliases = aliasConfig();
  const candidatesById = new Map(batch.candidates.map((candidate) => [candidate.candidate_id, candidate]));
  const state: ApiState = { calls: 0, errors: [] };
  const repaired: Array<BatchGoogleRecord & { repair_metadata?: Record<string, unknown> }> = [];

  console.warn(apiKey ? 'Repairing only controlled batch match failures.' : 'GOOGLE_PLACES_API_KEY missing. Repair dry-run only.');

  for (const record of enrichment.records) {
    const candidate = candidatesById.get(record.candidate_id);
    if (!candidate || !TARGET_NAMES.has(record.candidate_name)) {
      repaired.push(record);
      continue;
    }
    repaired.push(await repairRecord(candidate, record, apiKey, aliases, state));
  }

  writeFileSync(path.join(process.cwd(), 'data', 'controlled_batch_30_google_enrichment_repaired.json'), JSON.stringify({
    generatedAt: new Date().toISOString(),
    googleCallsMade: state.calls,
    apiErrors: state.errors,
    records: repaired,
  }, null, 2));

  const markdown = report(enrichment.records, repaired, state.calls, state.errors);
  writeFileSync(path.join(process.cwd(), 'data', 'controlled_batch_30_match_repair_report.md'), markdown);
  console.log(markdown);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
