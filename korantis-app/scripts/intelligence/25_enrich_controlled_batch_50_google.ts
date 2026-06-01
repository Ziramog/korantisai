import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '..', '..', '.env.local') });
import { writeFileSync } from 'fs';
import {
  type BatchCandidate,
  type BatchGoogleRecord,
  type GooglePlace,
  type MatchInfo,
  categoryLabel,
  categoryTerms,
  candidateAliases,
  normalizeText,
  readJson,
  scoreGoogleMatch,
  tokenOverlap,
} from './controlled_batch_utils';
import { clampScore } from './scoring/utils';

const MAX_CANDIDATES = 50;
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

type ApiState = {
  calls: number;
  errors: string[];
};

type ScoredPlace = {
  place: GooglePlace;
  match: MatchInfo;
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

function isCabaAddress(address: string): boolean {
  const normalized = normalizeText(address);
  return normalized.includes('cdad autonoma de buenos aires') ||
    normalized.includes('ciudad autonoma de buenos aires') ||
    normalized.includes('caba') ||
    /\bc1\d{3}\b/.test(normalized);
}

function nonCabaRisk(address: string): boolean {
  const normalized = normalizeText(address);
  return normalized.includes('provincia de buenos aires') ||
    normalized.includes('chile') ||
    normalized.includes('uruguay');
}

function googleTypeCompatible(candidate: BatchCandidate, place: GooglePlace): boolean {
  const placeTypes = [place.primaryType || '', ...(place.types || [])].map(normalizeText);
  return categoryTerms(candidate.category).some((term) => placeTypes.some((type) => type.includes(normalizeText(term))));
}

function exactOrNearAlias(candidate: BatchCandidate, place: GooglePlace): boolean {
  const googleName = place.displayName?.text || '';
  const compact = (value: string) => normalizeText(value).replace(/\s+/g, '');
  return candidateAliases(candidate).some((alias) => {
    const aliasNorm = normalizeText(alias);
    const googleNorm = normalizeText(googleName);
    return aliasNorm === googleNorm ||
      aliasNorm.includes(googleNorm) ||
      googleNorm.includes(aliasNorm) ||
      compact(alias).includes(compact(googleName)) ||
      compact(googleName).includes(compact(alias)) ||
      tokenOverlap(alias, googleName) >= 0.55;
  });
}

function scoreControlledMatch(candidate: BatchCandidate, place: GooglePlace): MatchInfo {
  const base = scoreGoogleMatch(candidate, place);
  const warnings = new Set(base.match_warnings);
  const reasons = [...base.match_reasons];
  const caba = isCabaAddress(place.formattedAddress || '');
  const aliasStrong = exactOrNearAlias(candidate, place);
  const typeCompatible = googleTypeCompatible(candidate, place);
  let confidence = base.match_confidence;

  if (caba && !base.match_reasons.includes('Buenos Aires/CABA address')) {
    confidence += 14;
    reasons.push('CABA address compatibility');
    warnings.delete('city not explicit');
  }

  if (candidate.merged_sources.some((mention) => mention.category === candidate.category)) {
    confidence += 8;
    reasons.push('source category-compatible');
  }

  if (aliasStrong && caba && typeCompatible && warnings.has('district absent from formattedAddress')) {
    warnings.delete('district absent from formattedAddress');
    reasons.push('district absence ignored due strong name/CABA/category evidence');
    confidence += 4;
  }

  if (nonCabaRisk(place.formattedAddress || '') && !caba) {
    confidence -= 26;
    warnings.add('non-CABA address risk');
  }

  if (!typeCompatible) warnings.add('category ambiguity');
  if (!aliasStrong) warnings.add('name mismatch');

  return {
    ...base,
    match_confidence: clampScore(confidence),
    match_reasons: Array.from(new Set(reasons)),
    match_warnings: Array.from(warnings),
  };
}

function classify(scored: ScoredPlace[]): BatchGoogleRecord['status'] {
  if (!scored.length) return 'unmatched';
  const [top, second] = scored;
  if (top.match.match_confidence < 76) return 'unmatched';
  if (top.match.match_warnings.some((warning) => ['name mismatch', 'category ambiguity', 'non-CABA address risk'].includes(warning))) return 'ambiguous_match';
  if (top.match.match_confidence >= 94 && top.match.match_warnings.length === 0) return 'matched';
  if (second && top.place.id !== second.place.id && top.match.match_confidence - second.match.match_confidence < 8) return 'ambiguous_match';
  return 'matched';
}

async function searchPlaces(candidate: BatchCandidate, apiKey: string, state: ApiState): Promise<GooglePlace[]> {
  const queries = [
    `${candidate.venue_name} ${candidate.district} Buenos Aires ${categoryLabel(candidate.category)}`,
    `${candidate.venue_name} Buenos Aires ${categoryLabel(candidate.category)}`,
  ];
  const byId = new Map<string, GooglePlace>();
  for (const query of queries) {
    const response = await googleFetch<{ places?: GooglePlace[] }>(TEXT_SEARCH_URL, apiKey, SEARCH_FIELD_MASK, state, {
      method: 'POST',
      body: JSON.stringify({
        textQuery: query,
        languageCode: 'en',
        regionCode: 'AR',
        maxResultCount: 5,
      }),
    });
    for (const place of response.places || []) {
      if (place.id) byId.set(place.id, place);
    }
  }
  return [...byId.values()];
}

async function fetchDetails(placeId: string, apiKey: string, state: ApiState): Promise<GooglePlace> {
  return await googleFetch<GooglePlace>(`${DETAILS_URL}/${encodeURIComponent(placeId)}`, apiKey, DETAILS_FIELD_MASK, state);
}

function report(records: BatchGoogleRecord[], calls: number, errors: string[], dryRun: boolean): string {
  const matched = records.filter((record) => record.status === 'matched');
  const ambiguous = records.filter((record) => record.status === 'ambiguous_match');
  const unmatched = records.filter((record) => record.status === 'unmatched');
  const withPhotos = matched.filter((record) => (record.google_data?.photos || []).length > 0);

  return [
    '# Controlled Batch 50 Google Enrichment Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    `- Dry run: ${dryRun ? 'yes' : 'no'}`,
    `- Total candidates: ${records.length}`,
    `- Matched: ${matched.length}`,
    `- Ambiguous: ${ambiguous.length}`,
    `- Unmatched: ${unmatched.length}`,
    `- Matched with photo refs: ${withPhotos.length}`,
    `- Google calls made: ${calls}`,
    `- API errors: ${errors.length}`,
    '',
    '## Matching Failures',
    '',
    ...[...ambiguous, ...unmatched].map((record) => `- ${record.candidate_name}: ${record.status}; confidence ${record.match?.match_confidence ?? 'n/a'}; warnings ${record.match?.match_warnings.join('; ') || record.error || 'none'}`),
    ...([ambiguous, unmatched].flat().length ? [] : ['- None']),
    '',
    '## Matched',
    '',
    ...matched.map((record) => `- ${record.candidate_name} -> ${record.match?.google_name} (${record.match?.match_confidence}) photos ${(record.google_data?.photos || []).length}`),
    '',
    '## API Errors',
    '',
    ...(errors.length ? errors.map((error) => `- ${error}`) : ['- None']),
  ].join('\n');
}

async function main() {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const batch = readJson<BatchFile>(path.join(process.cwd(), 'data', 'controlled_batch_50_candidates.json'));
  if (batch.candidates.length > MAX_CANDIDATES) throw new Error(`Refusing to process ${batch.candidates.length}; max is ${MAX_CANDIDATES}.`);

  const dryRun = !apiKey;
  const state: ApiState = { calls: 0, errors: [] };
  const records: BatchGoogleRecord[] = [];
  console.warn(dryRun ? 'GOOGLE_PLACES_API_KEY missing. Running dry-run.' : `Controlled Google enrichment for ${batch.candidates.length} candidates only.`);

  for (const candidate of batch.candidates) {
    const query = `${candidate.venue_name} ${candidate.district} Buenos Aires ${categoryLabel(candidate.category)}`;
    if (!apiKey) {
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
        .map((place) => ({ place, match: scoreControlledMatch(candidate, place) }))
        .sort((a, b) => b.match.match_confidence - a.match.match_confidence);
      const status = classify(scored);
      const top = scored[0] || null;
      let googleData: GooglePlace | null = null;
      let googlePlaceId = top?.place.id || null;
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
        error: status === 'unmatched' ? 'no confident match' : null,
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

  writeFileSync(path.join(process.cwd(), 'data', 'controlled_batch_50_google_enrichment.json'), JSON.stringify({
    generatedAt: new Date().toISOString(),
    dryRun,
    googleCallsMade: state.calls,
    apiErrors: state.errors,
    records,
  }, null, 2));

  const markdown = report(records, state.calls, state.errors, dryRun);
  writeFileSync(path.join(process.cwd(), 'data', 'controlled_batch_50_google_enrichment_report.md'), markdown);
  console.log(markdown);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
