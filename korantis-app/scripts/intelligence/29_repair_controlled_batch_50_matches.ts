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

const MANUAL_HINTS: Record<string, { aliases: string[]; preferred_addresses?: string[]; reject_names?: string[] }> = {
  'L Harmonie': { aliases: ['L Harmonie', 'Lharmonie', "L'Harmonie"], preferred_addresses: ['Av. del Libertador 3118'] },
  'Maleza Cafe': { aliases: ['Maleza Cafe', 'Maleza Café', 'Maleza'], reject_names: ['Amelia Café de Especialidad', 'MELAZA'] },
  'Moshu Las Canitas': { aliases: ['Moshu Las Canitas', 'Moshu Cafe', 'Moshu Café', 'Moshu'], preferred_addresses: ['Moldes 3802'] },
  'Apu Nena': { aliases: ['Apu Nena', 'ApuNena'], preferred_addresses: ['Aguirre 1600'] },
  'Narda Lepes Mercado': { aliases: ['Narda Lepes Mercado', 'Narda todo rico'], preferred_addresses: ['Av. del Libertador 4168'], reject_names: ['Restaurante Narda Comedor'] },
  'Vina de San Telmo': { aliases: ['Vina de San Telmo', 'Viña de San Telmo', 'La Viña de San Telmo'], reject_names: ['Tierra Mendocina Wine Bar', 'Lilith Vino', 'Ray Wine Bar'] },
  'Aldo Vinoteca Recoleta': { aliases: ['Aldo Vinoteca Recoleta', "Aldo's Vinoteca Recoleta", 'Aldo Vinoteca'], reject_names: ['Alpataco', 'La Vinoteca de Don Aldo'] },
  'Finde': { aliases: ['Finde', 'Finde Wine Bar', 'Finde Vinos'], reject_names: ['HELKA Wine Bar', 'Lucrecia vinos', 'Pentos Colegiales', 'La Parra Club Vinoteca', 'Verdot Wine Bar'] },
};

type BatchFile = { candidates: BatchCandidate[] };
type EnrichmentFile = { records: BatchGoogleRecord[] };
type ApiState = { calls: number; errors: string[] };
type RepairEvaluation = { place: GooglePlace; match: MatchInfo; before_confidence: number | null; after_confidence: number; promoted: boolean };

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
    normalized.includes('rio negro') ||
    normalized.includes('mexico') ||
    normalized.includes('chile') ||
    normalized.includes('uruguay');
}

function allAliases(candidate: BatchCandidate): string[] {
  return Array.from(new Set([
    ...candidateAliases(candidate),
    ...(MANUAL_HINTS[candidate.venue_name]?.aliases || []),
  ]));
}

function exactOrNearAlias(candidate: BatchCandidate, place: GooglePlace): boolean {
  const googleName = place.displayName?.text || '';
  const compact = (value: string) => normalizeText(value).replace(/\s+/g, '');
  return allAliases(candidate).some((alias) => {
    const aliasNorm = normalizeText(alias);
    const googleNorm = normalizeText(googleName);
    return aliasNorm === googleNorm ||
      aliasNorm.includes(googleNorm) ||
      googleNorm.includes(aliasNorm) ||
      compact(alias) === compact(googleName) ||
      compact(alias).includes(compact(googleName)) ||
      compact(googleName).includes(compact(alias)) ||
      tokenOverlap(alias, googleName) >= 0.55;
  });
}

function hasPreferredAddress(candidate: BatchCandidate, place: GooglePlace): boolean {
  const address = normalizeText(place.formattedAddress || '');
  return (MANUAL_HINTS[candidate.venue_name]?.preferred_addresses || []).some((hint) => address.includes(normalizeText(hint)));
}

function googleTypeCompatible(candidate: BatchCandidate, place: GooglePlace): boolean {
  const types = [place.primaryType || '', ...(place.types || [])].map(normalizeText);
  return categoryTerms(candidate.category).some((term) => types.some((type) => type.includes(normalizeText(term))));
}

function isRejectedHint(candidate: BatchCandidate, place: GooglePlace): boolean {
  const googleName = normalizeText(place.displayName?.text || '');
  return (MANUAL_HINTS[candidate.venue_name]?.reject_names || []).some((name) => googleName === normalizeText(name));
}

function scoreRepair(candidate: BatchCandidate, place: GooglePlace, previous: BatchGoogleRecord): RepairEvaluation {
  const base = scoreGoogleMatch(candidate, place);
  const warnings = new Set(base.match_warnings);
  const reasons = [...base.match_reasons];
  const caba = isCabaAddress(place.formattedAddress || '');
  const aliasStrong = exactOrNearAlias(candidate, place);
  const typeCompatible = googleTypeCompatible(candidate, place);
  const preferred = hasPreferredAddress(candidate, place);
  let confidence = base.match_confidence;

  if (aliasStrong) {
    confidence += 24;
    reasons.push('manual/accent-insensitive alias match');
    warnings.delete('name mismatch');
  }
  if (caba) {
    confidence += 12;
    reasons.push('CABA address compatibility');
    warnings.delete('city not explicit');
  }
  if (typeCompatible) {
    confidence += 8;
    reasons.push('Google type compatible');
    warnings.delete('category ambiguity');
  }
  if (candidate.merged_sources.some((mention) => mention.category === candidate.category)) {
    confidence += 6;
    reasons.push('source category-compatible');
  }
  if (preferred) {
    confidence += 18;
    reasons.push('preferred branch/address match');
  }
  if (aliasStrong && caba && typeCompatible) {
    warnings.delete('district absent from formattedAddress');
    reasons.push('district absence ignored due strong name/CABA/category evidence');
  }
  if (nonCabaRisk(place.formattedAddress || '') && !caba) {
    confidence -= 45;
    warnings.add('non-CABA address risk');
  }
  if (isRejectedHint(candidate, place)) {
    confidence -= 35;
    warnings.add('manual reject-name hint');
  }
  if (!aliasStrong) warnings.add('name mismatch');
  if (!typeCompatible) warnings.add('category ambiguity');

  const match: MatchInfo = {
    ...base,
    match_confidence: clampScore(confidence),
    match_reasons: Array.from(new Set(reasons)),
    match_warnings: Array.from(warnings),
  };
  return {
    place,
    match,
    before_confidence: previous.match?.match_confidence ?? null,
    after_confidence: match.match_confidence,
    promoted: false,
  };
}

function classifyRepair(evaluations: RepairEvaluation[]): BatchGoogleRecord['status'] {
  if (!evaluations.length) return 'unmatched';
  const [top, second] = evaluations;
  if (top.after_confidence < 82) return 'unmatched';
  if (top.match.match_warnings.some((warning) => ['name mismatch', 'category ambiguity', 'non-CABA address risk', 'manual reject-name hint'].includes(warning))) return 'unmatched';
  if (second && second.after_confidence >= 82 && top.after_confidence - second.after_confidence < 6 && !top.match.match_reasons.includes('preferred branch/address match')) return 'ambiguous_match';
  return 'matched';
}

function searchQueries(candidate: BatchCandidate): string[] {
  const aliases = allAliases(candidate).slice(0, 5);
  const districts = [candidate.district, 'Buenos Aires', 'CABA', 'Palermo', 'Recoleta', 'San Telmo', 'Belgrano', 'Puerto Madero', 'Las Cañitas'];
  return Array.from(new Set([
    `${candidate.venue_name} Buenos Aires`,
    `${candidate.venue_name} CABA`,
    `${candidate.venue_name} ${candidate.district}`,
    `${candidate.venue_name} ${categoryLabel(candidate.category)} Buenos Aires`,
    ...aliases.flatMap((alias) => [
      `${alias} Buenos Aires`,
      `${alias} CABA`,
      `${alias} ${candidate.district}`,
      `${alias} ${categoryLabel(candidate.category)} Buenos Aires`,
    ]),
    ...districts.map((district) => `${candidate.venue_name} ${district}`),
    ...(MANUAL_HINTS[candidate.venue_name]?.preferred_addresses || []).map((address) => `${candidate.venue_name} ${address} Buenos Aires`),
  ]));
}

async function searchPlaces(query: string, apiKey: string, state: ApiState): Promise<GooglePlace[]> {
  const response = await googleFetch<{ places?: GooglePlace[] }>(TEXT_SEARCH_URL, apiKey, SEARCH_FIELD_MASK, state, {
    method: 'POST',
    body: JSON.stringify({ textQuery: query, languageCode: 'en', regionCode: 'AR', maxResultCount: 5 }),
  });
  return response.places || [];
}

async function fetchDetails(placeId: string, apiKey: string, state: ApiState): Promise<GooglePlace> {
  return await googleFetch<GooglePlace>(`${DETAILS_URL}/${encodeURIComponent(placeId)}`, apiKey, DETAILS_FIELD_MASK, state);
}

async function repairRecord(candidate: BatchCandidate, previous: BatchGoogleRecord, apiKey: string | undefined, state: ApiState): Promise<BatchGoogleRecord & { repair_metadata?: Record<string, unknown> }> {
  if (!apiKey) return { ...previous, repair_metadata: { attempted: true, dry_run: true } };
  const placesById = new Map<string, GooglePlace>();
  for (const query of searchQueries(candidate)) {
    try {
      for (const place of await searchPlaces(query, apiKey, state)) {
        if (place.id) placesById.set(place.id, place);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      state.errors.push(`${candidate.venue_name}: ${message}`);
    }
  }
  const evaluations = [...placesById.values()].map((place) => scoreRepair(candidate, place, previous)).sort((a, b) => b.after_confidence - a.after_confidence);
  const status = classifyRepair(evaluations);
  const top = evaluations[0] || null;
  let googleData: GooglePlace | null = null;
  let googlePlaceId = top?.place.id || previous.google_place_id;
  if (status === 'matched' && googlePlaceId) {
    googleData = await fetchDetails(googlePlaceId, apiKey, state);
    googlePlaceId = googleData.id || googlePlaceId;
    if (top) top.promoted = true;
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
  const originalById = new Map(original.map((record) => [record.candidate_id, record]));
  const targets = original.filter((record) => record.status === 'unmatched');
  const targetRows = repaired.filter((record) => targets.some((target) => target.candidate_id === record.candidate_id));
  const repairedMatches = targetRows.filter((record) => record.status === 'matched');
  const stillUnmatched = targetRows.filter((record) => record.status === 'unmatched');
  return [
    '# Controlled Batch 50 Match Repair Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    `- Target unmatched candidates: ${targets.length}`,
    `- Repaired matches: ${repairedMatches.length}`,
    `- Still unmatched: ${stillUnmatched.length}`,
    `- Total additional Google calls: ${calls}`,
    `- API errors: ${errors.length}`,
    '',
    '## Target Results',
    '',
    ...targetRows.map((record) => {
      const before = originalById.get(record.candidate_id);
      return `- ${record.candidate_name}: ${before?.status || 'missing'} -> ${record.status}; confidence ${before?.match?.match_confidence ?? 'n/a'} -> ${record.match?.match_confidence ?? 'n/a'}; match ${record.match?.google_name || 'none'}; reasons ${record.match?.match_reasons.join('; ') || 'none'}; warnings ${record.match?.match_warnings.join('; ') || 'none'}`;
    }),
    '',
    '## Repaired Matches',
    '',
    ...(repairedMatches.length ? repairedMatches.map((record) => `- ${record.candidate_name}: ${record.match?.google_name} (${record.google_place_id})`) : ['- None']),
    '',
    '## Still Unmatched',
    '',
    ...(stillUnmatched.length ? stillUnmatched.map((record) => `- ${record.candidate_name}: ${record.match?.google_name || 'none'}; warnings ${record.match?.match_warnings.join('; ') || 'none'}`) : ['- None']),
    '',
    '## API Errors',
    '',
    ...(errors.length ? errors.map((error) => `- ${error}`) : ['- None']),
  ].join('\n');
}

async function main() {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const batch = readJson<BatchFile>(path.join(process.cwd(), 'data', 'controlled_batch_50_candidates.json'));
  const enrichment = readJson<EnrichmentFile>(path.join(process.cwd(), 'data', 'controlled_batch_50_google_enrichment.json'));
  if (batch.candidates.length > MAX_CANDIDATES || enrichment.records.length > MAX_CANDIDATES) throw new Error(`Refusing to process more than ${MAX_CANDIDATES}.`);
  const candidatesById = new Map(batch.candidates.map((candidate) => [candidate.candidate_id, candidate]));
  const state: ApiState = { calls: 0, errors: [] };
  const repaired: Array<BatchGoogleRecord & { repair_metadata?: Record<string, unknown> }> = [];

  for (const record of enrichment.records) {
    if (record.status !== 'unmatched') {
      repaired.push(record);
      continue;
    }
    const candidate = candidatesById.get(record.candidate_id);
    if (!candidate) {
      repaired.push(record);
      continue;
    }
    repaired.push(await repairRecord(candidate, record, apiKey, state));
  }

  writeFileSync(path.join(process.cwd(), 'data', 'controlled_batch_50_google_enrichment_repaired.json'), JSON.stringify({
    generatedAt: new Date().toISOString(),
    googleCallsMade: state.calls,
    apiErrors: state.errors,
    records: repaired,
  }, null, 2));
  const markdown = report(enrichment.records, repaired, state.calls, state.errors);
  writeFileSync(path.join(process.cwd(), 'data', 'controlled_batch_50_match_repair_report.md'), markdown);
  console.log(markdown);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
