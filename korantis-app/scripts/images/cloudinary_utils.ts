import { Readable } from 'stream';
import type { UploadApiResponse } from 'cloudinary';
import { cloudinary, configureCloudinary, validateCloudinaryEnv } from '../../src/lib/cloudinary';

type UploadOptions = {
  city: string;
  venueName: string;
  role: string;
  index: number;
};

export function normalizeVenueSlug(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'venue';
}

export function buildVenueImagePublicId(city: string, venueName: string, role: string, index: number) {
  const venueSlug = normalizeVenueSlug(venueName);
  const citySlug = normalizeVenueSlug(city);
  return `korantis/venues/${citySlug}/${venueSlug}/${role}-${index}`;
}

export function validateCloudinaryEnvForImages() {
  return validateCloudinaryEnv();
}

export async function uploadImageBufferToCloudinary(buffer: Buffer, options: UploadOptions) {
  const validation = configureCloudinary();
  if (!validation.ok) {
    throw new Error(`Missing Cloudinary env vars: ${validation.missing.join(', ')}`);
  }

  const publicId = buildVenueImagePublicId(options.city, options.venueName, options.role, options.index);

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
      }
    );

    Readable.from(buffer).pipe(uploadStream);
  });
}
