export type FreshnessVenue = {
  createdAt?: string | null;
  publishedAt?: string | null;
  curationStatus?: string | null;
  heroImage?: string | null;
  cardImage?: string | null;
  imageUrl?: string | null;
  galleryImages?: Array<{ src?: string | null }> | null;
  images?: Array<{ src?: string | null }> | null;
};

export type LaunchFreshnessDiagnostics = {
  bias: number;
  status: 'eligible' | 'missing_date' | 'not_active' | 'missing_cloudinary_image' | 'fallback_image' | 'expired' | 'future_date';
  ageDays: number | null;
  sourceDate: string | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function allImageUrls(venue: FreshnessVenue) {
  return [
    venue.heroImage,
    venue.cardImage,
    venue.imageUrl,
    ...(venue.galleryImages || []).map((image) => image.src),
    ...(venue.images || []).map((image) => image.src),
  ].filter(Boolean) as string[];
}

function hasCloudinaryImage(venue: FreshnessVenue) {
  return allImageUrls(venue).some((url) => url.startsWith('https://res.cloudinary.com/'));
}

function hasFallbackImage(venue: FreshnessVenue) {
  return allImageUrls(venue).some((url) => url.includes('/venue_invernadero.png'));
}

export function getLaunchFreshnessDiagnostics(venue: FreshnessVenue, now: Date = new Date()): LaunchFreshnessDiagnostics {
  if (venue.curationStatus && venue.curationStatus !== 'active') {
    return { bias: 0, status: 'not_active', ageDays: null, sourceDate: null };
  }

  if (!hasCloudinaryImage(venue)) {
    return { bias: 0, status: 'missing_cloudinary_image', ageDays: null, sourceDate: null };
  }

  if (hasFallbackImage(venue)) {
    return { bias: 0, status: 'fallback_image', ageDays: null, sourceDate: null };
  }

  const sourceDate = venue.publishedAt || venue.createdAt || null;
  if (!sourceDate) {
    return { bias: 0, status: 'missing_date', ageDays: null, sourceDate: null };
  }

  const publishedTime = Date.parse(sourceDate);
  if (!Number.isFinite(publishedTime)) {
    return { bias: 0, status: 'missing_date', ageDays: null, sourceDate };
  }

  const ageDays = (now.getTime() - publishedTime) / DAY_MS;
  if (ageDays < 0) {
    return { bias: 0, status: 'future_date', ageDays, sourceDate };
  }

  if (ageDays <= 1) return { bias: 0.08, status: 'eligible', ageDays, sourceDate };
  if (ageDays <= 7) return { bias: 0.05, status: 'eligible', ageDays, sourceDate };
  if (ageDays <= 14) return { bias: 0.025, status: 'eligible', ageDays, sourceDate };

  return { bias: 0, status: 'expired', ageDays, sourceDate };
}

export function getLaunchFreshnessBias(venue: FreshnessVenue, now: Date = new Date()) {
  return getLaunchFreshnessDiagnostics(venue, now).bias;
}

