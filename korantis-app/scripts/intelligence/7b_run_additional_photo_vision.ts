import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '..', '..', '.env.local') });
import { readFileSync, writeFileSync } from 'fs';
import { OpenAI } from 'openai';
import type { PhotoVisionResult, VenuePhotoVisionAggregation } from './photo_vision_contract';
import { PHOTO_VISION_CONTRACT_VERSION } from './photo_vision_contract';

const TARGET_NAMES = ['Cuervo Cafe', 'LAB Tostadores de Cafe', 'Lattente'];
const OPENAI_VISION_MODEL = 'gpt-4o-mini';

type GooglePhoto = {
  name?: string;
  widthPx?: number;
  heightPx?: number;
};

type EnrichmentRecord = {
  candidate_id: string;
  candidate_name: string;
  google_place_id: string | null;
  status: string;
  google_data: {
    photos?: GooglePhoto[];
  } | null;
};

type EnrichmentFile = {
  records: EnrichmentRecord[];
};

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

function photoInputs(record: EnrichmentRecord): PhotoInput[] {
  if (!record.google_place_id) return [];
  return (record.google_data?.photos || [])
    .filter((photo) => typeof photo.name === 'string' && photo.name.length > 0)
    .slice(0, 10)
    .map((photo, index) => ({
      candidate_id: record.candidate_id,
      google_place_id: record.google_place_id as string,
      venue_name: record.candidate_name,
      photo_reference: photo.name as string,
      width: typeof photo.widthPx === 'number' ? photo.widthPx : null,
      height: typeof photo.heightPx === 'number' ? photo.heightPx : null,
      order: index + 1,
      source: 'google',
      vision_status: 'not_evaluated',
    }));
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
        content: 'Classify venue photos for a curated place discovery product. Be strict and return only JSON.',
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: [
              'Evaluate this venue photo.',
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

  return normalizeVisionResult(JSON.parse(response.choices[0].message.content || '{}') as Partial<PhotoVisionResult>, photoReference);
}

function dryRunVenue(record: EnrichmentRecord, reason: string): VenueVisionResult {
  return {
    candidate_id: record.candidate_id,
    google_place_id: record.google_place_id,
    venue_name: record.candidate_name,
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
  const enrichment = readJson<EnrichmentFile>(path.join(process.cwd(), 'data', 'venue_intelligence_google_enrichment_final_pilot.json'));
  const records = enrichment.records.filter((record) => TARGET_NAMES.includes(record.candidate_name) && record.status === 'matched' && (record.google_data?.photos || []).length > 0);
  const dryRunReason = !googleApiKey ? 'missing GOOGLE_PLACES_API_KEY' : openAiKey ? null : 'missing OPENAI_API_KEY';
  const openai = openAiKey ? new OpenAI({ apiKey: openAiKey }) : null;
  const results: VenueVisionResult[] = [];
  const errors: string[] = [];

  if (dryRunReason) {
    console.warn(`Additional vision dry-run: ${dryRunReason}.`);
  } else {
    console.warn(`Running additional vision for ${records.length} newly repaired cafe matches only.`);
  }

  for (const record of records) {
    if (dryRunReason || !googleApiKey || !openai) {
      results.push(dryRunVenue(record, dryRunReason || 'vision model unavailable'));
      continue;
    }

    const photoResults: PhotoVisionResult[] = [];
    const venueErrors: string[] = [];
    for (const photo of photoInputs(record)) {
      try {
        const photoUri = await resolvePhotoUri(photo.photo_reference, googleApiKey);
        const result = await classifyWithOpenAI(openai, photoUri, photo.photo_reference);
        photoResults.push(result);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        venueErrors.push(`${photo.photo_reference}: ${message}`);
        errors.push(`${record.candidate_name}: ${message}`);
      }
    }

    results.push({
      candidate_id: record.candidate_id,
      google_place_id: record.google_place_id,
      venue_name: record.candidate_name,
      vision_status: venueErrors.length > 0 ? 'partial_error' : 'evaluated',
      model: OPENAI_VISION_MODEL,
      photos_evaluated: photoResults.length,
      photo_results: photoResults,
      aggregation: aggregateVenue(photoResults),
      errors: venueErrors,
    });
  }

  const output = {
    generatedAt: new Date().toISOString(),
    contractVersion: PHOTO_VISION_CONTRACT_VERSION,
    model: OPENAI_VISION_MODEL,
    dryRun: Boolean(dryRunReason),
    dryRunReason,
    venue_count: results.length,
    photo_count: records.reduce((sum, record) => sum + Math.min((record.google_data?.photos || []).length, 10), 0),
    photos_evaluated: results.reduce((sum, result) => sum + result.photos_evaluated, 0),
    errors,
    venues: results,
  };
  writeFileSync(path.join(process.cwd(), 'data', 'venue_intelligence_additional_photo_vision_results.json'), JSON.stringify(output, null, 2));

  const report = [
    '# Venue Intelligence Additional Photo Vision Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Summary',
    '',
    `- Target venues: ${records.length}`,
    `- Dry run: ${dryRunReason ? 'yes' : 'no'}`,
    `- Photos available: ${output.photo_count}`,
    `- Photos evaluated: ${output.photos_evaluated}`,
    `- Venues with acceptable hero photo: ${results.filter((result) => result.aggregation.acceptable_hero_photo).length}`,
    `- Errors: ${errors.length}`,
    '',
    '## Venue Aggregation',
    '',
    ...results.map((result) => `- ${result.venue_name}: hero ${result.aggregation.acceptable_hero_photo ? 'yes' : 'no'}, photo quality ${result.aggregation.photo_quality_score}, interior ${result.aggregation.interior_confidence}, seating ${result.aggregation.seating_confidence}, warnings: ${result.aggregation.warnings.join('; ') || 'none'}`),
    '',
    '## Errors',
    '',
    ...(errors.length ? errors.map((error) => `- ${error}`) : ['- None']),
  ].join('\n');
  writeFileSync(path.join(process.cwd(), 'data', 'venue_intelligence_additional_photo_vision_report.md'), report);
  console.log(report);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
