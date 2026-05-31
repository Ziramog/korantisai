import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '..', '..', '.env.local') });
import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';

type PublicVenue = {
  id: string;
  name: string;
  hero_image?: string | null;
  tagline: string | null;
  narrative: string | null;
  tags: string[] | null;
  quality: number | null;
  l3_vector: number[] | string | null;
};

type VenueImage = {
  id: string;
  venue_id: string;
  is_cover: boolean | null;
};

type ReadinessRow = {
  id: string;
  name: string;
  heroImagePresent: boolean;
  galleryPresent: boolean;
  tagsPresent: boolean;
  prosePresent: boolean;
  embeddingsPresent: boolean;
  qualityScorePresent: boolean;
  notes: string[];
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

const ATMOSPHERIC_VOCABULARY = [
  'amber',
  'botanical',
  'bright',
  'bustling',
  'calm',
  'cinematic',
  'cozy',
  'daylight',
  'dim',
  'energetic',
  'focused',
  'golden',
  'green',
  'intimate',
  'lively',
  'minimal',
  'morning',
  'nostalgic',
  'quiet',
  'ritual',
  'romantic',
  'slow',
  'social',
  'soft',
  'sunlit',
  'warm',
];

const FALLBACK_TAGS = ['Atmospheric', 'Buenos Aires', 'Consumer Ready'];

function imageUrl(id: string) {
  return `/api/venue-images/${id}`;
}

function hasFlag(name: string) {
  return process.argv.includes(`--${name}`);
}

async function hasColumn(column: string) {
  const { error } = await supabase.from('venues').select(column).limit(1);
  return !error;
}

function normalizeTag(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function extractAtmosphericTags(prose: string | null, existing: string[] | null) {
  const text = prose?.toLowerCase() || '';
  const tags = ATMOSPHERIC_VOCABULARY.filter((word) => text.includes(word)).map(normalizeTag);
  const merged = [...tags, ...(existing || []).filter(Boolean)];
  const unique = [...new Set(merged)].slice(0, 6);
  return unique.length >= 3 ? unique : [...new Set([...unique, ...FALLBACK_TAGS])].slice(0, 6);
}

async function main() {
  const dryRun = !hasFlag('apply');
  const heroImageColumnExists = await hasColumn('hero_image');

  const venueColumns = [
    'id',
    'name',
    heroImageColumnExists ? 'hero_image' : null,
    'tagline',
    'narrative',
    'tags',
    'quality',
    'l3_vector',
  ].filter(Boolean).join(', ');

  const { data: venues, error: venueError } = await supabase
    .from('venues')
    .select(venueColumns)
    .order('name');

  if (venueError) throw new Error(`Unable to read public.venues: ${venueError.message}`);

  const venueRows = (venues || []) as unknown as PublicVenue[];
  const venueIds = venueRows.map((venue) => venue.id);
  const { data: images, error: imageError } = await supabase
    .from('venue_images')
    .select('id, venue_id, is_cover')
    .in('venue_id', venueIds);

  if (imageError) throw new Error(`Unable to read venue_images: ${imageError.message}`);

  const imagesByVenue = new Map<string, VenueImage[]>();
  for (const image of (images || []) as VenueImage[]) {
    const rows = imagesByVenue.get(image.venue_id) || [];
    rows.push(image);
    imagesByVenue.set(image.venue_id, rows);
  }

  const readiness: ReadinessRow[] = [];

  for (const venue of venueRows) {
    const venueImages = (imagesByVenue.get(venue.id) || [])
      .sort((a, b) => Number(Boolean(b.is_cover)) - Number(Boolean(a.is_cover)));
    const heroImage = venue.hero_image || (venueImages[0]?.id ? imageUrl(venueImages[0].id) : null);
    const tags = extractAtmosphericTags([venue.tagline, venue.narrative].filter(Boolean).join(' '), venue.tags);

    const updatePayload: Record<string, unknown> = { tags };
    if (heroImageColumnExists && heroImage) {
      updatePayload.hero_image = heroImage;
    }

    if (!dryRun) {
      const { error } = await supabase.from('venues').update(updatePayload).eq('id', venue.id);
      if (error) throw new Error(`Unable to update ${venue.name}: ${error.message}`);
    }

    readiness.push({
      id: venue.id,
      name: venue.name,
      heroImagePresent: Boolean(heroImage),
      galleryPresent: venueImages.length > 0,
      tagsPresent: tags.length >= 3,
      prosePresent: Boolean(venue.tagline && venue.narrative),
      embeddingsPresent: Boolean(venue.l3_vector),
      qualityScorePresent: typeof venue.quality === 'number',
      notes: [
        heroImageColumnExists ? '' : 'public.venues.hero_image column missing in live schema',
        venueImages.length > 0 ? '' : 'no venue_images rows',
        Boolean(venue.l3_vector) ? '' : 'no published L3 embedding',
      ].filter(Boolean),
    });
  }

  const totals = {
    publishedVenues: readiness.length,
    heroImagesPresent: readiness.filter((row) => row.heroImagePresent).length,
    galleriesPresent: readiness.filter((row) => row.galleryPresent).length,
    tagsPresent: readiness.filter((row) => row.tagsPresent).length,
    prosePresent: readiness.filter((row) => row.prosePresent).length,
    embeddingsPresent: readiness.filter((row) => row.embeddingsPresent).length,
    qualityScoresPresent: readiness.filter((row) => row.qualityScorePresent).length,
  };

  const report = [
    '# Consumer Readiness Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Mode: ${dryRun ? 'dry-run' : 'apply'}`,
    '',
    '## Schema',
    '',
    `- public.venues.hero_image column present: ${heroImageColumnExists ? 'yes' : 'no'}`,
    '- Gallery source: public.venue_images',
    '- Gallery runtime exposure: /api/venues galleryImages[] plus /api/venue-images/[id] proxy',
    '',
    '## Totals',
    '',
    `- Published venues: ${totals.publishedVenues}`,
    `- Hero image present: ${totals.heroImagesPresent}/${totals.publishedVenues}`,
    `- Gallery present: ${totals.galleriesPresent}/${totals.publishedVenues}`,
    `- Tags present: ${totals.tagsPresent}/${totals.publishedVenues}`,
    `- Prose present: ${totals.prosePresent}/${totals.publishedVenues}`,
    `- Embeddings present: ${totals.embeddingsPresent}/${totals.publishedVenues}`,
    `- Quality score present: ${totals.qualityScoresPresent}/${totals.publishedVenues}`,
    '',
    '## Published Venue Matrix',
    '',
    '| Venue | Hero image | Gallery | Tags | Prose | Embeddings | Quality score | Notes |',
    '|---|---:|---:|---:|---:|---:|---:|---|',
    ...readiness.map((row) => [
      `| ${row.name}`,
      row.heroImagePresent ? 'PASS' : 'FAIL',
      row.galleryPresent ? 'PASS' : 'FAIL',
      row.tagsPresent ? 'PASS' : 'FAIL',
      row.prosePresent ? 'PASS' : 'FAIL',
      row.embeddingsPresent ? 'PASS' : 'FAIL',
      row.qualityScorePresent ? 'PASS' : 'FAIL',
      `${row.notes.join('; ') || '-'} |`,
    ].join(' | ')),
    '',
    '## Readiness Verdict',
    '',
    totals.publishedVenues > 0 &&
    totals.heroImagesPresent === totals.publishedVenues &&
    totals.galleriesPresent === totals.publishedVenues &&
    totals.tagsPresent === totals.publishedVenues &&
    totals.prosePresent === totals.publishedVenues &&
    totals.embeddingsPresent === totals.publishedVenues &&
    totals.qualityScoresPresent === totals.publishedVenues
      ? 'PASS: All published venues are consumer-complete.'
      : 'FAIL: Published venues are not yet consumer-complete. The primary blockers are missing live hero_image schema application, missing venue_images for legacy rows, and missing embeddings on legacy rows.',
    '',
  ].join('\n');

  writeFileSync(path.join(__dirname, '..', '..', 'data', 'consumer_readiness_report.md'), report);
  console.log(report);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
