import { createServiceSupabaseClient } from '../enrichment/supabase_enrichment_utils';
import { escapeMd, normalizeName, readJson } from '../enrichment/enrichment_utils';
import { APPROVED_PUBLISH_BATCH, writeReport, type ValidationOutput } from './publishing_utils';

type ApiVenue = {
  id: string;
  name: string;
  category: string;
  heroImage?: string;
  cardImage?: string;
  imageUrl?: string;
  galleryImages?: Array<{ src?: string; source?: string; role?: string }>;
  images?: Array<{ src?: string; source?: string; role?: string }>;
  lat?: number;
  lng?: number;
};

type VerificationVenue = {
  name: string;
  id: string;
  in_public_venues: boolean;
  in_api: boolean;
  category: string | null;
  api_category: string | null;
  cloudinary_hero: boolean;
  cloudinary_card: boolean;
  cloudinary_image_url: boolean;
  gallery_count: number;
  cloudinary_gallery_count: number;
  fallback_used: boolean;
  legacy_proxy_used: boolean;
  coordinates_present: boolean;
  price_level_available: boolean;
  contact_available: boolean;
  blockers: string[];
};

type VerificationOutput = {
  generated_at: string;
  api_base_url: string;
  total_public_venues: number;
  api_venues_count: number;
  approved_batch_count: number;
  approved_visible_count: number;
  cloudinary_ready_count: number;
  fallback_count: number;
  legacy_proxy_count: number;
  venues: VerificationVenue[];
  blockers: Array<{ venue: string; blockers: string[] }>;
};

function isCloudinary(value: string | undefined) {
  return Boolean(value?.startsWith('https://res.cloudinary.com/'));
}

function usesFallback(value: string | undefined) {
  return Boolean(value?.includes('/venue_invernadero.png'));
}

function usesLegacyProxy(value: string | undefined) {
  return Boolean(value?.startsWith('/api/venue-images') || value?.includes('/api/venue-images/'));
}

function markdown(output: VerificationOutput) {
  return [
    '# Publish Batch 16 Verification',
    '',
    `Generated: ${output.generated_at}`,
    `API base URL: ${output.api_base_url}`,
    `Total public venues: ${output.total_public_venues}`,
    `API venues count: ${output.api_venues_count}`,
    `Approved visible count: ${output.approved_visible_count}/${output.approved_batch_count}`,
    `Cloudinary-ready approved venues: ${output.cloudinary_ready_count}/${output.approved_batch_count}`,
    `Fallback approved venues: ${output.fallback_count}`,
    `Legacy proxy approved venues: ${output.legacy_proxy_count}`,
    '',
    '## Venue Verification',
    '',
    '| Venue | Public | API | Category | Gallery | Cloudinary | Fallback | Legacy | Blockers |',
    '|---|---:|---:|---|---:|---:|---:|---:|---|',
    ...output.venues.map((venue) => `| ${escapeMd(venue.name)} | ${venue.in_public_venues ? 'yes' : 'no'} | ${venue.in_api ? 'yes' : 'no'} | ${escapeMd(venue.api_category || venue.category || '')} | ${venue.gallery_count} | ${venue.cloudinary_hero && venue.cloudinary_card && venue.cloudinary_image_url ? 'yes' : 'no'} | ${venue.fallback_used ? 'yes' : 'no'} | ${venue.legacy_proxy_used ? 'yes' : 'no'} | ${escapeMd(venue.blockers.join('; ') || 'none')} |`),
    '',
    '## Blockers',
    '',
    output.blockers.length ? output.blockers.map((item) => `- ${item.venue}: ${item.blockers.join('; ')}`).join('\n') : '- none',
    '',
    '## Price / Contact Note',
    '',
    'The runtime API does not currently expose price/contact fields. Availability is verified from preserved Google enrichment data in the dedicated reports.',
  ].join('\n');
}

async function main() {
  const validation = await readJson<ValidationOutput>('data/publish_batch_16_validation.json');
  const apiBaseUrl = (process.env.API_BASE_URL || 'https://korantis-app.vercel.app').replace(/\/$/, '');
  const supabase = createServiceSupabaseClient();

  const { data: publicRows, error: publicError } = await supabase
    .from('venues')
    .select('id,name,category,coordinates')
    .in('id', validation.venues.map((venue) => venue.public_venue_id));
  if (publicError) throw publicError;

  const { count: totalPublicVenues, error: countError } = await supabase
    .from('venues')
    .select('id', { count: 'exact', head: true });
  if (countError) throw countError;

  const response = await fetch(`${apiBaseUrl}/api/venues`, { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(`API failed ${response.status}: ${await response.text()}`);
  const payload = await response.json() as { venues?: ApiVenue[] };
  const apiVenues = payload.venues || [];
  const apiByName = new Map(apiVenues.map((venue) => [normalizeName(venue.name), venue]));
  const publicById = new Map((publicRows || []).map((row) => [String(row.id), row as { id: string; name: string; category: string | null; coordinates: unknown }]));
  const validationByName = new Map(validation.venues.map((venue) => [normalizeName(venue.name), venue]));

  const venues: VerificationVenue[] = APPROVED_PUBLISH_BATCH.map((name) => {
    const validated = validationByName.get(normalizeName(name));
    const publicRow = validated ? publicById.get(validated.public_venue_id) : undefined;
    const apiVenue = apiByName.get(normalizeName(name));
    const gallery = apiVenue?.galleryImages || apiVenue?.images || [];
    const imageValues = [apiVenue?.heroImage, apiVenue?.cardImage, apiVenue?.imageUrl, ...gallery.map((image) => image.src)];
    const blockers: string[] = [];

    if (!publicRow) blockers.push('missing public.venues row');
    if (!apiVenue) blockers.push('missing from /api/venues');
    if (apiVenue && !isCloudinary(apiVenue.heroImage)) blockers.push('heroImage is not Cloudinary');
    if (apiVenue && !isCloudinary(apiVenue.cardImage)) blockers.push('cardImage is not Cloudinary');
    if (apiVenue && !isCloudinary(apiVenue.imageUrl)) blockers.push('imageUrl is not Cloudinary');
    if (apiVenue && gallery.filter((image) => isCloudinary(image.src)).length < 1) blockers.push('missing Cloudinary gallery images');
    if (apiVenue && imageValues.some(usesFallback)) blockers.push('fallback image used');
    if (apiVenue && imageValues.some(usesLegacyProxy)) blockers.push('legacy proxy image used');
    if (apiVenue && (typeof apiVenue.lat !== 'number' || typeof apiVenue.lng !== 'number')) blockers.push('missing API coordinates');

    return {
      name,
      id: validated?.public_venue_id || '',
      in_public_venues: Boolean(publicRow),
      in_api: Boolean(apiVenue),
      category: publicRow?.category ?? null,
      api_category: apiVenue?.category ?? null,
      cloudinary_hero: isCloudinary(apiVenue?.heroImage),
      cloudinary_card: isCloudinary(apiVenue?.cardImage),
      cloudinary_image_url: isCloudinary(apiVenue?.imageUrl),
      gallery_count: gallery.length,
      cloudinary_gallery_count: gallery.filter((image) => isCloudinary(image.src)).length,
      fallback_used: imageValues.some(usesFallback),
      legacy_proxy_used: imageValues.some(usesLegacyProxy),
      coordinates_present: Boolean(apiVenue && typeof apiVenue.lat === 'number' && typeof apiVenue.lng === 'number'),
      price_level_available: Boolean(validated?.google.priceLevel),
      contact_available: Boolean(validated?.google.websiteUri || validated?.google.nationalPhoneNumber || validated?.google.internationalPhoneNumber || validated?.google.googleMapsUri),
      blockers,
    };
  });

  const blockers = venues
    .filter((venue) => venue.blockers.length > 0)
    .map((venue) => ({ venue: venue.name, blockers: venue.blockers }));

  const output: VerificationOutput = {
    generated_at: new Date().toISOString(),
    api_base_url: apiBaseUrl,
    total_public_venues: totalPublicVenues || 0,
    api_venues_count: apiVenues.length,
    approved_batch_count: APPROVED_PUBLISH_BATCH.length,
    approved_visible_count: venues.filter((venue) => venue.in_api).length,
    cloudinary_ready_count: venues.filter((venue) => venue.cloudinary_hero && venue.cloudinary_card && venue.cloudinary_image_url && venue.cloudinary_gallery_count > 0).length,
    fallback_count: venues.filter((venue) => venue.fallback_used).length,
    legacy_proxy_count: venues.filter((venue) => venue.legacy_proxy_used).length,
    venues,
    blockers,
  };

  await writeReport('publish_batch_16_verification.json', 'publish_batch_16_verification.md', output, markdown(output));

  console.log(`Verified ${output.approved_visible_count}/${output.approved_batch_count} approved venues in ${apiBaseUrl}/api/venues`);
  if (blockers.length > 0) {
    console.error(`Verification blockers: ${blockers.map((item) => item.venue).join(', ')}`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

