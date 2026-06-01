import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '..', '..', '.env.local') });
import { readFileSync, writeFileSync } from 'fs';
import { OpenAI } from 'openai';
import type { PhotoVisionResult, VenuePhotoVisionAggregation } from './photo_vision_contract';
import { PHOTO_VISION_CONTRACT_VERSION } from './photo_vision_contract';

const MAX_VENUES = 8;
const MAX_PHOTOS = 80;
const OPENAI_VISION_MODEL = 'gpt-4o-mini';

type PhotoInput = {
  candidate_id: string;
  google_place_id: string;
  venue_name: string;
  photo_reference: string;
  width: number | null;
  height: number | null;
  order: number;
  source: 'google';
  vision_status: 'not_evaluated';
};

type PhotoInputVenue = {
  candidate_id: string;
  google_place_id: string | null;
  venue_name: string;
  status: string;
  photo_count: number;
  enough_photo_material_for_vision: boolean;
  photos: PhotoInput[];
};

type PhotoInputsFile = {
  venues: PhotoInputVenue[];
  photo_inputs: PhotoInput[];
};

type VenueVisionResult = {
  candidate_id: string;
  google_place_id: string | null;
  venue_name: string;
  vision_status: 'evaluated' | 'dry_run' | 'partial_error';
  model: string | null;
  photos_evaluated: number;
  photo_results: PhotoVisionResult[];
  aggregation: VenuePhotoVisionAggregation;
  errors: string[];
};

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(file, 'utf8')) as T;
}

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

function aggregateVenue(photoResults: PhotoVisionResult[]): VenuePhotoVisionAggregation {
  const acceptablePhotos = photoResults.filter((photo) => (
    photo.hero_suitability_score >= 65 &&
    photo.atmosphere_score >= 55 &&
    !photo.product_only &&
    !photo.menu_only &&
    !(photo.storefront_only && !photo.interior_visible)
  ));
  const bestHero = [...acceptablePhotos].sort((a, b) => b.hero_suitability_score - a.hero_suitability_score)[0] || null;
  const bestCard = [...photoResults].filter((photo) => !photo.menu_only && !photo.product_only).sort((a, b) => b.card_suitability_score - a.card_suitability_score)[0] || bestHero;
  const maxOf = (selector: (photo: PhotoVisionResult) => number) => photoResults.length ? Math.max(...photoResults.map(selector)) : 0;
  const booleanPercent = (selector: (photo: PhotoVisionResult) => boolean) => photoResults.length
    ? Math.round((photoResults.filter(selector).length / photoResults.length) * 100)
    : 0;
  const warnings = new Set<string>();

  if (!bestHero) warnings.add('no acceptable hero photo from vision results');
  if (booleanPercent((photo) => photo.seating_visible) < 30) warnings.add('weak seating visibility');
  if (booleanPercent((photo) => photo.interior_visible) < 30) warnings.add('weak interior visibility');
  if (photoResults.some((photo) => photo.product_only || photo.menu_only)) warnings.add('some photos are product/menu-only');

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

function dryRunVenue(venue: PhotoInputVenue, reason: string): VenueVisionResult {
  return {
    candidate_id: venue.candidate_id,
    google_place_id: venue.google_place_id,
    venue_name: venue.venue_name,
    vision_status: 'dry_run',
    model: null,
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

async function main() {
  const googleApiKey = process.env.GOOGLE_PLACES_API_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;
  const input = readJson<PhotoInputsFile>(path.join(process.cwd(), 'data', 'venue_intelligence_photo_inputs.json'));
  const venues = input.venues.filter((venue) => venue.enough_photo_material_for_vision && venue.photos.length > 0);
  const photoCount = venues.reduce((sum, venue) => sum + venue.photos.length, 0);

  if (venues.length > MAX_VENUES) throw new Error(`Refusing to process ${venues.length} venues. Max allowed is ${MAX_VENUES}.`);
  if (photoCount > MAX_PHOTOS) throw new Error(`Refusing to process ${photoCount} photos. Max allowed is ${MAX_PHOTOS}.`);

  const dryRunReason = !googleApiKey
    ? 'missing GOOGLE_PLACES_API_KEY'
    : openAiKey
      ? null
      : 'missing configured low-cost vision key';

  if (dryRunReason) {
    console.warn(`Vision dry-run: ${dryRunReason}.`);
  } else {
    console.warn(`Controlled photo vision will evaluate ${photoCount} photos across ${venues.length} pilot venues only.`);
  }

  const model = OPENAI_VISION_MODEL;
  const openai = openAiKey ? new OpenAI({ apiKey: openAiKey }) : null;
  const venueResults: VenueVisionResult[] = [];
  const errors: string[] = [];

  for (const venue of venues) {
    if (dryRunReason || !googleApiKey || !openai) {
      venueResults.push(dryRunVenue(venue, dryRunReason || 'vision model unavailable'));
      continue;
    }

    const photoResults: PhotoVisionResult[] = [];
    const venueErrors: string[] = [];

    for (const photo of venue.photos) {
      try {
        const photoUri = await resolvePhotoUri(photo.photo_reference, googleApiKey);
        const result = await classifyWithOpenAI(openai, photoUri, photo.photo_reference);
        photoResults.push(result);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        venueErrors.push(`${photo.photo_reference}: ${message}`);
        errors.push(`${venue.venue_name}: ${message}`);
      }
    }

    venueResults.push({
      candidate_id: venue.candidate_id,
      google_place_id: venue.google_place_id,
      venue_name: venue.venue_name,
      vision_status: venueErrors.length > 0 ? 'partial_error' : 'evaluated',
      model,
      photos_evaluated: photoResults.length,
      photo_results: photoResults,
      aggregation: aggregateVenue(photoResults),
      errors: venueErrors,
    });
  }

  const output = {
    generatedAt: new Date().toISOString(),
    contractVersion: PHOTO_VISION_CONTRACT_VERSION,
    model,
    dryRun: Boolean(dryRunReason),
    dryRunReason,
    venue_count: venueResults.length,
    photo_count: photoCount,
    photos_evaluated: venueResults.reduce((sum, venue) => sum + venue.photos_evaluated, 0),
    errors,
    venues: venueResults,
  };
  writeFileSync(path.join(process.cwd(), 'data', 'venue_intelligence_photo_vision_results.json'), JSON.stringify(output, null, 2));

  const acceptable = venueResults.filter((venue) => venue.aggregation.acceptable_hero_photo);
  const failed = venueResults.filter((venue) => !venue.aggregation.acceptable_hero_photo);
  const report = [
    '# Venue Intelligence Photo Vision Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Scope',
    '',
    '- Evaluates only pilot venues with existing photo references and enough material.',
    '- Does not write to database.',
    '- Does not publish venues or generate copy.',
    '',
    '## Summary',
    '',
    `- Dry run: ${dryRunReason ? 'yes' : 'no'}`,
    `- Model: ${model}`,
    `- Venues targeted: ${venueResults.length}`,
    `- Photos available: ${photoCount}`,
    `- Photos evaluated: ${output.photos_evaluated}`,
    `- Venues with acceptable hero photo: ${acceptable.length}`,
    `- Venues failing hero photo: ${failed.length}`,
    `- Errors: ${errors.length}`,
    '',
    '## Venue Aggregation',
    '',
    ...venueResults.map((venue) => `- ${venue.venue_name}: hero ${venue.aggregation.acceptable_hero_photo ? 'yes' : 'no'}, photo quality ${venue.aggregation.photo_quality_score}, interior ${venue.aggregation.interior_confidence}, seating ${venue.aggregation.seating_confidence}, warnings: ${venue.aggregation.warnings.join('; ') || 'none'}`),
    '',
    '## Errors',
    '',
    ...(errors.length ? errors.map((error) => `- ${error}`) : ['- None']),
  ].join('\n');

  writeFileSync(path.join(process.cwd(), 'data', 'venue_intelligence_photo_vision_report.md'), report);
  console.log(report);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
