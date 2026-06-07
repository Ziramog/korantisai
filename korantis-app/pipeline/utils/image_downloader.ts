import { createHash } from 'crypto';
import type { ImageCandidate, ImageSourceType, RiskFlag, VenueRaw } from '../types';

const USER_AGENT = 'KorantisImageDiscoveryPreflight/1.0';
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const WEBSITE_IMAGE_LIMIT = 24;

interface AttributeMap {
  [key: string]: string;
}

interface ProbeResult {
  candidate: ImageCandidate;
  downloaded: boolean;
  warning?: string;
}

interface ImageDimensions {
  width: number;
  height: number;
  format: 'JPEG' | 'PNG' | 'WEBP' | 'GIF' | 'BMP' | 'UNKNOWN';
}

interface GooglePhotoRecord {
  name?: string;
  widthPx?: number;
  heightPx?: number;
  authorAttributions?: Array<{
    displayName?: string;
    uri?: string;
    photoUri?: string;
  }>;
}

export async function discoverOfficialWebsiteImages(venue: VenueRaw): Promise<ImageCandidate[]> {
  if (!venue.website_url || isDisallowedSourceUrl(venue.website_url)) return [];

  const html = await fetchHtml(venue.website_url);
  if (!html) return [];

  return extractImageCandidatesFromHtml(html, venue.website_url, venue.name).slice(0, WEBSITE_IMAGE_LIMIT);
}

export function discoverGooglePlacesPhotoCandidates(venue: VenueRaw): ImageCandidate[] {
  const photos = getGooglePlacePhotos(venue);
  return photos.map((photo, index): ImageCandidate => {
    const mediaUrl = photo.name
      ? `https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=1600&maxHeightPx=1600`
      : '';

    return {
      venue_name: venue.name,
      source_url: venue.google_maps_url || venue.raw_google_place ? venue.google_maps_url || 'google_places_raw_snapshot' : '',
      resolved_image_url: mediaUrl,
      original_image_url: mediaUrl,
      source_type: 'google_places',
      rights_hint: buildGooglePhotoRightsHint(photo),
      rights_risk: 'medium',
      width: photo.widthPx || 0,
      height: photo.heightPx || 0,
      content_length: 0,
      alt_text: `${venue.name} Google Places photo ${index + 1}`,
      source_page_context: 'google_places_photo_reference',
      risk_flags: ['rights_review_needed'],
    };
  }).filter((candidate) => candidate.resolved_image_url && candidate.source_url);
}

export async function probeImageCandidate(candidate: ImageCandidate, options: { googlePlacesApiKey?: string } = {}): Promise<ProbeResult> {
  const fetchUrl = buildFetchUrl(candidate.resolved_image_url, options.googlePlacesApiKey);
  if (!fetchUrl) {
    return {
      candidate: markSourceTrustOnly(candidate, 'image_fetch_url_unavailable'),
      downloaded: false,
      warning: 'image_fetch_url_unavailable',
    };
  }

  let response: Response;
  try {
    response = await fetch(fetchUrl, {
      headers: {
        Accept: 'image/jpeg,image/png,image/webp;q=0.9,*/*;q=0.1',
        'User-Agent': USER_AGENT,
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
    });
  } catch (error) {
    return {
      candidate: markSourceTrustOnly(candidate, `image_fetch_failed: ${formatUnknownError(error)}`),
      downloaded: false,
      warning: 'image_fetch_failed',
    };
  }

  const contentType = normalizeContentType(response.headers.get('content-type') || inferContentTypeFromUrl(response.url));
  const contentLength = Number(response.headers.get('content-length')) || candidate.content_length || 0;
  if (!response.ok) {
    return {
      candidate: {
        ...markSourceTrustOnly(candidate, `image_fetch_http_${response.status}`),
        content_type: contentType,
        content_length: contentLength,
      },
      downloaded: false,
      warning: `image_fetch_http_${response.status}`,
    };
  }

  if (contentLength > MAX_IMAGE_BYTES) {
    return {
      candidate: {
        ...markSourceTrustOnly(candidate, 'image_too_large_to_download'),
        content_type: contentType,
        content_length: contentLength,
      },
      downloaded: false,
      warning: 'image_too_large_to_download',
    };
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  const dimensions = extractImageDimensions(bytes);
  const finalUrl = sanitizePersistedUrl(response.url || candidate.resolved_image_url);

  return {
    candidate: {
      ...candidate,
      resolved_image_url: finalUrl,
      content_type: contentType || contentTypeFromMagic(dimensions.format),
      content_length: contentLength || bytes.length,
      width: dimensions.width || candidate.width,
      height: dimensions.height || candidate.height,
      sha256: createHash('sha256').update(bytes).digest('hex'),
      notes: mergeNotes(candidate.notes, `downloaded_bytes=${bytes.length}`, `magic_format=${dimensions.format}`),
    },
    downloaded: true,
  };
}

export function extractImageCandidatesFromHtml(html: string, pageUrl: string, venueName: string): ImageCandidate[] {
  const candidates: ImageCandidate[] = [];
  const pageContext = extractPageTitle(html) || pageUrl;

  for (const imageUrl of extractMetaImages(html)) {
    candidates.push(buildWebsiteCandidate(venueName, pageUrl, imageUrl, {
      alt: 'Open Graph image',
      context: `${pageContext} og:image twitter:image`,
      sourceType: classifyWebsiteSourceType(pageUrl),
    }));
  }

  for (const attrs of extractTagAttributes(html, 'img')) {
    const src = bestImageSource(attrs);
    if (!src) continue;
    candidates.push(buildWebsiteCandidate(venueName, pageUrl, src, {
      alt: attrs.alt || '',
      context: `${pageContext} ${attrs.class || ''} ${attrs.id || ''}`,
      sourceType: classifyWebsiteSourceType(pageUrl),
      width: parsePositiveInt(attrs.width),
      height: parsePositiveInt(attrs.height),
    }));
  }

  for (const attrs of extractTagAttributes(html, 'source')) {
    const src = bestImageSource(attrs);
    if (!src) continue;
    candidates.push(buildWebsiteCandidate(venueName, pageUrl, src, {
      alt: 'HTML source image',
      context: `${pageContext} ${attrs.media || ''} ${attrs.type || ''}`,
      sourceType: classifyWebsiteSourceType(pageUrl),
    }));
  }

  return dedupeCandidatesByUrl(candidates)
    .map((candidate) => ({
      ...candidate,
      resolved_image_url: resolveUrl(candidate.resolved_image_url, pageUrl),
      original_image_url: resolveUrl(candidate.original_image_url || candidate.resolved_image_url, pageUrl),
    }))
    .filter((candidate) => candidate.resolved_image_url && !isDisallowedSourceUrl(candidate.resolved_image_url));
}

function buildWebsiteCandidate(
  venueName: string,
  pageUrl: string,
  imageUrl: string,
  options: { alt: string; context: string; sourceType: ImageSourceType; width?: number; height?: number },
): ImageCandidate {
  return {
    venue_name: venueName,
    source_url: pageUrl,
    resolved_image_url: imageUrl,
    original_image_url: imageUrl,
    source_type: options.sourceType,
    rights_hint: 'venue_controlled_official_website',
    rights_risk: 'low',
    width: options.width || 0,
    height: options.height || 0,
    content_length: 0,
    alt_text: options.alt,
    source_page_context: options.context,
    risk_flags: [],
  };
}

async function fetchHtml(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': USER_AGENT,
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
    });

    const contentType = response.headers.get('content-type') || '';
    if (!response.ok || !contentType.toLowerCase().includes('text/html')) return '';
    return await response.text();
  } catch {
    return '';
  }
}

function extractMetaImages(html: string): string[] {
  return extractTagAttributes(html, 'meta')
    .filter((attrs) => {
      const property = (attrs.property || attrs.name || '').toLowerCase();
      return ['og:image', 'og:image:url', 'twitter:image', 'twitter:image:src'].includes(property);
    })
    .map((attrs) => attrs.content || '')
    .filter(Boolean);
}

function extractTagAttributes(html: string, tagName: string): AttributeMap[] {
  const pattern = new RegExp(`<${tagName}\\b([^>]*)>`, 'gi');
  const tags = html.matchAll(pattern);
  return [...tags].map((match) => parseAttributes(match[1] || ''));
}

function parseAttributes(raw: string): AttributeMap {
  const attrs: AttributeMap = {};
  const pattern = /([:\w-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;
  for (const match of raw.matchAll(pattern)) {
    attrs[match[1].toLowerCase()] = decodeHtmlEntities(match[3] || match[4] || match[5] || '');
  }
  return attrs;
}

function bestImageSource(attrs: AttributeMap): string {
  const srcset = attrs.srcset || attrs['data-srcset'];
  if (srcset) {
    const best = srcset
      .split(',')
      .map((entry) => entry.trim().split(/\s+/))
      .map(([url, descriptor]) => ({
        url,
        score: descriptor?.endsWith('w') ? Number.parseInt(descriptor, 10) || 0 : descriptor?.endsWith('x') ? Number.parseFloat(descriptor) * 1000 : 0,
      }))
      .filter((entry) => entry.url)
      .sort((a, b) => b.score - a.score)[0];
    if (best) return best.url;
  }

  return attrs.src || attrs['data-src'] || attrs['data-lazy-src'] || attrs['data-original'] || attrs['data-full'] || '';
}

function getGooglePlacePhotos(venue: VenueRaw): GooglePhotoRecord[] {
  const place = getRecord(getRecord(venue.raw_google_place || {}, 'place'));
  const photos = place.photos;
  if (!Array.isArray(photos)) return [];
  return photos.filter((photo): photo is GooglePhotoRecord => typeof photo === 'object' && photo !== null);
}

function buildFetchUrl(url: string, googlePlacesApiKey?: string): string {
  if (!url.includes('places.googleapis.com/v1/') || !url.includes('/media?')) return url;
  if (!googlePlacesApiKey?.trim()) return '';
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}key=${encodeURIComponent(googlePlacesApiKey)}`;
}

function buildGooglePhotoRightsHint(photo: GooglePhotoRecord): string {
  const authors = (photo.authorAttributions || []).map((author) => author.displayName).filter(Boolean);
  return authors.length > 0 ? `google_places_author_attribution:${authors.join(', ')}` : 'google_places_photo_reference';
}

function markSourceTrustOnly(candidate: ImageCandidate, note: string): ImageCandidate {
  const inferredType = normalizeContentType(candidate.content_type || inferContentTypeFromUrl(candidate.resolved_image_url));
  const riskFlags: RiskFlag[] = [...new Set([...(candidate.risk_flags || []), 'source_trust_only' as const])];
  return {
    ...candidate,
    content_type: inferredType,
    risk_flags: riskFlags,
    notes: mergeNotes(candidate.notes, note),
  };
}

function normalizeContentType(value: string): string {
  return value.split(';')[0].trim().toLowerCase();
}

function contentTypeFromMagic(format: ImageDimensions['format']): string {
  if (format === 'JPEG') return 'image/jpeg';
  if (format === 'PNG') return 'image/png';
  if (format === 'WEBP') return 'image/webp';
  if (format === 'GIF') return 'image/gif';
  if (format === 'BMP') return 'image/bmp';
  return '';
}

function inferContentTypeFromUrl(url: string): string {
  const pathname = safePathname(url).toLowerCase();
  if (/\.(jpe?g)(?:$|\?)/.test(pathname)) return 'image/jpeg';
  if (/\.png(?:$|\?)/.test(pathname)) return 'image/png';
  if (/\.webp(?:$|\?)/.test(pathname)) return 'image/webp';
  if (/\.gif(?:$|\?)/.test(pathname)) return 'image/gif';
  if (/\.svg(?:$|\?)/.test(pathname)) return 'image/svg+xml';
  if (/\.avif(?:$|\?)/.test(pathname)) return 'image/avif';
  if (/\.bmp(?:$|\?)/.test(pathname)) return 'image/bmp';
  return '';
}

export function extractImageDimensions(bytes: Buffer): ImageDimensions {
  if (bytes.length >= 24 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), format: 'PNG' };
  }

  if (bytes.length >= 10 && bytes.subarray(0, 3).toString('ascii') === 'GIF') {
    return { width: bytes.readUInt16LE(6), height: bytes.readUInt16LE(8), format: 'GIF' };
  }

  if (bytes.length >= 26 && bytes.subarray(0, 2).toString('ascii') === 'BM') {
    return { width: bytes.readUInt32LE(18), height: Math.abs(bytes.readInt32LE(22)), format: 'BMP' };
  }

  if (bytes.length >= 12 && bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP') {
    return parseWebpDimensions(bytes);
  }

  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    return parseJpegDimensions(bytes);
  }

  return { width: 0, height: 0, format: 'UNKNOWN' };
}

function parseJpegDimensions(bytes: Buffer): ImageDimensions {
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) break;
    const marker = bytes[offset + 1];
    const length = bytes.readUInt16BE(offset + 2);
    if (length < 2 || offset + 2 + length > bytes.length) break;
    if (marker >= 0xc0 && marker <= 0xc3) {
      return {
        height: bytes.readUInt16BE(offset + 5),
        width: bytes.readUInt16BE(offset + 7),
        format: 'JPEG',
      };
    }
    offset += 2 + length;
  }
  return { width: 0, height: 0, format: 'JPEG' };
}

function parseWebpDimensions(bytes: Buffer): ImageDimensions {
  const chunk = bytes.subarray(12, 16).toString('ascii');
  if (chunk === 'VP8X' && bytes.length >= 30) {
    return {
      width: 1 + bytes.readUIntLE(24, 3),
      height: 1 + bytes.readUIntLE(27, 3),
      format: 'WEBP',
    };
  }
  if (chunk === 'VP8 ' && bytes.length >= 30) {
    return {
      width: bytes.readUInt16LE(26) & 0x3fff,
      height: bytes.readUInt16LE(28) & 0x3fff,
      format: 'WEBP',
    };
  }
  if (chunk === 'VP8L' && bytes.length >= 25) {
    const bits = bytes.readUInt32LE(21);
    return {
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 14) & 0x3fff) + 1,
      format: 'WEBP',
    };
  }
  return { width: 0, height: 0, format: 'WEBP' };
}

function classifyWebsiteSourceType(pageUrl: string): ImageSourceType {
  const lower = pageUrl.toLowerCase();
  if (lower.includes('gallery') || lower.includes('galeria') || lower.includes('galer%C3%ADa')) return 'official_gallery';
  return 'official_website';
}

function dedupeCandidatesByUrl(candidates: ImageCandidate[]): ImageCandidate[] {
  const seen = new Set<string>();
  const result: ImageCandidate[] = [];
  for (const candidate of candidates) {
    const key = candidate.resolved_image_url.trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(candidate);
  }
  return result;
}

function isDisallowedSourceUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return lower.includes('instagram.com') || lower.includes('tripadvisor.');
}

function resolveUrl(url: string, pageUrl: string): string {
  try {
    return new URL(url, pageUrl).toString();
  } catch {
    return '';
  }
}

function sanitizePersistedUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.searchParams.delete('key');
    return parsed.toString();
  } catch {
    return url.replace(/([?&]key=)[^&]+/i, '$1REDACTED');
  }
}

function safePathname(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url.split('?')[0];
  }
}

function extractPageTitle(html: string): string {
  const match = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  return match ? decodeHtmlEntities(match[1].replace(/\s+/g, ' ').trim()) : '';
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function parsePositiveInt(value?: string): number {
  if (!value) return 0;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function mergeNotes(existing: string | undefined, ...notes: string[]): string {
  return [...new Set([existing, ...notes].filter(Boolean))].join('; ');
}

function getRecord(value: unknown, key?: string): Record<string, unknown> {
  const target = key && isRecord(value) ? value[key] : value;
  return isRecord(target) ? target : {};
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function formatUnknownError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}
