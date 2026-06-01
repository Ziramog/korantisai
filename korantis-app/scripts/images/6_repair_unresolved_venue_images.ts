import * as path from 'path';
import './script_env';
import { writeFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import { uploadImageBufferToCloudinary } from './cloudinary_utils';

type VenueRow = {
  id: string;
  name: string;
  city: string | null;
  category: string | null;
  location: string | null;
  coordinates: { lat?: number; lng?: number } | string | null;
};

type GooglePlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  primaryType?: string;
  types?: string[];
  businessStatus?: string;
  rating?: number;
  userRatingCount?: number;
  photos?: Array<{
    name?: string;
    widthPx?: number;
    heightPx?: number;
    authorAttributions?: unknown;
  }>;
};

type RepairRow = {
  venue_id: string;
  venue_name: string;
  current_public_status: string;
  current_image_state: string;
  google_place_id: string | null;
  google_match_safe: boolean;
  google_photo_refs_exist: boolean;
  previous_collector_failure: string;
  recommended_action: string;
  match_notes: string[];
  uploaded_images: number;
  inserted_venue_images: number;
  errors: string[];
};

const DATA_DIR = path.join(__dirname, '..', '..', 'data');

const TARGETS = [
  {
    name: 'Invernadero',
    aliases: ['Invernadero Gin Tapas Palermo Buenos Aires', 'Invernadero Buenos Aires'],
    expectedTypes: ['restaurant', 'bar', 'tapas_restaurant'],
    maxDistanceKm: 0.75,
  },
  {
    name: 'Melbourne Café',
    aliases: ['Melbourne Café Palermo Soho Buenos Aires', 'Melbourne Cafe Palermo Buenos Aires', 'Melbourne Coffee Palermo Soho'],
    expectedTypes: ['coffee_shop', 'cafe', 'cafeteria'],
    maxDistanceKm: 0.75,
  },
  {
    name: 'Crisol Café',
    aliases: ['Crisol Café Villa Crespo Buenos Aires', 'Crisol Cafe Villa Crespo', 'Crisol Coffee Bakery Villa Crespo'],
    expectedTypes: ['coffee_shop', 'cafe', 'cafeteria', 'bakery'],
    maxDistanceKm: 1.25,
  },
];

function createSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  return createClient(url, key, { auth: { persistSession: false } });
}

function normalizeName(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function parseCoordinates(coordinates: VenueRow['coordinates']) {
  if (!coordinates) return null;
  if (typeof coordinates === 'object') return coordinates;
  try {
    return JSON.parse(coordinates) as { lat?: number; lng?: number };
  } catch {
    return null;
  }
}

function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const radius = 6371;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * radius * Math.asin(Math.sqrt(a));
}

function categoryCompatible(place: GooglePlace, expectedTypes: string[]) {
  const types = new Set([place.primaryType, ...(place.types || [])].filter(Boolean));
  return expectedTypes.some((type) => types.has(type));
}

function addressCompatible(place: GooglePlace) {
  const address = normalizeName(place.formattedAddress || '');
  return address.includes('buenos aires') || address.includes('cdad autonoma') || address.includes('caba');
}

function nameCompatible(venueName: string, placeName: string) {
  const venue = normalizeName(venueName);
  const place = normalizeName(placeName);
  if (venue === place) return true;
  if (place.includes(venue)) return true;
  const core = venue.replace(/\b(cafe|coffee)\b/g, '').trim();
  return core.length >= 5 && place.includes(core);
}

async function searchGoogle(query: string, venue: VenueRow) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) throw new Error('Missing GOOGLE_PLACES_API_KEY.');
  const coordinates = parseCoordinates(venue.coordinates);
  const body: Record<string, unknown> = { textQuery: query, pageSize: 5 };

  if (typeof coordinates?.lat === 'number' && typeof coordinates.lng === 'number') {
    body.locationBias = {
      circle: {
        center: { latitude: coordinates.lat, longitude: coordinates.lng },
        radius: 3000,
      },
    };
  }

  const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': [
        'places.id',
        'places.displayName',
        'places.formattedAddress',
        'places.location',
        'places.primaryType',
        'places.types',
        'places.businessStatus',
        'places.rating',
        'places.userRatingCount',
        'places.photos',
      ].join(','),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const bodyText = await response.text();
    throw new Error(`Google Text Search failed ${response.status}: ${bodyText || response.statusText}`);
  }

  const payload = await response.json() as { places?: GooglePlace[] };
  return payload.places || [];
}

function scorePlace(venue: VenueRow, place: GooglePlace, expectedTypes: string[], maxDistanceKm: number) {
  const coordinates = parseCoordinates(venue.coordinates);
  const placeName = place.displayName?.text || '';
  const notes: string[] = [];

  const nameOk = nameCompatible(venue.name, placeName);
  const categoryOk = categoryCompatible(place, expectedTypes);
  const addressOk = addressCompatible(place);
  const openOk = !place.businessStatus || place.businessStatus === 'OPERATIONAL';
  const photosOk = (place.photos || []).some((photo) => photo.name);
  const distance = coordinates && place.location?.latitude && place.location?.longitude
    ? distanceKm(coordinates.lat as number, coordinates.lng as number, place.location.latitude, place.location.longitude)
    : null;
  const distanceOk = distance !== null && distance <= maxDistanceKm;

  if (!nameOk) notes.push(`name mismatch: ${placeName}`);
  if (!categoryOk) notes.push(`category mismatch: ${place.primaryType || 'unknown'}`);
  if (!addressOk) notes.push(`address not clearly Buenos Aires/CABA: ${place.formattedAddress || 'unknown'}`);
  if (!openOk) notes.push(`business status is ${place.businessStatus}`);
  if (!photosOk) notes.push('no Google photo refs');
  if (!distanceOk) notes.push(`distance ${distance === null ? 'unknown' : `${distance.toFixed(2)} km`} exceeds safe threshold`);

  return {
    safe: nameOk && categoryOk && addressOk && openOk && photosOk && distanceOk,
    distance,
    notes,
  };
}

async function resolveGooglePhotoUri(photoReference: string) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) throw new Error('Missing GOOGLE_PLACES_API_KEY.');
  const url = new URL(`https://places.googleapis.com/v1/${photoReference}/media`);
  url.searchParams.set('maxWidthPx', '1600');
  url.searchParams.set('skipHttpRedirect', 'true');
  url.searchParams.set('key', apiKey);

  const response = await fetch(url, {
    headers: { 'X-Goog-Api-Key': apiKey },
  });

  if (!response.ok) throw new Error(`Google photo media error ${response.status}: ${response.statusText}`);
  const payload = await response.json() as { photoUri?: string };
  if (!payload.photoUri) throw new Error('Google photo media response did not include photoUri.');
  return payload.photoUri;
}

async function downloadGooglePhoto(photoReference: string) {
  const photoUri = await resolveGooglePhotoUri(photoReference);
  const response = await fetch(photoUri);
  if (!response.ok) throw new Error(`Google photo binary error ${response.status}: ${response.statusText}`);
  return Buffer.from(await response.arrayBuffer());
}

function selectedPhotos(place: GooglePlace) {
  const unique = Array.from(new Map((place.photos || []).filter((photo) => photo.name).map((photo) => [photo.name as string, photo])).values());
  const roles = ['hero', 'card', 'gallery', 'gallery', 'gallery', 'gallery', 'gallery', 'gallery'] as const;
  return unique.slice(0, 8).map((photo, index) => ({
    photo,
    role: roles[index],
    sortOrder: index < 2 ? 0 : index - 2,
  }));
}

async function repairVenueImages(supabase: ReturnType<typeof createSupabase>, venue: VenueRow, place: GooglePlace, row: RepairRow) {
  const existing = await supabase
    .from('venue_images')
    .select('id, public_id, google_photo_reference, photo_reference, role')
    .eq('venue_id', venue.id);
  if (existing.error) throw new Error(`Unable to read venue_images for ${venue.name}: ${existing.error.message}`);

  const existingRefs = new Set((existing.data || []).map((image) => image.google_photo_reference || image.photo_reference).filter(Boolean));

  for (const item of selectedPhotos(place)) {
    if (!item.photo.name || existingRefs.has(item.photo.name)) continue;

    const buffer = await downloadGooglePhoto(item.photo.name);
    const upload = await uploadImageBufferToCloudinary(buffer, {
      city: venue.city || 'buenos_aires',
      venueName: venue.name,
      role: item.role,
      index: item.sortOrder,
    });

    row.uploaded_images++;

    const insert = await supabase.from('venue_images').insert({
      venue_id: venue.id,
      photo_reference: item.photo.name,
      google_photo_reference: item.photo.name,
      url: upload.url,
      secure_url: upload.secure_url,
      public_id: upload.public_id,
      role: item.role,
      sort_order: item.sortOrder,
      source: 'google_places',
      width: upload.width || item.photo.widthPx,
      height: upload.height || item.photo.heightPx,
      bytes: upload.bytes,
      format: upload.format,
      quality_score: null,
      hero_suitability_score: null,
      html_attributions: item.photo.authorAttributions,
      is_cover: item.role === 'hero',
      status: 'processed',
      updated_at: new Date().toISOString(),
    });

    if (insert.error) throw new Error(`Unable to insert image for ${venue.name}: ${insert.error.message}`);
    existingRefs.add(item.photo.name);
    row.inserted_venue_images++;
  }
}

async function main() {
  const supabase = createSupabase();
  const { data: venues, error } = await supabase.from('venues').select('*');
  if (error) throw new Error(`Unable to read public venues: ${error.message}`);

  const reportRows: RepairRow[] = [];

  for (const target of TARGETS) {
    const venue = ((venues || []) as VenueRow[]).find((row) => normalizeName(row.name) === normalizeName(target.name));
    if (!venue) {
      reportRows.push({
        venue_id: 'missing',
        venue_name: target.name,
        current_public_status: 'missing',
        current_image_state: 'unknown',
        google_place_id: null,
        google_match_safe: false,
        google_photo_refs_exist: false,
        previous_collector_failure: 'public venue row not found',
        recommended_action: 'inspect public.venues',
        match_notes: ['public venue row not found'],
        uploaded_images: 0,
        inserted_venue_images: 0,
        errors: [],
      });
      continue;
    }

    const existingImages = await supabase.from('venue_images').select('id, public_id, role').eq('venue_id', venue.id);
    if (existingImages.error) throw new Error(`Unable to read current image state: ${existingImages.error.message}`);

    const repairRow: RepairRow = {
      venue_id: venue.id,
      venue_name: venue.name,
      current_public_status: 'active/public',
      current_image_state: (existingImages.data || []).length > 0 ? `${existingImages.data?.length} image rows` : 'fallback/no image rows',
      google_place_id: null,
      google_match_safe: false,
      google_photo_refs_exist: false,
      previous_collector_failure: 'no safe name/address/category match found by generic collector',
      recommended_action: 'manual image upload, unpublish candidate, replace venue, or leave temporary fallback_allowed',
      match_notes: [],
      uploaded_images: 0,
      inserted_venue_images: 0,
      errors: [],
    };

    const candidates: Array<{ place: GooglePlace; notes: string[]; safe: boolean; distance: number | null }> = [];

    for (const alias of target.aliases) {
      try {
        const places = await searchGoogle(alias, venue);
        for (const place of places) {
          const scored = scorePlace(venue, place, target.expectedTypes, target.maxDistanceKm);
          candidates.push({ place, ...scored });
        }
      } catch (searchError) {
        repairRow.errors.push(searchError instanceof Error ? searchError.message : String(searchError));
      }
    }

    const safeCandidate = candidates.find((candidate) => candidate.safe);
    const bestCandidate = safeCandidate || candidates[0];

    if (bestCandidate) {
      repairRow.google_place_id = bestCandidate.place.id || null;
      repairRow.google_photo_refs_exist = (bestCandidate.place.photos || []).some((photo) => photo.name);
      repairRow.google_match_safe = Boolean(safeCandidate);
      repairRow.match_notes = [
        `best candidate: ${bestCandidate.place.displayName?.text || 'unknown'}`,
        `address: ${bestCandidate.place.formattedAddress || 'unknown'}`,
        `primaryType: ${bestCandidate.place.primaryType || 'unknown'}`,
        `distance: ${bestCandidate.distance === null ? 'unknown' : `${bestCandidate.distance.toFixed(2)} km`}`,
        ...bestCandidate.notes,
      ];
    }

    if (safeCandidate) {
      repairRow.previous_collector_failure = 'generic collector query lacked the stronger category alias needed for exact safe match';
      repairRow.recommended_action = 'repaired with safe Google match and Cloudinary image materialization';
      try {
        await repairVenueImages(supabase, venue, safeCandidate.place, repairRow);
      } catch (repairError) {
        repairRow.errors.push(repairError instanceof Error ? repairError.message : String(repairError));
        repairRow.recommended_action = 'manual review required after upload/upsert error';
      }
    }

    reportRows.push(repairRow);
  }

  const repaired = reportRows.filter((row) => row.inserted_venue_images > 0);
  const unresolved = reportRows.filter((row) => row.inserted_venue_images === 0);
  const markdown = [
    '# Unresolved Venue Image Repair Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Summary',
    '',
    `- Repaired venues: ${repaired.length}`,
    `- Unresolved venues: ${unresolved.length}`,
    `- Images uploaded: ${reportRows.reduce((sum, row) => sum + row.uploaded_images, 0)}`,
    `- venue_images inserted: ${reportRows.reduce((sum, row) => sum + row.inserted_venue_images, 0)}`,
    '',
    ...reportRows.map((row) => [
      `## ${row.venue_name}`,
      '',
      `- venue_id: ${row.venue_id}`,
      `- current public status: ${row.current_public_status}`,
      `- current image state: ${row.current_image_state}`,
      `- google_place_id: ${row.google_place_id || 'none'}`,
      `- Google match safe: ${row.google_match_safe ? 'yes' : 'no'}`,
      `- Google photo refs exist: ${row.google_photo_refs_exist ? 'yes' : 'no'}`,
      `- why previous collector failed: ${row.previous_collector_failure}`,
      `- recommended action: ${row.recommended_action}`,
      `- uploaded images: ${row.uploaded_images}`,
      `- venue_images inserted: ${row.inserted_venue_images}`,
      `- match notes: ${row.match_notes.join('; ') || 'none'}`,
      `- errors: ${row.errors.join('; ') || 'none'}`,
      '',
    ].join('\n')),
  ].join('\n');

  writeFileSync(path.join(DATA_DIR, 'unresolved_venue_image_repair_report.md'), markdown);
  writeFileSync(path.join(DATA_DIR, 'unresolved_venue_image_repair_report.json'), JSON.stringify({
    generated_at: new Date().toISOString(),
    repaired_venues: repaired.length,
    unresolved_venues: unresolved.length,
    images_uploaded: reportRows.reduce((sum, row) => sum + row.uploaded_images, 0),
    venue_images_inserted: reportRows.reduce((sum, row) => sum + row.inserted_venue_images, 0),
    venues: reportRows,
  }, null, 2));
  console.log(markdown);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
