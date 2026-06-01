import '../images/script_env';
import { Readable } from 'node:stream';
import type { UploadApiResponse } from 'cloudinary';
import { cloudinary, configureCloudinary, validateCloudinaryEnv } from '../../src/lib/cloudinary';
import { buildVenueImagePublicId } from '../images/cloudinary_utils';
import { escapeMd, readJson, writeJsonAndMarkdown } from './enrichment_utils';

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
  venues: InputVenue[];
};

type MaterializedImage = {
  candidate_id: string;
  google_place_id: string | null;
  venue_name: string;
  role: SelectedPhoto['role'];
  sort_order: number;
  source: 'google_places';
  google_photo_reference: string;
  width?: number;
  height?: number;
  quality_score: number | null;
  hero_suitability_score: number | null;
  status: 'dry_run' | 'uploaded' | 'error';
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

function limitPhotos(photos: SelectedPhoto[]) {
  const usedRefs = new Set<string>();
  const selected: SelectedPhoto[] = [];

  for (const role of ['hero', 'card', 'gallery'] as const) {
    const maxForRole = role === 'gallery' ? 6 : 1;
    const rolePhotos = photos.filter((photo) => photo.role === role);

    for (const photo of rolePhotos) {
      if (selected.filter((item) => item.role === role).length >= maxForRole) break;
      if (usedRefs.has(photo.google_photo_reference)) continue;
      selected.push(photo);
      usedRefs.add(photo.google_photo_reference);
    }
  }

  return selected.slice(0, 8);
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

async function uploadImageBufferToCloudinary(buffer: Buffer, venue: InputVenue, photo: SelectedPhoto, index: number) {
  const publicId = buildVenueImagePublicId(venue.city, venue.venue_name, photo.role, index);

  return await new Promise<UploadApiResponse>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
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

    Readable.from(buffer).pipe(uploadStream);
  });
}

async function materialize(venue: InputVenue, photo: SelectedPhoto, index: number, write: boolean): Promise<MaterializedImage> {
  const base: MaterializedImage = {
    candidate_id: venue.candidate_id,
    google_place_id: venue.google_place_id,
    venue_name: venue.venue_name,
    role: photo.role,
    sort_order: photo.sort_order,
    source: 'google_places',
    google_photo_reference: photo.google_photo_reference,
    width: photo.width,
    height: photo.height,
    quality_score: photo.quality_score,
    hero_suitability_score: photo.hero_suitability_score,
    status: 'dry_run',
    public_id: buildVenueImagePublicId(venue.city, venue.venue_name, photo.role, index),
  };

  if (!write) return base;

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) throw new Error('Missing GOOGLE_PLACES_API_KEY.');

  const buffer = await downloadGooglePhoto(photo.google_photo_reference, apiKey);
  const upload = await uploadImageBufferToCloudinary(buffer, venue, photo, index);
  return {
    ...base,
    status: 'uploaded',
    secure_url: upload.secure_url,
    url: upload.url,
    public_id: upload.public_id,
    width: upload.width,
    height: upload.height,
    bytes: upload.bytes,
    format: upload.format,
  };
}

function markdown(mode: string, images: MaterializedImage[], errors: string[]) {
  return [
    '# Publish Candidate Cloudinary Materialization',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Mode: ${mode}`,
    '',
    `- Images considered: ${images.length}`,
    `- Uploaded: ${images.filter((image) => image.status === 'uploaded').length}`,
    `- Dry-run: ${images.filter((image) => image.status === 'dry_run').length}`,
    `- Errors: ${images.filter((image) => image.status === 'error').length + errors.length}`,
    '',
    '## Environment / API Errors',
    '',
    ...(errors.length ? errors.map((error) => `- ${error}`) : ['- None']),
    '',
    '| Venue | Role | Sort | Status | Public ID | Error |',
    '| --- | --- | ---: | --- | --- | --- |',
    ...images.map((image) => `| ${escapeMd(image.venue_name)} | ${image.role} | ${image.sort_order} | ${image.status} | ${escapeMd(image.public_id)} | ${escapeMd(image.error)} |`),
  ].join('\n');
}

async function main() {
  const write = hasFlag('write');
  const payload = await readJson<InputPayload>('data/publish_candidate_photo_refs.json', { venues: [] });
  const errors: string[] = [];
  const images: MaterializedImage[] = [];

  if (write) {
    const cloudinaryValidation = validateCloudinaryEnv();
    if (!cloudinaryValidation.ok) errors.push(`Missing Cloudinary env vars: ${cloudinaryValidation.missing.join(', ')}`);
    if (!process.env.GOOGLE_PLACES_API_KEY) errors.push('Missing GOOGLE_PLACES_API_KEY.');
    if (errors.length === 0) configureCloudinary();
  }

  if (errors.length === 0) {
    for (const venue of payload.venues) {
      const photos = limitPhotos(venue.selected_photos);
      for (let index = 0; index < photos.length; index++) {
        try {
          images.push(await materialize(venue, photos[index], index, write));
        } catch (error) {
          images.push({
            candidate_id: venue.candidate_id,
            google_place_id: venue.google_place_id,
            venue_name: venue.venue_name,
            role: photos[index].role,
            sort_order: photos[index].sort_order,
            source: 'google_places',
            google_photo_reference: photos[index].google_photo_reference,
            quality_score: photos[index].quality_score,
            hero_suitability_score: photos[index].hero_suitability_score,
            status: 'error',
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }
  }

  const output = {
    generated_at: new Date().toISOString(),
    mode: write ? 'write' : 'dry-run',
    images_uploaded: images.filter((image) => image.status === 'uploaded').length,
    images_dry_run: images.filter((image) => image.status === 'dry_run').length,
    errors,
    images,
  };

  await writeJsonAndMarkdown('publish_candidate_cloudinary_materialization.json', 'publish_candidate_cloudinary_materialization.md', output, markdown(output.mode, images, errors));
  console.log(`Candidate materialization ${output.mode}: ${images.length} images`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
