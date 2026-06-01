import { writeFile } from 'node:fs/promises';
import { dataPath, ensureDataDir, escapeMd, normalizeName, readJson } from '../enrichment/enrichment_utils';
import { createServiceSupabaseClient } from '../enrichment/supabase_enrichment_utils';

export const APPROVED_PUBLISH_BATCH = [
  'Blanca Deco and Cafe',
  'Julia',
  'Roux',
  'Anchoita',
  'El Cuartito',
  'Reliquia',
  'Apu Nena',
  'Corte Comedor',
  'Guerrin',
  'Cabaña Las Lilas',
  'Vini Bar',
  'Gran Bar Danzon',
  '878 Bar',
  'Milion',
  'Plaza Bar',
  'Mixtape Bar',
] as const;

export type ApprovedVenueName = typeof APPROVED_PUBLISH_BATCH[number];

export type PublishReadyCandidate = {
  venue: string;
  candidate_id: string;
  district: string;
  normalized_category: string;
  eligibility_status: string;
  match_status: string;
  has_hero: boolean;
  has_card: boolean;
  gallery_count: number;
  category_write_safe: boolean;
  publish_ready: boolean;
  reasons?: string[];
};

export type CategoryMapping = {
  venue: string;
  scope: string;
  current_category: string;
  normalized_category: string;
  display_category_en: string;
  display_category_es: string;
  confidence: number;
  reasons: string[];
  write_safe: boolean;
};

export type GoogleRecord = {
  candidate_id: string;
  candidate_name: string;
  category: string;
  district: string;
  status: string;
  google_place_id?: string | null;
  google_data?: {
    id?: string;
    displayName?: { text?: string };
    formattedAddress?: string;
    location?: { latitude?: number; longitude?: number };
    primaryType?: string | null;
    types?: string[];
    priceLevel?: string | null;
    rating?: number | null;
    userRatingCount?: number | null;
    websiteUri?: string;
    googleMapsUri?: string;
    nationalPhoneNumber?: string;
    internationalPhoneNumber?: string;
  } | null;
  match?: {
    match_confidence?: number;
    match_reasons?: string[];
    match_warnings?: string[];
  } | null;
};

export type IntelligenceOutput = {
  venue_name: string;
  candidate_id: string;
  google_place_id?: string | null;
  city?: string;
  district: string;
  category: string;
  scores?: Record<string, number>;
  intent_scores?: Record<string, number>;
  eligibility?: {
    status?: string;
    reasons?: string[];
    warnings?: string[];
  };
  photo_intelligence?: {
    acceptable_hero_photo?: boolean;
    photo_quality_score?: number;
    hero_photo_reference?: string | null;
    best_card_photo_reference?: string | null;
  };
};

export type CandidateImageAsset = {
  id: string;
  candidate_id: string;
  staging_venue_id?: string | null;
  google_place_id: string;
  venue_name: string;
  city: string;
  district?: string | null;
  normalized_category: string;
  url: string;
  public_id: string;
  role: 'hero' | 'card' | 'gallery' | string;
  sort_order: number;
  source: string;
  google_photo_reference?: string | null;
  width?: number | null;
  height?: number | null;
  quality_score?: number | null;
  hero_suitability_score?: number | null;
};

export type PublicVenueRow = {
  id: string;
  name: string;
  city: string;
  category: string;
  location: string;
  coordinates: { lat: number; lng: number } | null;
  card_size: string;
  spacing: string;
  atmosphere: string;
  quality: number;
  tagline: string;
  narrative: string;
  tags: string[];
  l2_vector: null;
  l3_vector: null;
};

export type ValidationVenue = {
  approved_name: ApprovedVenueName;
  candidate_id: string;
  google_place_id: string;
  public_venue_id: string;
  name: string;
  district: string;
  normalized_category: string;
  display_category_en: string;
  display_category_es: string;
  category_confidence: number;
  eligibility_score: number;
  quality: number;
  atmosphere: string;
  coordinates: { lat: number; lng: number };
  google: {
    rating: number | null;
    userRatingCount: number | null;
    priceLevel: string | null;
    websiteUri: string | null;
    googleMapsUri: string | null;
    nationalPhoneNumber: string | null;
    internationalPhoneNumber: string | null;
    formattedAddress: string | null;
  };
  image_assets: {
    total: number;
    hero: number;
    card: number;
    gallery: number;
    cloudinary: number;
  };
  reasons: string[];
  warnings: string[];
};

export type ValidationOutput = {
  generated_at: string;
  mode: 'validation';
  approved_count: number;
  valid_count: number;
  blocked_count: number;
  public_venues_before: number;
  venues: ValidationVenue[];
  blockers: Array<{ venue: string; reasons: string[] }>;
  warnings: Array<{ venue: string; warnings: string[] }>;
};

export type PublicVenueLookup = {
  id: string;
  name: string;
};

export type VenueImageLookup = {
  id: string;
  venue_id: string;
  public_id?: string | null;
  google_photo_reference?: string | null;
  role?: string | null;
};

type PublishReadyFile = {
  candidates: PublishReadyCandidate[];
};

type CategoryMappingFile = {
  mappings: CategoryMapping[];
};

type GoogleFile = {
  records: GoogleRecord[];
};

type IntelligenceFile = {
  outputs: IntelligenceOutput[];
};

export function approvedNameSet() {
  return new Set<string>(APPROVED_PUBLISH_BATCH.map(normalizeName));
}

export function byNormalizedName<T extends { venue?: string; venue_name?: string; candidate_name?: string; name?: string }>(items: T[]) {
  const map = new Map<string, T>();
  for (const item of items) {
    const name = item.venue || item.venue_name || item.candidate_name || item.name;
    if (name) map.set(normalizeName(name), item);
  }
  return map;
}

export function isCloudinaryUrl(url: string | null | undefined) {
  return Boolean(url?.startsWith('https://res.cloudinary.com/'));
}

export function clampQuality(value: number | undefined) {
  if (!Number.isFinite(value)) return 0.75;
  return Math.max(0, Math.min(1, Number(value) / 100));
}

export function deriveAtmosphere(category: string, intentScores: Record<string, number> | undefined) {
  const scores = intentScores || {};
  const byScore = [
    ['morning', scores.brunch_score || 0],
    ['afternoon', Math.max(scores.reading_score || 0, scores.conversation_score || 0)],
    ['night', Math.max(scores.dinner_score || 0, scores.wine_score || 0, scores.cocktail_score || 0)],
  ] as const;
  const strongest = [...byScore].sort((a, b) => b[1] - a[1])[0];
  if (strongest[1] >= 55) return strongest[0];
  if (category.includes('cocktail') || category.includes('wine') || category === 'bar') return 'night';
  if (category.includes('cafe')) return 'morning';
  return 'afternoon';
}

export function publicVenueFromValidation(venue: ValidationVenue): PublicVenueRow {
  return {
    id: venue.public_venue_id,
    name: venue.name,
    city: 'Buenos Aires',
    category: venue.normalized_category,
    location: venue.district ? `${venue.district}, CABA` : 'Buenos Aires, CABA',
    coordinates: venue.coordinates,
    card_size: 'layered',
    spacing: 'breathe',
    atmosphere: venue.atmosphere,
    quality: venue.quality,
    tagline: '',
    narrative: '',
    tags: [venue.normalized_category],
    l2_vector: null,
    l3_vector: null,
  };
}

export function validationMarkdown(output: ValidationOutput) {
  const lines = [
    '# Publish Batch 16 Validation',
    '',
    `Generated: ${output.generated_at}`,
    '',
    `Approved candidates: ${output.approved_count}`,
    `Valid candidates: ${output.valid_count}`,
    `Blocked candidates: ${output.blocked_count}`,
    `Public venues before publish: ${output.public_venues_before}`,
    '',
    '## Validated Venues',
    '',
    '| Venue | Google Place ID | Category | District | Assets | Rating | Reviews | Price | Warnings |',
    '|---|---|---|---|---:|---:|---:|---|---|',
    ...output.venues.map((venue) => [
      escapeMd(venue.name),
      escapeMd(venue.google_place_id),
      escapeMd(venue.normalized_category),
      escapeMd(venue.district),
      `${venue.image_assets.hero}/${venue.image_assets.card}/${venue.image_assets.gallery}`,
      escapeMd(venue.google.rating ?? 'null'),
      escapeMd(venue.google.userRatingCount ?? 'null'),
      escapeMd(venue.google.priceLevel ?? 'null'),
      escapeMd(venue.warnings.join('; ') || 'none'),
    ].join(' | ')).map((row) => `| ${row} |`),
    '',
    '## Blockers',
    '',
    output.blockers.length
      ? output.blockers.map((blocker) => `- ${blocker.venue}: ${blocker.reasons.join('; ')}`).join('\n')
      : '- none',
    '',
    '## Schema Note',
    '',
    'The live public.venues schema does not include dedicated Google price/contact columns. These values are preserved in validation and availability reports, but not written into public.venues.',
  ];
  return lines.join('\n');
}

export async function loadPublishingInputs() {
  const [readyFile, mappingFile, googleFile, intelligenceFile] = await Promise.all([
    readJson<PublishReadyFile>('data/publish_ready_after_candidate_assets.json'),
    readJson<CategoryMappingFile>('data/category_normalization_publish_mapping.json'),
    readJson<GoogleFile>('data/controlled_batch_50_google_enrichment_repaired.json'),
    readJson<IntelligenceFile>('data/controlled_batch_50_f4_intelligence.json'),
  ]);

  return {
    ready: readyFile.candidates || [],
    mappings: mappingFile.mappings || [],
    googleRecords: googleFile.records || [],
    intelligence: intelligenceFile.outputs || [],
  };
}

export async function loadCandidateImageAssets(candidateIds: string[]) {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from('candidate_image_assets')
    .select('*')
    .in('candidate_id', candidateIds);

  if (error) throw error;
  return (data || []) as CandidateImageAsset[];
}

export async function loadPublicVenueLookup() {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from('venues')
    .select('id,name');

  if (error) throw error;
  return (data || []) as PublicVenueLookup[];
}

export async function writeReport(jsonFile: string, markdownFile: string, payload: unknown, markdown: string) {
  await ensureDataDir();
  await writeFile(dataPath(jsonFile), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  await writeFile(dataPath(markdownFile), `${markdown}\n`, 'utf8');
}

