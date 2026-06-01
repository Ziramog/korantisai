import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '..', '..', '.env.local') });
import { writeFileSync } from 'fs';
import {
  CONTROLLED_BATCH_MAX,
  type BatchCandidate,
  type BatchGoogleRecord,
  type GooglePlace,
  categoryLabel,
  classifyMatch,
  readJson,
  scoreGoogleMatch,
} from './controlled_batch_utils';

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

async function searchPlaces(candidate: BatchCandidate, apiKey: string, state: ApiState): Promise<GooglePlace[]> {
  const query = `${candidate.venue_name} ${candidate.district} Buenos Aires ${categoryLabel(candidate.category)}`;
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

function report(records: BatchGoogleRecord[], calls: number, errors: string[], dryRun: boolean): string {
  const matched = records.filter((record) => record.status === 'matched');
  const ambiguous = records.filter((record) => record.status === 'ambiguous_match');
  const unmatched = records.filter((record) => record.status === 'unmatched');
  const withPhotos = records.filter((record) => (record.google_data?.photos || []).length > 0);

  return [
    '# Controlled Batch 30 Google Enrichment Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    `- Dry run: ${dryRun ? 'yes' : 'no'}`,
    `- Total candidates: ${records.length}`,
    `- Matched: ${matched.length}`,
    `- Ambiguous: ${ambiguous.length}`,
    `- Unmatched: ${unmatched.length}`,
    `- With photo refs: ${withPhotos.length}`,
    `- Google calls made: ${calls}`,
    `- API errors: ${errors.length}`,
    '',
    '## Matched',
    '',
    ...(matched.length ? matched.map((record) => `- ${record.candidate_name} -> ${record.match?.google_name} (${record.match?.match_confidence}) photos ${(record.google_data?.photos || []).length}`) : ['- None']),
    '',
    '## Ambiguous',
    '',
    ...(ambiguous.length ? ambiguous.map((record) => `- ${record.candidate_name}: ${record.match?.google_name || 'none'} (${record.match?.match_confidence || 0}); warnings ${record.match?.match_warnings.join('; ') || 'none'}`) : ['- None']),
    '',
    '## Unmatched',
    '',
    ...(unmatched.length ? unmatched.map((record) => `- ${record.candidate_name}: ${record.error || 'no confident match'}`) : ['- None']),
    '',
    '## API Errors',
    '',
    ...(errors.length ? errors.map((error) => `- ${error}`) : ['- None']),
  ].join('\n');
}

async function main() {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const batch = readJson<BatchFile>(path.join(process.cwd(), 'data', 'controlled_batch_30_candidates.json'));
  if (batch.candidates.length > CONTROLLED_BATCH_MAX) throw new Error(`Refusing to process more than ${CONTROLLED_BATCH_MAX} candidates.`);
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
        .map((place) => ({ place, match: scoreGoogleMatch(candidate, place) }))
        .sort((a, b) => b.match.match_confidence - a.match.match_confidence);
      const status = classifyMatch(scored);
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

  writeFileSync(path.join(process.cwd(), 'data', 'controlled_batch_30_google_enrichment.json'), JSON.stringify({
    generatedAt: new Date().toISOString(),
    dryRun,
    googleCallsMade: state.calls,
    apiErrors: state.errors,
    records,
  }, null, 2));

  const markdown = report(records, state.calls, state.errors, dryRun);
  writeFileSync(path.join(process.cwd(), 'data', 'controlled_batch_30_google_enrichment.md'), markdown);
  writeFileSync(path.join(process.cwd(), 'data', 'controlled_batch_30_google_enrichment_report.md'), markdown);
  console.log(markdown);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
