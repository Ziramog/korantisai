import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '..', '..', '.env.local') });
import { writeFileSync } from 'fs';

type RuntimeVenue = {
  id: string;
  name: string;
  heroImage?: string | null;
  galleryImages?: Array<{ src?: string | null; isCover?: boolean | null }>;
};

type RuntimePayload = {
  venues?: RuntimeVenue[];
};

const DATA_DIR = path.join(__dirname, '..', '..', 'data');

function getArgValue(name: string) {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

function runtimeUrl() {
  const explicit = getArgValue('url') || process.env.KORANTIS_API_URL;
  if (explicit) return explicit;
  return 'https://korantis-app.vercel.app/api/venues';
}

function sourceKind(src: string | null | undefined) {
  if (!src) return 'missing';
  if (src === '/venue_invernadero.png' || src.includes('/venue_invernadero.png')) return 'fallback';
  if (src.includes('res.cloudinary.com')) return 'cloudinary';
  if (src.startsWith('/api/venue-images/')) return 'legacy_google_proxy';
  return 'other';
}

async function main() {
  const url = runtimeUrl();
  const response = await fetch(url, { cache: 'no-store' });

  if (!response.ok) {
    throw new Error(`/api/venues verification failed ${response.status}: ${response.statusText}`);
  }

  const payload = await response.json() as RuntimePayload;
  const venues = payload.venues || [];

  const rows = venues.map((venue) => {
    const gallery = venue.galleryImages || [];
    const heroSource = sourceKind(venue.heroImage);
    const gallerySources = gallery.map((image) => sourceKind(image.src));
    return {
      id: venue.id,
      name: venue.name,
      hero_image: venue.heroImage || null,
      hero_source: heroSource,
      gallery_count: gallery.length,
      gallery_sources: gallerySources,
      has_gallery: gallery.length > 0,
      uses_fallback: heroSource === 'fallback' || gallerySources.includes('fallback'),
      uses_legacy_google_proxy: heroSource === 'legacy_google_proxy' || gallerySources.includes('legacy_google_proxy'),
    };
  });

  const totals = {
    api_url: url,
    venue_count: venues.length,
    cloudinary_hero_count: rows.filter((row) => row.hero_source === 'cloudinary').length,
    fallback_venue_count: rows.filter((row) => row.uses_fallback).length,
    legacy_google_proxy_venue_count: rows.filter((row) => row.uses_legacy_google_proxy).length,
    gallery_complete_count: rows.filter((row) => row.has_gallery).length,
    gallery_missing_count: rows.filter((row) => !row.has_gallery).length,
  };

  const output = {
    generated_at: new Date().toISOString(),
    totals,
    venues: rows,
  };

  writeFileSync(path.join(DATA_DIR, 'public_venue_image_verification.json'), JSON.stringify(output, null, 2));

  const report = [
    '# Public Venue Image Verification',
    '',
    `Generated: ${output.generated_at}`,
    `API URL: ${url}`,
    '',
    '## Totals',
    '',
    `- /api/venues count: ${totals.venue_count}`,
    `- Cloudinary hero count: ${totals.cloudinary_hero_count}`,
    `- Venues using /venue_invernadero.png fallback: ${totals.fallback_venue_count}`,
    `- Venues still using legacy Google proxy: ${totals.legacy_google_proxy_venue_count}`,
    `- Venues with non-empty galleryImages: ${totals.gallery_complete_count}`,
    `- Venues missing galleryImages: ${totals.gallery_missing_count}`,
    '',
    '## Remaining Fallback Venues',
    '',
    ...rows.filter((row) => row.uses_fallback).map((row) => `- ${row.name}`),
    '',
    '## Remaining Legacy Google Proxy Venues',
    '',
    ...rows.filter((row) => row.uses_legacy_google_proxy).map((row) => `- ${row.name}`),
    '',
  ].join('\n');

  writeFileSync(path.join(DATA_DIR, 'public_venue_image_verification.md'), report);
  console.log(report);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
