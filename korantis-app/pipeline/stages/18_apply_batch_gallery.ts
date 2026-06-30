import { createHash } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { applyGallery } from '../enrichment/04_apply_gallery';

interface ReviewedDecisionManifest {
  decisions: Array<{
    venue_name: string;
    publication_decision?: string;
    publish_eligible?: boolean;
    blockers?: string[];
  }>;
}

interface VisionImageRecord {
  venue_name: string;
  resolved_image_url: string;
  source_url?: string;
  source_type?: string;
  width?: number;
  height?: number;
  publication_status?: string;
  vision?: Record<string, unknown>;
}

interface GalleryImageSelection {
  role: string;
  image: VisionImageRecord;
  selection_score: number;
  selection_reason: string[];
}

interface VenueGallerySelection {
  venue_name: string;
  selected_gallery_images: GalleryImageSelection[];
}

interface GallerySelectionResult {
  selections: VenueGallerySelection[];
}

interface PublicProjectionDryRun {
  approved_venue_mappings: Array<{
    venue_name: string;
    target_public_venue_id: string;
  }>;
}

interface BatchGalleryApplyResult {
  batch_id: string;
  generated_at: string;
  mode: 'dry_run' | 'apply';
  approved_venues: number;
  approved_venues_with_gallery: number;
  approved_images: number;
  gallery_manifest_path: string;
  enrichment_gallery_result_path: string;
  blockers: string[];
}

interface ReviewedGalleryManifest {
  run_id: string;
  reviewed_at: string;
  entries: Array<{
    venue_id: string;
    venue_name: string;
    reviewer_decision: 'approve_gallery';
    reviewer_notes: string;
    images: Array<{
      candidate_id: string;
      venue_id: string;
      venue_name: string;
      source_url?: string;
      resolved_image_url: string;
      source_type: string;
      source_origin: string;
      width?: number;
      height?: number;
      role: string;
      rights_status: string;
      rights_notes: string;
      selection_score: number;
      selection_reason: string[];
      gallery_rank: number;
      raw_vision?: Record<string, unknown>;
    }>;
  }>;
}

const MIN_GALLERY_IMAGES = 2;
const MAX_GALLERY_IMAGES = 3;

export async function applyBatchGalleryImages(batchName: string, args: string[] = []): Promise<BatchGalleryApplyResult> {
  if (args.includes('--apply') && args.includes('--dry-run')) throw new Error('Stage 18 received both --apply and --dry-run.');
  const apply = args.includes('--apply');
  const outputDir = path.join(process.cwd(), 'data', 'batches', batchName);
  const reviewedManifestPath = path.join(outputDir, 'publication_decision_manifest.reviewed.json');
  const gallerySelectionPath = path.join(outputDir, 'stage_15_gallery_selection.json');
  const projectionPath = path.join(outputDir, 'public_projection_dry_run.json');
  if (!existsSync(reviewedManifestPath)) throw new Error(`Missing reviewed publication manifest: ${reviewedManifestPath}`);
  if (!existsSync(gallerySelectionPath)) throw new Error(`Missing Stage 15 gallery selection: ${gallerySelectionPath}`);
  if (!existsSync(projectionPath)) throw new Error(`Missing public projection dry-run mapping: ${projectionPath}`);

  const reviewedManifest = readJson<ReviewedDecisionManifest>(reviewedManifestPath);
  const gallerySelection = readJson<GallerySelectionResult>(gallerySelectionPath);
  const projection = readJson<PublicProjectionDryRun>(projectionPath);
  const approvedNames = new Set(reviewedManifest.decisions
    .filter((decision) => decision.publication_decision === 'approve' && decision.publish_eligible && (decision.blockers || []).length === 0)
    .map((decision) => normalizeName(decision.venue_name)));
  const mappingByVenue = new Map(projection.approved_venue_mappings.map((mapping) => [normalizeName(mapping.venue_name), mapping.target_public_venue_id]));
  const galleryByVenue = new Map(gallerySelection.selections.map((selection) => [normalizeName(selection.venue_name), selection]));
  const blockers: string[] = [];

  const entries: ReviewedGalleryManifest['entries'] = [];
  for (const venueKey of [...approvedNames].sort()) {
    const venueId = mappingByVenue.get(venueKey);
    const selection = galleryByVenue.get(venueKey);
    if (!venueId) {
      blockers.push(`missing_public_projection_mapping:${venueKey}`);
      continue;
    }
    const images = (selection?.selected_gallery_images || []).slice(0, MAX_GALLERY_IMAGES);
    if (images.length < MIN_GALLERY_IMAGES) {
      blockers.push(`minimum_gallery_not_met:${selection?.venue_name || venueKey}:${images.length}/${MIN_GALLERY_IMAGES}`);
      continue;
    }
    entries.push({
      venue_id: venueId,
      venue_name: selection?.venue_name || venueKey,
      reviewer_decision: 'approve_gallery',
      reviewer_notes: `AI auto-approved gallery for Korantis publication. Selected ${images.length} vision-approved atmosphere images.`,
      images: images.map((item, index) => ({
        candidate_id: buildCandidateId(venueId, item.image.resolved_image_url, index + 1),
        venue_id: venueId,
        venue_name: selection?.venue_name || item.image.venue_name || venueKey,
        source_url: item.image.source_url || item.image.resolved_image_url,
        resolved_image_url: item.image.resolved_image_url,
        source_type: item.image.source_type || 'unknown',
        source_origin: 'batch_stage_15_auto_gallery',
        width: item.image.width,
        height: item.image.height,
        role: item.role,
        rights_status: item.image.publication_status || 'source_review_required',
        rights_notes: 'Auto-selected from AI vision review; source attribution and rights status preserved.',
        selection_score: item.selection_score,
        selection_reason: item.selection_reason || [],
        gallery_rank: index + 1,
        raw_vision: item.image.vision,
      })),
    });
  }

  const reviewedGalleryManifest: ReviewedGalleryManifest = {
    run_id: batchName,
    reviewed_at: new Date().toISOString(),
    entries,
  };
  const galleryManifestPath = path.join(outputDir, 'gallery_review_manifest.auto.json');
  writeFileSync(galleryManifestPath, `${JSON.stringify(reviewedGalleryManifest, null, 2)}\n`, 'utf8');

  if (entries.length === 0) blockers.push('no_approved_gallery_entries');
  if (apply && blockers.length > 0) {
    throw new Error(`Stage 18 apply aborted:\n- ${blockers.join('\n- ')}`);
  }

  const enrichmentResult = await applyGallery({
    runId: batchName,
    apply,
    reviewedFile: galleryManifestPath,
  });

  const result: BatchGalleryApplyResult = {
    batch_id: batchName,
    generated_at: new Date().toISOString(),
    mode: apply ? 'apply' : 'dry_run',
    approved_venues: approvedNames.size,
    approved_venues_with_gallery: entries.length,
    approved_images: entries.reduce((sum, entry) => sum + entry.images.length, 0),
    gallery_manifest_path: galleryManifestPath,
    enrichment_gallery_result_path: path.join(process.cwd(), 'data', 'enrichment', batchName, 'gallery_apply_result.json'),
    blockers: [...blockers, ...enrichmentResult.blockers],
  };

  mkdirSync(outputDir, { recursive: true });
  writeFileSync(path.join(outputDir, 'auto_gallery_apply_result.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  writeFileSync(path.join(outputDir, 'auto_gallery_apply_report.md'), buildReport(result), 'utf8');
  console.log(`Stage 18 auto gallery result written to ${path.join(outputDir, 'auto_gallery_apply_result.json')}`);
  console.log(`Stage 18 summary: mode=${result.mode}, venues=${result.approved_venues_with_gallery}/${result.approved_venues}, images=${result.approved_images}, blockers=${result.blockers.length}`);
  return result;
}

function buildCandidateId(venueId: string, imageUrl: string, rank: number): string {
  const hash = createHash('sha256').update(`${venueId}:${rank}:${imageUrl}`).digest('hex').slice(0, 18);
  return `${venueId}:gallery:${rank}:${hash}`;
}

function buildReport(result: BatchGalleryApplyResult): string {
  return [
    `# Stage 18 Auto Gallery Apply - ${result.batch_id}`,
    '',
    `- Generated: ${result.generated_at}`,
    `- Mode: ${result.mode}`,
    `- Approved venues: ${result.approved_venues}`,
    `- Approved venues with gallery: ${result.approved_venues_with_gallery}`,
    `- Approved images: ${result.approved_images}`,
    `- Gallery manifest: ${result.gallery_manifest_path}`,
    `- Enrichment gallery result: ${result.enrichment_gallery_result_path}`,
    '',
    '## Blockers',
    '',
    ...(result.blockers.length > 0 ? result.blockers.map((blocker) => `- ${escapeMd(blocker)}`) : ['- none']),
  ].join('\n') + '\n';
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, 'utf8')) as T;
}

function normalizeName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function escapeMd(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

const isDirectRun = process.argv[1] ? fileURLToPath(import.meta.url) === path.resolve(process.argv[1]) : false;

if (isDirectRun) {
  const [, , batchName, ...args] = process.argv;
  if (!batchName) {
    console.error('Usage: npx tsx pipeline/stages/18_apply_batch_gallery.ts <batch_id> [--dry-run|--apply]');
    process.exit(1);
  }

  applyBatchGalleryImages(batchName, args).catch((error: unknown) => {
    console.error(`Stage 18 auto gallery apply failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  });
}
