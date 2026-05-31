import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '..', '..', '.env.local') });
import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';
import { writeFileSync } from 'fs';
import { PHASE_A_PLACE_IDS } from './phase_a_ids';

type VenueImage = {
  id: string;
  venue_id: string;
  photo_reference: string;
  width: number | null;
  height: number | null;
  is_cover: boolean | null;
};

type PhotoScore = {
  hero_candidate: boolean;
  card_candidate: boolean;
  interior_visible: boolean;
  seating_visible: boolean;
  people_staying_visible: boolean;
  storefront_only: boolean;
  product_only: boolean;
  menu_only: boolean;
  atmosphere_score: number;
  rationale: string;
};

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!GOOGLE_API_KEY || !OPENAI_API_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing GOOGLE_PLACES_API_KEY, OPENAI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

function hasFlag(name: string) {
  return process.argv.includes(`--${name}`);
}

function getArgValue(name: string) {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

function selectedIds() {
  if (hasFlag('phase-a')) return [...PHASE_A_PLACE_IDS];
  const ids = getArgValue('ids');
  return ids ? ids.split(',').map((id) => id.trim()).filter(Boolean) : [];
}

async function hasColumn(table: string, column: string) {
  const { error } = await supabase.from(table).select(column).limit(1);
  return !error;
}

async function resolvePhotoUri(photoReference: string) {
  const url = new URL(`https://places.googleapis.com/v1/${photoReference}/media`);
  url.searchParams.set('maxWidthPx', '900');
  url.searchParams.set('skipHttpRedirect', 'true');
  url.searchParams.set('key', GOOGLE_API_KEY as string);

  const response = await fetch(url, {
    headers: { 'X-Goog-Api-Key': GOOGLE_API_KEY as string },
  });

  if (!response.ok) {
    throw new Error(`Unable to resolve photo media (${response.status})`);
  }

  const payload = await response.json() as { photoUri?: string };
  if (!payload.photoUri) throw new Error('Google photo media response did not include photoUri.');
  return payload.photoUri;
}

function normalizeScore(score: PhotoScore): PhotoScore {
  const atmosphereScore = Number.isFinite(score.atmosphere_score)
    ? Math.max(0, Math.min(100, Math.round(score.atmosphere_score)))
    : 0;
  const hardRejectHero = score.product_only || score.menu_only;

  return {
    hero_candidate: Boolean(score.hero_candidate && !hardRejectHero && atmosphereScore >= 65),
    card_candidate: Boolean(score.card_candidate && !score.menu_only && atmosphereScore >= 45),
    interior_visible: Boolean(score.interior_visible),
    seating_visible: Boolean(score.seating_visible),
    people_staying_visible: Boolean(score.people_staying_visible),
    storefront_only: Boolean(score.storefront_only),
    product_only: Boolean(score.product_only),
    menu_only: Boolean(score.menu_only),
    atmosphere_score: atmosphereScore,
    rationale: String(score.rationale || ''),
  };
}

async function classifyPhoto(photoUri: string) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Classify venue photos for a curated place discovery product. Be strict: product shots, menus, counters, and storefront-only photos are not hero candidates.',
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: [
              'Classify this Google Places venue photo.',
              'Prefer interiors, seating, lighting, spatial depth, ambience, and people staying.',
              'Do not mark product-only, menu-only, or storefront-only images as hero candidates unless there is no better image; for this single-image classification, keep hero_candidate false for those cases.',
            ].join('\n'),
          },
          {
            type: 'image_url',
            image_url: { url: photoUri, detail: 'low' },
          },
        ],
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'venue_photo_score',
        schema: {
          type: 'object',
          properties: {
            hero_candidate: { type: 'boolean' },
            card_candidate: { type: 'boolean' },
            interior_visible: { type: 'boolean' },
            seating_visible: { type: 'boolean' },
            people_staying_visible: { type: 'boolean' },
            storefront_only: { type: 'boolean' },
            product_only: { type: 'boolean' },
            menu_only: { type: 'boolean' },
            atmosphere_score: { type: 'number' },
            rationale: { type: 'string' },
          },
          required: [
            'hero_candidate',
            'card_candidate',
            'interior_visible',
            'seating_visible',
            'people_staying_visible',
            'storefront_only',
            'product_only',
            'menu_only',
            'atmosphere_score',
            'rationale',
          ],
          additionalProperties: false,
        },
        strict: true,
      },
    },
  });

  return normalizeScore(JSON.parse(response.choices[0].message.content || '{}') as PhotoScore);
}

async function main() {
  const ids = selectedIds();
  const limitPerVenue = Number(getArgValue('limit-per-venue') || '6');
  const canWritePhotoScores = await hasColumn('venue_images', 'photo_scores');
  const canWriteHeroScore = await hasColumn('venue_images', 'hero_suitability_score');
  const canWriteRejectionReason = await hasColumn('venue_images', 'rejection_reason');

  let query = supabase
    .from('venue_images')
    .select('id, venue_id, photo_reference, width, height, is_cover')
    .order('venue_id')
    .order('is_cover', { ascending: false });

  if (ids.length > 0) query = query.in('venue_id', ids);

  const { data, error } = await query;
  if (error) throw new Error(`Unable to read venue_images: ${error.message}`);

  const imagesByVenue = new Map<string, VenueImage[]>();
  for (const image of (data || []) as VenueImage[]) {
    const rows = imagesByVenue.get(image.venue_id) || [];
    if (rows.length < limitPerVenue) rows.push(image);
    imagesByVenue.set(image.venue_id, rows);
  }

  const results: Array<VenueImage & { score?: PhotoScore; error?: string }> = [];

  for (const [venueId, images] of imagesByVenue) {
    console.log(`Scoring ${images.length} photos for ${venueId}...`);

    for (const image of images) {
      try {
        const photoUri = await resolvePhotoUri(image.photo_reference);
        const score = await classifyPhoto(photoUri);
        results.push({ ...image, score });

        if (canWritePhotoScores || canWriteHeroScore || canWriteRejectionReason) {
          const payload: Record<string, unknown> = {};
          if (canWritePhotoScores) payload.photo_scores = score;
          if (canWriteHeroScore) payload.hero_suitability_score = score.atmosphere_score;
          if (canWriteRejectionReason && !score.hero_candidate) {
            payload.rejection_reason = score.product_only
              ? 'product_only'
              : score.menu_only
                ? 'menu_only'
                : score.storefront_only
                  ? 'storefront_only'
                  : score.atmosphere_score < 65
                    ? 'weak_atmosphere'
                    : null;
          }

          const { error: updateError } = await supabase.from('venue_images').update(payload).eq('id', image.id);
          if (updateError) throw new Error(`Unable to update photo score: ${updateError.message}`);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        results.push({ ...image, error: message });
        console.error(`  Photo ${image.id} failed: ${message}`);
      }
    }
  }

  writeFileSync(path.join('data', 'phase_a_photo_scores.json'), JSON.stringify({
    generatedAt: new Date().toISOString(),
    ids,
    canWritePhotoScores,
    results,
  }, null, 2));

  console.log(`Photo scoring complete. Results: ${results.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

