import * as path from 'path';
import './script_env';
import { writeFileSync } from 'fs';

type RuntimeImage = {
  src?: string | null;
  role?: string | null;
};

type RuntimeVenue = {
  id: string;
  name: string;
  heroImage?: string | null;
  cardImage?: string | null;
  imageUrl?: string | null;
  galleryImages?: RuntimeImage[];
  images?: RuntimeImage[];
};

type RuntimePayload = {
  venues?: RuntimeVenue[];
};

const DATA_DIR = path.join(__dirname, '..', '..', 'data');

function getArgValue(name: string) {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

function apiUrl() {
  const explicit = getArgValue('url') || process.env.API_BASE_URL || process.env.KORANTIS_API_URL;
  const base = explicit || 'http://localhost:3000';
  return base.endsWith('/api/venues') ? base : `${base.replace(/\/$/, '')}/api/venues`;
}

function sourceKind(src: string | null | undefined) {
  if (!src) return 'missing';
  if (src === '/venue_invernadero.png' || src.includes('/venue_invernadero.png')) return 'fallback';
  if (src.includes('res.cloudinary.com')) return 'cloudinary';
  if (src.startsWith('/api/venue-images/') || src.includes('/api/venue-images/')) return 'legacy_proxy';
  if (src.startsWith('http')) return 'direct_other';
  return 'other';
}

function hasCloudinary(values: Array<string | null | undefined>) {
  return values.some((value) => sourceKind(value) === 'cloudinary');
}

async function main() {
  const url = apiUrl();
  const response = await fetch(url, { cache: 'no-store' });

  if (!response.ok) {
    throw new Error(`/api/venues verification failed ${response.status}: ${response.statusText}`);
  }

  const payload = await response.json() as RuntimePayload;
  const venues = payload.venues || [];

  const rows = venues.map((venue) => {
    const galleryImages = venue.galleryImages || [];
    const allImageValues = [
      venue.heroImage,
      venue.cardImage,
      venue.imageUrl,
      ...galleryImages.map((image) => image.src),
    ];
    const sourceKinds = allImageValues.map(sourceKind);
    const gallerySourceKinds = galleryImages.map((image) => sourceKind(image.src));

    return {
      id: venue.id,
      name: venue.name,
      hero_image: venue.heroImage || null,
      hero_source: sourceKind(venue.heroImage),
      card_image: venue.cardImage || null,
      card_source: sourceKind(venue.cardImage),
      image_url: venue.imageUrl || null,
      image_url_source: sourceKind(venue.imageUrl),
      gallery_count: galleryImages.length,
      gallery_cloudinary_count: gallerySourceKinds.filter((kind) => kind === 'cloudinary').length,
      has_gallery: galleryImages.length > 0,
      uses_cloudinary: sourceKinds.includes('cloudinary'),
      uses_legacy_proxy: sourceKinds.includes('legacy_proxy'),
      uses_fallback: sourceKinds.includes('fallback'),
      has_hero_or_card: hasCloudinary([venue.heroImage, venue.cardImage, venue.imageUrl]),
    };
  });

  const unresolved = rows.filter((row) => row.uses_fallback || !row.uses_cloudinary);
  const totals = {
    api_url: url,
    total_venues: venues.length,
    cloudinary_url_venues: rows.filter((row) => row.uses_cloudinary).length,
    legacy_proxy_venues: rows.filter((row) => row.uses_legacy_proxy).length,
    fallback_venues: rows.filter((row) => row.uses_fallback).length,
    gallery_present_venues: rows.filter((row) => row.has_gallery).length,
    hero_or_card_cloudinary_venues: rows.filter((row) => row.has_hero_or_card).length,
    unresolved_venues: unresolved.length,
  };

  const output = {
    generated_at: new Date().toISOString(),
    totals,
    unresolved: unresolved.map((row) => ({
      id: row.id,
      name: row.name,
      hero_source: row.hero_source,
      card_source: row.card_source,
      image_url_source: row.image_url_source,
      gallery_count: row.gallery_count,
    })),
    venues: rows,
  };

  writeFileSync(path.join(DATA_DIR, 'api_cloudinary_cutover_verification.json'), JSON.stringify(output, null, 2));

  const report = [
    '# API Cloudinary Cutover Verification',
    '',
    `Generated: ${output.generated_at}`,
    `API URL: ${url}`,
    '',
    '## Totals',
    '',
    `- Total venues: ${totals.total_venues}`,
    `- Venues using Cloudinary URLs: ${totals.cloudinary_url_venues}`,
    `- Venues using legacy proxy URLs: ${totals.legacy_proxy_venues}`,
    `- Venues using fallback: ${totals.fallback_venues}`,
    `- Venues with galleryImages length > 0: ${totals.gallery_present_venues}`,
    `- Venues with Cloudinary hero/card/imageUrl: ${totals.hero_or_card_cloudinary_venues}`,
    `- Unresolved venues: ${totals.unresolved_venues}`,
    '',
    '## Unresolved Venues',
    '',
    ...(output.unresolved.length
      ? output.unresolved.map((venue) => (
        `- ${venue.name}: hero=${venue.hero_source}, card=${venue.card_source}, imageUrl=${venue.image_url_source}, gallery=${venue.gallery_count}`
      ))
      : ['- None']),
    '',
  ].join('\n');

  writeFileSync(path.join(DATA_DIR, 'api_cloudinary_cutover_verification.md'), report);
  console.log(report);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
