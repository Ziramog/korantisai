import * as path from 'path';
import './script_env';
import { writeFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

type VenueRow = {
  id: string;
  name: string;
  curation_status?: string | null;
  hero_image?: string | null;
};

type ImageRow = {
  id: string;
  venue_id: string;
  is_cover?: boolean | null;
  role?: string | null;
  url?: string | null;
  secure_url?: string | null;
  public_id?: string | null;
};

const DATA_DIR = path.join(__dirname, '..', '..', 'data');

function createSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or Supabase key.');
  }

  return createClient(url, key, { auth: { persistSession: false } });
}

function groupImages(images: ImageRow[]) {
  const grouped = new Map<string, ImageRow[]>();
  for (const image of images) {
    const rows = grouped.get(image.venue_id) || [];
    rows.push(image);
    grouped.set(image.venue_id, rows);
  }
  return grouped;
}

async function selectVenueImages(supabase: ReturnType<typeof createSupabase>, venueIds: string[]) {
  const preferred = await supabase
    .from('venue_images')
    .select('id, venue_id, is_cover, role, url, secure_url, public_id')
    .in('venue_id', venueIds);

  if (!preferred.error) return (preferred.data || []) as ImageRow[];

  const legacy = await supabase
    .from('venue_images')
    .select('id, venue_id, is_cover')
    .in('venue_id', venueIds);

  if (legacy.error) throw new Error(`Unable to read venue_images: ${legacy.error.message}`);
  return (legacy.data || []) as ImageRow[];
}

async function main() {
  const supabase = createSupabase();
  const { data: venues, error: venueError } = await supabase
    .from('venues')
    .select('*')
    .order('name');

  if (venueError) throw new Error(`Unable to read public.venues: ${venueError.message}`);

  const venueRows = (venues || []) as VenueRow[];
  const activeVenues = venueRows.filter((venue) => !venue.curation_status || venue.curation_status === 'active');
  const images = await selectVenueImages(supabase, venueRows.map((venue) => venue.id));
  const imagesByVenue = groupImages(images);

  const rows = venueRows.map((venue) => {
    const venueImages = imagesByVenue.get(venue.id) || [];
    const hasCloudinary = venueImages.some((image) => Boolean(image.secure_url || image.url || image.public_id));
    const hasHero = Boolean(venue.hero_image) || venueImages.some((image) => image.role === 'hero' || image.is_cover);
    const hasCard = venueImages.some((image) => image.role === 'card');
    const hasGallery = venueImages.some((image) => image.role === 'gallery') || venueImages.length > 0;
    const usesFallback = !venue.hero_image && venueImages.length === 0;

    return {
      id: venue.id,
      name: venue.name,
      curation_status: venue.curation_status || 'active',
      image_count: venueImages.length,
      has_venue_images: venueImages.length > 0,
      has_cloudinary_image: hasCloudinary,
      uses_legacy_venue_images_proxy: venueImages.length > 0 && !hasCloudinary,
      has_hero_image: hasHero,
      has_card_image: hasCard,
      has_gallery_images: hasGallery,
      uses_invernadero_fallback: usesFallback,
      missing_cloudinary_public_id_count: venueImages.filter((image) => !image.public_id).length,
    };
  });

  const activeRows = rows.filter((row) => row.curation_status === 'active');
  const totals = {
    total_public_venues: venueRows.length,
    active_public_venues: activeVenues.length,
    venues_with_venue_images: activeRows.filter((row) => row.has_venue_images).length,
    venues_without_venue_images: activeRows.filter((row) => !row.has_venue_images).length,
    venues_with_hero_image: activeRows.filter((row) => row.has_hero_image).length,
    venues_with_card_image: activeRows.filter((row) => row.has_card_image).length,
    venues_with_gallery_images: activeRows.filter((row) => row.has_gallery_images).length,
    venues_using_invernadero_fallback: activeRows.filter((row) => row.uses_invernadero_fallback).length,
    venues_using_legacy_venue_images_proxy: activeRows.filter((row) => row.uses_legacy_venue_images_proxy).length,
    images_missing_cloudinary_public_id: activeRows.reduce((sum, row) => sum + row.missing_cloudinary_public_id_count, 0),
  };

  const payload = { generated_at: new Date().toISOString(), totals, venues: rows };
  writeFileSync(path.join(DATA_DIR, 'public_venue_image_audit.json'), JSON.stringify(payload, null, 2));

  const report = [
    '# Public Venue Image Audit',
    '',
    `Generated: ${payload.generated_at}`,
    '',
    '## Totals',
    '',
    `- Total public venues: ${totals.total_public_venues}`,
    `- Active public venues: ${totals.active_public_venues}`,
    `- Active venues with venue_images: ${totals.venues_with_venue_images}`,
    `- Active venues without venue_images: ${totals.venues_without_venue_images}`,
    `- Active venues with hero image: ${totals.venues_with_hero_image}`,
    `- Active venues with card image: ${totals.venues_with_card_image}`,
    `- Active venues with gallery images: ${totals.venues_with_gallery_images}`,
    `- Active venues using /venue_invernadero.png fallback: ${totals.venues_using_invernadero_fallback}`,
    `- Active venues using legacy /api/venue-images proxy: ${totals.venues_using_legacy_venue_images_proxy}`,
    `- Active image rows missing Cloudinary public_id: ${totals.images_missing_cloudinary_public_id}`,
    '',
    '## Fallback Venues',
    '',
    ...activeRows
      .filter((row) => row.uses_invernadero_fallback)
      .map((row) => `- ${row.name} (${row.id})`),
    '',
    '## Legacy Proxy Venues',
    '',
    ...activeRows
      .filter((row) => row.uses_legacy_venue_images_proxy)
      .map((row) => `- ${row.name} (${row.id})`),
    '',
  ].join('\n');

  writeFileSync(path.join(DATA_DIR, 'public_venue_image_audit.md'), report);
  console.log(report);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
