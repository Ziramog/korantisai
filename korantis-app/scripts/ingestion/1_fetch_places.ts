import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '..', '..', '.env.local') });
import { createClient } from '@supabase/supabase-js';
import { PHASE_A_PLACE_IDS } from './phase_a_ids';

type StagingVenue = {
  id: string;
  name: string;
  status: string;
  canonical_data: Record<string, unknown> | null;
};

type PlacePhoto = {
  name?: string;
  widthPx?: number;
  heightPx?: number;
  authorAttributions?: unknown;
};

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!GOOGLE_API_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const PLACE_DETAIL_FIELDS = [
  'id',
  'displayName',
  'formattedAddress',
  'location',
  'regularOpeningHours',
  'websiteUri',
  'googleMapsUri',
  'rating',
  'userRatingCount',
  'priceLevel',
  'primaryType',
  'types',
  'businessStatus',
  'editorialSummary',
  'photos',
  'nationalPhoneNumber',
  'internationalPhoneNumber',
];

const PRESERVED_CANONICAL_FIELDS = [
  'source',
  'discovery_query',
  'brand_key',
  'city',
  'country',
  'category',
  'place_id',
  'name',
  'displayName',
  'rating',
  'userRatingCount',
  'review_count',
  'priceLevel',
  'primaryType',
  'primary_type',
  'types',
  'businessStatus',
  'business_status',
  'formattedAddress',
  'address',
  'location',
  'regularOpeningHours',
  'websiteUri',
  'website',
  'googleMapsUri',
  'google_maps_uri',
  'editorialSummary',
  'photos',
  'nationalPhoneNumber',
  'internationalPhoneNumber',
];

function getArgValue(name: string) {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

function hasFlag(name: string) {
  return process.argv.includes(`--${name}`);
}

function compactObject(data: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined && value !== null)
  );
}

function displayNameText(displayName: unknown) {
  if (!displayName || typeof displayName !== 'object') return undefined;
  const text = (displayName as { text?: unknown }).text;
  return typeof text === 'string' ? text : undefined;
}

function normalizePlaceDetails(details: Record<string, unknown>) {
  return compactObject({
    ...details,
    place_id: details.id,
    name: displayNameText(details.displayName),
    address: details.formattedAddress,
    review_count: details.userRatingCount,
    primary_type: details.primaryType,
    business_status: details.businessStatus,
    website: details.websiteUri,
    google_maps_uri: details.googleMapsUri,
  });
}

function preservedExistingFields(existing: Record<string, unknown> | null) {
  if (!existing) return {};
  return compactObject(
    Object.fromEntries(PRESERVED_CANONICAL_FIELDS.map((field) => [field, existing[field]]))
  );
}

function mergeCanonicalData(existing: Record<string, unknown> | null, details: Record<string, unknown>) {
  const normalizedDetails = normalizePlaceDetails(details);

  return {
    ...(existing || {}),
    ...normalizedDetails,
    ...preservedExistingFields(existing),
    source: 'google_places_details',
    details_fetched_at: new Date().toISOString(),
  };
}

async function fetchPlaceDetails(placeId: string) {
  const url = `https://places.googleapis.com/v1/places/${placeId}?fields=${PLACE_DETAIL_FIELDS.join(',')}`;
  const response = await fetch(url, {
    headers: {
      'X-Goog-Api-Key': GOOGLE_API_KEY as string,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Google API Error ${response.status}: ${body || response.statusText}`);
  }

  return await response.json() as Record<string, unknown>;
}

async function selectVenues() {
  const all = hasFlag('all');
  const phaseA = hasFlag('phase-a');
  const ids = getArgValue('ids')?.split(',').map((id) => id.trim()).filter(Boolean) || [];
  const status = getArgValue('status') || 'pending';
  let query = supabase.from('staging_venues').select('*');

  if (phaseA) {
    query = query.in('id', [...PHASE_A_PLACE_IDS]);
  } else if (ids.length > 0) {
    query = query.in('id', ids);
  } else if (!all) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Unable to read staging_venues: ${error.message}`);
  return (data || []) as StagingVenue[];
}

async function insertMissingPhotos(venueId: string, photos: PlacePhoto[]) {
  if (photos.length === 0) return 0;

  const { data: existingPhotos, error } = await supabase
    .from('venue_images')
    .select('photo_reference')
    .eq('venue_id', venueId);

  if (error) throw new Error(`Unable to read existing venue_images: ${error.message}`);

  const existingReferences = new Set((existingPhotos || []).map((photo) => photo.photo_reference));
  const hasExistingCover = existingReferences.size > 0;
  let inserted = 0;

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    if (!photo.name || existingReferences.has(photo.name)) continue;

    const { error: insertError } = await supabase.from('venue_images').insert({
      venue_id: venueId,
      photo_reference: photo.name,
      width: photo.widthPx,
      height: photo.heightPx,
      html_attributions: photo.authorAttributions,
      is_cover: !hasExistingCover && inserted === 0 && i === 0,
      status: 'reference_only',
    });

    if (insertError) throw new Error(`Unable to insert photo reference: ${insertError.message}`);
    existingReferences.add(photo.name);
    inserted++;
  }

  return inserted;
}

async function main() {
  console.log('Starting Step 1: Fetch Canonical Data...');

  const venues = await selectVenues();

  if (venues.length === 0) {
    console.log('No venues found for selected mode.');
    return;
  }

  console.log(`Found ${venues.length} venues.`);

  for (const venue of venues) {
    console.log(`Processing ${venue.name} (${venue.id})...`);

    if (venue.status === 'pending') {
      await supabase.from('staging_venues').update({ status: 'processing' }).eq('id', venue.id);
    }

    try {
      const details = await fetchPlaceDetails(venue.id);
      const canonicalData = mergeCanonicalData(venue.canonical_data, details);

      await supabase.from('staging_venues').update({
        canonical_data: canonicalData,
      }).eq('id', venue.id);

      const photos = Array.isArray(details.photos) ? details.photos as PlacePhoto[] : [];
      const insertedPhotos = await insertMissingPhotos(venue.id, photos);

      if (photos.length > 0) {
        console.log(`  Photo references: ${photos.length}; inserted ${insertedPhotos} new.`);
      }

      console.log(`Success: ${venue.name}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error processing ${venue.name}: ${message}`);
      await supabase.from('pipeline_jobs').insert({
        venue_id: venue.id,
        step_name: '1_fetch_places',
        status: 'error',
        error_message: message,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      });
    }
  }

  console.log('Step 1 Complete.');
}

main().catch(console.error);
