import { OpenAI } from 'openai';
import {
  escapeMd,
  photoEditorialScore,
  readJson,
  writeJsonMd,
  type EnrichmentPhotoRef,
  type PhotoVision,
} from './gallery_quality_utils';

const OPENAI_VISION_MODEL = 'gpt-4o-mini';

function clampScore(value: unknown) {
  const number = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return Math.max(0, Math.min(100, Math.round(number)));
}

function normalizeVisionResult(input: Partial<PhotoVision>, photoReference: string): PhotoVision {
  return {
    photo_reference: photoReference,
    interior_visible: Boolean(input.interior_visible),
    exterior_visible: Boolean(input.exterior_visible),
    seating_visible: Boolean(input.seating_visible),
    people_staying_visible: Boolean(input.people_staying_visible),
    product_only: Boolean(input.product_only),
    storefront_only: Boolean(input.storefront_only),
    menu_only: Boolean(input.menu_only),
    counter_only: Boolean(input.counter_only),
    spatial_depth_score: clampScore(input.spatial_depth_score),
    design_quality_score: clampScore(input.design_quality_score),
    atmosphere_score: clampScore(input.atmosphere_score),
    hero_suitability_score: clampScore(input.hero_suitability_score),
    card_suitability_score: clampScore(input.card_suitability_score),
    warnings: Array.isArray(input.warnings) ? input.warnings.map(String) : [],
  };
}

async function resolvePhotoUri(photoReference: string, apiKey: string): Promise<string> {
  const url = new URL(`https://places.googleapis.com/v1/${photoReference}/media`);
  url.searchParams.set('maxWidthPx', '900');
  url.searchParams.set('skipHttpRedirect', 'true');
  url.searchParams.set('key', apiKey);
  const response = await fetch(url, { headers: { 'X-Goog-Api-Key': apiKey } });
  if (!response.ok) throw new Error(`Unable to resolve photo media (${response.status})`);
  const payload = await response.json() as { photoUri?: string };
  if (!payload.photoUri) throw new Error('Google photo media response did not include photoUri.');
  return payload.photoUri;
}

async function classifyWithOpenAI(openai: OpenAI, photoUri: string, photoReference: string): Promise<PhotoVision> {
  const response = await openai.chat.completions.create({
    model: OPENAI_VISION_MODEL,
    messages: [
      {
        role: 'system',
        content: 'Classify venue photos for a curated place discovery product. Return only strict JSON. Do not write prose.',
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Evaluate this venue photo. Prefer interiors, seating, people staying, natural light, spatial depth, design quality, and atmosphere. Scores must be 0-100.',
          },
          { type: 'image_url', image_url: { url: photoUri, detail: 'low' } },
        ],
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'gallery_photo_vision_result',
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
            spatial_depth_score: { type: 'number' },
            design_quality_score: { type: 'number' },
            atmosphere_score: { type: 'number' },
            hero_suitability_score: { type: 'number' },
            card_suitability_score: { type: 'number' },
            warnings: { type: 'array', items: { type: 'string' } },
          },
          required: ['photo_reference', 'interior_visible', 'exterior_visible', 'seating_visible', 'people_staying_visible', 'counter_only', 'product_only', 'storefront_only', 'menu_only', 'spatial_depth_score', 'design_quality_score', 'atmosphere_score', 'hero_suitability_score', 'card_suitability_score', 'warnings'],
          additionalProperties: false,
        },
        strict: true,
      },
    },
  });
  return normalizeVisionResult(JSON.parse(response.choices[0].message.content || '{}') as Partial<PhotoVision>, photoReference);
}

function markdown(output: {
  mode: string;
  existing_metadata: number;
  evaluated: number;
  skipped_needs_run: number;
  errors: string[];
  refs: Array<EnrichmentPhotoRef & { vision_status: string; score: number; error?: string }>;
}) {
  return [
    '# Gallery Enrichment Photo Vision',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Mode: ${output.mode}`,
    '',
    `- Existing metadata reused: ${output.existing_metadata}`,
    `- Newly evaluated: ${output.evaluated}`,
    `- Skipped until --run: ${output.skipped_needs_run}`,
    `- Errors: ${output.errors.length}`,
    '',
    '| Venue | Status | Score | Interior | Seating | Product | Storefront | Error |',
    '|---|---|---:|---:|---:|---:|---:|---|',
    ...output.refs.map((ref) => `| ${escapeMd(ref.venue_name)} | ${ref.vision_status} | ${ref.score} | ${ref.vision?.interior_visible ? 'yes' : 'no'} | ${ref.vision?.seating_visible ? 'yes' : 'no'} | ${ref.vision?.product_only ? 'yes' : 'no'} | ${ref.vision?.storefront_only ? 'yes' : 'no'} | ${escapeMd(ref.error || '')} |`),
  ].join('\n');
}

async function main() {
  const run = process.argv.includes('--run');
  const input = readJson<{ refs: EnrichmentPhotoRef[] }>('data/gallery_enrichment_photo_refs.json', { refs: [] });
  const openai = run ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
  const googleApiKey = process.env.GOOGLE_PLACES_API_KEY;
  const refs: Array<EnrichmentPhotoRef & { vision_status: string; score: number; error?: string }> = [];
  const errors: string[] = [];

  for (const ref of input.refs) {
    if (ref.vision) {
      refs.push({ ...ref, vision_status: 'existing_metadata', score: photoEditorialScore(ref.vision) });
      continue;
    }

    if (!run) {
      refs.push({ ...ref, vision_status: 'skipped_needs_run', score: 0 });
      continue;
    }

    if (!openai || !googleApiKey) {
      const error = 'Missing OPENAI_API_KEY or GOOGLE_PLACES_API_KEY.';
      errors.push(`${ref.venue_name}: ${error}`);
      refs.push({ ...ref, vision_status: 'error', score: 0, error });
      continue;
    }

    try {
      const photoUri = await resolvePhotoUri(ref.google_photo_reference, googleApiKey);
      const vision = await classifyWithOpenAI(openai, photoUri, ref.google_photo_reference);
      refs.push({ ...ref, vision, needs_vision: false, vision_status: 'evaluated', score: photoEditorialScore(vision) });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${ref.venue_name}: ${message}`);
      refs.push({ ...ref, vision_status: 'error', score: 0, error: message });
    }
  }

  const output = {
    generated_at: new Date().toISOString(),
    mode: run ? 'run' : 'dry-run',
    existing_metadata: refs.filter((ref) => ref.vision_status === 'existing_metadata').length,
    evaluated: refs.filter((ref) => ref.vision_status === 'evaluated').length,
    skipped_needs_run: refs.filter((ref) => ref.vision_status === 'skipped_needs_run').length,
    errors,
    refs,
  };

  writeJsonMd('gallery_enrichment_photo_vision.json', 'gallery_enrichment_photo_vision.md', output, markdown(output));
  console.log(JSON.stringify({
    existing_metadata: output.existing_metadata,
    evaluated: output.evaluated,
    skipped_needs_run: output.skipped_needs_run,
    errors: output.errors.length,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

