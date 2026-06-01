import './script_env';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { buildVenueImagePublicId } from './cloudinary_utils';

export const DATA_DIR = path.join(process.cwd(), 'data');

export type PublicVenue = {
  id: string;
  name: string;
  category: string | null;
  location?: string | null;
};

export type VenueImage = {
  id: string;
  venue_id: string;
  photo_reference?: string | null;
  google_photo_reference?: string | null;
  role?: string | null;
  sort_order?: number | null;
  source?: string | null;
  url?: string | null;
  secure_url?: string | null;
  public_id?: string | null;
  is_cover?: boolean | null;
  quality_score?: number | null;
  hero_suitability_score?: number | null;
  width?: number | null;
  height?: number | null;
};

export type PhotoVision = {
  photo_reference: string;
  interior_visible?: boolean;
  exterior_visible?: boolean;
  seating_visible?: boolean;
  people_staying_visible?: boolean;
  product_only?: boolean;
  storefront_only?: boolean;
  menu_only?: boolean;
  counter_only?: boolean;
  spatial_depth_score?: number;
  design_quality_score?: number;
  atmosphere_score?: number;
  hero_suitability_score?: number;
  card_suitability_score?: number;
  warnings?: string[];
};

export type VenueVision = {
  google_place_id?: string;
  venue_name: string;
  photo_results?: PhotoVision[];
};

export type GalleryStatus =
  | 'gallery_good'
  | 'gallery_acceptable'
  | 'interior_weak'
  | 'seating_weak'
  | 'product_heavy'
  | 'storefront_heavy'
  | 'metadata_missing'
  | 'manual_image_needed'
  | 'alternative_photo_source_needed'
  | 'fallback_unresolved';

export type GalleryAuditVenue = {
  venue_id: string;
  venue_name: string;
  category: string | null;
  gallery_count: number;
  hero_exists: boolean;
  card_exists: boolean;
  interior_visible_count: number;
  seating_visible_count: number;
  atmosphere_high_quality_count: number;
  product_menu_only_count: number;
  storefront_only_count: number;
  metadata_missing_count: number;
  weak_interior_warning: boolean;
  weak_seating_warning: boolean;
  duplicate_risk: boolean;
  fallback_status: 'ok' | 'fallback_unresolved';
  statuses: GalleryStatus[];
  existing_photo_refs: string[];
};

export type EnrichmentPhotoRef = {
  venue_id: string;
  venue_name: string;
  category: string | null;
  source: 'existing_vision' | 'missing_venue_photo_refs' | 'publish_candidate_photo_refs' | 'google_enrichment';
  google_photo_reference: string;
  width?: number | null;
  height?: number | null;
  vision?: PhotoVision | null;
  already_in_venue_images: boolean;
  needs_vision: boolean;
  reason: string;
};

export type SelectedGalleryAsset = EnrichmentPhotoRef & {
  selected_role: 'gallery';
  sort_order: number;
  selection_score: number;
  selection_reason?: string;
};

export type MaterializedGalleryAsset = SelectedGalleryAsset & {
  status: 'dry_run' | 'uploaded' | 'error';
  url?: string;
  secure_url?: string;
  public_id?: string;
  bytes?: number;
  format?: string;
  error?: string;
};

export function readJson<T>(file: string, fallback: T): T {
  const fullPath = path.isAbsolute(file) ? file : path.join(process.cwd(), file);
  if (!existsSync(fullPath)) return fallback;
  return JSON.parse(readFileSync(fullPath, 'utf8')) as T;
}

export function writeJsonMd(jsonFile: string, mdFile: string, payload: unknown, markdown: string) {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(path.join(DATA_DIR, jsonFile), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  writeFileSync(path.join(DATA_DIR, mdFile), `${markdown}\n`, 'utf8');
}

export function escapeMd(value: unknown) {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

export function normalizeName(value: string | null | undefined) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function createSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase service env vars.');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function loadPublicImageState() {
  const supabase = createSupabase();
  const { data: venues, error: venuesError } = await supabase
    .from('venues')
    .select('id,name,category,location')
    .order('name');
  if (venuesError) throw venuesError;

  const venueIds = ((venues || []) as PublicVenue[]).map((venue) => venue.id);
  const { data: images, error: imagesError } = await supabase
    .from('venue_images')
    .select('id,venue_id,photo_reference,google_photo_reference,role,sort_order,source,url,secure_url,public_id,is_cover,quality_score,hero_suitability_score,width,height')
    .in('venue_id', venueIds);
  if (imagesError) throw imagesError;

  const imagesByVenue = new Map<string, VenueImage[]>();
  for (const image of (images || []) as VenueImage[]) {
    const rows = imagesByVenue.get(image.venue_id) || [];
    rows.push(image);
    imagesByVenue.set(image.venue_id, rows);
  }

  return {
    venues: (venues || []) as PublicVenue[],
    images: (images || []) as VenueImage[],
    imagesByVenue,
  };
}

export function loadVisionMetadata() {
  const files = [
    'data/controlled_batch_50_photo_vision.json',
    'data/controlled_batch_50_repaired_photo_vision.json',
    'data/controlled_batch_30_photo_vision.json',
    'data/controlled_batch_30_repaired_photo_vision.json',
    'data/venue_intelligence_photo_vision_results.json',
    'data/venue_intelligence_additional_photo_vision_results.json',
    'data/gallery_enrichment_photo_vision.json',
  ];

  const byRef = new Map<string, PhotoVision>();
  const byVenueId = new Map<string, VenueVision[]>();
  const byVenueName = new Map<string, VenueVision[]>();

  for (const file of files) {
    const payload = readJson<{ venues?: VenueVision[] }>(file, { venues: [] });
    for (const venue of payload.venues || []) {
      if (venue.google_place_id) {
        const current = byVenueId.get(venue.google_place_id) || [];
        current.push(venue);
        byVenueId.set(venue.google_place_id, current);
      }
      const nameKey = normalizeName(venue.venue_name);
      if (nameKey) {
        const current = byVenueName.get(nameKey) || [];
        current.push(venue);
        byVenueName.set(nameKey, current);
      }
      for (const photo of venue.photo_results || []) {
        byRef.set(photo.photo_reference, photo);
      }
    }
  }

  return { byRef, byVenueId, byVenueName };
}

export function imageRef(image: VenueImage) {
  return image.google_photo_reference || image.photo_reference || '';
}

export function isFallbackImage(image: VenueImage) {
  return Boolean((image.secure_url || image.url || '').includes('/venue_invernadero.png'));
}

export function isCloudinaryImage(image: VenueImage) {
  return Boolean((image.secure_url || image.url || '').startsWith('https://res.cloudinary.com/'));
}

export function photoEditorialScore(photo: PhotoVision | null | undefined) {
  if (!photo) return 0;
  let score = 0;
  if (photo.interior_visible) score += 30;
  if (photo.seating_visible) score += 25;
  if (photo.people_staying_visible) score += 15;
  score += Math.round((photo.atmosphere_score || 0) * 0.18);
  score += Math.round((photo.spatial_depth_score || 0) * 0.08);
  score += Math.round((photo.design_quality_score || 0) * 0.06);
  if (photo.product_only) score -= 35;
  if (photo.menu_only) score -= 35;
  if (photo.storefront_only && !photo.interior_visible) score -= 30;
  return Math.max(0, Math.min(100, score));
}

export function classifyAuditVenue(
  venue: PublicVenue,
  images: VenueImage[],
  visionByRef: Map<string, PhotoVision>,
): GalleryAuditVenue {
  const galleryImages = images.filter((image) => image.role === 'gallery');
  const heroExists = images.some((image) => image.role === 'hero' && (image.secure_url || image.url));
  const cardExists = images.some((image) => image.role === 'card' && (image.secure_url || image.url));
  const fallbackStatus = images.some(isFallbackImage) || images.length === 0 ? 'fallback_unresolved' : 'ok';
  const seenRefs = new Set<string>();
  let duplicateRisk = false;
  let interiorVisibleCount = 0;
  let seatingVisibleCount = 0;
  let atmosphereHighQualityCount = 0;
  let productMenuOnlyCount = 0;
  let storefrontOnlyCount = 0;
  let metadataMissingCount = 0;

  for (const image of galleryImages) {
    const ref = imageRef(image);
    if (ref) {
      if (seenRefs.has(ref)) duplicateRisk = true;
      seenRefs.add(ref);
    }

    const vision = ref ? visionByRef.get(ref) : undefined;
    if (!vision) {
      metadataMissingCount++;
      continue;
    }
    if (vision.interior_visible) interiorVisibleCount++;
    if (vision.seating_visible) seatingVisibleCount++;
    if ((vision.atmosphere_score || 0) >= 70 || photoEditorialScore(vision) >= 65) atmosphereHighQualityCount++;
    if (vision.product_only || vision.menu_only) productMenuOnlyCount++;
    if (vision.storefront_only && !vision.interior_visible) storefrontOnlyCount++;
  }

  const weakInteriorWarning = galleryImages.length > 0 && interiorVisibleCount === 0;
  const weakSeatingWarning = galleryImages.length > 0 && seatingVisibleCount === 0;
  const statuses = new Set<GalleryStatus>();

  if (fallbackStatus === 'fallback_unresolved') statuses.add('fallback_unresolved');
  if (metadataMissingCount > 0) statuses.add('metadata_missing');
  if (weakInteriorWarning) statuses.add('interior_weak');
  if (weakSeatingWarning) statuses.add('seating_weak');
  if (productMenuOnlyCount >= Math.max(2, Math.ceil(galleryImages.length / 2))) statuses.add('product_heavy');
  if (storefrontOnlyCount >= Math.max(2, Math.ceil(galleryImages.length / 2))) statuses.add('storefront_heavy');
  if (fallbackStatus === 'fallback_unresolved' && galleryImages.length === 0) statuses.add('manual_image_needed');
  if (fallbackStatus === 'fallback_unresolved') statuses.add('alternative_photo_source_needed');
  if (statuses.size === 0 && interiorVisibleCount >= 2 && seatingVisibleCount >= 1 && atmosphereHighQualityCount >= 3) statuses.add('gallery_good');
  if (statuses.size === 0) statuses.add('gallery_acceptable');

  return {
    venue_id: venue.id,
    venue_name: venue.name,
    category: venue.category,
    gallery_count: galleryImages.length,
    hero_exists: heroExists,
    card_exists: cardExists,
    interior_visible_count: interiorVisibleCount,
    seating_visible_count: seatingVisibleCount,
    atmosphere_high_quality_count: atmosphereHighQualityCount,
    product_menu_only_count: productMenuOnlyCount,
    storefront_only_count: storefrontOnlyCount,
    metadata_missing_count: metadataMissingCount,
    weak_interior_warning: weakInteriorWarning,
    weak_seating_warning: weakSeatingWarning,
    duplicate_risk: duplicateRisk,
    fallback_status: fallbackStatus,
    statuses: Array.from(statuses),
    existing_photo_refs: images.map(imageRef).filter(Boolean),
  };
}

export function buildGalleryPublicId(venueName: string, index: number) {
  return buildVenueImagePublicId('Buenos Aires', venueName, 'gallery-enrichment', index);
}
