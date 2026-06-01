import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createServiceSupabaseClient } from '../enrichment/supabase_enrichment_utils';
import { APPROVED_PUBLISH_BATCH } from './publishing_utils';
import { escapeMd, normalizeName } from '../enrichment/enrichment_utils';

type ApiVenue = {
  id: string;
  name: string;
  category?: string;
  heroImage?: string;
  cardImage?: string;
  imageUrl?: string;
  galleryImages?: Array<{ src?: string; source?: string; role?: string }>;
  images?: Array<{ src?: string; source?: string; role?: string }>;
  lat?: number;
  lng?: number;
};

type VenueImageRow = {
  id: string;
  venue_id: string;
  role: string | null;
  url: string | null;
  secure_url: string | null;
  public_id: string | null;
};

const DATA_DIR = path.join(process.cwd(), 'data');

function isCloudinary(value: string | undefined | null) {
  return Boolean(value?.startsWith('https://res.cloudinary.com/'));
}

function isFallback(value: string | undefined | null) {
  return Boolean(value?.includes('/venue_invernadero.png'));
}

function isLegacyProxy(value: string | undefined | null) {
  return Boolean(value?.includes('/api/venue-images/'));
}

function allImageValues(venue: ApiVenue) {
  const gallery = venue.galleryImages || venue.images || [];
  return [venue.heroImage, venue.cardImage, venue.imageUrl, ...gallery.map((image) => image.src)].filter(Boolean) as string[];
}

function summarizeApi(venues: ApiVenue[]) {
  return {
    total_venue_count: venues.length,
    cloudinary_hero_count: venues.filter((venue) => isCloudinary(venue.heroImage)).length,
    cloudinary_image_url_count: venues.filter((venue) => isCloudinary(venue.imageUrl)).length,
    gallery_present_count: venues.filter((venue) => (venue.galleryImages || venue.images || []).length > 0).length,
    fallback_count: venues.filter((venue) => allImageValues(venue).some(isFallback)).length,
    legacy_proxy_count: venues.filter((venue) => allImageValues(venue).some(isLegacyProxy)).length,
  };
}

function apiMarkdown(payload: Awaited<ReturnType<typeof buildApiDebug>>) {
  return [
    '# F.8 Production API Debug',
    '',
    `Generated: ${payload.generated_at}`,
    `API URL: ${payload.api_url}`,
    '',
    '## Summary',
    '',
    `- Total venues: ${payload.summary.total_venue_count}`,
    `- Cloudinary heroImage: ${payload.summary.cloudinary_hero_count}`,
    `- Cloudinary imageUrl: ${payload.summary.cloudinary_image_url_count}`,
    `- Gallery present: ${payload.summary.gallery_present_count}`,
    `- Fallback image usage: ${payload.summary.fallback_count}`,
    `- Legacy proxy usage: ${payload.summary.legacy_proxy_count}`,
    '',
    '## F.8 Approved Venues',
    '',
    '| Venue | In API | Hero Cloudinary | ImageUrl Cloudinary | Gallery | Fallback | Legacy Proxy | Category |',
    '|---|---:|---:|---:|---:|---:|---:|---|',
    ...payload.approved_venues.map((venue) => `| ${escapeMd(venue.name)} | ${venue.in_api ? 'yes' : 'no'} | ${venue.hero_cloudinary ? 'yes' : 'no'} | ${venue.image_url_cloudinary ? 'yes' : 'no'} | ${venue.gallery_count} | ${venue.uses_fallback ? 'yes' : 'no'} | ${venue.uses_legacy_proxy ? 'yes' : 'no'} | ${escapeMd(venue.category || '')} |`),
  ].join('\n');
}

function dbMarkdown(payload: Awaited<ReturnType<typeof buildSupabaseDebug>>) {
  return [
    '# F.8 Supabase State Debug',
    '',
    `Generated: ${payload.generated_at}`,
    '',
    '## Summary',
    '',
    `- Public venues: ${payload.summary.public_venue_count}`,
    `- Total venue_images: ${payload.summary.venue_image_count}`,
    `- F.8 venue_images: ${payload.summary.f8_venue_image_count}`,
    `- F.8 venues with hero: ${payload.summary.f8_with_hero}`,
    `- F.8 venues with card: ${payload.summary.f8_with_card}`,
    `- F.8 venues with gallery: ${payload.summary.f8_with_gallery}`,
    `- F.8 venues with Cloudinary URLs: ${payload.summary.f8_with_cloudinary}`,
    '',
    '## F.8 Venue Image State',
    '',
    '| Venue | Public Row | Hero | Card | Gallery | Cloudinary | Public IDs |',
    '|---|---:|---:|---:|---:|---:|---:|',
    ...payload.venues.map((venue) => `| ${escapeMd(venue.name)} | ${venue.public_row ? 'yes' : 'no'} | ${venue.hero_count} | ${venue.card_count} | ${venue.gallery_count} | ${venue.cloudinary_count} | ${venue.public_id_count} |`),
  ].join('\n');
}

async function writeJsonAndMarkdown(jsonName: string, mdName: string, payload: unknown, markdown: string) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(path.join(DATA_DIR, jsonName), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  await writeFile(path.join(DATA_DIR, mdName), `${markdown}\n`, 'utf8');
}

async function fetchApiVenues(apiBaseUrl: string) {
  const apiUrl = `${apiBaseUrl.replace(/\/$/, '')}/api/venues`;
  const response = await fetch(apiUrl, {
    headers: {
      accept: 'application/json',
      'cache-control': 'no-cache',
      pragma: 'no-cache',
    },
  });
  if (!response.ok) throw new Error(`API fetch failed ${response.status}: ${await response.text()}`);
  const payload = await response.json() as { venues?: ApiVenue[] };
  return { apiUrl, venues: payload.venues || [] };
}

async function buildApiDebug(apiBaseUrl: string) {
  const { apiUrl, venues } = await fetchApiVenues(apiBaseUrl);
  const byName = new Map(venues.map((venue) => [normalizeName(venue.name), venue]));
  const approvedVenues = APPROVED_PUBLISH_BATCH.map((name) => {
    const venue = byName.get(normalizeName(name));
    const imageValues = venue ? allImageValues(venue) : [];
    return {
      name,
      in_api: Boolean(venue),
      id: venue?.id || null,
      category: venue?.category || null,
      heroImage: venue?.heroImage || null,
      imageUrl: venue?.imageUrl || null,
      gallery_count: (venue?.galleryImages || venue?.images || []).length,
      hero_cloudinary: isCloudinary(venue?.heroImage),
      image_url_cloudinary: isCloudinary(venue?.imageUrl),
      gallery_cloudinary_count: (venue?.galleryImages || venue?.images || []).filter((image) => isCloudinary(image.src)).length,
      uses_fallback: imageValues.some(isFallback),
      uses_legacy_proxy: imageValues.some(isLegacyProxy),
    };
  });

  return {
    generated_at: new Date().toISOString(),
    api_base_url: apiBaseUrl,
    api_url: apiUrl,
    summary: summarizeApi(venues),
    approved_venues: approvedVenues,
  };
}

async function buildSupabaseDebug() {
  const supabase = createServiceSupabaseClient();
  const { count: publicVenueCount, error: venueCountError } = await supabase
    .from('venues')
    .select('id', { count: 'exact', head: true });
  if (venueCountError) throw venueCountError;

  const { count: venueImageCount, error: imageCountError } = await supabase
    .from('venue_images')
    .select('id', { count: 'exact', head: true });
  if (imageCountError) throw imageCountError;

  const { data: venuesData, error: venuesError } = await supabase
    .from('venues')
    .select('id,name,category')
    .in('name', [...APPROVED_PUBLISH_BATCH]);
  if (venuesError) throw venuesError;

  const publicRows = (venuesData || []) as Array<{ id: string; name: string; category: string | null }>;
  const ids = publicRows.map((venue) => venue.id);

  const { data: imageData, error: imagesError } = await supabase
    .from('venue_images')
    .select('id,venue_id,role,url,secure_url,public_id')
    .in('venue_id', ids);
  if (imagesError) throw imagesError;

  const images = (imageData || []) as VenueImageRow[];
  const imagesByVenue = new Map<string, VenueImageRow[]>();
  for (const image of images) {
    const current = imagesByVenue.get(image.venue_id) || [];
    current.push(image);
    imagesByVenue.set(image.venue_id, current);
  }

  const publicByName = new Map(publicRows.map((venue) => [normalizeName(venue.name), venue]));
  const venues = APPROVED_PUBLISH_BATCH.map((name) => {
    const publicRow = publicByName.get(normalizeName(name));
    const venueImages = publicRow ? imagesByVenue.get(publicRow.id) || [] : [];
    return {
      name,
      public_row: Boolean(publicRow),
      id: publicRow?.id || null,
      category: publicRow?.category || null,
      image_count: venueImages.length,
      hero_count: venueImages.filter((image) => image.role === 'hero').length,
      card_count: venueImages.filter((image) => image.role === 'card').length,
      gallery_count: venueImages.filter((image) => image.role === 'gallery').length,
      cloudinary_count: venueImages.filter((image) => isCloudinary(image.secure_url || image.url)).length,
      public_id_count: venueImages.filter((image) => image.public_id).length,
    };
  });

  return {
    generated_at: new Date().toISOString(),
    summary: {
      public_venue_count: publicVenueCount || 0,
      venue_image_count: venueImageCount || 0,
      f8_venue_image_count: images.length,
      f8_with_hero: venues.filter((venue) => venue.hero_count > 0).length,
      f8_with_card: venues.filter((venue) => venue.card_count > 0).length,
      f8_with_gallery: venues.filter((venue) => venue.gallery_count > 0).length,
      f8_with_cloudinary: venues.filter((venue) => venue.cloudinary_count > 0).length,
    },
    venues,
  };
}

async function main() {
  const productionApi = await buildApiDebug('https://korantis-app.vercel.app');
  await writeJsonAndMarkdown('f8_production_api_debug.json', 'f8_production_api_debug.md', productionApi, apiMarkdown(productionApi));

  const supabaseState = await buildSupabaseDebug();
  await writeJsonAndMarkdown('f8_supabase_state_debug.json', 'f8_supabase_state_debug.md', supabaseState, dbMarkdown(supabaseState));

  const localApiBase = process.env.LOCAL_API_BASE_URL || 'http://localhost:3000';
  let localApi: Awaited<ReturnType<typeof buildApiDebug>> | { error: string; api_base_url: string };
  try {
    localApi = await buildApiDebug(localApiBase);
  } catch (error) {
    localApi = {
      api_base_url: localApiBase,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  const comparison = {
    generated_at: new Date().toISOString(),
    production: productionApi,
    local: localApi,
    conclusion: 'See production/local summaries. If production API has 66 venues and Cloudinary URLs, issue is not Supabase or API payload.',
  };
  await writeJsonAndMarkdown(
    'f8_api_local_vs_production_debug.json',
    'f8_api_local_vs_production_debug.md',
    comparison,
    [
      '# F.8 Local vs Production API Debug',
      '',
      `Generated: ${comparison.generated_at}`,
      '',
      `Production venues: ${productionApi.summary.total_venue_count}`,
      `Production Cloudinary heroImage: ${productionApi.summary.cloudinary_hero_count}`,
      `Production fallback: ${productionApi.summary.fallback_count}`,
      '',
      'Local API:',
      'error' in localApi
        ? `- unavailable: ${localApi.error}`
        : `- venues: ${localApi.summary.total_venue_count}\n- Cloudinary heroImage: ${localApi.summary.cloudinary_hero_count}\n- fallback: ${localApi.summary.fallback_count}`,
    ].join('\n'),
  );

  console.log(JSON.stringify({
    production: productionApi.summary,
    supabase: supabaseState.summary,
    local: 'error' in localApi ? { error: localApi.error } : localApi.summary,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

