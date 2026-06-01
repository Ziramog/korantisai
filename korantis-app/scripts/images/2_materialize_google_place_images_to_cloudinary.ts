import * as path from 'path';
import './script_env';
import { readFileSync, writeFileSync } from 'fs';
import {
  buildVenueImagePublicId,
  uploadImageBufferToCloudinary,
  validateCloudinaryEnvForImages,
} from './cloudinary_utils';

type PhotoRole = 'hero' | 'card' | 'gallery';

type SelectedPhoto = {
  role: PhotoRole;
  sort_order: number;
  google_photo_reference: string;
  width?: number;
  height?: number;
  quality_score: number | null;
  hero_suitability_score: number | null;
};

type InputVenue = {
  venue_id: string;
  venue_name: string;
  city: string;
  category: string | null;
  selected_photos: SelectedPhoto[];
};

type InputPayload = {
  venues: InputVenue[];
};

type MaterializedImage = {
  venue_id: string;
  venue_name: string;
  city: string;
  role: PhotoRole;
  sort_order: number;
  source: 'google_places';
  google_photo_reference: string;
  quality_score: number | null;
  hero_suitability_score: number | null;
  status: 'dry_run' | 'uploaded' | 'error';
  error?: string;
  url?: string;
  secure_url?: string;
  public_id?: string;
  width?: number;
  height?: number;
  bytes?: number;
  format?: string;
};

const DATA_DIR = path.join(__dirname, '..', '..', 'data');

function hasFlag(name: string) {
  return process.argv.includes(`--${name}`);
}

function getArgValue(name: string) {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
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
    headers: {
      'X-Goog-Api-Key': apiKey,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Google photo media error ${response.status}: ${body || response.statusText}`);
  }

  const payload = await response.json() as { photoUri?: string };
  if (!payload.photoUri) throw new Error('Google photo media response did not include photoUri.');
  return payload.photoUri;
}

async function downloadGooglePhoto(photoReference: string, apiKey: string) {
  const photoUri = await resolveGooglePhotoUri(photoReference, apiKey);
  const response = await fetch(photoUri);

  if (!response.ok) {
    throw new Error(`Google photo binary error ${response.status}: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function materializeVenuePhoto(venue: InputVenue, photo: SelectedPhoto, index: number, write: boolean) {
  const base: MaterializedImage = {
    venue_id: venue.venue_id,
    venue_name: venue.venue_name,
    city: venue.city,
    role: photo.role,
    sort_order: photo.sort_order,
    source: 'google_places',
    google_photo_reference: photo.google_photo_reference,
    quality_score: photo.quality_score,
    hero_suitability_score: photo.hero_suitability_score,
  } as MaterializedImage;

  if (!write) {
    return {
      ...base,
      status: 'dry_run',
      public_id: buildVenueImagePublicId(venue.city, venue.venue_name, photo.role, index),
    };
  }

  const googleApiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!googleApiKey) throw new Error('Missing GOOGLE_PLACES_API_KEY.');

  const buffer = await downloadGooglePhoto(photo.google_photo_reference, googleApiKey);
  const upload = await uploadImageBufferToCloudinary(buffer, {
    city: venue.city,
    venueName: venue.venue_name,
    role: photo.role,
    index,
  });

  return {
    ...base,
    status: 'uploaded',
    url: upload.url,
    secure_url: upload.secure_url,
    public_id: upload.public_id,
    width: upload.width,
    height: upload.height,
    bytes: upload.bytes,
    format: upload.format,
  };
}

async function main() {
  const write = hasFlag('write');
  const inputPath = getArgValue('input') || path.join(DATA_DIR, 'missing_venue_photo_refs.json');
  const payload = JSON.parse(readFileSync(inputPath, 'utf8')) as InputPayload;
  const results: MaterializedImage[] = [];
  const apiErrors: string[] = [];

  if (write) {
    const cloudinaryValidation = validateCloudinaryEnvForImages();
    if (!cloudinaryValidation.ok) {
      apiErrors.push(`Missing Cloudinary env vars: ${cloudinaryValidation.missing.join(', ')}`);
    }
    if (!process.env.GOOGLE_PLACES_API_KEY) {
      apiErrors.push('Missing GOOGLE_PLACES_API_KEY.');
    }
  }

  if (apiErrors.length === 0) {
    for (const venue of payload.venues) {
      const photos = limitPhotos(venue.selected_photos);

      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        try {
          results.push(await materializeVenuePhoto(venue, photo, i, write));
        } catch (error) {
          results.push({
            venue_id: venue.venue_id,
            venue_name: venue.venue_name,
            city: venue.city,
            role: photo.role,
            sort_order: photo.sort_order,
            source: 'google_places',
            google_photo_reference: photo.google_photo_reference,
            quality_score: photo.quality_score,
            hero_suitability_score: photo.hero_suitability_score,
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
    input: inputPath,
    total_input_venues: payload.venues.length,
    total_images_considered: payload.venues.reduce((sum, venue) => sum + limitPhotos(venue.selected_photos).length, 0),
    uploaded_images: results.filter((image) => image.status === 'uploaded').length,
    dry_run_images: results.filter((image) => image.status === 'dry_run').length,
    errored_images: results.filter((image) => image.status === 'error').length,
    api_errors: apiErrors,
    images: results,
  };

  const outputJson = JSON.stringify(output, null, 2);
  writeFileSync(path.join(DATA_DIR, 'cloudinary_materialization_output.json'), outputJson);
  writeFileSync(path.join(DATA_DIR, 'materialized_venue_images_cloudinary.json'), outputJson);

  const report = [
    '# Google Places Photo Materialization',
    '',
    `Generated: ${output.generated_at}`,
    `Mode: ${output.mode}`,
    '',
    `- Input venues: ${output.total_input_venues}`,
    `- Images considered: ${output.total_images_considered}`,
    `- Uploaded images: ${output.uploaded_images}`,
    `- Dry-run images: ${output.dry_run_images}`,
    `- Errored images: ${output.errored_images}`,
    '',
    '## API / Env Errors',
    '',
    ...(apiErrors.length ? apiErrors.map((error) => `- ${error}`) : ['- None']),
    '',
  ].join('\n');

  writeFileSync(path.join(DATA_DIR, 'cloudinary_materialization_report.md'), report);
  writeFileSync(path.join(DATA_DIR, 'materialized_venue_images_cloudinary_report.md'), report);
  console.log(report);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
