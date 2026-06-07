import { createHash } from 'crypto';
import type { ImageCandidate, RiskFlag } from '../types';

const MIN_DIMENSION = 512;
const PREFERRED_DIMENSION = 1024;

const ALLOWED_CONTENT_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const REJECTED_EXTENSIONS = /\.(svg|gif|avif|bmp)(?:$|[?#])/i;

const SPATIAL_TERMS = [
  'interior',
  'salon',
  'dining room',
  'room',
  'bar interior',
  'ambience',
  'ambiance',
  'atmosphere',
  'gallery',
  'galeria',
  'press',
  'media',
  'venue',
  'terraza',
  'patio',
  'fachada',
  'exterior',
];

const PRODUCT_TERMS = [
  'food',
  'dish',
  'plate',
  'menu-item',
  'dessert',
  'cocktail',
  'drink',
  'wine',
  'burger',
  'pizza',
  'pasta',
  'steak',
  'coffee',
  'plato',
  'comida',
  'bebida',
  'producto',
];

const JUNK_TERMS = [
  'logo',
  'icon',
  'favicon',
  'brandmark',
  'menu',
  'qr',
  'payment',
  'visa',
  'mastercard',
  'map',
  'google-map',
  'pin',
  'sprite',
  'badge',
  'award',
  'tripadvisor',
];

const THUMBNAIL_TERMS = [
  'thumb',
  'thumbnail',
  '/small/',
  '/tiny/',
  '/icon/',
  'w_100',
  'w_150',
  'w_200',
  'w_300',
  'h_100',
  'h_150',
  'h_200',
  'h_300',
  '150x150',
  '300x300',
  '320x',
  'x320',
];

export interface RejectedImageCandidate extends ImageCandidate {
  validation_status: 'rejected_before_m3';
  prefilter_decision: 'reject_before_m3';
  rejection_reasons: string[];
}

export interface AcceptedImageCandidate extends ImageCandidate {
  validation_status: 'accepted_for_m3_preflight';
  prefilter_decision: 'pass_to_m3';
  width: number;
  height: number;
  content_type: string;
  risk_flags: RiskFlag[];
  pre_m3_score: number;
}

export interface ImageValidationResult {
  final_queue: AcceptedImageCandidate[];
  rejected_candidates: RejectedImageCandidate[];
  summary: {
    input_count: number;
    final_queue_size: number;
    rejected_count: number;
    below_preferred_resolution_count: number;
    unsupported_format_count: number;
    duplicate_count: number;
    source_breakdown: Record<string, number>;
    candidates_per_venue: Record<string, number>;
    venues_with_candidates: string[];
    venues_with_zero_candidates: string[];
  };
}

export function validateImageCandidates(candidates: ImageCandidate[], venueNames: string[]): ImageValidationResult {
  const normalized = candidates.map(normalizeCandidate);
  const venueHasSpatial = findVenuesWithSpatialCandidates(normalized);
  const seenUrls = new Set<string>();
  const seenHashes = new Set<string>();
  const accepted: AcceptedImageCandidate[] = [];
  const rejected: RejectedImageCandidate[] = [];

  for (const candidate of normalized) {
    const evaluation = evaluateCandidate(candidate, venueHasSpatial.has(candidate.venue_name));
    const normalizedUrl = normalizeUrl(candidate.resolved_image_url);
    const sha = candidate.sha256 || '';

    if (seenUrls.has(normalizedUrl)) {
      evaluation.rejectionReasons.push('duplicate_resolved_image_url');
    }
    if (sha && seenHashes.has(sha)) {
      evaluation.rejectionReasons.push('duplicate_sha256');
    }

    if (evaluation.rejectionReasons.length > 0) {
      rejected.push({
        ...candidate,
        validation_status: 'rejected_before_m3',
        prefilter_decision: 'reject_before_m3',
        rejection_reasons: evaluation.rejectionReasons,
        risk_flags: mergeFlags(candidate.risk_flags, evaluation.riskFlags),
      });
      continue;
    }

    const acceptedCandidate: AcceptedImageCandidate = {
      ...candidate,
      validation_status: 'accepted_for_m3_preflight',
      prefilter_decision: 'pass_to_m3',
      width: candidate.width,
      height: candidate.height,
      content_type: candidate.content_type || '',
      dedupe_hash: candidate.dedupe_hash || hashText(normalizedUrl || `${candidate.venue_name}:${candidate.source_url}`),
      risk_flags: mergeFlags(candidate.risk_flags, evaluation.riskFlags),
      pre_m3_score: scoreCandidate(candidate, evaluation.isSpatial, evaluation.isProductHeavy),
    };

    accepted.push(acceptedCandidate);
    seenUrls.add(normalizedUrl);
    if (sha) seenHashes.add(sha);
  }

  const finalQueue = accepted.sort((a, b) => b.pre_m3_score - a.pre_m3_score);
  const candidatesPerVenue = countBy(finalQueue, (candidate) => candidate.venue_name);
  const venuesWithCandidates = venueNames.filter((venueName) => (candidatesPerVenue[venueName] || 0) > 0);
  const venuesWithZeroCandidates = venueNames.filter((venueName) => (candidatesPerVenue[venueName] || 0) === 0);

  return {
    final_queue: finalQueue,
    rejected_candidates: rejected,
    summary: {
      input_count: normalized.length,
      final_queue_size: finalQueue.length,
      rejected_count: rejected.length,
      below_preferred_resolution_count: finalQueue.filter((candidate) => maxDimension(candidate) < PREFERRED_DIMENSION).length,
      unsupported_format_count: rejected.filter((candidate) =>
        candidate.rejection_reasons.some((reason) => reason.includes('unsupported') || reason.includes('content_type')),
      ).length,
      duplicate_count: rejected.filter((candidate) =>
        candidate.rejection_reasons.some((reason) => reason.includes('duplicate')),
      ).length,
      source_breakdown: countBy(finalQueue, (candidate) => candidate.source_type),
      candidates_per_venue: candidatesPerVenue,
      venues_with_candidates: venuesWithCandidates,
      venues_with_zero_candidates: venuesWithZeroCandidates,
    },
  };
}

function normalizeCandidate(candidate: ImageCandidate): ImageCandidate {
  return {
    ...candidate,
    content_type: normalizeContentType(candidate.content_type || ''),
    width: candidate.width || 0,
    height: candidate.height || 0,
    content_length: candidate.content_length || 0,
    dedupe_hash: candidate.dedupe_hash || undefined,
    risk_flags: candidate.risk_flags || [],
  };
}

function evaluateCandidate(candidate: ImageCandidate, venueHasSpatial: boolean): {
  isSpatial: boolean;
  isProductHeavy: boolean;
  rejectionReasons: string[];
  riskFlags: RiskFlag[];
} {
  const rejectionReasons: string[] = [];
  const riskFlags: RiskFlag[] = [];
  const text = candidateAssetText(candidate);
  const contentType = normalizeContentType(candidate.content_type || '');
  const maxDim = maxDimension(candidate);
  const isSpatial = isSpatialCandidate(candidate);
  const isProductHeavy = containsAny(text, PRODUCT_TERMS);

  if (hasRejectedExtension(candidate.resolved_image_url) || isRejectedContentType(contentType)) {
    rejectionReasons.push('unsupported_format_svg_gif_avif_bmp');
    riskFlags.push('unsupported_format');
  }
  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    rejectionReasons.push('content_type_not_jpeg_png_webp');
    riskFlags.push('unsupported_format');
  }
  if (contentType && !contentType.startsWith('image/')) {
    rejectionReasons.push('non_image_content');
    riskFlags.push('unsupported_format');
  }
  if (containsAny(text, JUNK_TERMS)) {
    rejectionReasons.push('obvious_logo_icon_menu_payment_map');
    riskFlags.push('source_trust_only');
  }
  if (containsAny(candidate.resolved_image_url.toLowerCase(), THUMBNAIL_TERMS)) {
    rejectionReasons.push('known_thumbnail_asset');
    riskFlags.push('low_resolution');
  }
  if (maxDim < MIN_DIMENSION) {
    rejectionReasons.push('max_dimension_below_512');
    riskFlags.push('low_resolution');
  }
  if (isProductHeavy && venueHasSpatial) {
    rejectionReasons.push('product_food_suppressed_spatial_exists');
    riskFlags.push('product_only');
  }

  if (maxDim >= MIN_DIMENSION && maxDim < PREFERRED_DIMENSION) riskFlags.push('below_preferred_resolution');
  if (maxDim >= PREFERRED_DIMENSION) riskFlags.push('preferred_resolution');
  if (candidate.source_type !== 'official_website' && candidate.source_type !== 'official_gallery') riskFlags.push('rights_review_needed');
  if (candidate.risk_flags?.includes('source_trust_only')) riskFlags.push('source_trust_only');
  if (isProductHeavy) riskFlags.push('product_only');

  return {
    isSpatial,
    isProductHeavy,
    rejectionReasons,
    riskFlags,
  };
}

function findVenuesWithSpatialCandidates(candidates: ImageCandidate[]): Set<string> {
  const venues = new Set<string>();
  for (const candidate of candidates) {
    const contentType = normalizeContentType(candidate.content_type || '');
    if (
      isSpatialCandidate(candidate) &&
      !containsAny(candidateAssetText(candidate), PRODUCT_TERMS) &&
      ALLOWED_CONTENT_TYPES.has(contentType) &&
      maxDimension(candidate) >= MIN_DIMENSION &&
      !containsAny(candidateAssetText(candidate), JUNK_TERMS)
    ) {
      venues.add(candidate.venue_name);
    }
  }
  return venues;
}

function isSpatialCandidate(candidate: ImageCandidate): boolean {
  if (candidate.source_type === 'official_gallery') return true;
  return containsAny(candidateAssetText(candidate), SPATIAL_TERMS);
}

function scoreCandidate(candidate: ImageCandidate, isSpatial: boolean, isProductHeavy: boolean): number {
  const maxDim = maxDimension(candidate);
  let score = 0;
  score += Math.min(maxDim / 80, 25);
  score += candidate.source_type === 'official_gallery' ? 35 : 0;
  score += candidate.source_type === 'official_website' ? 22 : 0;
  score += candidate.source_type === 'google_places' ? 16 : 0;
  score += isSpatial ? 24 : 0;
  score -= isProductHeavy ? 28 : 0;
  score -= maxDim < PREFERRED_DIMENSION ? 10 : 0;
  return Math.round(score);
}

function maxDimension(candidate: ImageCandidate): number {
  return Math.max(candidate.width || 0, candidate.height || 0);
}

function candidateAssetText(candidate: ImageCandidate): string {
  return [
    candidate.resolved_image_url,
    candidate.original_image_url,
    candidate.alt_text,
    candidate.source_page_context,
    candidate.notes,
  ].filter(Boolean).join(' ').toLowerCase();
}

function hasRejectedExtension(url: string): boolean {
  return REJECTED_EXTENSIONS.test(safePathname(url)) || /\.(svg|gif|avif|bmp)(?:$|[?#])/i.test(url);
}

function isRejectedContentType(contentType: string): boolean {
  return ['image/svg+xml', 'image/gif', 'image/avif', 'image/bmp', 'image/x-ms-bmp'].includes(contentType);
}

function normalizeContentType(value: string): string {
  return value.split(';')[0].trim().toLowerCase();
}

function containsAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term.toLowerCase()));
}

function countBy<T>(items: T[], getter: (item: T) => string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const key = getter(item) || 'unknown';
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = '';
    parsed.searchParams.sort();
    return parsed.toString();
  } catch {
    return url.trim();
  }
}

function safePathname(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url.split('?')[0];
  }
}

function mergeFlags(existing: RiskFlag[] | undefined, additions: RiskFlag[]): RiskFlag[] {
  return [...new Set([...(existing || []), ...additions])];
}

function hashText(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}
