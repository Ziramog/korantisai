import {
  buildGalleryPublicId,
  escapeMd,
  readJson,
  writeJsonMd,
  type MaterializedGalleryAsset,
  type SelectedGalleryAsset,
} from './gallery_quality_utils';
import { uploadImageBufferToCloudinary, validateCloudinaryEnvForImages } from './cloudinary_utils';

async function resolveGooglePhotoUri(photoReference: string, apiKey: string) {
  const url = new URL(`https://places.googleapis.com/v1/${photoReference}/media`);
  url.searchParams.set('maxWidthPx', '1600');
  url.searchParams.set('skipHttpRedirect', 'true');
  url.searchParams.set('key', apiKey);
  const response = await fetch(url, { headers: { 'X-Goog-Api-Key': apiKey } });
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

function markdown(images: MaterializedGalleryAsset[], errors: string[], mode: string) {
  return [
    '# Gallery Enrichment Materialization',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Mode: ${mode}`,
    '',
    `- Selected images: ${images.length}`,
    `- Uploaded: ${images.filter((image) => image.status === 'uploaded').length}`,
    `- Dry-run: ${images.filter((image) => image.status === 'dry_run').length}`,
    `- Errors: ${errors.length}`,
    '',
    '| Venue | Status | Sort | Public ID | Error |',
    '|---|---|---:|---|---|',
    ...images.map((image) => `| ${escapeMd(image.venue_name)} | ${image.status} | ${image.sort_order} | ${escapeMd(image.public_id)} | ${escapeMd(image.error || '')} |`),
    '',
    '## Errors',
    '',
    errors.length ? errors.map((error) => `- ${error}`).join('\n') : '- none',
  ].join('\n');
}

async function main() {
  const write = process.argv.includes('--write');
  const selection = readJson<{ selected: SelectedGalleryAsset[] }>('data/gallery_enrichment_selection.json', { selected: [] });
  const errors: string[] = [];
  const images: MaterializedGalleryAsset[] = [];

  if (write) {
    const cloudinary = validateCloudinaryEnvForImages();
    if (!cloudinary.ok) errors.push(`Missing Cloudinary env vars: ${cloudinary.missing.join(', ')}`);
    if (!process.env.GOOGLE_PLACES_API_KEY) errors.push('Missing GOOGLE_PLACES_API_KEY');
  }

  for (let i = 0; i < selection.selected.length; i++) {
    const asset = selection.selected[i];
    const base: MaterializedGalleryAsset = {
      ...asset,
      status: 'dry_run',
      public_id: buildGalleryPublicId(asset.venue_name, asset.sort_order || i),
    };

    if (!write || errors.length > 0) {
      images.push(base);
      continue;
    }

    try {
      const buffer = await downloadGooglePhoto(asset.google_photo_reference, process.env.GOOGLE_PLACES_API_KEY as string);
      const upload = await uploadImageBufferToCloudinary(buffer, {
        city: 'Buenos Aires',
        venueName: asset.venue_name,
        role: 'gallery-enrichment',
        index: asset.sort_order || i,
      });
      images.push({
        ...base,
        status: 'uploaded',
        url: upload.url,
        secure_url: upload.secure_url,
        public_id: upload.public_id,
        width: upload.width,
        height: upload.height,
        bytes: upload.bytes,
        format: upload.format,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${asset.venue_name}: ${message}`);
      images.push({ ...base, status: 'error', error: message });
    }
  }

  const output = {
    generated_at: new Date().toISOString(),
    mode: write ? 'write' : 'dry-run',
    selected_images: selection.selected.length,
    uploaded: images.filter((image) => image.status === 'uploaded').length,
    dry_run: images.filter((image) => image.status === 'dry_run').length,
    errors,
    images,
  };

  writeJsonMd('gallery_enrichment_materialization.json', 'gallery_enrichment_materialization.md', output, markdown(images, errors, output.mode));
  console.log(JSON.stringify({ mode: output.mode, selected: output.selected_images, uploaded: output.uploaded, errors: errors.length }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

