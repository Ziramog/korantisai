import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '..', '..', '.env.local') });
import { writeFileSync } from 'fs';
import { OpenAI } from 'openai';
import {
  CONTROLLED_BATCH_MAX,
  type BatchGoogleRecord,
  type PhotoVisionResult,
  type VenueVisionAggregation,
  type VenueVisionResult,
  readJson,
} from './controlled_batch_utils';

const MAX_PHOTOS_PER_VENUE = 10;
const MAX_PHOTOS = CONTROLLED_BATCH_MAX * MAX_PHOTOS_PER_VENUE;
const OPENAI_VISION_MODEL = 'gpt-4o-mini';

type EnrichmentFile = {
  records: BatchGoogleRecord[];
};

type PhotoInput = {
  candidate_id: string;
  google_place_id: string;
  venue_name: string;
  photo_reference: string;
  width: number | null;
  height: number | null;
  order: number;
};

function clampScore(value: unknown): number {
  const number = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return Math.max(0, Math.min(100, Math.round(number)));
}

function normalizeVisionResult(input: Partial<PhotoVisionResult>, photoReference: string): PhotoVisionResult {
  return {
    photo_reference: photoReference,
    interior_visible: Boolean(input.interior_visible),
    exterior_visible: Boolean(input.exterior_visible),
    seating_visible: Boolean(input.seating_visible),
    people_staying_visible: Boolean(input.people_staying_visible),
    counter_only: Boolean(input.counter_only),
    product_only: Boolean(input.product_only),
    storefront_only: Boolean(input.storefront_only),
    menu_only: Boolean(input.menu_only),
    natural_light_score: clampScore(input.natural_light_score),
    spatial_depth_score: clampScore(input.spatial_depth_score),
    design_quality_score: clampScore(input.design_quality_score),
    atmosphere_score: clampScore(input.atmosphere_score),
    hero_suitability_score: clampScore(input.hero_suitability_score),
    card_suitability_score: clampScore(input.card_suitability_score),
    warnings: Array.isArray(input.warnings) ? input.warnings.map(String) : [],
  };
}

function photoInputs(record: BatchGoogleRecord): PhotoInput[] {
  if (record.status !== 'matched' || !record.google_place_id) return [];
  return (record.google_data?.photos || [])
    .filter((photo) => typeof photo.name === 'string' && photo.name.length > 0)
    .slice(0, MAX_PHOTOS_PER_VENUE)
    .map((photo, index) => ({
      candidate_id: record.candidate_id,
      google_place_id: record.google_place_id as string,
      venue_name: record.candidate_name,
      photo_reference: photo.name as string,
      width: typeof photo.widthPx === 'number' ? photo.widthPx : null,
      height: typeof photo.heightPx === 'number' ? photo.heightPx : null,
      order: index + 1,
    }));
}

function aggregateVenue(photoResults: PhotoVisionResult[]): VenueVisionAggregation {
  const acceptablePhotos = photoResults.filter((photo) => (
    photo.hero_suitability_score >= 65 &&
    photo.atmosphere_score >= 55 &&
    !photo.product_only &&
    !photo.menu_only &&
    !(photo.storefront_only && !photo.interior_visible)
  ));
  const bestHero = [...acceptablePhotos].sort((a, b) => b.hero_suitability_score - a.hero_suitability_score)[0] || null;
  const bestCard = [...photoResults]
    .filter((photo) => !photo.menu_only && !photo.product_only)
    .sort((a, b) => b.card_suitability_score - a.card_suitability_score)[0] || bestHero;
  const maxOf = (selector: (photo: PhotoVisionResult) => number) => photoResults.length ? Math.max(...photoResults.map(selector)) : 0;
  const booleanPercent = (selector: (photo: PhotoVisionResult) => boolean) => photoResults.length
    ? Math.round((photoResults.filter(selector).length / photoResults.length) * 100)
    : 0;
  const warnings = new Set<string>();

  if (!bestHero) warnings.add('no acceptable hero photo from vision results');
  if (booleanPercent((photo) => photo.seating_visible) < 30) warnings.add('weak seating visibility');
  if (booleanPercent((photo) => photo.interior_visible) < 30) warnings.add('weak interior visibility');
  if (photoResults.some((photo) => photo.product_only || photo.menu_only)) warnings.add('some photos are product/menu-only');
  if (photoResults.some((photo) => photo.storefront_only && !photo.interior_visible)) warnings.add('some photos are storefront-only');

  return {
    acceptable_hero_photo: Boolean(bestHero),
    hero_photo_reference: bestHero?.photo_reference || null,
    best_card_photo_reference: bestCard?.photo_reference || null,
    photo_quality_score: maxOf((photo) => photo.hero_suitability_score),
    interior_confidence: booleanPercent((photo) => photo.interior_visible),
    seating_confidence: booleanPercent((photo) => photo.seating_visible),
    long_stay_visual_signal: Math.round((booleanPercent((photo) => photo.seating_visible || photo.people_staying_visible) + maxOf((photo) => photo.spatial_depth_score)) / 2),
    design_visual_signal: maxOf((photo) => photo.design_quality_score),
    warnings: [...warnings],
  };
}

async function resolvePhotoUri(photoReference: string, apiKey: string): Promise<string> {
  const url = new URL(`https://places.googleapis.com/v1/${photoReference}/media`);
  url.searchParams.set('maxWidthPx', '900');
  url.searchParams.set('skipHttpRedirect', 'true');
  url.searchParams.set('key', apiKey);

  const response = await fetch(url, {
    headers: { 'X-Goog-Api-Key': apiKey },
  });
  if (!response.ok) throw new Error(`Unable to resolve photo media (${response.status})`);
  const payload = await response.json() as { photoUri?: string };
  if (!payload.photoUri) throw new Error('Google photo media response did not include photoUri.');
  return payload.photoUri;
}

async function classifyWithOpenAI(openai: OpenAI, photoUri: string, photoReference: string): Promise<PhotoVisionResult> {
  const response = await openai.chat.completions.create({
    model: OPENAI_VISION_MODEL,
    messages: [
      {
        role: 'system',
        content: [
          'You classify venue photos for a curated place discovery product.',
          'Be strict. Product shots, menu shots, empty storefronts, and counter-only photos are weak hero candidates.',
          'Return only the requested JSON fields. Do not write prose.',
        ].join(' '),
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: [
              'Evaluate this venue photo against the contract.',
              'Prefer interiors, seating, people staying, natural light, spatial depth, design quality, and atmosphere.',
              'Scores must be 0-100.',
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
        name: 'photo_vision_result',
        schema: {
          type: 'object',
          properties: {
            photo_reference: { type: 'string' },
            interior_visible: { type: 'boolean' },
            exterior_visible: { type: 'boolean' },
            seating_visible: { type: 'boolean' },
            people_staying_visible: { type: 'boolean' },
            counter_only: { type: 'boolean' },
            product_only: { type: 'boolean' },
            storefront_only: { type: 'boolean' },
            menu_only: { type: 'boolean' },
            natural_light_score: { type: 'number' },
            spatial_depth_score: { type: 'number' },
            design_quality_score: { type: 'number' },
            atmosphere_score: { type: 'number' },
            hero_suitability_score: { type: 'number' },
            card_suitability_score: { type: 'number' },
            warnings: { type: 'array', items: { type: 'string' } },
          },
          required: [
            'photo_reference',
            'interior_visible',
            'exterior_visible',
            'seating_visible',
            'people_staying_visible',
            'counter_only',
            'product_only',
            'storefront_only',
            'menu_only',
            'natural_light_score',
            'spatial_depth_score',
            'design_quality_score',
            'atmosphere_score',
            'hero_suitability_score',
            'card_suitability_score',
            'warnings',
          ],
          additionalProperties: false,
        },
        strict: true,
      },
    },
  });

  const parsed = JSON.parse(response.choices[0].message.content || '{}') as Partial<PhotoVisionResult>;
  return normalizeVisionResult(parsed, photoReference);
}

function unevaluatedVenue(record: BatchGoogleRecord, status: VenueVisionResult['vision_status'], reason: string): VenueVisionResult {
  return {
    candidate_id: record.candidate_id,
    google_place_id: record.google_place_id,
    venue_name: record.candidate_name,
    vision_status: status,
    model: null,
    photos_available: record.google_data?.photos?.length || 0,
    photos_evaluated: 0,
    photo_results: [],
    aggregation: {
      acceptable_hero_photo: false,
      hero_photo_reference: null,
      best_card_photo_reference: null,
      photo_quality_score: 0,
      interior_confidence: 0,
      seating_confidence: 0,
      long_stay_visual_signal: 0,
      design_visual_signal: 0,
      warnings: [reason],
    },
    errors: [reason],
  };
}

async function evaluateVenue(record: BatchGoogleRecord, openai: OpenAI, googleApiKey: string): Promise<VenueVisionResult> {
  const inputs = photoInputs(record);
  const photoResults: PhotoVisionResult[] = [];
  const errors: string[] = [];

  for (const input of inputs) {
    try {
      const photoUri = await resolvePhotoUri(input.photo_reference, googleApiKey);
      photoResults.push(await classifyWithOpenAI(openai, photoUri, input.photo_reference));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${input.order}: ${message}`);
    }
  }

  return {
    candidate_id: record.candidate_id,
    google_place_id: record.google_place_id,
    venue_name: record.candidate_name,
    vision_status: errors.length && photoResults.length ? 'partial_error' : 'evaluated',
    model: OPENAI_VISION_MODEL,
    photos_available: record.google_data?.photos?.length || 0,
    photos_evaluated: photoResults.length,
    photo_results: photoResults,
    aggregation: aggregateVenue(photoResults),
    errors,
  };
}

function report(venues: VenueVisionResult[], dryRun: boolean): string {
  const evaluated = venues.filter((venue) => venue.vision_status === 'evaluated' || venue.vision_status === 'partial_error');
  const withHero = venues.filter((venue) => venue.aggregation.acceptable_hero_photo);
  const noPhotos = venues.filter((venue) => venue.vision_status === 'no_photos');
  const partial = venues.filter((venue) => venue.vision_status === 'partial_error');
  const avgPhotoQuality = evaluated.length
    ? Math.round(evaluated.reduce((sum, venue) => sum + venue.aggregation.photo_quality_score, 0) / evaluated.length)
    : 0;

  return [
    '# Controlled Batch 30 Photo Vision Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    `- Dry run: ${dryRun ? 'yes' : 'no'}`,
    `- Venues in report: ${venues.length}`,
    `- Evaluated venues: ${evaluated.length}`,
    `- Photos evaluated: ${venues.reduce((sum, venue) => sum + venue.photos_evaluated, 0)}`,
    `- Venues with acceptable hero: ${withHero.length}`,
    `- Venues without photos: ${noPhotos.length}`,
    `- Partial errors: ${partial.length}`,
    `- Average photo quality: ${avgPhotoQuality}`,
    '',
    '## Venue Photo Results',
    '',
    ...venues.map((venue) => `- ${venue.venue_name}: ${venue.vision_status}, photos ${venue.photos_evaluated}/${venue.photos_available}, hero ${venue.aggregation.acceptable_hero_photo ? 'yes' : 'no'}, quality ${venue.aggregation.photo_quality_score}, warnings ${venue.aggregation.warnings.join('; ') || 'none'}`),
    '',
    '## Errors',
    '',
    ...venues.flatMap((venue) => venue.errors.map((error) => `- ${venue.venue_name}: ${error}`)).concat(venues.some((venue) => venue.errors.length) ? [] : ['- None']),
  ].join('\n');
}

async function main() {
  const googleApiKey = process.env.GOOGLE_PLACES_API_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;
  const enrichment = readJson<EnrichmentFile>(path.join(process.cwd(), 'data', 'controlled_batch_30_google_enrichment.json'));
  const matchedRecords = enrichment.records.filter((record) => record.status === 'matched');
  const photoCount = matchedRecords.reduce((sum, record) => sum + photoInputs(record).length, 0);

  if (enrichment.records.length > CONTROLLED_BATCH_MAX) throw new Error(`Refusing to process more than ${CONTROLLED_BATCH_MAX} candidates.`);
  if (photoCount > MAX_PHOTOS) throw new Error(`Refusing to process ${photoCount} photos. Max allowed is ${MAX_PHOTOS}.`);

  const dryRunReason = !googleApiKey ? 'missing GOOGLE_PLACES_API_KEY' : openAiKey ? null : 'missing OPENAI_API_KEY';
  const dryRun = Boolean(dryRunReason);
  const openai = openAiKey ? new OpenAI({ apiKey: openAiKey }) : null;
  const venues: VenueVisionResult[] = [];

  console.warn(dryRunReason || `Controlled photo vision for ${matchedRecords.length} matched venues and ${photoCount} photos.`);

  for (const record of enrichment.records) {
    if (record.status !== 'matched') continue;
    if (!photoInputs(record).length) {
      venues.push(unevaluatedVenue(record, 'no_photos', 'no photo references'));
      continue;
    }
    if (!openai || !googleApiKey || dryRunReason) {
      venues.push(unevaluatedVenue(record, 'dry_run', dryRunReason || 'photo vision dry-run'));
      continue;
    }
    venues.push(await evaluateVenue(record, openai, googleApiKey));
  }

  const output = {
    generatedAt: new Date().toISOString(),
    dryRun,
    model: dryRun ? null : OPENAI_VISION_MODEL,
    venues,
  };
  const markdown = report(venues, dryRun);

  writeFileSync(path.join(process.cwd(), 'data', 'controlled_batch_30_photo_vision.json'), JSON.stringify(output, null, 2));
  writeFileSync(path.join(process.cwd(), 'data', 'controlled_batch_30_photo_vision.md'), markdown);
  console.log(markdown);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
