import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '..', '..', '.env.local') });
import { createClient } from '@supabase/supabase-js';

type Category = 'cafe' | 'restaurant' | 'wine_bar' | 'cocktail_bar';

type PlaceCandidate = {
  id: string;
  displayName?: { text?: string; languageCode?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  primaryType?: string;
  types?: string[];
  rating?: number;
  userRatingCount?: number;
  websiteUri?: string;
  googleMapsUri?: string;
  businessStatus?: string;
};

type SelectedVenue = {
  place: PlaceCandidate;
  category: Category;
  query: string;
  brandKey: string;
};

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!GOOGLE_API_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing GOOGLE_PLACES_API_KEY, NEXT_PUBLIC_SUPABASE_URL, or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

const PHASE_A_QUOTAS: Record<Category, number> = {
  cafe: 5,
  restaurant: 3,
  wine_bar: 1,
  cocktail_bar: 1,
};

const PHASE_B_QUOTAS: Record<Category, number> = {
  cafe: 25,
  restaurant: 15,
  wine_bar: 5,
  cocktail_bar: 5,
};

const DISCOVERY_QUERIES: Record<Category, string[]> = {
  cafe: [
    'specialty coffee Buenos Aires',
    'cafes Palermo Buenos Aires',
    'cafes Recoleta Buenos Aires',
    'cafes San Telmo Buenos Aires',
  ],
  restaurant: [
    'restaurants Palermo Buenos Aires',
    'restaurants San Telmo Buenos Aires',
    'best restaurants Buenos Aires',
  ],
  wine_bar: [
    'wine bars Buenos Aires',
    'vinotecas wine bar Palermo Buenos Aires',
  ],
  cocktail_bar: [
    'cocktail bars Buenos Aires',
    'best cocktail bars Palermo Buenos Aires',
  ],
};

const OBVIOUS_CHAIN_BRANDS = new Set([
  'starbucks',
  'cafe martinez',
  'havanna',
  'bonafide',
  'mc cafe',
  'mccafe',
]);

function getArgValue(name: string) {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

function phaseQuotas() {
  const phase = (getArgValue('phase') || 'A').toUpperCase();
  if (phase === 'B') return { phase, quotas: PHASE_B_QUOTAS };
  return { phase: 'A', quotas: PHASE_A_QUOTAS };
}

function normalizeName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[''.]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function brandKeyFor(name: string) {
  const normalized = normalizeName(name)
    .replace(/\b(palermo|recoleta|san telmo|belgrano|retiro|microcentro|soho|hollywood|buenos aires|ba)\b/g, '')
    .replace(/\b(cafe|coffee|bar|restaurant|restaurante|sucursal|branch)\b/g, '')
    .replace(/[-|,/()].*/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return normalized || normalizeName(name);
}

function isOpenCandidate(place: PlaceCandidate) {
  return !place.businessStatus || place.businessStatus === 'OPERATIONAL';
}

function looksLikeBuenosAires(place: PlaceCandidate) {
  const address = normalizeName(place.formattedAddress || '');
  return address.includes('buenos aires') || address.includes('caba') || address.includes('argentina');
}

function categoryMatches(place: PlaceCandidate, category: Category) {
  const types = new Set([place.primaryType, ...(place.types || [])].filter(Boolean));
  const name = normalizeName(place.displayName?.text || '');

  if (category === 'cafe') {
    return types.has('cafe') || types.has('coffee_shop') || name.includes('coffee') || name.includes('cafe');
  }

  if (category === 'restaurant') {
    return types.has('restaurant') || types.has('fine_dining_restaurant');
  }

  if (category === 'wine_bar') {
    return types.has('wine_bar') || name.includes('wine') || name.includes('vino') || name.includes('vinoteca');
  }

  return types.has('bar') || name.includes('cocktail') || name.includes('coctel') || name.includes('bar');
}

async function searchGooglePlaces(query: string) {
  const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_API_KEY as string,
      'X-Goog-FieldMask': [
        'places.id',
        'places.displayName',
        'places.formattedAddress',
        'places.location',
        'places.primaryType',
        'places.types',
        'places.rating',
        'places.userRatingCount',
        'places.websiteUri',
        'places.googleMapsUri',
        'places.businessStatus',
      ].join(','),
    },
    body: JSON.stringify({
      textQuery: query,
      pageSize: 20,
      locationBias: {
        circle: {
          center: { latitude: -34.6037, longitude: -58.3816 },
          radius: 12000,
        },
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Google Places search failed (${response.status}): ${body}`);
  }

  const data = await response.json();
  return (data.places || []) as PlaceCandidate[];
}

async function existingPlaceIds() {
  const ids = new Set<string>();

  for (const table of ['staging_venues', 'venues']) {
    const { data, error } = await supabase.from(table).select('id');
    if (error) throw new Error(`Unable to read ${table}: ${error.message}`);
    for (const row of data || []) ids.add(row.id);
  }

  return ids;
}

async function selectVenues(quotas: Record<Category, number>) {
  const existingIds = await existingPlaceIds();
  const seenIds = new Set(existingIds);
  const seenBrands = new Set<string>();
  const selected: SelectedVenue[] = [];
  const duplicateIds: string[] = [];
  const repeatedBrands: string[] = [];
  const rejectedChains: string[] = [];
  const apiErrors: string[] = [];

  for (const category of Object.keys(quotas) as Category[]) {
    const selectedForCategory = () => selected.filter((item) => item.category === category).length;

    for (const query of DISCOVERY_QUERIES[category]) {
      if (selectedForCategory() >= quotas[category]) break;

      console.log(`Searching ${category}: ${query}`);

      try {
        const places = await searchGooglePlaces(query);

        for (const place of places) {
          if (selectedForCategory() >= quotas[category]) break;

          const name = place.displayName?.text || '';
          if (!place.id || !name) continue;

          if (seenIds.has(place.id)) {
            duplicateIds.push(`${name} (${place.id})`);
            continue;
          }

          if (!isOpenCandidate(place) || !looksLikeBuenosAires(place) || !categoryMatches(place, category)) {
            continue;
          }

          const brandKey = brandKeyFor(name);
          if (OBVIOUS_CHAIN_BRANDS.has(brandKey)) {
            rejectedChains.push(name);
            continue;
          }

          if (seenBrands.has(brandKey)) {
            repeatedBrands.push(name);
            continue;
          }

          seenIds.add(place.id);
          seenBrands.add(brandKey);
          selected.push({ place, category, query, brandKey });
        }
      } catch (error) {
        apiErrors.push(`${query}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  return { selected, duplicateIds, repeatedBrands, rejectedChains, apiErrors };
}

async function insertSelectedVenues(selected: SelectedVenue[]) {
  for (const item of selected) {
    const { place, category, query, brandKey } = item;
    const name = place.displayName?.text || 'Unknown venue';

    const { error } = await supabase.from('staging_venues').insert({
      id: place.id,
      name,
      city: 'buenos_aires',
      category_seed: category,
      status: 'pending',
      canonical_data: {
        source: 'google_places_text_search',
        discovery_query: query,
        brand_key: brandKey,
        city: 'buenos_aires',
        country: 'argentina',
        category,
        place_id: place.id,
        name,
        address: place.formattedAddress || null,
        location: place.location || null,
        rating: place.rating || null,
        review_count: place.userRatingCount || null,
        website: place.websiteUri || null,
        google_maps_uri: place.googleMapsUri || null,
        primary_type: place.primaryType || null,
        types: place.types || [],
        business_status: place.businessStatus || null,
      },
    });

    if (error) throw new Error(`Failed to insert ${name}: ${error.message}`);
    console.log(`Staged ${category}: ${name}`);
  }
}

async function main() {
  const { phase, quotas } = phaseQuotas();
  console.log(`Starting Buenos Aires discovery Phase ${phase}`);

  const { selected, duplicateIds, repeatedBrands, rejectedChains, apiErrors } = await selectVenues(quotas);

  for (const category of Object.keys(quotas) as Category[]) {
    const count = selected.filter((item) => item.category === category).length;
    if (count < quotas[category]) {
      throw new Error(`Insufficient ${category} venues selected: ${count}/${quotas[category]}`);
    }
  }

  await insertSelectedVenues(selected);

  console.log('\nDiscovery complete.');
  console.log(`Selected: ${selected.length}`);
  console.log(`Duplicate place IDs skipped: ${duplicateIds.length}`);
  console.log(`Repeated branches skipped: ${repeatedBrands.length}`);
  console.log(`Obvious chains skipped: ${rejectedChains.length}`);
  console.log(`API errors: ${apiErrors.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
