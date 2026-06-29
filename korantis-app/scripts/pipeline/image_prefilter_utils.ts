import { createHash } from 'crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';

export type JsonObject = Record<string, unknown>;

export type ImageCandidate = {
  venue_name: string;
  source_url: string;
  resolved_image_url: string;
  original_image_url?: string;
  source_type?: string;
  source_quality?: string;
  rights_hint?: string;
  content_type?: string;
  content_length?: number;
  width?: number;
  height?: number;
  real_width?: number;
  real_height?: number;
  bytes_received?: number;
  pil_format?: string;
  sha256?: string;
  dedupe_hash?: string;
  alt_text?: string;
  surrounding_text?: string;
  source_page_context?: string;
  filename_hint?: string;
  priority?: number;
  risk_flags?: string[];
  [key: string]: unknown;
};

export type QueueCandidate = ImageCandidate & {
  width: number;
  height: number;
  content_length: number;
  dedupe_hash: string;
  validation_status: 'imported_needs_validation';
  publication_status: 'not_approved_for_publication';
  below_preferred_resolution: boolean;
  pre_m3_score: number;
  source_targeting: {
    class: SourceTargetClass;
    matched_terms: string[];
  };
  prefilter_decision: 'pass_to_m3';
  prefilter_notes: string[];
  risk_flags: string[];
};

export type RejectedCandidate = ImageCandidate & {
  prefilter_decision: 'reject_before_m3';
  rejection_reasons: string[];
  prefilter_notes: string[];
  risk_flags: string[];
};

export type BuildVisionQueueResult = {
  generated_at: string;
  dry_run_safe: true;
  input_count: number;
  final_queue_count: number;
  rejected_count: number;
  venue_count: number;
  venues_with_two_plus_non_product_spatial_candidates: number;
  success_criteria: Record<string, boolean>;
  final_queue: QueueCandidate[];
  rejected_candidates: RejectedCandidate[];
  summary: Record<string, unknown>;
};

export type FinalQueueValidationReport = {
  generated_at: string;
  input_file: string;
  queue_count: number;
  venue_count: number;
  venues_with_two_plus_non_product_spatial_candidates: number;
  checks: Array<{
    name: string;
    passed: boolean;
    details: string;
  }>;
  failures: Array<{
    name: string;
    passed: false;
    details: string;
  }>;
  publish_ready: false;
  m3_ready: boolean;
};

export type SourceTargetClass =
  | 'official_gallery'
  | 'press_media'
  | 'michelin_gallery'
  | 'fifty_best_gallery'
  | 'city_tourism'
  | 'editorial_spatial_review'
  | 'official_site'
  | 'weak_or_unknown';

const OUTPUT_DIR = path.join(process.cwd(), 'data');
const MIN_DIMENSION = 512;
const PREFERRED_DIMENSION = 1024;

const UNSUPPORTED_FORMAT_TERMS = [
  'svg',
  'image/svg+xml',
  'gif',
  'image/gif',
  'avif',
  'image/avif',
  'bmp',
  'image/bmp',
  'x-ms-bmp',
];

const SPATIAL_TERMS = [
  'interior',
  'salon',
  'salón',
  'dining room',
  'bar interior',
  'ambience',
  'ambiance',
  'atmosphere',
  'gallery',
  'press',
  'media',
  'sala',
  'room',
  'venue',
  'restaurant interior',
  'bar',
];

const PRODUCT_TERMS = [
  'food',
  'dish',
  'plate',
  'menu-item',
  'dessert',
  'cocktail',
  'drink',
  'wine-bottle',
  'burger',
  'pizza',
  'pasta',
  'steak',
  'empanada',
  'sushi',
  'brunch',
  'bread',
  'coffee-cup',
  'product',
  'plato',
  'comida',
  'bebida',
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

const WINDOWS_UNSAFE_PATTERN = /[<>:"/\\|?*\u0000-\u001f]/;

export function readJsonFile(filePath: string): JsonObject {
  return JSON.parse(readFileSync(filePath, 'utf8')) as JsonObject;
}

export function writeJsonFile(filePath: string, value: unknown): void {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

export function writeMarkdownFile(filePath: string, value: string): void {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${value.trim()}\n`, 'utf8');
}

export function dataPath(fileName: string): string {
  return path.join(OUTPUT_DIR, fileName);
}

export function extractCandidates(input: JsonObject): ImageCandidate[] {
  const candidates = firstArray(input, [
    'queue',
    'final_vision_queue',
    'final_vision_candidates',
    'resolved_image_candidates',
    'all_image_candidates_raw',
    'candidates',
    'records',
    'items',
  ]);

  if (candidates.length > 0) {
    return candidates.map(normalizeCandidate).filter(hasMinimumIdentity);
  }

  const nestedRecords = firstArray(input, ['records']);
  return nestedRecords
    .flatMap((record) => firstArray(record, ['final_vision_candidates', 'resolved_image_candidates', 'image_candidates_raw'])
      .map((candidate) => normalizeCandidate({ ...candidate, venue_name: getString(record, 'venue_name') || getString(candidate, 'venue_name') })))
    .filter(hasMinimumIdentity);
}

export function buildVisionQueue(candidates: ImageCandidate[]): BuildVisionQueueResult {
  const normalized = candidates.map(normalizeCandidate);
  const spatialByVenue = new Map<string, boolean>();

  for (const candidate of normalized) {
    const evaluation = evaluateCandidate(candidate, false);
    if (evaluation.canPassM3 && evaluation.isSpatial && !evaluation.isProductHeavy) {
      spatialByVenue.set(candidate.venue_name, true);
    }
  }

  const accepted: QueueCandidate[] = [];
  const rejected: RejectedCandidate[] = [];
  const seenUrls = new Set<string>();
  const seenHashes = new Set<string>();

  for (const candidate of normalized) {
    const venueHasSpatial = spatialByVenue.get(candidate.venue_name) || false;
    const evaluation = evaluateCandidate(candidate, venueHasSpatial);
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
        prefilter_decision: 'reject_before_m3',
        rejection_reasons: evaluation.rejectionReasons,
        prefilter_notes: evaluation.notes,
        risk_flags: mergeFlags(candidate.risk_flags, evaluation.riskFlags),
      });
      continue;
    }

    const dimensions = getDimensions(candidate);
    const score = scoreCandidate(candidate, evaluation.sourceTargetClass, evaluation.isSpatial, evaluation.isProductHeavy);
    const queueCandidate: QueueCandidate = {
      ...candidate,
      width: dimensions.width,
      height: dimensions.height,
      content_length: getContentLength(candidate),
      dedupe_hash: candidate.dedupe_hash || hashText(normalizedUrl || `${candidate.venue_name}:${candidate.source_url}`),
      validation_status: 'imported_needs_validation',
      publication_status: 'not_approved_for_publication',
      below_preferred_resolution: Math.max(dimensions.width, dimensions.height) < PREFERRED_DIMENSION,
      pre_m3_score: score,
      source_targeting: {
        class: evaluation.sourceTargetClass,
        matched_terms: evaluation.sourceMatchedTerms,
      },
      prefilter_decision: 'pass_to_m3',
      prefilter_notes: evaluation.notes,
      risk_flags: mergeFlags(candidate.risk_flags, evaluation.riskFlags),
    };

    accepted.push(queueCandidate);
    seenUrls.add(normalizedUrl);
    if (sha) {
      seenHashes.add(sha);
    }
  }

  const finalQueue = accepted.sort((a, b) => b.pre_m3_score - a.pre_m3_score);
  const venuesWith2PlusSpatial = countVenuesWith2PlusSpatial(finalQueue);

  return {
    generated_at: new Date().toISOString(),
    dry_run_safe: true,
    input_count: candidates.length,
    final_queue_count: finalQueue.length,
    rejected_count: rejected.length,
    venue_count: new Set(finalQueue.map((candidate) => candidate.venue_name)).size,
    venues_with_two_plus_non_product_spatial_candidates: venuesWith2PlusSpatial,
    success_criteria: buildSuccessCriteria(finalQueue, venuesWith2PlusSpatial),
    final_queue: finalQueue,
    rejected_candidates: rejected,
    summary: {
      accepted_by_source_target: countBy(finalQueue, (candidate) => candidate.source_targeting.class),
      rejected_by_reason: countRejectionReasons(rejected),
      below_preferred_resolution: finalQueue.filter((candidate) => candidate.below_preferred_resolution).length,
      product_suppressed: rejected.filter((candidate) => candidate.rejection_reasons.includes('product_food_suppressed_spatial_exists')).length,
    },
  };
}

export function validateFinalVisionQueue(queue: ImageCandidate[], inputFile: string): FinalQueueValidationReport {
  const normalized = queue.map(normalizeCandidate);
  const venuesWith2PlusSpatial = countVenuesWith2PlusSpatial(normalized);
  const checks: FinalQueueValidationReport['checks'] = [];

  const addCheck = (name: string, passed: boolean, details: string): void => {
    checks.push({ name, passed, details });
  };

  addCheck('At least 15 venues have 2+ non-product spatial candidates', venuesWith2PlusSpatial >= 15, `Found ${venuesWith2PlusSpatial}.`);
  addCheck('No unsupported formats', normalized.every((candidate) => !hasUnsupportedFormat(candidate)), `${normalized.filter(hasUnsupportedFormat).length} unsupported records.`);
  addCheck('No SVG/GIF/AVIF/BMP', normalized.every((candidate) => !hasRejectedExtension(candidate)), `${normalized.filter(hasRejectedExtension).length} rejected extension records.`);
  addCheck('No known thumbnails', normalized.every((candidate) => !isKnownThumbnail(candidate)), `${normalized.filter(isKnownThumbnail).length} known thumbnail records.`);
  addCheck('No max_dim below 512', normalized.every((candidate) => getMaxDim(candidate) >= MIN_DIMENSION), `${normalized.filter((candidate) => getMaxDim(candidate) < MIN_DIMENSION).length} records below 512.`);
  addCheck('512-1023 marked below_preferred_resolution', normalized.every((candidate) => getMaxDim(candidate) >= PREFERRED_DIMENSION || Boolean(candidate.below_preferred_resolution)), `${normalized.filter((candidate) => getMaxDim(candidate) >= MIN_DIMENSION && getMaxDim(candidate) < PREFERRED_DIMENSION && !candidate.below_preferred_resolution).length} unmarked records.`);
  addCheck('No all-zero width/height/content_length', normalized.every((candidate) => !(getMaxDim(candidate) === 0 && getContentLength(candidate) === 0)), `${normalized.filter((candidate) => getMaxDim(candidate) === 0 && getContentLength(candidate) === 0).length} all-zero records.`);
  addCheck('Required source fields preserved', normalized.every(hasMinimumIdentity), `${normalized.filter((candidate) => !hasMinimumIdentity(candidate)).length} records missing required source fields.`);
  addCheck('No duplicate resolved_image_url', duplicateValues(normalized.map((candidate) => normalizeUrl(candidate.resolved_image_url))).length === 0, duplicateValues(normalized.map((candidate) => normalizeUrl(candidate.resolved_image_url))).join(', ') || 'No duplicates.');
  addCheck('No duplicate sha256', duplicateValues(normalized.map((candidate) => candidate.sha256 || '').filter(Boolean)).length === 0, duplicateValues(normalized.map((candidate) => candidate.sha256 || '').filter(Boolean)).join(', ') || 'No duplicates.');
  addCheck('Filenames are Windows-safe', normalized.every((candidate) => isWindowsSafeFilename(urlFilename(candidate.resolved_image_url))), `${normalized.filter((candidate) => !isWindowsSafeFilename(urlFilename(candidate.resolved_image_url))).length} unsafe URL filenames.`);
  addCheck('No obvious logo/icon/menu/payment/map candidates', normalized.every((candidate) => !isObviousJunk(candidate)), `${normalized.filter(isObviousJunk).length} obvious non-spatial records.`);

  const failures = checks
    .filter((check) => !check.passed)
    .map((check) => ({ ...check, passed: false as const }));

  return {
    generated_at: new Date().toISOString(),
    input_file: inputFile,
    queue_count: normalized.length,
    venue_count: new Set(normalized.map((candidate) => candidate.venue_name)).size,
    venues_with_two_plus_non_product_spatial_candidates: venuesWith2PlusSpatial,
    checks,
    failures,
    publish_ready: false,
    m3_ready: failures.length === 0,
  };
}

export function validationMarkdown(report: FinalQueueValidationReport): string {
  return [
    '# Final Vision Queue Validation',
    '',
    `Generated: ${report.generated_at}`,
    `Input file: \`${report.input_file}\``,
    '',
    `M3 ready: **${report.m3_ready}**`,
    `Publish ready: **${report.publish_ready}**`,
    '',
    '## Counts',
    '',
    `- Queue items: ${report.queue_count}`,
    `- Venues: ${report.venue_count}`,
    `- Venues with 2+ non-product spatial candidates: ${report.venues_with_two_plus_non_product_spatial_candidates}`,
    '',
    '## Checks',
    '',
    ...report.checks.map((check) => `- ${check.passed ? 'PASS' : 'FAIL'}: ${check.name} - ${check.details}`),
  ].join('\n');
}

export function buildQueueMarkdown(report: BuildVisionQueueResult): string {
  return [
    '# Hardened Final Vision Queue Build Report',
    '',
    `Generated: ${report.generated_at}`,
    '',
    `Input candidates: ${report.input_count}`,
    `Final queue: ${report.final_queue_count}`,
    `Rejected before M3: ${report.rejected_count}`,
    `Venues with 2+ non-product spatial candidates: ${report.venues_with_two_plus_non_product_spatial_candidates}`,
    '',
    '## Success Criteria',
    '',
    ...Object.entries(report.success_criteria).map(([key, value]) => `- ${value ? 'PASS' : 'FAIL'}: ${key}`),
    '',
    '## Summary',
    '',
    `- Accepted by source target: ${JSON.stringify(report.summary.accepted_by_source_target)}`,
    `- Rejected by reason: ${JSON.stringify(report.summary.rejected_by_reason)}`,
    `- Product suppressed: ${String(report.summary.product_suppressed)}`,
  ].join('\n');
}

export async function probeImageBytes(url: string): Promise<Partial<ImageCandidate>> {
  const response = await fetch(url, {
    headers: {
      Accept: 'image/jpeg,image/png,image/webp;q=0.9',
      'User-Agent': 'KorantisImagePreflight/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`Image fetch failed: ${response.status}`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  const dimensions = extractImageDimensions(bytes);

  return {
    content_type: response.headers.get('content-type') || undefined,
    content_length: Number(response.headers.get('content-length')) || bytes.length,
    bytes_received: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    real_width: dimensions.width,
    real_height: dimensions.height,
    pil_format: dimensions.format,
  };
}

export function extractImageDimensions(bytes: Buffer): { width: number; height: number; format: string } {
  if (bytes.length >= 24 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), format: 'PNG' };
  }

  if (bytes.length >= 10 && bytes.subarray(0, 3).toString('ascii') === 'GIF') {
    return { width: bytes.readUInt16LE(6), height: bytes.readUInt16LE(8), format: 'GIF' };
  }

  if (bytes.length >= 12 && bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP') {
    return parseWebpDimensions(bytes);
  }

  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    return parseJpegDimensions(bytes);
  }

  return { width: 0, height: 0, format: 'UNKNOWN' };
}

function evaluateCandidate(candidate: ImageCandidate, venueHasSpatial: boolean): {
  canPassM3: boolean;
  isSpatial: boolean;
  isProductHeavy: boolean;
  sourceTargetClass: SourceTargetClass;
  sourceMatchedTerms: string[];
  rejectionReasons: string[];
  riskFlags: string[];
  notes: string[];
} {
  const rejectionReasons: string[] = [];
  const riskFlags: string[] = [];
  const notes: string[] = [];
  const sourceTargeting = classifySourceTarget(candidate);
  const maxDim = getMaxDim(candidate);
  const isSpatial = sourceTargeting.class !== 'weak_or_unknown' || containsAny(candidateText(candidate), SPATIAL_TERMS).matched;
  const isProductHeavy = isProductCandidate(candidate);

  if (hasUnsupportedFormat(candidate)) {
    rejectionReasons.push('unsupported_format');
    riskFlags.push('unsupported_format');
  }
  if (hasRejectedExtension(candidate)) {
    rejectionReasons.push('rejected_extension_svg_gif_avif_bmp');
    riskFlags.push('unsupported_format');
  }
  if (isKnownThumbnail(candidate)) {
    rejectionReasons.push('known_thumbnail');
    riskFlags.push('low_resolution');
  }
  if (isObviousJunk(candidate)) {
    rejectionReasons.push('obvious_logo_icon_menu_payment_map');
    riskFlags.push('source_trust_only');
  }
  if (maxDim > 0 && maxDim < MIN_DIMENSION) {
    rejectionReasons.push('below_min_dimension');
    riskFlags.push('low_resolution');
  }
  if (maxDim === 0 && getContentLength(candidate) === 0) {
    rejectionReasons.push('missing_real_dimensions_and_content_length');
    riskFlags.push('possible_cdn_unverified');
  }
  if (maxDim >= MIN_DIMENSION && maxDim < PREFERRED_DIMENSION) {
    riskFlags.push('below_preferred_resolution');
    notes.push('Image is usable for screening but below preferred resolution.');
  }
  if (isProductHeavy && venueHasSpatial) {
    rejectionReasons.push('product_food_suppressed_spatial_exists');
    riskFlags.push('product_only');
  }
  if (isProductHeavy && !venueHasSpatial) {
    riskFlags.push('product_only');
    notes.push('Product-heavy candidate retained only because venue has no detected spatial candidate.');
  }
  if (!isSpatial && !isProductHeavy) {
    notes.push('Candidate has weak spatial source targeting.');
  }

  return {
    canPassM3: rejectionReasons.length === 0,
    isSpatial,
    isProductHeavy,
    sourceTargetClass: sourceTargeting.class,
    sourceMatchedTerms: sourceTargeting.matchedTerms,
    rejectionReasons,
    riskFlags,
    notes,
  };
}

function normalizeCandidate(value: JsonObject): ImageCandidate {
  const resolved = getString(value, 'resolved_image_url') || getString(value, 'url') || getString(value, 'image_url');
  const sourceUrl = getString(value, 'source_url') || getString(value, 'page_url') || getString(value, 'source');
  const realWidth = getNumber(value, 'real_width') || getNumber(value, 'width');
  const realHeight = getNumber(value, 'real_height') || getNumber(value, 'height');
  const contentLength = getNumber(value, 'content_length') || getNumber(value, 'bytes_received');

  return {
    ...value,
    venue_name: getString(value, 'venue_name'),
    source_url: sourceUrl,
    resolved_image_url: resolved,
    original_image_url: getString(value, 'original_image_url') || resolved,
    source_type: getString(value, 'source_type'),
    source_quality: getString(value, 'source_quality'),
    rights_hint: getString(value, 'rights_hint'),
    content_type: getString(value, 'content_type') || getString(value, 'declared_content_type'),
    content_length: contentLength,
    width: realWidth,
    height: realHeight,
    real_width: realWidth,
    real_height: realHeight,
    bytes_received: getNumber(value, 'bytes_received') || contentLength,
    pil_format: getString(value, 'pil_format'),
    sha256: getString(value, 'sha256'),
    dedupe_hash: getString(value, 'dedupe_hash'),
    alt_text: getString(value, 'alt_text'),
    surrounding_text: getString(value, 'surrounding_text'),
    source_page_context: getString(value, 'source_page_context'),
    filename_hint: getString(value, 'filename_hint'),
    priority: getNumber(value, 'priority'),
    risk_flags: getStringArray(value, 'risk_flags'),
  };
}

function hasMinimumIdentity(candidate: ImageCandidate): boolean {
  return Boolean(candidate.venue_name && candidate.source_url && candidate.resolved_image_url);
}

function classifySourceTarget(candidate: ImageCandidate): { class: SourceTargetClass; matchedTerms: string[] } {
  const text = candidateText(candidate);
  const url = `${candidate.source_url} ${candidate.resolved_image_url}`.toLowerCase();
  const matchedTerms = containsAny(text, SPATIAL_TERMS).terms;

  if (url.includes('michelin')) return { class: 'michelin_gallery', matchedTerms };
  if (url.includes('theworlds50best') || url.includes('50best')) return { class: 'fifty_best_gallery', matchedTerms };
  if (url.includes('turismo') || url.includes('tourism') || url.includes('buenosaires.gob')) return { class: 'city_tourism', matchedTerms };
  if (url.includes('press') || url.includes('media') || text.includes('press')) return { class: 'press_media', matchedTerms };
  if (url.includes('gallery') || text.includes('gallery') || text.includes('galeria') || text.includes('galería')) return { class: 'official_gallery', matchedTerms };
  if (containsAny(text, ['review', 'interior', 'ambience', 'ambiance', 'salón', 'dining room']).matched) return { class: 'editorial_spatial_review', matchedTerms };
  if (candidate.source_type === 'official_website' || candidate.source_quality === 'official_site') return { class: 'official_site', matchedTerms };
  return { class: 'weak_or_unknown', matchedTerms };
}

function scoreCandidate(candidate: ImageCandidate, sourceClass: SourceTargetClass, isSpatial: boolean, isProductHeavy: boolean): number {
  const maxDim = getMaxDim(candidate);
  let score = 0;
  score += Math.min(maxDim / 100, 20);
  score += sourceClass === 'official_gallery' ? 30 : 0;
  score += sourceClass === 'press_media' ? 26 : 0;
  score += sourceClass === 'michelin_gallery' ? 28 : 0;
  score += sourceClass === 'fifty_best_gallery' ? 28 : 0;
  score += sourceClass === 'city_tourism' ? 22 : 0;
  score += sourceClass === 'editorial_spatial_review' ? 24 : 0;
  score += sourceClass === 'official_site' ? 16 : 0;
  score += isSpatial ? 20 : 0;
  score -= isProductHeavy ? 35 : 0;
  score -= maxDim > 0 && maxDim < PREFERRED_DIMENSION ? 12 : 0;
  return Math.round(score);
}

function isProductCandidate(candidate: ImageCandidate): boolean {
  return containsAny(candidateText(candidate), PRODUCT_TERMS).matched;
}

function isObviousJunk(candidate: ImageCandidate): boolean {
  return containsAny(candidateText(candidate), JUNK_TERMS).matched;
}

function hasUnsupportedFormat(candidate: ImageCandidate): boolean {
  return containsAny(`${candidate.content_type || ''} ${candidate.pil_format || ''}`.toLowerCase(), UNSUPPORTED_FORMAT_TERMS).matched;
}

function hasRejectedExtension(candidate: ImageCandidate): boolean {
  const filename = urlFilename(candidate.resolved_image_url).toLowerCase();
  return /\.(svg|gif|avif|bmp)(?:$|\?)/.test(filename) || containsAny(candidate.resolved_image_url.toLowerCase(), ['.svg', '.gif', '.avif', '.bmp']).matched;
}

function isKnownThumbnail(candidate: ImageCandidate): boolean {
  const text = `${candidate.resolved_image_url} ${candidate.original_image_url || ''} ${candidate.filename_hint || ''}`.toLowerCase();
  return containsAny(text, THUMBNAIL_TERMS).matched || (getMaxDim(candidate) > 0 && getMaxDim(candidate) < MIN_DIMENSION);
}

function getDimensions(candidate: ImageCandidate): { width: number; height: number } {
  return {
    width: candidate.real_width || candidate.width || 0,
    height: candidate.real_height || candidate.height || 0,
  };
}

function getMaxDim(candidate: ImageCandidate): number {
  const dimensions = getDimensions(candidate);
  return Math.max(dimensions.width, dimensions.height);
}

function getContentLength(candidate: ImageCandidate): number {
  return candidate.bytes_received || candidate.content_length || 0;
}

function countVenuesWith2PlusSpatial(candidates: ImageCandidate[]): number {
  const counts = new Map<string, number>();
  for (const candidate of candidates) {
    if (!isProductCandidate(candidate) && classifySourceTarget(candidate).class !== 'weak_or_unknown') {
      counts.set(candidate.venue_name, (counts.get(candidate.venue_name) || 0) + 1);
    }
  }
  return [...counts.values()].filter((count) => count >= 2).length;
}

function buildSuccessCriteria(finalQueue: QueueCandidate[], venuesWith2PlusSpatial: number): Record<string, boolean> {
  return {
    'at_least_15_venues_with_2_plus_non_product_spatial_candidates': venuesWith2PlusSpatial >= 15,
    'zero_unsupported_formats': finalQueue.every((candidate) => !hasUnsupportedFormat(candidate) && !hasRejectedExtension(candidate)),
    'zero_known_thumbnails': finalQueue.every((candidate) => !isKnownThumbnail(candidate)),
    'zero_all_zero_width_height_content_length': finalQueue.every((candidate) => !(getMaxDim(candidate) === 0 && getContentLength(candidate) === 0)),
    'all_filenames_windows_safe': finalQueue.every((candidate) => isWindowsSafeFilename(urlFilename(candidate.resolved_image_url))),
  };
}

function countBy<T>(items: T[], getter: (item: T) => string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const key = getter(item) || 'unknown';
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

function countRejectionReasons(rejected: RejectedCandidate[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const candidate of rejected) {
    for (const reason of candidate.rejection_reasons) {
      counts[reason] = (counts[reason] || 0) + 1;
    }
  }
  return counts;
}

function duplicateValues(values: string[]): string[] {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const value of values) {
    if (!value) continue;
    if (seen.has(value)) dupes.add(value);
    seen.add(value);
  }
  return [...dupes];
}

function candidateText(candidate: ImageCandidate): string {
  return [
    candidate.resolved_image_url,
    candidate.original_image_url,
    candidate.source_url,
    candidate.alt_text,
    candidate.surrounding_text,
    candidate.source_page_context,
    candidate.filename_hint,
  ].filter(Boolean).join(' ').toLowerCase();
}

function containsAny(text: string, terms: string[]): { matched: boolean; terms: string[] } {
  const matchedTerms = terms.filter((term) => matchesSearchTerm(text, term));
  return { matched: matchedTerms.length > 0, terms: matchedTerms };
}

function matchesSearchTerm(text: string, term: string): boolean {
  const normalizedText = text.toLowerCase();
  const normalizedTerm = term.toLowerCase();
  if (!/^[\p{L}\p{N}]+(?:[ _-][\p{L}\p{N}]+)*$/u.test(normalizedTerm)) {
    return normalizedText.includes(normalizedTerm);
  }

  const pattern = normalizedTerm
    .split(/[ _-]+/u)
    .map(escapeRegExp)
    .join('[\\s_-]+');
  return new RegExp(`(?:^|[^\\p{L}\\p{N}])${pattern}(?=$|[^\\p{L}\\p{N}])`, 'u').test(normalizedText);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = '';
    return parsed.toString();
  } catch {
    return url.trim();
  }
}

function urlFilename(url: string): string {
  try {
    const parsed = new URL(url);
    return path.basename(parsed.pathname) || 'image';
  } catch {
    return path.basename(url.split('?')[0]) || 'image';
  }
}

function isWindowsSafeFilename(filename: string): boolean {
  return filename.length > 0 && !WINDOWS_UNSAFE_PATTERN.test(filename);
}

function mergeFlags(existing: string[] | undefined, additions: string[]): string[] {
  return [...new Set([...(existing || []), ...additions])];
}

function hashText(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function getString(value: JsonObject, key: string): string {
  const item = value[key];
  return typeof item === 'string' ? item : '';
}

function getNumber(value: JsonObject, key: string): number {
  const item = value[key];
  return typeof item === 'number' && Number.isFinite(item) ? item : 0;
}

function getStringArray(value: JsonObject, key: string): string[] {
  const item = value[key];
  return Array.isArray(item) ? item.filter((entry): entry is string => typeof entry === 'string') : [];
}

function firstArray(value: JsonObject, keys: string[]): JsonObject[] {
  for (const key of keys) {
    const item = value[key];
    if (Array.isArray(item)) {
      return item.filter((entry): entry is JsonObject => Boolean(entry) && typeof entry === 'object' && !Array.isArray(entry));
    }
  }
  return [];
}

function parseJpegDimensions(bytes: Buffer): { width: number; height: number; format: string } {
  let offset = 2;
  while (offset < bytes.length) {
    if (bytes[offset] !== 0xff) break;
    const marker = bytes[offset + 1];
    const length = bytes.readUInt16BE(offset + 2);
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

function parseWebpDimensions(bytes: Buffer): { width: number; height: number; format: string } {
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
