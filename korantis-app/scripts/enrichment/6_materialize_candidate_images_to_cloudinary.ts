import '../images/script_env';
import { Readable } from 'node:stream';
import type { UploadApiResponse } from 'cloudinary';
import { cloudinary, configureCloudinary, validateCloudinaryEnv } from '../../src/lib/cloudinary';
import { escapeMd, mapByCandidateId, readJson, slugify, writeJsonAndMarkdown } from './enrichment_utils';
import { createServiceSupabaseClient, loadPublicVenueLookup, tableExists, validateSupabaseServiceEnv } from './supabase_enrichment_utils';

type SelectedPhoto = {
  role: 'hero' | 'card' | 'gallery';
  sort_order: number;
  google_photo_reference: string;
  width?: number;
  height?: number;
  quality_score: number | null;
  hero_suitability_score: number | null;
};

type InputVenue = {
  candidate_id: string;
  google_place_id: string | null;
  venue_name: string;
  city: string;
  category: string;
  selected_photos: SelectedPhoto[];
};

type InputPayload = {
  venues?: InputVenue[];
};

type IntelligenceFile = {
  outputs: Array<{
    candidate_id: string;
    match_status?: string;
    eligibility?: { status?: string };
  }>;
};

type GoogleFile = {
  records: Array<{
    candidate_id: string;
    status: string;
  }>;
};

type MaterializedImage = {
  candidate_id: string;
  google_place_id: string | null;
  venue_name: string;
  city: string;
  target: 'venue_images' | 'candidate_image_assets';
  venue_id: string | null;
  role: SelectedPhoto['role'];
  sort_order: number;
  source: 'google_places';
  google_photo_reference: string;
  width?: number;
  height?: number;
  quality_score: number | null;
  hero_suitability_score: number | null;
  status: 'dry_run' | 'uploaded' | 'skipped' | 'error';
  public_id?: string;
  secure_url?: string;
  url?: string;
  bytes?: number;
  format?: string;
  error?: string;
};

function hasFlag(name: string) {
  return process.argv.includes(`--${name}`);
}

function normalizeName(value: string) {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function limitPhotos(photos: SelectedPhoto[]) {
  const selected: SelectedPhoto[] = [];
  const usedRefs = new Set<string>();

  for (const role of ['hero', 'card', 'gallery'] as const) {
    const max = role === 'gallery' ? 6 : 1;
    for (const photo of photos.filter((item) => item.role === role)) {
      if (selected.filter((item) => item.role === role).length >= max) break;
      if (usedRefs.has(photo.google_photo_reference)) continue;
      selected.push(photo);
      usedRefs.add(photo.google_photo_reference);
    }
  }

  return selected.slice(0, 8);
}

function publicIdFor(venue: InputVenue, role: string, index: number, publicVenueId: string | null) {
  const base = publicVenueId ? 'venues' : 'candidates';
  return `korantis/${base}/buenos-aires/${slugify(venue.venue_name)}/${role}-${index}`;
}

async function resolveGooglePhotoUri(photoReference: string, apiKey: string) {
  const url = new URL(`https://places.googleapis.com/v1/${photoReference}/media`);
  url.searchParams.set('maxWidthPx', '1600');
  url.searchParams.set('skipHttpRedirect', 'true');
  url.searchParams.set('key', apiKey);

  const response = await fetch(url, {
    headers: { 'X-Goog-Api-Key': apiKey },
  });
  if (!response.ok) throw new Error(`Google photo media error ${response.status}: ${await response.text()}`);
  const payload = await response.json() as { photoUri?: string };
  if (!payload.photoUri) throw new Error('Google photo media response did not include photoUri.');
  return payload.photoUri;
}

async function downloadGooglePhoto(photoReference: string, apiKey: string) {
  const photoUri = await resolveGooglePhotoUri(photoReference, apiKey);
  const response = await fetch(photoUri);
  if (!response.ok) throw new Error(`Google photo binary error ${response.status}: ${response.statusText}`);
  return Buffer.from(await response.arrayBuffer());
}

async function uploadBuffer(buffer: Buffer, publicId: string) {
  return await new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        overwrite: false,
        resource_type: 'image',
        fetch_format: 'auto',
        quality: 'auto',
        width: 1600,
        crop: 'limit',
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        if (!result) {
          reject(new Error('Cloudinary upload returned no result.'));
          return;
        }
        resolve(result);
      },
    );
    Readable.from(buffer).pipe(stream);
  });
}

function markdown(mode: string, images: MaterializedImage[], blockers: string[]) {
  return [
    '# Candidate Image Materialization',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Mode: ${mode}`,
    '',
    `- Uploaded: ${images.filter((image) => image.status === 'uploaded').length}`,
    `- Dry-run: ${images.filter((image) => image.status === 'dry_run').length}`,
    `- Skipped: ${images.filter((image) => image.status === 'skipped').length}`,
    `- Errors: ${images.filter((image) => image.status === 'error').length}`,
    '',
    '## Blocking Conditions',
    '',
    ...(blockers.length ? blockers.map((blocker) => `- ${blocker}`) : ['- None']),
    '',
    '| Venue | Target | Role | Status | Public ID | Error |',
    '| --- | --- | --- | --- | --- | --- |',
    ...images.map((image) => `| ${escapeMd(image.venue_name)} | ${image.target} | ${image.role} | ${image.status} | ${escapeMd(image.public_id)} | ${escapeMd(image.error)} |`),
  ].join('\n');
}

async function main() {
  const write = hasFlag('write');
  const [input, intelligence, google] = await Promise.all([
    readJson<InputPayload>('data/publish_candidate_photo_refs.json', { venues: [] }),
    readJson<IntelligenceFile>('data/controlled_batch_50_f4_intelligence.json'),
    readJson<GoogleFile>('data/controlled_batch_50_google_enrichment_repaired.json'),
  ]);
  const outputsById = mapByCandidateId(intelligence.outputs);
  const googleById = mapByCandidateId(google.records);
  const blockers: string[] = [];
  const cloudinaryValidation = validateCloudinaryEnv();
  const supabaseValidation = validateSupabaseServiceEnv();
  const venueByName = new Map<string, string>();
  let candidateImageAssetsExists = false;

  if (!cloudinaryValidation.ok) blockers.push(`Missing Cloudinary env vars: ${cloudinaryValidation.missing.join(', ')}`);
  if (!process.env.GOOGLE_PLACES_API_KEY) blockers.push('Missing GOOGLE_PLACES_API_KEY');
  if (!supabaseValidation.ok) blockers.push(`Missing Supabase env vars: ${supabaseValidation.missing.join(', ')}`);

  if (supabaseValidation.ok) {
    const supabase = createServiceSupabaseClient();
    const publicVenues = await loadPublicVenueLookup(supabase);
    for (const venue of publicVenues) venueByName.set(normalizeName(venue.name), venue.id);
    candidateImageAssetsExists = await tableExists(supabase, 'candidate_image_assets');
  }

  const needsCandidateAssets = (input.venues || []).some((venue) => !venueByName.has(normalizeName(venue.venue_name)));
  if (write && needsCandidateAssets && !candidateImageAssetsExists) {
    blockers.push('candidate_image_assets table missing; apply supabase/09_candidate_image_assets.sql before --write');
  }

  if (write && blockers.length === 0) configureCloudinary();
  const images: MaterializedImage[] = [];

  for (const venue of input.venues || []) {
    const output = outputsById.get(venue.candidate_id);
    const googleRecord = googleById.get(venue.candidate_id);
    const matchStatus = googleRecord?.status || output?.match_status;
    const eligibilityStatus = output?.eligibility?.status;
    const venueId = venueByName.get(normalizeName(venue.venue_name)) || null;
    const target = venueId ? 'venue_images' : 'candidate_image_assets';

    if (matchStatus !== 'matched' || eligibilityStatus !== 'active') {
      images.push({
        candidate_id: venue.candidate_id,
        google_place_id: venue.google_place_id,
        venue_name: venue.venue_name,
        city: venue.city,
        target,
        venue_id: venueId,
        role: 'hero',
        sort_order: 0,
        source: 'google_places',
        google_photo_reference: '',
        quality_score: null,
        hero_suitability_score: null,
        status: 'skipped',
        error: `Unsafe candidate: match=${matchStatus || 'missing'} eligibility=${eligibilityStatus || 'missing'}`,
      });
      continue;
    }

    const photos = limitPhotos(venue.selected_photos || []);
    for (let index = 0; index < photos.length; index++) {
      const photo = photos[index];
      const publicId = publicIdFor(venue, photo.role, index, venueId);
      const base: MaterializedImage = {
        candidate_id: venue.candidate_id,
        google_place_id: venue.google_place_id,
        venue_name: venue.venue_name,
        city: venue.city,
        target,
        venue_id: venueId,
        role: photo.role,
        sort_order: photo.sort_order,
        source: 'google_places',
        google_photo_reference: photo.google_photo_reference,
        width: photo.width,
        height: photo.height,
        quality_score: photo.quality_score,
        hero_suitability_score: photo.hero_suitability_score,
        status: 'dry_run',
        public_id: publicId,
      };

      if (!write || blockers.length > 0) {
        images.push(base);
        continue;
      }

      try {
        const buffer = await downloadGooglePhoto(photo.google_photo_reference, process.env.GOOGLE_PLACES_API_KEY as string);
        const upload = await uploadBuffer(buffer, publicId);
        images.push({
          ...base,
          status: 'uploaded',
          secure_url: upload.secure_url,
          url: upload.url,
          public_id: upload.public_id,
          width: upload.width,
          height: upload.height,
          bytes: upload.bytes,
          format: upload.format,
        });
      } catch (error) {
        images.push({
          ...base,
          status: 'error',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  const output = {
    generated_at: new Date().toISOString(),
    mode: write ? 'write' : 'dry-run',
    write_blocked: write && blockers.length > 0,
    blockers,
    uploaded_count: images.filter((image) => image.status === 'uploaded').length,
    dry_run_count: images.filter((image) => image.status === 'dry_run').length,
    images,
  };

  await writeJsonAndMarkdown(
    'candidate_image_materialization_output.json',
    'candidate_image_materialization_report.md',
    output,
    markdown(output.mode, images, blockers),
  );

  console.log(`Candidate image materialization ${output.mode}: uploaded=${output.uploaded_count} dry_run=${output.dry_run_count}`);
  if (write && blockers.length > 0) process.exitCode = 2;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

