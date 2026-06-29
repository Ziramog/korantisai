import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { discoverGooglePlacesPhotoCandidates, discoverOfficialWebsiteImages, probeImageCandidate } from '../utils/image_downloader';
import { validateImageCandidates, type AcceptedImageCandidate, type RejectedImageCandidate } from '../validation/image_validator';
import { loadLocalEnv } from './01_extract_data';
import type { ImageCandidate, VenueRaw } from '../types';

interface Stage03Result {
  batch_id: string;
  generated_at: string;
  venues_processed: number;
  candidates_found: number;
  candidates_rejected: number;
  final_queue_size: number;
  candidates_per_venue: Record<string, number>;
  venues_with_candidates: string[];
  venues_with_zero_candidates: string[];
  below_preferred_resolution_count: number;
  unsupported_format_count: number;
  duplicate_count: number;
  source_breakdown: Record<string, number>;
  image_candidates: ImageCandidate[];
  final_vision_queue: AcceptedImageCandidate[];
  rejected_candidates: RejectedImageCandidate[];
  report_markdown: string;
}

export interface Stage03Options {
  maxCandidatesPerVenue?: number;
}

export async function runStage03ImageDiscovery(batchName: string, options: Stage03Options = {}): Promise<Stage03Result> {
  loadLocalEnv();

  const outputDir = path.join(process.cwd(), 'data', 'batches', batchName);
  const rawVenuePath = path.join(outputDir, 'stage_01_raw_venues.json');
  const rawVenues = readRawVenues(rawVenuePath);
  const imageCandidates: ImageCandidate[] = [];
  const googlePlacesApiKey = process.env.GOOGLE_PLACES_API_KEY;

  for (const venue of rawVenues) {
    const discovered = [
      ...discoverGooglePlacesPhotoCandidates(venue),
      ...(await discoverOfficialWebsiteImages(venue)),
    ];

    const maxCandidates = Math.max(1, options.maxCandidatesPerVenue || 28);
    const limited = prioritizeDiscoveredCandidates(discovered).slice(0, maxCandidates);
    for (const candidate of limited) {
      const probed = await probeImageCandidate(candidate, { googlePlacesApiKey });
      imageCandidates.push(probed.candidate);
    }
  }

  const validation = validateImageCandidates(imageCandidates, rawVenues.map((venue) => venue.name));
  const generatedAt = new Date().toISOString();
  const result: Stage03Result = {
    batch_id: batchName,
    generated_at: generatedAt,
    venues_processed: rawVenues.length,
    candidates_found: imageCandidates.length,
    candidates_rejected: validation.summary.rejected_count,
    final_queue_size: validation.summary.final_queue_size,
    candidates_per_venue: validation.summary.candidates_per_venue,
    venues_with_candidates: validation.summary.venues_with_candidates,
    venues_with_zero_candidates: validation.summary.venues_with_zero_candidates,
    below_preferred_resolution_count: validation.summary.below_preferred_resolution_count,
    unsupported_format_count: validation.summary.unsupported_format_count,
    duplicate_count: validation.summary.duplicate_count,
    source_breakdown: validation.summary.source_breakdown,
    image_candidates: imageCandidates,
    final_vision_queue: validation.final_queue,
    rejected_candidates: validation.rejected_candidates,
    report_markdown: '',
  };
  result.report_markdown = buildStage03Report(result);

  mkdirSync(outputDir, { recursive: true });
  writeFileSync(path.join(outputDir, 'stage_03_image_candidates.json'), `${JSON.stringify({
    batch_id: batchName,
    generated_at: generatedAt,
    candidates: imageCandidates,
    rejected_candidates: validation.rejected_candidates,
  }, null, 2)}\n`, 'utf8');
  writeFileSync(path.join(outputDir, 'stage_03_final_vision_queue.json'), `${JSON.stringify({
    batch_id: batchName,
    generated_at: generatedAt,
    ready_for_stage_04_m3: isFinalQueueReadyForStage04(result.final_vision_queue),
    queue: validation.final_queue,
    summary: validation.summary,
  }, null, 2)}\n`, 'utf8');
  writeFileSync(path.join(outputDir, 'stage_03_report.md'), result.report_markdown, 'utf8');

  console.log(`Stage 03 image candidates written to ${path.join(outputDir, 'stage_03_image_candidates.json')}`);
  console.log(`Stage 03 final vision queue written to ${path.join(outputDir, 'stage_03_final_vision_queue.json')}`);
  console.log(`Stage 03 report written to ${path.join(outputDir, 'stage_03_report.md')}`);
  console.log(
    `Stage 03 summary: venues=${result.venues_processed}, candidates=${result.candidates_found}, final_queue=${result.final_queue_size}, rejected=${result.candidates_rejected}`,
  );

  return result;
}

function readRawVenues(filePath: string): VenueRaw[] {
  const parsed = JSON.parse(readFileSync(filePath, 'utf8')) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error(`Stage 03 input must be a VenueRaw array: ${filePath}`);
  }
  return parsed.filter((entry): entry is VenueRaw => isVenueRaw(entry));
}

function isVenueRaw(value: unknown): value is VenueRaw {
  return typeof value === 'object' && value !== null && 'name' in value && 'city' in value && 'input' in value;
}

function prioritizeDiscoveredCandidates(candidates: ImageCandidate[]): ImageCandidate[] {
  return [...candidates].sort((a, b) => priorityScore(b) - priorityScore(a));
}

function priorityScore(candidate: ImageCandidate): number {
  const text = [
    candidate.resolved_image_url,
    candidate.alt_text,
    candidate.source_page_context,
  ].filter(Boolean).join(' ').toLowerCase();
  let score = 0;
  if (candidate.source_type === 'official_gallery') score += 35;
  if (candidate.source_type === 'official_website') score += 25;
  if (candidate.source_type === 'google_places') score += 20;
  if (containsAny(text, ['interior', 'salon', 'dining', 'ambience', 'atmosphere', 'gallery', 'exterior'])) score += 20;
  if (containsAny(text, ['logo', 'icon', 'menu', 'payment', 'map', 'qr'])) score -= 40;
  if (containsAny(text, ['food', 'dish', 'plate', 'cocktail', 'drink', 'menu-item'])) score -= 12;
  score += Math.min(Math.max(candidate.width || 0, candidate.height || 0) / 100, 18);
  return score;
}

function buildStage03Report(result: Stage03Result): string {
  const lines = [
    '# Stage 03 Image Discovery Preflight Report',
    '',
    `- Batch: ${result.batch_id}`,
    `- Generated: ${result.generated_at}`,
    `- Venues processed: ${result.venues_processed}`,
    `- Candidates found: ${result.candidates_found}`,
    `- Candidates rejected: ${result.candidates_rejected}`,
    `- Final queue size: ${result.final_queue_size}`,
    `- Below preferred resolution: ${result.below_preferred_resolution_count}`,
    `- Unsupported format rejected: ${result.unsupported_format_count}`,
    `- Duplicate rejected: ${result.duplicate_count}`,
    '',
    '## Candidates Per Venue',
    '',
    ...Object.entries(result.candidates_per_venue).map(([venue, count]) => `- ${venue}: ${count}`),
    '',
    '## Venues With Zero Candidates',
    '',
    ...(result.venues_with_zero_candidates.length > 0 ? result.venues_with_zero_candidates.map((venue) => `- ${venue}`) : ['- none']),
    '',
    '## Source Breakdown',
    '',
    ...Object.entries(result.source_breakdown).map(([sourceType, count]) => `- ${sourceType}: ${count}`),
    '',
    '## Rejection Breakdown',
    '',
    ...Object.entries(countRejectionReasons(result.rejected_candidates)).map(([reason, count]) => `- ${reason}: ${count}`),
    '',
    '## Stage 04 Readiness',
    '',
    `- Ready for Stage 04 M3 vision: ${isFinalQueueReadyForStage04(result.final_vision_queue) ? 'yes' : 'no'}`,
    '- M3 was not called.',
  ];

  return `${lines.join('\n')}\n`;
}

function isFinalQueueReadyForStage04(queue: AcceptedImageCandidate[]): boolean {
  return queue.length > 0 && queue.every((candidate) =>
    ['image/jpeg', 'image/png', 'image/webp'].includes(candidate.content_type) &&
    Math.max(candidate.width, candidate.height) >= 512 &&
    !candidate.risk_flags.includes('unsupported_format'),
  );
}

function countRejectionReasons(rejected: RejectedImageCandidate[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const candidate of rejected) {
    for (const reason of candidate.rejection_reasons) {
      counts[reason] = (counts[reason] || 0) + 1;
    }
  }
  return counts;
}

function containsAny(text: string, terms: string[]): boolean {
  return terms.some((term) => matchesSearchTerm(text, term));
}

function matchesSearchTerm(text: string, term: string): boolean {
  const normalizedText = text.toLowerCase();
  const normalizedTerm = term.toLowerCase();
  if (!/^[\p{L}\p{N}]+(?:[ _-][\p{L}\p{N}]+)*$/u.test(normalizedTerm)) {
    return normalizedText.includes(normalizedTerm);
  }

  const pattern = normalizedTerm
    .split(/[ _-]+/u)
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('[\\s_-]+');
  return new RegExp(`(?:^|[^\\p{L}\\p{N}])${pattern}(?=$|[^\\p{L}\\p{N}])`, 'u').test(normalizedText);
}

const currentFile = path.resolve(fileURLToPath(import.meta.url));
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : '';

if (currentFile === invokedFile) {
  const batchName = process.argv[2];
  if (!batchName) {
    console.error('Usage: npx tsx pipeline/stages/03_discover_images.ts <batch_id>');
    process.exitCode = 1;
  } else {
    runStage03ImageDiscovery(batchName).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Stage 03 failed: ${message}`);
      process.exitCode = 1;
    });
  }
}
