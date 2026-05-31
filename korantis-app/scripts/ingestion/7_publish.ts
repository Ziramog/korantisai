import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '..', '..', '.env.local') });
import { createClient } from '@supabase/supabase-js';

type StagingVenue = {
  id: string;
  name: string;
  city: string;
  category_seed: string;
  status: string;
  canonical_data: Record<string, unknown> | null;
  atmosphere_prose: string | null;
};

type PlaceLocation = {
  latitude?: number;
  longitude?: number;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

const PUBLIC_VENUE_COLUMNS = [
  'id',
  'name',
  'city',
  'category',
  'location',
  'coordinates',
  'card_size',
  'spacing',
  'hero_image',
  'atmosphere',
  'quality',
  'tagline',
  'narrative',
  'tags',
  'l2_vector',
  'l3_vector',
  'created_at',
  'updated_at',
] as const;

function getArgValue(name: string) {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

function hasFlag(name: string) {
  return process.argv.includes(`--${name}`);
}

function titleCase(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

function categoryLabel(category: string) {
  const labels: Record<string, string> = {
    cafe: 'Specialty Coffee',
    restaurant: 'Restaurant',
    wine_bar: 'Wine Bar',
    cocktail_bar: 'Cocktail Bar',
  };

  return labels[category] || titleCase(category);
}

function atmosphereForCategory(category: string) {
  if (category === 'cafe') return 'morning';
  if (category === 'wine_bar' || category === 'cocktail_bar') return 'late-night';
  return 'night';
}

function layoutForCategory(category: string) {
  if (category === 'cafe') return { card_size: 'compact', spacing: 'breathe' };
  if (category === 'restaurant') return { card_size: 'layered', spacing: 'breathe' };
  return { card_size: 'cinematic', spacing: 'isolated' };
}

function shortTagline(prose: string | null, fallback: string) {
  if (!prose) return fallback;
  const firstSentence = prose.match(/^(.+?[.!?])\s/)?.[1] || prose;
  return firstSentence.split(/\s+/).slice(0, 22).join(' ');
}

function getStringField(source: Record<string, unknown> | null, field: string) {
  const value = source?.[field];
  return typeof value === 'string' ? value : null;
}

function getLocationField(source: Record<string, unknown> | null) {
  const value = source?.location;
  if (!value || typeof value !== 'object') return null;
  return value as PlaceLocation;
}

function coordinatesFromCanonical(canonicalData: Record<string, unknown> | null) {
  const location = getLocationField(canonicalData);
  return {
    lat: location?.latitude ?? -34.6037,
    lng: location?.longitude ?? -58.3816,
  };
}

function locationFromCanonical(canonicalData: Record<string, unknown> | null) {
  return getStringField(canonicalData, 'formattedAddress') || getStringField(canonicalData, 'address') || 'Buenos Aires, Argentina';
}

function qualityScore(reviewCount: number, hasProse: boolean, hasEmbedding: boolean, hasImages: boolean) {
  const reviewComponent = Math.min(reviewCount, 5) / 5;
  const completeness = [hasProse, hasEmbedding, hasImages].filter(Boolean).length / 3;
  return Number((0.55 + reviewComponent * 0.25 + completeness * 0.2).toFixed(2));
}

function imageUrl(id: string) {
  return `/api/venue-images/${id}`;
}

async function auditPublicVenuesSchema() {
  const existing: string[] = [];
  const missing: string[] = [];

  for (const column of PUBLIC_VENUE_COLUMNS) {
    const { error } = await supabase.from('venues').select(column).limit(1);
    if (error) missing.push(column);
    else existing.push(column);
  }

  return { existing, missing };
}

async function selectVenue(placeId?: string) {
  let query = supabase
    .from('staging_venues')
    .select('*')
    .eq('status', 'ready_for_review')
    .not('atmosphere_prose', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(1);

  if (placeId) {
    query = supabase
      .from('staging_venues')
      .select('*')
      .eq('id', placeId)
      .eq('status', 'ready_for_review')
      .not('atmosphere_prose', 'is', null)
      .limit(1);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Unable to select staging venue: ${error.message}`);
  if (!data || data.length !== 1) throw new Error('Expected exactly one ready_for_review staging venue.');
  return data[0] as StagingVenue;
}

async function buildPublicVenueRecord(venue: StagingVenue) {
  const [{ count: reviewCount }, { count: imageCount }, { data: l3Records }, { data: imageRecords }] = await Promise.all([
    supabase.from('venue_reviews').select('*', { count: 'exact', head: true }).eq('venue_id', venue.id).neq('text', ''),
    supabase.from('venue_images').select('*', { count: 'exact', head: true }).eq('venue_id', venue.id),
    supabase.from('venue_embeddings').select('embedding').eq('venue_id', venue.id).eq('layer', 'L3').limit(1),
    supabase
      .from('venue_images')
      .select('id, is_cover')
      .eq('venue_id', venue.id)
      .order('is_cover', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(1),
  ]);

  const l3Embedding = l3Records?.[0]?.embedding || null;
  const heroImage = imageRecords?.[0]?.id ? imageUrl(imageRecords[0].id) : null;
  const hasProse = Boolean(venue.atmosphere_prose);
  const hasEmbedding = Boolean(l3Embedding);
  const hasImages = Boolean(imageCount && imageCount > 0);
  const layout = layoutForCategory(venue.category_seed);
  const fallbackTagline = `${venue.name} enters Korantis as a ${categoryLabel(venue.category_seed).toLowerCase()} validation venue.`;

  return {
    id: venue.id,
    name: venue.name,
    city: 'Buenos Aires',
    category: categoryLabel(venue.category_seed),
    location: locationFromCanonical(venue.canonical_data),
    coordinates: coordinatesFromCanonical(venue.canonical_data),
    card_size: layout.card_size,
    spacing: layout.spacing,
    hero_image: heroImage,
    atmosphere: atmosphereForCategory(venue.category_seed),
    quality: qualityScore(reviewCount || 0, hasProse, hasEmbedding, hasImages),
    tagline: shortTagline(venue.atmosphere_prose, fallbackTagline),
    narrative: venue.atmosphere_prose || fallbackTagline,
    tags: ['Buenos Aires', categoryLabel(venue.category_seed), 'Validation'],
    l2_vector: null,
    l3_vector: l3Embedding,
  };
}

async function main() {
  const dryRun = !hasFlag('publish');
  const placeId = getArgValue('place-id');

  if (!dryRun && !placeId) {
    throw new Error('Publishing requires an explicit --place-id to avoid promoting multiple or unintended venues.');
  }

  const schema = await auditPublicVenuesSchema();
  const venue = await selectVenue(placeId);
  const record = await buildPublicVenueRecord(venue);
  const publishRecord = schema.missing.includes('hero_image')
    ? Object.fromEntries(Object.entries(record).filter(([key]) => key !== 'hero_image'))
    : record;

  console.log(JSON.stringify({
    mode: dryRun ? 'dry-run' : 'publish',
    schema,
    source: {
      table: 'staging_venues',
      id: venue.id,
      name: venue.name,
      status: venue.status,
    },
    target: {
      table: 'venues',
      id: record.id,
      name: record.name,
    },
    record: publishRecord,
  }, null, 2));

  if (dryRun) return;

  const { error } = await supabase.from('venues').upsert(publishRecord, { onConflict: 'id' });
  if (error) throw new Error(`Unable to publish venue: ${error.message}`);

  console.log(`Published ${record.name} (${record.id}) to public.venues.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
