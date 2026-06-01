import * as path from 'path';
import './script_env';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

type VenueRow = {
  id: string;
  name: string;
  city?: string | null;
  category?: string | null;
  location?: string | null;
  coordinates?: { lat?: number; lng?: number } | string | null;
  curation_status?: string | null;
};

type ImageRow = {
  venue_id: string;
  photo_reference?: string | null;
  google_photo_reference?: string | null;
  public_id?: string | null;
};

type StagingRow = {
  id: string;
  name: string;
  canonical_data: {
    photos?: PlacePhoto[];
  } | null;
};

type GooglePlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  photos?: PlacePhoto[];
};

type PlacePhoto = {
  name?: string;
  widthPx?: number;
  heightPx?: number;
  authorAttributions?: unknown;
};

type PhotoScore = {
  photo_reference: string;
  hero_suitability_score?: number;
  card_suitability_score?: number;
  atmosphere_score?: number;
};

type SelectedPhotoRef = {
  role: 'hero' | 'card' | 'gallery';
  sort_order: number;
  google_photo_reference: string;
  width?: number;
  height?: number;
  quality_score: number | null;
  hero_suitability_score: number | null;
};

const DATA_DIR = path.join(__dirname, '..', '..', 'data');

function hasFlag(name: string) {
  return process.argv.includes(`--${name}`);
}

function createSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or Supabase key.');
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

function displayName(place: GooglePlace) {
  return place.displayName?.text || '';
}

function nameCompatibilityScore(sourceName: string, placeName: string) {
  const source = normalizeName(sourceName);
  const place = normalizeName(placeName);
  if (!source || !place) return 0;
  if (source === place) return 100;
  if (source.includes(place) || place.includes(source)) return 88;

  const sourceTokens = new Set(source.split(' '));
  const placeTokens = new Set(place.split(' '));
  const overlap = Array.from(sourceTokens).filter((token) => placeTokens.has(token)).length;
  return Math.round((overlap / Math.max(sourceTokens.size, placeTokens.size)) * 100);
}

async function searchGoogleForVenue(venue: VenueRow) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) throw new Error('Missing GOOGLE_PLACES_API_KEY.');

  const coordinates = parseCoordinates(venue.coordinates);
  const textQuery = [venue.name, venue.location, venue.city].filter(Boolean).join(' ');
  const body: Record<string, unknown> = { textQuery, pageSize: 5 };

  if (typeof coordinates?.lat === 'number' && typeof coordinates.lng === 'number') {
    body.locationBias = {
      circle: {
        center: { latitude: coordinates.lat, longitude: coordinates.lng },
        radius: 2500,
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
        'places.photos',
      ].join(','),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Google Text Search failed ${response.status}: ${errorBody || response.statusText}`);
  }

  const payload = await response.json() as { places?: GooglePlace[] };
  const places = payload.places || [];

  return places
    .map((place) => ({
      place,
      score: nameCompatibilityScore(venue.name, displayName(place)),
    }))
    .sort((a, b) => b.score - a.score)[0] || null;
}

function collectPhotoScoresFromUnknown(value: unknown, scores: Map<string, PhotoScore>) {
  if (!value || typeof value !== 'object') return;

  if (Array.isArray(value)) {
    for (const item of value) collectPhotoScoresFromUnknown(item, scores);
    return;
  }

  const record = value as Record<string, unknown>;
  if (typeof record.photo_reference === 'string') {
    scores.set(record.photo_reference, {
      photo_reference: record.photo_reference,
      hero_suitability_score: typeof record.hero_suitability_score === 'number' ? record.hero_suitability_score : undefined,
      card_suitability_score: typeof record.card_suitability_score === 'number' ? record.card_suitability_score : undefined,
      atmosphere_score: typeof record.atmosphere_score === 'number' ? record.atmosphere_score : undefined,
    });
  }

  for (const nested of Object.values(record)) {
    collectPhotoScoresFromUnknown(nested, scores);
  }
}

function loadPhotoScores() {
  const scores = new Map<string, PhotoScore>();
  if (!existsSync(DATA_DIR)) return scores;

  for (const fileName of readdirSync(DATA_DIR)) {
    if (!fileName.endsWith('.json') || !fileName.includes('photo_vision')) continue;

    try {
      const parsed = JSON.parse(readFileSync(path.join(DATA_DIR, fileName), 'utf8')) as unknown;
      collectPhotoScoresFromUnknown(parsed, scores);
    } catch {
      // Ignore malformed historical artifacts.
    }
  }

  return scores;
}

function imageScore(photo: PlacePhoto, scores: Map<string, PhotoScore>) {
  if (!photo.name) return 0;
  const score = scores.get(photo.name);
  return Math.max(
    score?.hero_suitability_score || 0,
    score?.card_suitability_score || 0,
    score?.atmosphere_score || 0
  );
}

function selectPhotoRefs(photos: PlacePhoto[], scores: Map<string, PhotoScore>) {
  const unique = Array.from(
    new Map(photos.filter((photo) => photo.name).map((photo) => [photo.name as string, photo])).values()
  );

  const sorted = unique
    .map((photo, index) => ({ photo, index, score: imageScore(photo, scores) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 8);

  const selected: SelectedPhotoRef[] = [];
  const hero = sorted[0];
  const card = sorted[1] || sorted[0];

  if (hero?.photo.name) {
    const photoScore = scores.get(hero.photo.name);
    selected.push({
      role: 'hero',
      sort_order: 0,
      google_photo_reference: hero.photo.name,
      width: hero.photo.widthPx,
      height: hero.photo.heightPx,
      quality_score: (photoScore?.atmosphere_score ?? hero.score) || null,
      hero_suitability_score: (photoScore?.hero_suitability_score ?? hero.score) || null,
    });
  }

  if (card?.photo.name && card.photo.name !== hero?.photo.name) {
    const photoScore = scores.get(card.photo.name);
    selected.push({
      role: 'card',
      sort_order: 0,
      google_photo_reference: card.photo.name,
      width: card.photo.widthPx,
      height: card.photo.heightPx,
      quality_score: (photoScore?.atmosphere_score ?? card.score) || null,
      hero_suitability_score: (photoScore?.hero_suitability_score ?? card.score) || null,
    });
  }

  for (const item of sorted.slice(0, 6)) {
    if (!item.photo.name) continue;
    const photoScore = scores.get(item.photo.name);
    selected.push({
      role: 'gallery',
      sort_order: selected.filter((photo) => photo.role === 'gallery').length,
      google_photo_reference: item.photo.name,
      width: item.photo.widthPx,
      height: item.photo.heightPx,
      quality_score: (photoScore?.atmosphere_score ?? item.score) || null,
      hero_suitability_score: (photoScore?.hero_suitability_score ?? item.score) || null,
    });
  }

  return selected;
}

async function selectVenueImages(supabase: ReturnType<typeof createSupabase>, venueIds: string[]) {
  const preferred = await supabase
    .from('venue_images')
    .select('venue_id, photo_reference, google_photo_reference, public_id')
    .in('venue_id', venueIds);

  if (!preferred.error) return (preferred.data || []) as ImageRow[];

  const legacy = await supabase
    .from('venue_images')
    .select('venue_id, photo_reference')
    .in('venue_id', venueIds);

  if (legacy.error) throw new Error(`Unable to read venue_images: ${legacy.error.message}`);
  return (legacy.data || []) as ImageRow[];
}

async function main() {
  const includeLegacy = hasFlag('include-legacy');
  const googleSearch = hasFlag('google-search');
  const supabase = createSupabase();
  const scores = loadPhotoScores();
  const apiErrors: string[] = [];

  const { data: venues, error: venueError } = await supabase
    .from('venues')
    .select('*')
    .order('name');

  if (venueError) throw new Error(`Unable to read public.venues: ${venueError.message}`);

  const activeVenues = ((venues || []) as VenueRow[])
    .filter((venue) => !venue.curation_status || venue.curation_status === 'active');
  const venueIds = activeVenues.map((venue) => venue.id);
  const imageRows = await selectVenueImages(supabase, venueIds);

  const imagesByVenue = new Map<string, ImageRow[]>();
  for (const image of imageRows) {
    const rows = imagesByVenue.get(image.venue_id) || [];
    rows.push(image);
    imagesByVenue.set(image.venue_id, rows);
  }

  const targetVenues = activeVenues.filter((venue) => {
    const existing = imagesByVenue.get(venue.id) || [];
    if (existing.length === 0) return true;
    return includeLegacy && existing.some((image) => !image.public_id);
  });

  const { data: stagingByIdRows, error: stagingByIdError } = await supabase
    .from('staging_venues')
    .select('id, name, canonical_data')
    .in('id', targetVenues.map((venue) => venue.id));

  if (stagingByIdError) throw new Error(`Unable to read staging_venues: ${stagingByIdError.message}`);

  const { data: allStagingRows, error: allStagingError } = await supabase
    .from('staging_venues')
    .select('id, name, canonical_data');

  if (allStagingError) throw new Error(`Unable to read staging_venues for name matching: ${allStagingError.message}`);

  const stagingById = new Map(((stagingByIdRows || []) as StagingRow[]).map((row) => [row.id, row]));
  const stagingByName = new Map<string, StagingRow>();
  for (const row of (allStagingRows || []) as StagingRow[]) {
    const normalized = normalizeName(row.name);
    if (!stagingByName.has(normalized)) {
      stagingByName.set(normalized, row);
    }
  }

  const output = [];

  for (const venue of targetVenues) {
    const matchedStaging = stagingById.get(venue.id) || stagingByName.get(normalizeName(venue.name)) || null;
    let googlePlaceId = matchedStaging?.id || null;
    let photoRefSource = matchedStaging ? (matchedStaging.id === venue.id ? 'staging_id_match' : 'staging_name_match') : 'missing';
    let photos = matchedStaging?.canonical_data?.photos || [];

    if (photos.length === 0 && googleSearch) {
      try {
        const googleMatch = await searchGoogleForVenue(venue);
        if (googleMatch?.place.id && googleMatch.score >= 70) {
          googlePlaceId = googleMatch.place.id;
          photoRefSource = `google_text_search:${googleMatch.score}`;
          photos = googleMatch.place.photos || [];
        } else if (googleMatch?.place.id) {
          apiErrors.push(`${venue.name}: weak Google match ${displayName(googleMatch.place)} (${googleMatch.score})`);
        } else {
          apiErrors.push(`${venue.name}: no Google Text Search match`);
        }
      } catch (error) {
        apiErrors.push(`${venue.name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    output.push({
      venue_id: venue.id,
      venue_name: venue.name,
      google_place_id: googlePlaceId,
      photo_ref_source: photoRefSource,
      city: venue.city || 'buenos_aires',
      category: venue.category || null,
      existing_image_count: (imagesByVenue.get(venue.id) || []).length,
      canonical_photo_count: photos.length,
      selected_photos: selectPhotoRefs(photos, scores),
    });
  }

  const payload = {
    generated_at: new Date().toISOString(),
    include_legacy: includeLegacy,
    google_search_enabled: googleSearch,
    total_active_public_venues: activeVenues.length,
    target_venues: output.length,
    venues_with_photo_refs: output.filter((venue) => venue.selected_photos.length > 0).length,
    api_errors: apiErrors,
    venues: output,
  };

  writeFileSync(path.join(DATA_DIR, 'missing_venue_photo_refs.json'), JSON.stringify(payload, null, 2));

  const report = [
    '# Missing Venue Photo References',
    '',
    `Generated: ${payload.generated_at}`,
    `Mode: ${includeLegacy ? 'include legacy non-Cloudinary image rows' : 'venues without image rows only'}`,
    `Google search fallback: ${googleSearch ? 'enabled' : 'disabled'}`,
    '',
    `- Active public venues: ${payload.total_active_public_venues}`,
    `- Target venues: ${payload.target_venues}`,
    `- Target venues with Google photo refs: ${payload.venues_with_photo_refs}`,
    `- API/search warnings: ${apiErrors.length}`,
    '',
    '## Venues',
    '',
    ...output.map((venue) => (
      `- ${venue.venue_name}: ${venue.selected_photos.length} selected refs from ${venue.canonical_photo_count} photos (${venue.photo_ref_source})`
    )),
    '',
    '## API/Search Warnings',
    '',
    ...(apiErrors.length ? apiErrors.map((error) => `- ${error}`) : ['- None']),
    '',
  ].join('\n');

  writeFileSync(path.join(DATA_DIR, 'missing_venue_photo_refs_report.md'), report);
  console.log(report);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
