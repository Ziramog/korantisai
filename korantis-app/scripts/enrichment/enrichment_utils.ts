import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { categoryDisplayLabel, isNormalizedVenueCategory, type NormalizedVenueCategory } from '../../src/lib/categories/venueCategories';

export type PublicVenue = {
  id: string;
  name: string;
  category: string;
  location?: string;
  heroImage?: string;
  cardImage?: string;
  imageUrl?: string;
  galleryImages?: Array<{ src?: string; source?: string }>;
};

export type BatchCandidate = {
  candidate_id: string;
  venue_name: string;
  category: string;
  district: string;
  merged_sources?: Array<{ category?: string; context?: string; source?: string; source_url?: string }>;
};

export type GoogleRecord = {
  candidate_id: string;
  candidate_name: string;
  category: string;
  district: string;
  status: string;
  google_place_id?: string | null;
  google_data?: GoogleData | null;
  match?: {
    match_confidence?: number;
    match_warnings?: string[];
    match_reasons?: string[];
  } | null;
};

export type GoogleData = {
  id?: string;
  displayName?: { text?: string };
  primaryType?: string | null;
  types?: string[];
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  regularOpeningHours?: unknown;
  priceLevel?: string | null;
  rating?: number | null;
  userRatingCount?: number | null;
  photos?: Array<{
    name?: string;
    widthPx?: number;
    heightPx?: number;
    authorAttributions?: unknown[];
  }>;
};

export type IntelligenceOutput = {
  venue_name: string;
  candidate_id: string;
  google_place_id?: string | null;
  category: string;
  district: string;
  match_status?: string;
  scores?: Record<string, number>;
  signals?: Record<string, number>;
  intent_scores?: Record<string, number>;
  photo_intelligence?: {
    acceptable_hero_photo?: boolean;
    hero_photo_reference?: string | null;
    best_card_photo_reference?: string | null;
    photo_quality_score?: number;
    evaluation_status?: string;
    warnings?: string[];
  };
  eligibility?: {
    status?: string;
    reasons?: string[];
    warnings?: string[];
  };
};

export type VisionVenue = {
  candidate_id: string;
  google_place_id?: string;
  venue_name: string;
  vision_status: string;
  photos_available?: number;
  photos_evaluated?: number;
  photo_results?: Array<{
    photo_reference: string;
    width?: number;
    height?: number;
    atmosphere_score?: number;
    hero_suitability_score?: number;
    card_suitability_score?: number;
    interior_visible?: boolean;
    seating_visible?: boolean;
    people_staying_visible?: boolean;
    product_only?: boolean;
    storefront_only?: boolean;
    menu_only?: boolean;
    warnings?: string[];
  }>;
  aggregation?: {
    acceptable_hero_photo?: boolean;
    photo_quality_score?: number;
    warnings?: string[];
  };
};

export type CategoryProposal = {
  venue: string;
  current_category: string;
  proposed_normalized_category: string;
  proposed_display_category_en: string;
  proposed_display_category_es: string;
  confidence: number;
  reasons: string[];
  warnings: string[];
};

export type PublishReadyFile = {
  ready?: Array<{ venue: string; already_public?: boolean }>;
  not_ready?: Array<{ venue: string; reasons?: string[] }>;
};

export type ImageVerificationVenue = {
  id: string;
  name: string;
  hero_source?: string;
  card_source?: string;
  image_url_source?: string;
  gallery_count?: number;
  gallery_cloudinary_count?: number;
  has_gallery?: boolean;
  uses_cloudinary?: boolean;
  uses_legacy_proxy?: boolean;
  uses_fallback?: boolean;
  has_hero_or_card?: boolean;
};

export function dataPath(file: string) {
  return path.join(process.cwd(), 'data', file);
}

export async function ensureDataDir() {
  await mkdir(path.join(process.cwd(), 'data'), { recursive: true });
}

export async function readJson<T>(file: string, fallback?: T): Promise<T> {
  try {
    return JSON.parse(await readFile(path.isAbsolute(file) ? file : path.join(process.cwd(), file), 'utf8')) as T;
  } catch (error) {
    if (fallback !== undefined) return fallback;
    throw error;
  }
}

export async function writeJsonAndMarkdown(jsonFile: string, markdownFile: string, payload: unknown, markdown: string) {
  await ensureDataDir();
  await writeFile(dataPath(jsonFile), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  await writeFile(dataPath(markdownFile), `${markdown}\n`, 'utf8');
}

export function normalizeName(value: string | null | undefined) {
  return (value || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function slugify(value: string) {
  return normalizeName(value).replace(/\s+/g, '-').slice(0, 80) || 'venue';
}

export function fallbackCategoryProposal(venue: string, category: string): CategoryProposal {
  const key = normalizeName(category).replace(/\s+/g, '_');
  const text = normalizeName(`${venue} ${category}`);
  const hintedCategory =
    text.includes('wine') ? 'wine_bar'
      : text.includes('cocktail') || text.includes('speakeasy') || text.includes('vault') ? 'cocktail_bar'
        : text.includes('parrilla') ? 'parrilla'
          : text.includes('bakery') ? 'bakery_cafe'
            : text.includes('brunch') ? 'brunch'
              : text.includes('classic') || text.includes('historic') || text.includes('confiteria') ? 'classic_cafe'
                : text.includes('specialty') || text.includes('roastery') || text.includes('coffee') ? 'specialty_cafe'
                  : text.includes('cafe') ? 'cafe'
                    : text.includes('fusion') || text.includes('cuisine') || text.includes('restaurant') ? 'restaurant'
                      : null;
  const normalized: NormalizedVenueCategory | null = isNormalizedVenueCategory(key)
    ? key
    : hintedCategory && isNormalizedVenueCategory(hintedCategory)
      ? hintedCategory
    : null;

  if (normalized) {
    return {
      venue,
      current_category: category,
      proposed_normalized_category: normalized,
      proposed_display_category_en: categoryDisplayLabel(normalized, 'en'),
      proposed_display_category_es: categoryDisplayLabel(normalized, 'es'),
      confidence: 82,
      reasons: isNormalizedVenueCategory(key) ? ['already normalized category'] : ['category inferred from display label'],
      warnings: [],
    };
  }

  return {
    venue,
    current_category: category,
    proposed_normalized_category: 'restaurant',
    proposed_display_category_en: categoryDisplayLabel('restaurant', 'en'),
    proposed_display_category_es: categoryDisplayLabel('restaurant', 'es'),
    confidence: 50,
    reasons: ['no proposal found; default needs review'],
    warnings: ['missing category normalization proposal'],
  };
}

export function escapeMd(value: string | number | null | undefined) {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

export async function loadPublicVenues(): Promise<{ source: string; venues: PublicVenue[] }> {
  const bases = [
    process.env.API_BASE_URL,
    'http://localhost:3000',
    'https://korantis-app.vercel.app',
  ].filter(Boolean) as string[];

  for (const base of bases) {
    try {
      const response = await fetch(`${base.replace(/\/$/, '')}/api/venues`, {
        headers: { accept: 'application/json' },
      });
      if (!response.ok) continue;
      const payload = await response.json() as { venues?: PublicVenue[] };
      if (payload.venues?.length) return { source: `${base}/api/venues`, venues: payload.venues };
    } catch {
      // Try next source.
    }
  }

  return { source: 'unavailable', venues: [] };
}

export async function loadControlledBatch() {
  const [candidatesFile, googleFile, intelligenceFile, primaryVision, repairedVision, proposalsFile, publishReadyFile, verificationFile] = await Promise.all([
    readJson<{ candidates: BatchCandidate[] }>('data/controlled_batch_50_candidates.json'),
    readJson<{ records: GoogleRecord[] }>('data/controlled_batch_50_google_enrichment_repaired.json'),
    readJson<{ outputs: IntelligenceOutput[] }>('data/controlled_batch_50_f4_intelligence.json'),
    readJson<{ venues: VisionVenue[] }>('data/controlled_batch_50_photo_vision.json', { venues: [] }),
    readJson<{ venues: VisionVenue[] }>('data/controlled_batch_50_repaired_photo_vision.json', { venues: [] }),
    readJson<{ proposals: CategoryProposal[] }>('data/category_normalization_proposals.json', { proposals: [] }),
    readJson<PublishReadyFile>('data/publish_ready_candidates.json', { ready: [], not_ready: [] }),
    readJson<{ venues: ImageVerificationVenue[] }>('data/api_cloudinary_cutover_verification.json', { venues: [] }),
  ]);

  const visionById = new Map<string, VisionVenue>();
  for (const vision of primaryVision.venues || []) visionById.set(vision.candidate_id, vision);
  for (const vision of repairedVision.venues || []) visionById.set(vision.candidate_id, vision);

  return {
    candidates: candidatesFile.candidates || [],
    googleRecords: googleFile.records || [],
    intelligence: intelligenceFile.outputs || [],
    visionById,
    proposals: proposalsFile.proposals || [],
    publishReady: publishReadyFile,
    imageVerification: verificationFile.venues || [],
  };
}

export function mapByCandidateId<T extends { candidate_id: string }>(items: T[]) {
  return new Map(items.map((item) => [item.candidate_id, item]));
}

export function mapProposalsByName(proposals: CategoryProposal[]) {
  return new Map(proposals.map((proposal) => [normalizeName(proposal.venue), proposal]));
}

export function mapPublicImagesByName(venues: PublicVenue[], verification: ImageVerificationVenue[]) {
  const map = new Map<string, { cloudinaryHero: boolean; cloudinaryCard: boolean; galleryCount: number; fallback: boolean; publicId?: string }>();

  for (const item of verification) {
    map.set(normalizeName(item.name), {
      cloudinaryHero: item.hero_source === 'cloudinary' || Boolean(item.uses_cloudinary),
      cloudinaryCard: item.card_source === 'cloudinary' || item.image_url_source === 'cloudinary' || Boolean(item.uses_cloudinary),
      galleryCount: item.gallery_cloudinary_count || item.gallery_count || 0,
      fallback: Boolean(item.uses_fallback),
      publicId: item.id,
    });
  }

  for (const venue of venues) {
    const urls = [venue.heroImage, venue.cardImage, venue.imageUrl, ...(venue.galleryImages || []).map((image) => image.src)].filter(Boolean) as string[];
    const cloudinary = urls.some((url) => url.includes('res.cloudinary.com'));
    map.set(normalizeName(venue.name), {
      cloudinaryHero: Boolean(venue.heroImage?.includes('res.cloudinary.com')) || cloudinary,
      cloudinaryCard: Boolean(venue.cardImage?.includes('res.cloudinary.com') || venue.imageUrl?.includes('res.cloudinary.com')) || cloudinary,
      galleryCount: (venue.galleryImages || []).filter((image) => image.src?.includes('res.cloudinary.com')).length,
      fallback: urls.some((url) => url.includes('/venue_invernadero.png')),
      publicId: venue.id,
    });
  }

  return map;
}
