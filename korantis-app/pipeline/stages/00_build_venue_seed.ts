import { mkdirSync, readdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { loadLocalEnv } from './01_extract_data';
import {
  discoverEditorialSourceCandidates,
  type EditorialBatchType,
  type EditorialSourceCandidate,
  type EditorialSourceEnrichmentResult,
} from './00b_editorial_source_enrichment';
import { searchGooglePlacesText, type GooglePlacesTextCandidate } from '../utils/google_places';
import { runFullBatch } from '../run_full_batch';
import type { BatchInput, VenueInput, VenueType } from '../types';

type SeedType =
  | 'cafe'
  | 'restaurant'
  | 'bar'
  | 'cocktail_bar'
  | 'wine_bar'
  | 'cafe_bar'
  | 'bakery_cafe'
  | 'rooftop_bar'
  | 'speakeasy'
  | 'parrilla'
  | 'bistro';

interface SelectorOptions {
  count: number;
  city: string;
  neighborhoods: string[];
  typeMix: Record<string, number>;
  continuePipeline: boolean;
  forcePipeline: boolean;
  allowTypeFallback: boolean;
  maxQueries?: number;
  maxSourceQueries?: number;
  skipEditorialSources: boolean;
  planOnly: boolean;
}

interface ExistingVenueIndex {
  names: Set<string>;
  nameCityKeys: Set<string>;
  placeIds: Set<string>;
  aliases: Set<string>;
  knownVenues: KnownVenue[];
  sources: string[];
  warnings: string[];
}

interface KnownVenue {
  name: string;
  city?: string;
  neighborhood?: string;
  place_id?: string;
  aliases: string[];
  source: string;
  match_keys: string[];
}

interface Candidate {
  name: string;
  normalized_name: string;
  neighborhood: string;
  type: SeedType;
  place_id?: string;
  address?: string;
  coordinates?: { lat: number; lng: number };
  google_maps_url?: string;
  rating?: number;
  review_count?: number;
  business_status?: string;
  website_url?: string;
  google_place_types: string[];
  photo_count: number;
  max_photo_dimension: number;
  source_signals: string[];
  search_queries: string[];
  curated_boost: boolean;
  scores: CandidateScores;
  candidate_score: number;
  selection_reason: string;
  rejection_reasons: string[];
}

interface CandidateScores {
  google_presence_score: number;
  review_volume_score: number;
  visual_strength_score: number;
  category_fit_score: number;
  neighborhood_balance_score: number;
  atmosphere_potential_score: number;
  source_diversity_score: number;
  local_identity_score: number;
  editorial_discovery_score: number;
  generic_chain_penalty: number;
}

interface SelectionResult {
  batch_id: string;
  generated_at: string;
  city: string;
  discovery_mode: 'automated_google_places' | 'semi_automated';
  total_candidates_discovered: number;
  candidates_after_dedupe: number;
  candidates_after_hard_filters: number;
  rejected_count: number;
  selected_count: number;
  selected: Candidate[];
  rejected: Candidate[];
  already_known_excluded: Candidate[];
  warnings: string[];
  existing_sources_checked: string[];
  existing_known_venues_count: number;
  configured_neighborhoods: string[];
  configured_type_mix: Record<string, number>;
  type_counts: Record<string, number>;
  neighborhood_counts: Record<string, number>;
  deviations_from_target_mix: string[];
  next_pipeline_command: string;
}

const DEFAULT_BATCH_ID = 'batch_004_buenos_aires_50';
const DEFAULT_CITY = 'Buenos Aires';
const DEFAULT_NEIGHBORHOODS = [
  'Palermo',
  'Recoleta',
  'San Telmo',
  'Chacarita',
  'Villa Crespo',
  'Retiro',
  'Centro',
  'Belgrano',
  'Colegiales',
  'Nuñez',
  'Almagro',
  'Puerto Madero',
];
const ALLOWED_TYPES: SeedType[] = [
  'cafe',
  'restaurant',
  'bar',
  'cocktail_bar',
  'wine_bar',
  'cafe_bar',
  'bakery_cafe',
  'rooftop_bar',
  'speakeasy',
  'parrilla',
  'bistro',
];
const DEFAULT_TYPE_MIX = {
  cafes: 12,
  restaurants: 10,
  bars: 10,
  cocktails: 8,
  wine: 5,
  hybrids: 5,
};
const HARD_FRANCHISE_TERMS = [
  'starbucks',
  'dunkin',
  'dunkin donuts',
  'mcdonald',
  'mcdonalds',
  'burger king',
  'kfc',
  'subway',
  'pret a manger',
  'joe & the juice',
  'joe and the juice',
  'costa coffee',
  'tim hortons',
  'krispy kreme',
  'panera',
  'chipotle',
  'five guys',
  'shake shack',
  'sweetgreen',
  'cava',
  'mostaza',
  'cafe martinez',
  'café martínez',
  'havanna',
  'kentucky',
  'green eat',
  'tea connection',
];
const SOFT_CHAIN_TERMS = [
  'blue bottle',
  'blank street',
  'gregorys coffee',
  'gregory coffee',
  'bluestone lane',
  'le pain quotidien',
  'paris baguette',
  'maman',
  'paul',
  'laduree',
  'tostado',
  'bonafide',
];
const ATMOSPHERE_TERMS = [
  'club',
  'bar',
  'jardin',
  'jardín',
  'terraza',
  'rooftop',
  'speakeasy',
  'hidden',
  'vino',
  'wine',
  'cafe',
  'café',
  'bistro',
  'parrilla',
  'cantina',
  'salon',
  'salón',
  'vermut',
  'vermouth',
  'atelier',
  'casa',
  'almacen',
  'almacén',
];

const LOCAL_IDENTITY_TERMS = [
  'roaster',
  'roasters',
  'tostador',
  'tostadores',
  'specialty',
  'especialidad',
  'atelier',
  'studio',
  'house',
  'casa',
  'club',
  'hidden',
  'speakeasy',
  'natural wine',
  'vino',
  'vermut',
  'vermouth',
  'listening',
  'books',
  'bookstore',
  'garden',
  'jardin',
  'patio',
  'terrace',
  'terraza',
  'rooftop',
  'lounge',
  'bistro',
  'almacen',
  'cantina',
];
const EDITORIAL_DISCOVERY_TERMS = [
  'specialty coffee',
  'coffee roaster',
  'independent',
  'design',
  'quiet',
  'neighborhood',
  'natural wine',
  'cocktail',
  'speakeasy',
  'listening bar',
  'rooftop',
  'terrace',
  'wine bar',
  'cafe bar',
  'atmosphere',
  'romantic',
  'date night',
];

const QUERY_TYPES: Array<{ label: string; queryType: string; typeHint: SeedType }> = [
  { label: 'cafes', queryType: 'cafes', typeHint: 'cafe' },
  { label: 'specialty_coffee', queryType: 'specialty coffee shops', typeHint: 'cafe' },
  { label: 'independent_cafes', queryType: 'independent cafes', typeHint: 'cafe' },
  { label: 'coffee_roasters', queryType: 'coffee roasters', typeHint: 'cafe' },
  { label: 'design_cafes', queryType: 'design cafes', typeHint: 'cafe' },
  { label: 'quiet_cafes', queryType: 'quiet cafes', typeHint: 'cafe' },
  { label: 'cafe_bars_for_cafes', queryType: 'cafe bars', typeHint: 'cafe' },
  { label: 'bakery_cafes', queryType: 'bakery cafes', typeHint: 'bakery_cafe' },
  { label: 'restaurants', queryType: 'restaurants', typeHint: 'restaurant' },
  { label: 'atmosphere_restaurants', queryType: 'atmosphere restaurants', typeHint: 'restaurant' },
  { label: 'design_restaurants', queryType: 'design restaurants', typeHint: 'restaurant' },
  { label: 'romantic_restaurants', queryType: 'romantic restaurants', typeHint: 'restaurant' },
  { label: 'bistros', queryType: 'bistros', typeHint: 'bistro' },
  { label: 'parrillas', queryType: 'parrillas', typeHint: 'parrilla' },
  { label: 'bars', queryType: 'bars', typeHint: 'bar' },
  { label: 'neighborhood_bars', queryType: 'neighborhood bars', typeHint: 'bar' },
  { label: 'listening_bars', queryType: 'listening bars', typeHint: 'bar' },
  { label: 'cocktail_bars', queryType: 'cocktail bars', typeHint: 'cocktail_bar' },
  { label: 'best_cocktail_bars', queryType: 'best cocktail bars', typeHint: 'cocktail_bar' },
  { label: 'wine_bars', queryType: 'wine bars', typeHint: 'wine_bar' },
  { label: 'natural_wine_bars', queryType: 'natural wine bars', typeHint: 'wine_bar' },
  { label: 'rooftop_bars', queryType: 'rooftop bars', typeHint: 'rooftop_bar' },
  { label: 'rooftop_lounges', queryType: 'rooftop lounges', typeHint: 'rooftop_bar' },
  { label: 'terrace_bars', queryType: 'terrace bars', typeHint: 'rooftop_bar' },
  { label: 'skyline_bars', queryType: 'skyline bars', typeHint: 'rooftop_bar' },
  { label: 'hotel_rooftop_bars', queryType: 'hotel rooftop bars', typeHint: 'rooftop_bar' },
  { label: 'speakeasies', queryType: 'speakeasy bars', typeHint: 'speakeasy' },
  { label: 'cafe_bars', queryType: 'cafe bars', typeHint: 'cafe_bar' },
];

const CURATED_ALLOWLIST: Array<{ name: string; neighborhood: string; type: SeedType; reason: string }> = [
  { name: 'Presidente Bar', neighborhood: 'Recoleta', type: 'cocktail_bar', reason: 'strong cocktail identity' },
  { name: 'Tres Monos', neighborhood: 'Palermo', type: 'cocktail_bar', reason: 'high atmosphere signal' },
  { name: 'Naranjo Bar', neighborhood: 'Chacarita', type: 'wine_bar', reason: 'wine-focused discovery value' },
  { name: 'Anafe', neighborhood: 'Colegiales', type: 'restaurant', reason: 'distinct room and food identity' },
  { name: 'Café Registrado', neighborhood: 'Palermo', type: 'cafe', reason: 'coffee discovery value' },
  { name: 'Atis Bar', neighborhood: 'San Telmo', type: 'bar', reason: 'green patio atmosphere' },
  { name: 'Los Galgos', neighborhood: 'Centro', type: 'cafe_bar', reason: 'historic cafe-bar identity' },
  { name: 'El Preferido de Palermo', neighborhood: 'Palermo', type: 'bistro', reason: 'strong Buenos Aires identity' },
  { name: 'La Fuerza', neighborhood: 'Chacarita', type: 'bar', reason: 'vermouth and local mood signal' },
  { name: 'Cochinchina', neighborhood: 'Palermo', type: 'cocktail_bar', reason: 'cinematic cocktail identity' },
  { name: 'Sacro', neighborhood: 'Palermo', type: 'restaurant', reason: 'visual interior signal' },
  { name: 'Cuervo Café', neighborhood: 'Palermo', type: 'cafe', reason: 'coffee and neighborhood signal' },
];

export async function buildVenueSeed(batchName: string, options: SelectorOptions): Promise<SelectionResult> {
  loadLocalEnv();

  const batchId = batchName || DEFAULT_BATCH_ID;
  const outputDir = path.join(process.cwd(), 'data', 'batches', batchId);
  mkdirSync(outputDir, { recursive: true });

  const existing = await buildExistingVenueIndex(options.city);
  if (options.planOnly) {
    const result: SelectionResult = {
      batch_id: batchId,
      generated_at: new Date().toISOString(),
      city: options.city,
      discovery_mode: 'semi_automated',
      total_candidates_discovered: 0,
      candidates_after_dedupe: 0,
      candidates_after_hard_filters: 0,
      rejected_count: 0,
      selected_count: 0,
      selected: [],
      rejected: [],
      already_known_excluded: [],
      warnings: ['plan_only_no_candidate_discovery_or_external_calls'],
      existing_sources_checked: existing.sources,
      existing_known_venues_count: existing.knownVenues.length,
      configured_neighborhoods: options.neighborhoods,
      configured_type_mix: options.typeMix,
      type_counts: {},
      neighborhood_counts: {},
      deviations_from_target_mix: [`plan only; requested ${options.count} venues`],
      next_pipeline_command: `npx tsx pipeline/run_full_batch.ts ${batchId}`,
    };
    writeDebugOutputs(batchId, outputDir, result);
    console.log(`Stage 00 plan written to ${path.join(outputDir, 'venue_seed_report.md')}`);
    return result;
  }

  const candidates = await discoverCandidates(batchId, outputDir, existing, options);
  const deduped = dedupeCandidates(candidates);
  const scored = deduped.map((candidate) => scoreCandidate(candidate));
  const { accepted, rejected, alreadyKnown } = applyHardFilters(scored, existing, options);
  const selected = selectBalancedCandidates(accepted, options.count, options.typeMix, options.allowTypeFallback);
  const mixDeviations = buildMixDeviations(selected, options.count, options.typeMix);
  const warnings = [
    ...existing.warnings,
    ...(selected.length !== options.count ? [`selected_count_${selected.length}_does_not_match_requested_${options.count}`] : []),
    ...(mixDeviations.length > 0 ? mixDeviations.map((deviation) => `target_mix_deviation:${deviation}`) : []),
    ...(options.allowTypeFallback ? ['type_fallback_enabled'] : []),
  ];
  const hasBlockingMixDeviation = mixDeviations.length > 0 && !options.allowTypeFallback;

  if (selected.length !== options.count || hasBlockingMixDeviation) {
    writeDebugOutputs(batchId, outputDir, {
      batch_id: batchId,
      generated_at: new Date().toISOString(),
      city: options.city,
      discovery_mode: process.env.GOOGLE_PLACES_API_KEY && !options.planOnly ? 'automated_google_places' : 'semi_automated',
      total_candidates_discovered: candidates.length,
      candidates_after_dedupe: deduped.length,
      candidates_after_hard_filters: accepted.length,
      rejected_count: rejected.length,
      selected_count: selected.length,
      selected,
      rejected,
      already_known_excluded: alreadyKnown,
      warnings,
      existing_sources_checked: existing.sources,
      existing_known_venues_count: existing.knownVenues.length,
      configured_neighborhoods: options.neighborhoods,
      configured_type_mix: options.typeMix,
      type_counts: countBy(selected, (candidate) => candidate.type),
      neighborhood_counts: countBy(selected, (candidate) => candidate.neighborhood),
      deviations_from_target_mix: mixDeviations,
      next_pipeline_command: `npx tsx pipeline/run_full_batch.ts ${batchId}`,
    });
    const reason = selected.length !== options.count
      ? `selected ${selected.length} venues, expected ${options.count}`
      : `could not satisfy target mix: ${mixDeviations.join('; ')}`;
    throw new Error(`Stage 00 ${reason}. Review venue_seed_report.md and venue_candidates_debug.json.`);
  }

  const result: SelectionResult = {
    batch_id: batchId,
    generated_at: new Date().toISOString(),
    city: options.city,
    discovery_mode: process.env.GOOGLE_PLACES_API_KEY && !options.planOnly ? 'automated_google_places' : 'semi_automated',
    total_candidates_discovered: candidates.length,
    candidates_after_dedupe: deduped.length,
    candidates_after_hard_filters: accepted.length,
    rejected_count: rejected.length,
    selected_count: selected.length,
    selected,
    rejected,
    already_known_excluded: alreadyKnown,
    warnings,
    existing_sources_checked: existing.sources,
    existing_known_venues_count: existing.knownVenues.length,
    configured_neighborhoods: options.neighborhoods,
    configured_type_mix: options.typeMix,
    type_counts: countBy(selected, (candidate) => candidate.type),
    neighborhood_counts: countBy(selected, (candidate) => candidate.neighborhood),
    deviations_from_target_mix: mixDeviations,
    next_pipeline_command: `npx tsx pipeline/run_full_batch.ts ${batchId}`,
  };

  writeDebugOutputs(batchId, outputDir, result);
  writeSeedFiles(batchId, outputDir, result);

  console.log(`Venue seed written to ${path.join(outputDir, 'venue_seed.json')}`);
  console.log(`Pipeline input written to ${path.join(process.cwd(), 'pipeline', 'input', `${batchId}.json`)}`);
  console.log(`Venue seed report written to ${path.join(outputDir, 'venue_seed_report.md')}`);
  console.log(
    `Stage 00 summary: discovered=${result.total_candidates_discovered}, after_filters=${result.candidates_after_hard_filters}, selected=${result.selected_count}, rejected=${result.rejected_count}`,
  );

  if (options.continuePipeline && !options.planOnly) {
    await runFullBatch(batchId, {
      force: options.forcePipeline,
      planOnly: false,
      allowNon50: options.count !== 50,
      skipStage08: false,
      skipPublicationReview: false,
      maxImagesPerVenue: 4,
    });
  }

  return result;
}

async function discoverCandidates(batchId: string, outputDir: string, existing: ExistingVenueIndex, options: SelectorOptions): Promise<Candidate[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const candidates: Candidate[] = [];
  const queries = buildQueryMatrix(options.city, options.neighborhoods, options.typeMix).slice(0, options.maxQueries);

  if (!apiKey) {
    return CURATED_ALLOWLIST.map((item) => curatedCandidate(item, 'missing_google_api_semi_automated_pool'));
  }

  for (const query of queries) {
    const result = await searchGooglePlacesText(query.text, {
      apiKey,
      city: options.city,
      languageCode: 'en',
      regionCode: regionCodeForCity(options.city),
      maxResultCount: 10,
    });
    if (result.error) {
      candidates.push(curatedCandidate({
        name: `query_failed:${query.text}`,
        neighborhood: query.neighborhood,
        type: query.typeHint,
        reason: result.error,
      }, 'google_query_error'));
      continue;
    }
    for (const place of result.candidates) {
      candidates.push(fromGooglePlace(place, query.neighborhood, query.typeHint, query.text, false));
    }
  }

  for (const curated of CURATED_ALLOWLIST) {
    if (existing.names.has(existingKey(curated.name, curated.neighborhood))) continue;
    const result = await searchGooglePlacesText(`${curated.name} ${curated.neighborhood} ${options.city}`, {
      apiKey,
      city: options.city,
      languageCode: 'en',
      regionCode: regionCodeForCity(options.city),
      maxResultCount: 3,
    });
    const place = result.candidates[0];
    candidates.push(place
      ? fromGooglePlace(place, curated.neighborhood, curated.type, `curated:${curated.name}`, true)
      : curatedCandidate(curated, 'curated_allowlist_unresolved'));
  }

  if (!options.skipEditorialSources) {
    const editorial = await discoverEditorialSourceCandidates(batchId, {
      city: options.city,
      neighborhoods: options.neighborhoods,
      batchType: editorialBatchTypeFromMix(options.typeMix),
      maxSourceQueries: options.maxSourceQueries,
    });
    writeInlineEditorialSourceOutputs(outputDir, editorial);
    for (const item of editorial.candidates) {
      candidates.push(fromEditorialSourceCandidate(item));
    }
  }

  return candidates;
}

function fromEditorialSourceCandidate(item: EditorialSourceCandidate): Candidate {
  const typeHint = typeHintFromEditorialBatchType(item);
  const place = item.place;
  const type = normalizeType(place.google_place_types, place.primary_type, typeHint, place.name);
  const maxPhotoDimension = Math.max(0, ...place.photos.map((photo) => Math.max(photo.width || 0, photo.height || 0)));
  return {
    name: cleanVenueName(place.name),
    normalized_name: normalizeName(place.name),
    neighborhood: normalizeNeighborhood(item.neighborhood, DEFAULT_NEIGHBORHOODS),
    type,
    place_id: place.place_id,
    address: place.address,
    coordinates: place.coordinates,
    google_maps_url: place.google_maps_url,
    rating: place.rating,
    review_count: place.user_ratings_total,
    business_status: place.business_status,
    website_url: place.website_url,
    google_place_types: place.google_place_types,
    photo_count: place.photos.length,
    max_photo_dimension: maxPhotoDimension,
    source_signals: [
      'google_places',
      'editorial_source_query_candidate',
      `editorial_source:${item.source_id}`,
      `editorial_kind:${item.source_kind}`,
      item.source_kind === 'prestige_guide' ? 'prestige_source_query' : '',
      item.place.website_url ? 'official_website_from_google' : '',
      item.place.photos.length > 0 ? 'google_photo_signal' : '',
      ...item.signals,
    ].filter(Boolean),
    search_queries: [item.text_query],
    curated_boost: item.source_confidence >= 0.78,
    scores: emptyScores(),
    candidate_score: 0,
    selection_reason: '',
    rejection_reasons: [],
  };
}

function writeInlineEditorialSourceOutputs(outputDir: string, result: EditorialSourceEnrichmentResult): void {
  writeFileSync(path.join(outputDir, 'stage_00b_editorial_source_enrichment.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  writeFileSync(path.join(outputDir, 'stage_00b_editorial_source_enrichment_report.md'), buildInlineEditorialReport(result), 'utf8');
}

function buildInlineEditorialReport(result: EditorialSourceEnrichmentResult): string {
  return [
    '# Stage 00B Editorial Source Enrichment Report',
    '',
    `- Batch: ${result.batch_id}`,
    `- Generated: ${result.generated_at}`,
    `- City: ${result.city}`,
    `- Batch type: ${result.batch_type}`,
    `- Queries run: ${result.queries_run}`,
    `- Candidates found: ${result.candidates_found}`,
    `- Unique candidates: ${result.unique_candidates}`,
    `- Caveat: ${result.caveat}`,
    '',
    '## Sources Used',
    '',
    ...result.sources_used.map((source) => `- ${source.source_name} (${source.source_kind}, weight ${source.authority_weight}): ${source.source_url}`),
    '',
    '## Top Source-Derived Candidates',
    '',
    '| Venue | Neighborhood | Source | Confidence | Query |',
    '| --- | --- | --- | ---: | --- |',
    ...result.candidates.slice(0, 120).map((candidate) =>
      `| ${escapeTable(candidate.venue_name)} | ${escapeTable(candidate.neighborhood)} | ${escapeTable(candidate.source_name)} | ${candidate.source_confidence} | ${escapeTable(candidate.text_query)} |`,
    ),
    '',
    '## Warnings',
    '',
    ...(result.warnings.length > 0 ? result.warnings.map((warning) => `- ${warning}`) : ['- none']),
  ].join('\n') + '\n';
}

function editorialBatchTypeFromMix(typeMix: Record<string, number>): EditorialBatchType {
  const sorted = Object.entries(typeMix).sort((a, b) => b[1] - a[1]);
  const primary = sorted[0]?.[0] || 'mixed';
  if (primary === 'cafes') return 'cafes';
  if (primary === 'restaurants') return 'restaurants';
  if (primary === 'bars' || primary === 'cocktails' || primary === 'wine' || primary === 'rooftops') return 'bars';
  return 'mixed';
}

function typeHintFromEditorialBatchType(item: EditorialSourceCandidate): SeedType {
  if (item.source_kind === 'coffee_editorial') return 'cafe';
  if (item.text_query.includes('coffee') || item.text_query.includes('cafe')) return 'cafe';
  if (item.text_query.includes('cocktail')) return 'cocktail_bar';
  if (item.text_query.includes('wine')) return 'wine_bar';
  if (item.text_query.includes('bar')) return 'bar';
  return 'restaurant';
}

function buildQueryMatrix(city: string, neighborhoods: string[], typeMix: Record<string, number>): Array<{ text: string; neighborhood: string; typeHint: SeedType }> {
  const queries: Array<{ text: string; neighborhood: string; typeHint: SeedType }> = [];
  const requestedGroups = new Set(Object.keys(typeMix));
  for (const neighborhood of neighborhoods) {
    for (const queryType of QUERY_TYPES.filter((item) => requestedGroups.has(typeGroup(item.typeHint)))) {
      queries.push({
        text: `${queryType.queryType} in ${neighborhood} ${city}`,
        neighborhood,
        typeHint: queryType.typeHint,
      });
    }
  }
  return queries;
}

function fromGooglePlace(
  place: GooglePlacesTextCandidate,
  neighborhood: string,
  typeHint: SeedType,
  query: string,
  curatedBoost: boolean,
): Candidate {
  const type = normalizeType(place.google_place_types, place.primary_type, typeHint, place.name);
  const maxPhotoDimension = Math.max(0, ...place.photos.map((photo) => Math.max(photo.width || 0, photo.height || 0)));
  return {
    name: cleanVenueName(place.name),
    normalized_name: normalizeName(place.name),
    neighborhood: normalizeNeighborhood(neighborhood, DEFAULT_NEIGHBORHOODS),
    type,
    place_id: place.place_id,
    address: place.address,
    coordinates: place.coordinates,
    google_maps_url: place.google_maps_url,
    rating: place.rating,
    review_count: place.user_ratings_total,
    business_status: place.business_status,
    website_url: place.website_url,
    google_place_types: place.google_place_types,
    photo_count: place.photos.length,
    max_photo_dimension: maxPhotoDimension,
    source_signals: [
      'google_places',
      ...(place.website_url ? ['official_website_from_google'] : []),
      ...(place.photos.length > 0 ? ['google_photo_signal'] : []),
      ...(curatedBoost ? ['curated_allowlist_boost'] : []),
      ...candidateQualitySignals(place.name, type, place.google_place_types, query),
    ],
    search_queries: [query],
    curated_boost: curatedBoost,
    scores: emptyScores(),
    candidate_score: 0,
    selection_reason: '',
    rejection_reasons: [],
  };
}

function curatedCandidate(
  item: { name: string; neighborhood: string; type: SeedType; reason: string },
  signal: string,
): Candidate {
  return {
    name: item.name,
    normalized_name: normalizeName(item.name),
    neighborhood: normalizeNeighborhood(item.neighborhood, DEFAULT_NEIGHBORHOODS),
    type: item.type,
    google_place_types: [],
    photo_count: 0,
    max_photo_dimension: 0,
    source_signals: ['curated_allowlist', signal, item.reason],
    search_queries: [],
    curated_boost: true,
    scores: emptyScores(),
    candidate_score: 0,
    selection_reason: '',
    rejection_reasons: [],
  };
}

function dedupeCandidates(candidates: Candidate[]): Candidate[] {
  const byKey = new Map<string, Candidate>();
  for (const candidate of candidates.filter((item) => item.name && !item.name.startsWith('query_failed:'))) {
    const key = candidate.place_id || existingKey(candidate.name, candidate.neighborhood);
    const current = byKey.get(key);
    if (!current) {
      byKey.set(key, candidate);
      continue;
    }
    current.source_signals = [...new Set([...current.source_signals, ...candidate.source_signals])];
    current.search_queries = [...new Set([...current.search_queries, ...candidate.search_queries])];
    current.curated_boost = current.curated_boost || candidate.curated_boost;
    current.photo_count = Math.max(current.photo_count, candidate.photo_count);
    current.max_photo_dimension = Math.max(current.max_photo_dimension, candidate.max_photo_dimension);
    if (!current.website_url && candidate.website_url) current.website_url = candidate.website_url;
  }
  return [...byKey.values()];
}

function scoreCandidate(candidate: Candidate): Candidate {
  const scores: CandidateScores = {
    google_presence_score: scoreGooglePresence(candidate),
    review_volume_score: scoreReviewVolume(candidate.review_count),
    visual_strength_score: scoreVisualStrength(candidate),
    category_fit_score: scoreCategoryFit(candidate),
    neighborhood_balance_score: 0.7,
    atmosphere_potential_score: scoreAtmospherePotential(candidate),
    source_diversity_score: scoreSourceDiversity(candidate),
    local_identity_score: scoreLocalIdentity(candidate),
    editorial_discovery_score: scoreEditorialDiscovery(candidate),
    generic_chain_penalty: scoreGenericChainPenalty(candidate),
  };
  const rawCandidateScore =
    scores.google_presence_score * 0.15 +
    scores.review_volume_score * 0.1 +
    scores.visual_strength_score * 0.18 +
    scores.category_fit_score * 0.14 +
    scores.neighborhood_balance_score * 0.08 +
    scores.atmosphere_potential_score * 0.16 +
    scores.source_diversity_score * 0.04 +
    scores.local_identity_score * 0.1 +
    scores.editorial_discovery_score * 0.08 -
    scores.generic_chain_penalty * 0.13;
  const candidateScore = Math.max(0, Math.min(1, rawCandidateScore));
  return {
    ...candidate,
    scores,
    candidate_score: Number((candidateScore * 100).toFixed(2)),
    selection_reason: buildSelectionReason(candidate, scores, Number((candidateScore * 100).toFixed(2))),
  };
}

function applyHardFilters(
  candidates: Candidate[],
  existing: ExistingVenueIndex,
  options: SelectorOptions,
): { accepted: Candidate[]; rejected: Candidate[]; alreadyKnown: Candidate[] } {
  const accepted: Candidate[] = [];
  const rejected: Candidate[] = [];
  const alreadyKnown: Candidate[] = [];
  for (const candidate of candidates) {
    const reasons = hardFilterReasons(candidate, existing, options);
    if (reasons.some((reason) => reason.startsWith('already_exists'))) {
      alreadyKnown.push({ ...candidate, rejection_reasons: reasons });
    } else if (reasons.length > 0) {
      rejected.push({ ...candidate, rejection_reasons: reasons });
    } else {
      accepted.push(candidate);
    }
  }
  return { accepted, rejected, alreadyKnown };
}

function hardFilterReasons(candidate: Candidate, existing: ExistingVenueIndex, options: SelectorOptions): string[] {
  const reasons: string[] = [];
  if (!candidate.name) reasons.push('missing_name');
  if (!candidate.neighborhood || !options.neighborhoods.some((neighborhood) => normalizeName(neighborhood) === normalizeName(candidate.neighborhood))) {
    reasons.push('missing_or_unsupported_neighborhood');
  }
  if (!ALLOWED_TYPES.includes(candidate.type)) reasons.push('missing_or_invalid_type');
  if (candidate.business_status && candidate.business_status !== 'OPERATIONAL') reasons.push('not_operational');
  if (!candidate.place_id) reasons.push('missing_google_place_id');
  if (!candidate.coordinates) reasons.push('missing_coordinates');
  if (!candidate.rating) reasons.push('missing_rating');
  if (!candidate.review_count) reasons.push('missing_review_count');
  if (candidate.photo_count === 0) reasons.push('no_photo_signal');
  if (existing.placeIds.has(candidate.place_id || '')) reasons.push('already_exists_place_id');
  if (existing.names.has(existingKey(candidate.name, candidate.neighborhood))) reasons.push('already_exists_name_neighborhood');
  if (existing.nameCityKeys.has(nameCityKey(candidate.name, options.city))) reasons.push('already_exists_name_city');
  if (existing.aliases.has(nameCityKey(candidate.name, options.city)) || existing.aliases.has(existingKey(candidate.name, candidate.neighborhood))) {
    reasons.push('already_exists_alias');
  }
  if (matchesAnyTerm(candidate.name, HARD_FRANCHISE_TERMS)) reasons.push('chain_or_franchise');
  if (isIrrelevantCategory(candidate)) reasons.push('irrelevant_google_category');
  if (candidate.review_count && candidate.review_count < 20) reasons.push('low_evidence_quality');
  return reasons;
}

function selectBalancedCandidates(candidates: Candidate[], targetCount: number, typeMix: Record<string, number>, allowTypeFallback: boolean): Candidate[] {
  const selected: Candidate[] = [];
  const selectedKeys = new Set<string>();
  const neighborhoodCounts: Record<string, number> = {};
  const groupTargets = scaleGroupTargets(targetCount, typeMix);
  const requestedGroups = new Set(Object.keys(groupTargets));
  const maxPerNeighborhood = Math.max(3, Math.ceil(targetCount / 7));
  const sorted = [...candidates].sort((a, b) => b.candidate_score - a.candidate_score);

  for (const [group, target] of Object.entries(groupTargets)) {
    for (const candidate of sorted.filter((item) => typeGroup(item.type) === group)) {
      if (selected.filter((item) => typeGroup(item.type) === group).length >= target) break;
      if (!canSelect(candidate, selectedKeys, neighborhoodCounts, maxPerNeighborhood)) continue;
      addSelected(candidate, selected, selectedKeys, neighborhoodCounts);
    }
  }

  for (const candidate of sorted) {
    if (selected.length >= targetCount) break;
    if (!allowTypeFallback && !requestedGroups.has(typeGroup(candidate.type))) continue;
    if (!canSelect(candidate, selectedKeys, neighborhoodCounts, maxPerNeighborhood + 1)) continue;
    addSelected(candidate, selected, selectedKeys, neighborhoodCounts);
  }

  return selected.slice(0, targetCount);
}

async function buildExistingVenueIndex(city: string): Promise<ExistingVenueIndex> {
  const index: ExistingVenueIndex = {
    names: new Set(),
    nameCityKeys: new Set(),
    placeIds: new Set(),
    aliases: new Set(),
    knownVenues: [],
    sources: [],
    warnings: [],
  };
  await addExistingFromSupabase(index, city);
  addExistingFromLocalBatches(index, city);
  return index;
}

async function addExistingFromSupabase(index: ExistingVenueIndex, city: string): Promise<void> {
  const supabase = createSupabaseReadOnlyClient();
  if (!supabase) {
    index.warnings.push('Supabase read env unavailable; DB duplicate check skipped.');
    return;
  }
  for (const table of ['staging_venues', 'venues']) {
    const { data, error } = await supabase.from(table).select('*').limit(5000);
    if (error) {
      index.warnings.push(`Supabase duplicate check skipped for ${table}: ${error.message}`);
      continue;
    }
    index.sources.push(`supabase:${table}`);
    for (const row of data || []) addExistingRow(index, row as Record<string, unknown>, city, `supabase:${table}`);
  }
}

function addExistingFromLocalBatches(index: ExistingVenueIndex, city: string): void {
  const batchesDir = path.join(process.cwd(), 'data', 'batches');
  if (!existsSync(batchesDir)) return;
  for (const batchDir of readdirSync(batchesDir, { withFileTypes: true })) {
    if (!batchDir.isDirectory()) continue;
    addExistingRowsFromFile(index, path.join(batchesDir, batchDir.name, 'venue_seed.json'), city, `local_batch:${batchDir.name}:venue_seed`);
    addExistingRowsFromFile(index, path.join(batchesDir, batchDir.name, 'stage_01_raw_venues.json'), city, `local_batch:${batchDir.name}:stage_01`);
    addExistingRowsFromBatchResult(index, path.join(batchesDir, batchDir.name, 'batch_result_with_editorial.json'), city, `local_batch:${batchDir.name}:batch_result_with_editorial`);
    addExistingRowsFromBatchResult(index, path.join(batchesDir, batchDir.name, 'batch_result_quality_gated.json'), city, `local_batch:${batchDir.name}:batch_result_quality_gated`);
  }
}

function addExistingRowsFromFile(index: ExistingVenueIndex, filePath: string, city: string, source: string): void {
  if (!existsSync(filePath)) return;
  try {
    const parsed = JSON.parse(readFileSync(filePath, 'utf8')) as unknown;
    const rows = Array.isArray(parsed) ? parsed : isRecord(parsed) && Array.isArray(parsed.venues) ? parsed.venues : [];
    index.sources.push(source);
    for (const row of rows) {
      if (isRecord(row)) addExistingRow(index, row, city, source);
    }
  } catch {
    index.warnings.push(`Failed to read local duplicate source ${filePath}.`);
  }
}

function addExistingRowsFromBatchResult(index: ExistingVenueIndex, filePath: string, city: string, source: string): void {
  if (!existsSync(filePath)) return;
  try {
    const parsed = JSON.parse(readFileSync(filePath, 'utf8')) as unknown;
    if (!isRecord(parsed) || !Array.isArray(parsed.candidates)) return;
    index.sources.push(source);
    for (const candidate of parsed.candidates) {
      if (!isRecord(candidate)) continue;
      const venue = isRecord(candidate.venue) ? candidate.venue : {};
      const raw = isRecord(venue.raw) ? venue.raw : {};
      addExistingRow(index, { ...raw, venue_name: candidate.venue_name }, city, source);
    }
  } catch {
    index.warnings.push(`Failed to read local duplicate source ${filePath}.`);
  }
}

function addExistingRow(index: ExistingVenueIndex, row: Record<string, unknown>, fallbackCity: string, source: string): void {
  const canonical = isRecord(row.canonical_data) ? row.canonical_data : {};
  const input = isRecord(row.input) ? row.input : {};
  const name = stringValue(row.name) || stringValue(row.venue_name) || stringValue(canonical.name) || stringValue(input.name);
  const city = stringValue(row.city) || stringValue(canonical.city) || fallbackCity;
  const neighborhood = stringValue(row.neighborhood) || stringValue(canonical.neighborhood) || stringValue(input.neighborhood);
  const placeId = stringValue(row.place_id) || stringValue(row.google_place_id) || stringValue(canonical.place_id);
  const aliases = extractAliases(row, canonical);
  const matchKeys: string[] = [];
  if (name && neighborhood) index.names.add(existingKey(name, normalizeNeighborhood(neighborhood)));
  if (name && neighborhood) matchKeys.push(existingKey(name, normalizeNeighborhood(neighborhood)));
  if (name && city) {
    index.nameCityKeys.add(nameCityKey(name, city));
    matchKeys.push(nameCityKey(name, city));
  }
  if (placeId) index.placeIds.add(placeId);
  if (placeId) matchKeys.push(`place_id:${placeId}`);
  for (const alias of aliases) {
    if (neighborhood) index.aliases.add(existingKey(alias, normalizeNeighborhood(neighborhood)));
    if (city) index.aliases.add(nameCityKey(alias, city));
  }
  if (name || placeId) {
    index.knownVenues.push({ name, city, neighborhood, place_id: placeId, aliases, source, match_keys: matchKeys });
  }
}

function writeSeedFiles(batchId: string, outputDir: string, result: SelectionResult): void {
  const seed: BatchInput = {
    batch_id: batchId,
    city: result.city,
    created_at: '2026-06-07T00:00:00.000Z',
    notes: `${result.selected_count} ${result.city} venue seed batch generated by reusable Stage 00 candidate selector.`,
    venues: result.selected.map((candidate): VenueInput => ({
      name: candidate.name,
      neighborhood: candidate.neighborhood,
      type: candidate.type as VenueType,
      google_maps_url: candidate.google_maps_url,
      coordinates: candidate.coordinates,
      address: candidate.address,
      notes: `stage_00_score:${candidate.candidate_score}; ${candidate.selection_reason}`,
    })),
  };
  writeFileSync(path.join(outputDir, 'venue_seed.json'), `${JSON.stringify(seed, null, 2)}\n`, 'utf8');
  writeFileSync(path.join(process.cwd(), 'pipeline', 'input', `${batchId}.json`), `${JSON.stringify(seed, null, 2)}\n`, 'utf8');
}

function writeDebugOutputs(batchId: string, outputDir: string, result: SelectionResult): void {
  writeFileSync(path.join(outputDir, 'venue_candidates_debug.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  writeFileSync(path.join(outputDir, 'venue_seed_report.md'), buildReport(result), 'utf8');
}

function buildReport(result: SelectionResult): string {
  const lines = [
    '# Stage 00 Venue Seed Selection Report',
    '',
    `- Batch: ${result.batch_id}`,
    `- Generated: ${result.generated_at}`,
    `- City: ${result.city}`,
    `- Configured neighborhoods: ${result.configured_neighborhoods.join(', ')}`,
    `- Existing known venues indexed: ${result.existing_known_venues_count}`,
    `- Discovery mode: ${result.discovery_mode}`,
    `- Total candidates discovered: ${result.total_candidates_discovered}`,
    `- Candidates after dedupe: ${result.candidates_after_dedupe}`,
    `- Candidates after hard filters: ${result.candidates_after_hard_filters}`,
    `- Final selected count: ${result.selected_count}`,
    `- Rejected count: ${result.rejected_count}`,
    `- Already-known excluded count: ${result.already_known_excluded.length}`,
    `- Existing sources checked: ${result.existing_sources_checked.join(', ') || 'none'}`,
    '',
    '## Scoring Formula',
    '',
    '`candidate_score = google_presence_score * 0.15 + review_volume_score * 0.10 + visual_strength_score * 0.18 + category_fit_score * 0.14 + neighborhood_balance_score * 0.08 + atmosphere_potential_score * 0.16 + source_diversity_score * 0.04 + local_identity_score * 0.10 + editorial_discovery_score * 0.08 - generic_chain_penalty * 0.13`',
    '',
    '## Counts By Type',
    '',
    ...entriesOrNone(result.type_counts),
    '',
    '## Counts By Neighborhood',
    '',
    ...entriesOrNone(result.neighborhood_counts),
    '',
    '## Selected Venues',
    '',
    '| Name | Neighborhood | Type | Score | Selection Reason | Source Signals |',
    '| --- | --- | --- | ---: | --- | --- |',
    ...result.selected.map((candidate) =>
      `| ${escapeTable(candidate.name)} | ${candidate.neighborhood} | ${candidate.type} | ${candidate.candidate_score} | ${escapeTable(candidate.selection_reason)} | ${escapeTable(candidate.source_signals.join(', '))} |`,
    ),
    '',
    '## Why These Are Korantis Venues',
    '',
    ...result.selected.map((candidate) =>
      `- ${candidate.name}: ${candidate.type} in ${candidate.neighborhood}; ${candidate.selection_reason}; signals ${candidate.source_signals.join(', ')}`,
    ),
    '',
    '## Rejected Candidates Summary',
    '',
    ...result.rejected.slice(0, 80).map((candidate) =>
      `- ${candidate.name || 'unknown'} (${candidate.neighborhood || 'unknown'}): ${candidate.rejection_reasons.join(', ')}`,
    ),
    '',
    '## Already-Known Venues Excluded',
    '',
    ...(result.already_known_excluded.length > 0
      ? result.already_known_excluded.slice(0, 120).map((candidate) =>
          `- ${candidate.name || 'unknown'} (${candidate.neighborhood || result.city}): ${candidate.rejection_reasons.join(', ')}`,
        )
      : ['- none']),
    '',
    '## Sources Used',
    '',
    ...result.existing_sources_checked.map((source) => `- ${source}`),
    '',
    '## Deviations From Target Mix',
    '',
    ...(result.deviations_from_target_mix.length > 0 ? result.deviations_from_target_mix.map((item) => `- ${item}`) : ['- none']),
    '',
    '## Warnings',
    '',
    ...(result.warnings.length > 0 ? result.warnings.map((warning) => `- ${warning}`) : ['- none']),
    '',
    '## Validation',
    '',
    `- venue_seed.json contains exactly selected venues: ${result.selected_count}`,
    '- every selected venue has name, neighborhood, and type',
    '- duplicate normalized name + neighborhood removed',
    '- existing Supabase/local batch venues excluded when detected',
    '',
    '## Next Command',
    '',
    '```powershell',
    result.next_pipeline_command,
    '```',
  ];
  return `${lines.join('\n')}\n`;
}

function canSelect(candidate: Candidate, selectedKeys: Set<string>, neighborhoodCounts: Record<string, number>, maxPerNeighborhood: number): boolean {
  const key = existingKey(candidate.name, candidate.neighborhood);
  if (selectedKeys.has(key)) return false;
  if ((neighborhoodCounts[candidate.neighborhood] || 0) >= maxPerNeighborhood) return false;
  return true;
}

function addSelected(candidate: Candidate, selected: Candidate[], selectedKeys: Set<string>, neighborhoodCounts: Record<string, number>): void {
  selected.push(candidate);
  selectedKeys.add(existingKey(candidate.name, candidate.neighborhood));
  neighborhoodCounts[candidate.neighborhood] = (neighborhoodCounts[candidate.neighborhood] || 0) + 1;
}

function scaleGroupTargets(targetCount: number, typeMix: Record<string, number>): Record<string, number> {
  const entries = Object.entries(typeMix);
  const totalMix = entries.reduce((sum, [, count]) => sum + count, 0) || targetCount;
  const scaled = entries.map(([group, count]) => ({ group, raw: (count / totalMix) * targetCount }));
  const rounded: Record<string, number> = {};
  let used = 0;
  for (const item of scaled) {
    rounded[item.group] = Math.floor(item.raw);
    used += rounded[item.group];
  }
  for (const item of [...scaled].sort((a, b) => (b.raw % 1) - (a.raw % 1))) {
    if (used >= targetCount) break;
    rounded[item.group] += 1;
    used += 1;
  }
  return rounded;
}

function buildMixDeviations(selected: Candidate[], targetCount: number, typeMix: Record<string, number>): string[] {
  const targets = scaleGroupTargets(targetCount, typeMix);
  const counts = countBy(selected, (candidate) => typeGroup(candidate.type));
  return Object.entries(targets)
    .filter(([group, target]) => (counts[group] || 0) !== target)
    .map(([group, target]) => `${group}: selected ${counts[group] || 0}, target ${target}`);
}

function typeGroup(type: SeedType): string {
  if (type === 'cafe' || type === 'bakery_cafe') return 'cafes';
  if (type === 'restaurant' || type === 'bistro' || type === 'parrilla') return 'restaurants';
  if (type === 'bar') return 'bars';
  if (type === 'cocktail_bar' || type === 'speakeasy') return 'cocktails';
  if (type === 'rooftop_bar') return 'rooftops';
  if (type === 'wine_bar') return 'wine';
  return 'hybrids';
}

function normalizeType(types: string[], primaryType: string | undefined, typeHint: SeedType, name: string): SeedType {
  const all = new Set([primaryType, ...types].filter(Boolean));
  const text = normalizeName(`${name} ${[...all].join(' ')} ${typeHint}`);
  if (text.includes('rooftop')) return 'rooftop_bar';
  if (text.includes('speakeasy')) return 'speakeasy';
  if (all.has('cocktail_bar')) return 'cocktail_bar';
  if (text.includes('wine') || text.includes('vino')) return 'wine_bar';
  if (text.includes('bakery') || text.includes('pasteleria') || text.includes('panaderia')) return 'bakery_cafe';
  if (text.includes('cafe bar') || typeHint === 'cafe_bar') return 'cafe_bar';
  if (all.has('cafe') || all.has('coffee_shop')) return 'cafe';
  if (text.includes('parrilla')) return 'parrilla';
  if (text.includes('bistro')) return 'bistro';
  if (all.has('bar')) return 'bar';
  if (all.has('restaurant')) return 'restaurant';
  return typeHint;
}

function scoreGooglePresence(candidate: Candidate): number {
  const checks = [
    candidate.place_id,
    candidate.coordinates,
    candidate.google_maps_url,
    candidate.rating,
    candidate.review_count,
    candidate.google_place_types.length > 0,
  ];
  return checks.filter(Boolean).length / checks.length;
}

function scoreReviewVolume(reviewCount?: number): number {
  if (!reviewCount) return 0;
  if (reviewCount < 20) return 0.1;
  if (reviewCount < 80) return 0.55;
  if (reviewCount < 1200) return 1;
  if (reviewCount < 3500) return 0.82;
  return 0.65;
}

function scoreVisualStrength(candidate: Candidate): number {
  if (candidate.photo_count === 0) return 0;
  let score = 0.45;
  if (candidate.photo_count >= 3) score += 0.25;
  if (candidate.max_photo_dimension >= 1024) score += 0.2;
  if (candidate.website_url) score += 0.1;
  return Math.min(1, score);
}

function scoreCategoryFit(candidate: Candidate): number {
  if (!ALLOWED_TYPES.includes(candidate.type)) return 0;
  if (candidate.type === 'cocktail_bar' || candidate.type === 'wine_bar' || candidate.type === 'cafe_bar' || candidate.type === 'rooftop_bar') return 1;
  if (candidate.type === 'cafe' || candidate.type === 'bar' || candidate.type === 'bistro') return 0.9;
  return 0.82;
}

function scoreAtmospherePotential(candidate: Candidate): number {
  const haystack = normalizeName(`${candidate.name} ${candidate.type} ${candidate.google_place_types.join(' ')} ${candidate.source_signals.join(' ')}`);
  let score = 0.35;
  if (ATMOSPHERE_TERMS.some((term) => haystack.includes(normalizeName(term)))) score += 0.3;
  if (candidate.website_url) score += 0.15;
  if (candidate.curated_boost) score += 0.15;
  if (candidate.type === 'speakeasy' || candidate.type === 'rooftop_bar' || candidate.type === 'wine_bar') score += 0.1;
  return Math.min(1, score);
}

function scoreSourceDiversity(candidate: Candidate): number {
  return Math.min(1, new Set(candidate.source_signals).size / 5);
}

function scoreLocalIdentity(candidate: Candidate): number {
  const haystack = normalizeName(`${candidate.name} ${candidate.type} ${candidate.google_place_types.join(' ')} ${candidate.source_signals.join(' ')}`);
  let score = 0.25;
  if (candidate.website_url) score += 0.2;
  if (LOCAL_IDENTITY_TERMS.some((term) => haystack.includes(normalizeName(term)))) score += 0.25;
  if (candidate.source_signals.includes('local_identity_signal')) score += 0.2;
  if (candidate.curated_boost) score += 0.15;
  if (candidate.review_count && candidate.review_count >= 40 && candidate.review_count <= 1800) score += 0.1;
  if (candidate.review_count && candidate.review_count > 5000) score -= 0.15;
  return Math.max(0, Math.min(1, score));
}

function scoreEditorialDiscovery(candidate: Candidate): number {
  const haystack = normalizeName(`${candidate.name} ${candidate.type} ${candidate.search_queries.join(' ')} ${candidate.source_signals.join(' ')}`);
  let score = 0.15;
  if (candidate.source_signals.includes('editorial_discovery_query')) score += 0.35;
  if (EDITORIAL_DISCOVERY_TERMS.some((term) => haystack.includes(normalizeName(term)))) score += 0.25;
  if (candidate.type === 'cocktail_bar' || candidate.type === 'speakeasy' || candidate.type === 'wine_bar' || candidate.type === 'cafe_bar') score += 0.15;
  if (candidate.type === 'restaurant' && !candidate.source_signals.includes('atmosphere_query')) score -= 0.1;
  return Math.max(0, Math.min(1, score));
}

function scoreGenericChainPenalty(candidate: Candidate): number {
  let penalty = 0;
  if (matchesAnyTerm(candidate.name, SOFT_CHAIN_TERMS)) penalty += 0.55;
  if (candidate.source_signals.includes('soft_chain_review_required')) penalty += 0.25;
  if (candidate.review_count && candidate.review_count > 7000 && (candidate.type === 'cafe' || candidate.type === 'bakery_cafe')) penalty += 0.2;
  if (candidate.google_place_types.includes('store') && !candidate.website_url) penalty += 0.1;
  return Math.min(1, penalty);
}

function candidateQualitySignals(name: string, type: SeedType, googleTypes: string[], query: string): string[] {
  const haystack = normalizeName(`${name} ${type} ${googleTypes.join(' ')} ${query}`);
  const signals: string[] = [];
  if (LOCAL_IDENTITY_TERMS.some((term) => haystack.includes(normalizeName(term)))) signals.push('local_identity_signal');
  if (EDITORIAL_DISCOVERY_TERMS.some((term) => haystack.includes(normalizeName(term)))) signals.push('editorial_discovery_query');
  if (haystack.includes('atmosphere') || haystack.includes('design') || haystack.includes('romantic')) signals.push('atmosphere_query');
  if (matchesAnyTerm(name, SOFT_CHAIN_TERMS)) signals.push('soft_chain_review_required');
  return signals;
}

function matchesAnyTerm(value: string, terms: string[]): boolean {
  const normalized = normalizeName(value);
  return terms.some((term) => normalized.includes(normalizeName(term)));
}

function buildSelectionReason(candidate: Candidate, scores: CandidateScores, candidateScore: number): string {
  return [
    `score=${candidateScore}`,
    `google=${scores.google_presence_score.toFixed(2)}`,
    `visual=${scores.visual_strength_score.toFixed(2)}`,
    `category=${scores.category_fit_score.toFixed(2)}`,
    `atmosphere=${scores.atmosphere_potential_score.toFixed(2)}`,
    `local=${scores.local_identity_score.toFixed(2)}`,
    `editorial=${scores.editorial_discovery_score.toFixed(2)}`,
    scores.generic_chain_penalty > 0 ? `generic_penalty=${scores.generic_chain_penalty.toFixed(2)}` : '',
    candidate.curated_boost ? 'curated_boost' : '',
  ].filter(Boolean).join('; ');
}

function isIrrelevantCategory(candidate: Candidate): boolean {
  const types = candidate.google_place_types;
  const hasVenueSignal = types.some((type) => [
    'bar',
    'cocktail_bar',
    'lounge_bar',
    'night_club',
    'restaurant',
    'cafe',
    'coffee_shop',
    'bakery',
    'brunch_restaurant',
    'breakfast_restaurant',
    'wine_bar',
    'food',
  ].includes(type));
  if (hasVenueSignal && ALLOWED_TYPES.includes(candidate.type)) return false;
  const irrelevant = ['lodging', 'hotel', 'meal_delivery', 'meal_takeaway', 'fast_food_restaurant', 'supermarket'];
  return types.some((type) => irrelevant.includes(type));
}

function countBy<T>(items: T[], getter: (item: T) => string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const key = getter(item) || 'unknown';
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

function entriesOrNone(values: Record<string, number>): string[] {
  const entries = Object.entries(values);
  return entries.length > 0 ? entries.map(([key, value]) => `- ${key}: ${value}`) : ['- none'];
}

function emptyScores(): CandidateScores {
  return {
    google_presence_score: 0,
    review_volume_score: 0,
    visual_strength_score: 0,
    category_fit_score: 0,
    neighborhood_balance_score: 0,
    atmosphere_potential_score: 0,
    source_diversity_score: 0,
    local_identity_score: 0,
    editorial_discovery_score: 0,
    generic_chain_penalty: 0,
  };
}

function cleanVenueName(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function normalizeNeighborhood(value: string, neighborhoods: string[] = DEFAULT_NEIGHBORHOODS): string {
  const normalized = normalizeName(value);
  const match = neighborhoods.find((neighborhood) => normalizeName(neighborhood) === normalized);
  return match || value.trim();
}

function normalizeName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function existingKey(name: string, neighborhood: string): string {
  return `${normalizeName(name)}|${normalizeName(neighborhood)}`;
}

function nameCityKey(name: string, city: string): string {
  return `${normalizeName(name)}|${normalizeName(city)}`;
}

function extractAliases(row: Record<string, unknown>, canonical: Record<string, unknown>): string[] {
  const rawAliases = [
    row.aliases,
    row.known_aliases,
    canonical.aliases,
    canonical.known_aliases,
  ];
  return rawAliases.flatMap((value) => Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []);
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function createSupabaseReadOnlyClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function parseOptions(args: string[]): SelectorOptions {
  const countArg = valueAfter(args, '--count');
  const city = valueAfter(args, '--city') || DEFAULT_CITY;
  const neighborhoods = parseList(valueAfter(args, '--neighborhoods')) || DEFAULT_NEIGHBORHOODS;
  const typeMix = parseTypeMix(valueAfter(args, '--type-mix')) || DEFAULT_TYPE_MIX;
  return {
    count: countArg ? Number(countArg) : 50,
    city,
    neighborhoods,
    typeMix,
    continuePipeline: args.includes('--continue'),
    forcePipeline: !args.includes('--resume-pipeline'),
    allowTypeFallback: args.includes('--allow-type-fallback'),
    maxQueries: valueAfter(args, '--max-queries') ? Number(valueAfter(args, '--max-queries')) : undefined,
    maxSourceQueries: valueAfter(args, '--max-source-queries') ? Number(valueAfter(args, '--max-source-queries')) : undefined,
    skipEditorialSources: args.includes('--skip-editorial-sources'),
    planOnly: args.includes('--plan'),
  };
}

function parseList(value: string | undefined): string[] | undefined {
  if (!value) return undefined;
  const items = value.split(',').map((item) => item.trim()).filter(Boolean);
  return items.length > 0 ? items : undefined;
}

function parseTypeMix(value: string | undefined): Record<string, number> | undefined {
  if (!value) return undefined;
  const entries = value.split(',').map((item) => item.trim()).filter(Boolean);
  const mix: Record<string, number> = {};
  for (const entry of entries) {
    const [key, rawValue] = entry.split('=').map((item) => item.trim());
    const parsed = Number(rawValue);
    if (!key || !Number.isFinite(parsed) || parsed < 0) return undefined;
    const normalizedKey = normalizeTypeMixGroup(key);
    if (!normalizedKey) return undefined;
    mix[normalizedKey] = (mix[normalizedKey] || 0) + parsed;
  }
  return Object.keys(mix).length > 0 ? mix : undefined;
}

function normalizeTypeMixGroup(value: string): string | undefined {
  const key = normalizeName(value);
  if (['cafe', 'cafes', 'bakery_cafe', 'bakery_cafes'].includes(key)) return 'cafes';
  if (['restaurant', 'restaurants', 'bistro', 'bistros', 'parrilla', 'parrillas'].includes(key)) return 'restaurants';
  if (['bar', 'bars'].includes(key)) return 'bars';
  if (['cocktail', 'cocktails', 'cocktail_bar', 'cocktail_bars', 'speakeasy', 'speakeasies'].includes(key)) return 'cocktails';
  if (['wine', 'wine_bar', 'wine_bars'].includes(key)) return 'wine';
  if (['hybrid', 'hybrids', 'cafe_bar', 'cafe_bars'].includes(key)) return 'hybrids';
  if (['rooftop', 'rooftops', 'rooftop_bar', 'rooftop_bars', 'terrace', 'terraces', 'skyline', 'skyline_bars'].includes(key)) return 'rooftops';
  return undefined;
}

function regionCodeForCity(city: string): string {
  const normalized = normalizeName(city);
  if (normalized.includes('new york') || normalized.includes('nyc') || normalized.includes('united states')) return 'US';
  if (normalized.includes('buenos aires') || normalized.includes('argentina')) return 'AR';
  return 'US';
}

function valueAfter(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

function escapeTable(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

const currentFile = path.resolve(fileURLToPath(import.meta.url));
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : '';

if (currentFile === invokedFile) {
  const batchName = process.argv[2];
  if (!batchName) {
    console.error('Usage: npx tsx pipeline/stages/00_build_venue_seed.ts <batch_id> [--count 50] [--city "Buenos Aires"] [--neighborhoods "Palermo,Recoleta"] [--type-mix "cafes=12,restaurants=10,bars=10,cocktails=8,wine=5,hybrids=5"] [--continue] [--plan] [--max-queries N] [--max-source-queries N] [--skip-editorial-sources] [--resume-pipeline] [--allow-type-fallback]');
    process.exitCode = 1;
  } else {
    buildVenueSeed(batchName, parseOptions(process.argv.slice(3))).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Stage 00 venue seed failed: ${message}`);
      process.exitCode = 1;
    });
  }
}
