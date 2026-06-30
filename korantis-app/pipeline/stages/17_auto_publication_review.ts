import { existsSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

type PublicationDecision = 'approve' | 'reject' | 'pause';

interface PublicationDecisionRecord {
  venue_name: string;
  current_status: string;
  publication_decision: PublicationDecision;
  publish_eligible: boolean;
  default_reason: string;
  reviewer_notes: string;
  staging_score: number;
  blockers: string[];
  warnings: string[];
  hero_image_url?: string;
  image_source_type?: string;
  image_publication_status: string;
  source_url?: string;
  tagline?: string;
  description?: string;
  mood_tags: string[];
  neighborhood?: string;
  venue_type?: string;
  rating?: number;
  review_count?: number;
  google_maps_url?: string;
  confirmed_editorial_mentions: unknown[];
}

interface PublicationDecisionManifest {
  batch_id: string;
  generated_at: string;
  status: string;
  safety?: Record<string, unknown>;
  decisions: PublicationDecisionRecord[];
}

interface VisionImageRecord {
  venue_name: string;
  resolved_image_url: string;
  source_url?: string;
  source_type?: string;
  width?: number;
  height?: number;
  ok_photo?: boolean;
  skip_reason?: string | null;
  vision?: {
    scene_type?: string;
    shows_space?: boolean;
    is_hero_usable?: boolean;
    is_product_only?: boolean;
    has_identifiable_faces?: boolean;
    quality?: string;
    atmosphere_signal?: string;
    visual_reason?: string;
  };
  risk_flags?: string[];
}

interface SelectedHeroImage {
  venue_name: string;
  selected_image?: VisionImageRecord;
}

interface Stage04SelectedImages {
  selected_images: SelectedHeroImage[];
}

interface GalleryImageSelection {
  image: VisionImageRecord;
  selection_score: number;
}

interface VenueGallerySelection {
  venue_name: string;
  selected_gallery_images: GalleryImageSelection[];
}

interface GallerySelectionResult {
  selections: VenueGallerySelection[];
}

interface AutoReviewOptions {
  minStagingScore: number;
  minGalleryImages: number;
}

interface AutoReviewResult {
  batch_id: string;
  generated_at: string;
  total_decisions: number;
  approved: number;
  rejected: number;
  blocked_by_gallery: number;
  reviewed_manifest_path: string;
  report_path: string;
  options: AutoReviewOptions;
}

const DEFAULT_OPTIONS: AutoReviewOptions = {
  minStagingScore: 80,
  minGalleryImages: 2,
};

const HERO_SCENES = new Set(['hero_interior', 'gallery_atmosphere', 'hero_exterior']);
const GALLERY_SCENES = new Set(['hero_interior', 'gallery_atmosphere', 'hero_exterior']);
const ACCEPTED_QUALITY = new Set(['high', 'acceptable']);

export function generateAutoPublicationReview(batchName: string, overrides: Partial<AutoReviewOptions> = {}): AutoReviewResult {
  const options = { ...DEFAULT_OPTIONS, ...overrides };
  const outputDir = path.join(process.cwd(), 'data', 'batches', batchName);
  const baseManifestPath = path.join(outputDir, 'publication_decision_manifest.json');
  const selectedHeroesPath = path.join(outputDir, 'stage_04_selected_images.json');
  const gallerySelectionPath = path.join(outputDir, 'stage_15_gallery_selection.json');
  if (!existsSync(baseManifestPath)) throw new Error(`Missing publication decision manifest: ${baseManifestPath}`);
  if (!existsSync(selectedHeroesPath)) throw new Error(`Missing Stage 04 selected images: ${selectedHeroesPath}`);
  if (!existsSync(gallerySelectionPath)) throw new Error(`Missing Stage 15 gallery selection: ${gallerySelectionPath}`);

  const manifest = readJson<PublicationDecisionManifest>(baseManifestPath);
  const selectedHeroes = readJson<Stage04SelectedImages>(selectedHeroesPath);
  const gallerySelection = readJson<GallerySelectionResult>(gallerySelectionPath);
  const heroByVenue = new Map(selectedHeroes.selected_images.map((item) => [normalizeName(item.venue_name), item.selected_image]));
  const galleryByVenue = new Map(gallerySelection.selections.map((item) => [normalizeName(item.venue_name), item.selected_gallery_images || []]));

  let blockedByGallery = 0;
  const reviewedDecisions = manifest.decisions.map((decision) => {
    const venueKey = normalizeName(decision.venue_name);
    const hero = heroByVenue.get(venueKey);
    const gallery = galleryByVenue.get(venueKey) || [];
    const rejectReasons = buildRejectReasons(decision, hero, gallery, options);
    if (rejectReasons.some((reason) => reason.startsWith('gallery_images_below_minimum'))) blockedByGallery += 1;

    if (rejectReasons.length > 0) {
      return {
        ...decision,
        publication_decision: 'reject' as PublicationDecision,
        reviewer_notes: `AI auto-rejected by Korantis publication criteria: ${rejectReasons.join('; ')}`,
      };
    }

    return {
      ...decision,
      publication_decision: 'approve' as PublicationDecision,
      reviewer_notes: [
        'AI auto-approved by Korantis publication criteria.',
        `Hero scene=${hero?.vision?.scene_type || 'unknown'}, quality=${hero?.vision?.quality || 'unknown'}.`,
        `Gallery images=${gallery.length}.`,
        `Staging score=${decision.staging_score}.`,
      ].join(' '),
    };
  });

  const reviewedManifest = {
    ...manifest,
    generated_at: new Date().toISOString(),
    status: 'ai_auto_reviewed',
    safety: {
      no_public_writes_in_this_stage: true,
      auto_review_only: true,
      publication_apply_requires_next_stage: true,
      min_gallery_images_required: options.minGalleryImages,
      min_staging_score_required: options.minStagingScore,
    },
    review_mode: 'korantis_ai_auto_review',
    decisions: reviewedDecisions,
  };

  const reviewedManifestPath = path.join(outputDir, 'publication_decision_manifest.reviewed.json');
  const reportPath = path.join(outputDir, 'auto_publication_review_report.md');
  writeFileSync(reviewedManifestPath, `${JSON.stringify(reviewedManifest, null, 2)}\n`, 'utf8');
  const result: AutoReviewResult = {
    batch_id: manifest.batch_id || batchName,
    generated_at: reviewedManifest.generated_at,
    total_decisions: reviewedDecisions.length,
    approved: reviewedDecisions.filter((decision) => decision.publication_decision === 'approve').length,
    rejected: reviewedDecisions.filter((decision) => decision.publication_decision === 'reject').length,
    blocked_by_gallery: blockedByGallery,
    reviewed_manifest_path: reviewedManifestPath,
    report_path: reportPath,
    options,
  };
  writeFileSync(reportPath, buildReport(result, reviewedDecisions), 'utf8');
  console.log(`Auto publication reviewed manifest written to ${reviewedManifestPath}`);
  console.log(`Auto publication review report written to ${reportPath}`);
  console.log(`Stage 17 summary: approved=${result.approved}, rejected=${result.rejected}, blocked_by_gallery=${result.blocked_by_gallery}`);
  return result;
}

function buildRejectReasons(
  decision: PublicationDecisionRecord,
  hero: VisionImageRecord | undefined,
  gallery: GalleryImageSelection[],
  options: AutoReviewOptions,
): string[] {
  const reasons: string[] = [];
  if (!decision.publish_eligible) reasons.push('not_publish_eligible');
  if ((decision.blockers || []).length > 0) reasons.push(`decision_blockers:${decision.blockers.join('|')}`);
  if (decision.current_status !== 'ready_for_db_staging') reasons.push(`not_ready_for_db_staging:${decision.current_status}`);
  if (decision.staging_score < options.minStagingScore) reasons.push(`staging_score_below_minimum:${decision.staging_score}/${options.minStagingScore}`);
  reasons.push(...heroRejectReasons(hero));

  const acceptedGallery = gallery.filter((item) => galleryImageIsPublicationQuality(item.image));
  if (acceptedGallery.length < options.minGalleryImages) {
    reasons.push(`gallery_images_below_minimum:${acceptedGallery.length}/${options.minGalleryImages}`);
  }

  return [...new Set(reasons)];
}

function heroRejectReasons(hero: VisionImageRecord | undefined): string[] {
  const reasons: string[] = [];
  if (!hero?.resolved_image_url) return ['missing_hero_image'];
  if (!hero.ok_photo) reasons.push(hero.skip_reason || 'hero_not_ok_photo');
  if (!hero.vision?.shows_space) reasons.push('hero_does_not_show_space');
  if (hero.vision?.is_product_only) reasons.push('hero_product_only');
  if (hero.vision?.has_identifiable_faces) reasons.push('hero_identifiable_faces');
  if (!HERO_SCENES.has(hero.vision?.scene_type || '')) reasons.push(`hero_scene_rejected:${hero.vision?.scene_type || 'unknown'}`);
  if (!ACCEPTED_QUALITY.has(hero.vision?.quality || '')) reasons.push(`hero_quality_rejected:${hero.vision?.quality || 'unknown'}`);
  if (Math.max(hero.width || 0, hero.height || 0) < 512) reasons.push('hero_below_min_resolution');
  return reasons;
}

function galleryImageIsPublicationQuality(image: VisionImageRecord): boolean {
  if (!image.resolved_image_url) return false;
  if (!image.ok_photo) return false;
  if (!image.vision?.shows_space) return false;
  if (image.vision?.is_product_only) return false;
  if (image.vision?.has_identifiable_faces) return false;
  if (!GALLERY_SCENES.has(image.vision?.scene_type || '')) return false;
  if (!ACCEPTED_QUALITY.has(image.vision?.quality || '')) return false;
  if (Math.max(image.width || 0, image.height || 0) < 512) return false;
  return true;
}

function buildReport(result: AutoReviewResult, decisions: PublicationDecisionRecord[]): string {
  const approved = decisions.filter((decision) => decision.publication_decision === 'approve');
  const rejected = decisions.filter((decision) => decision.publication_decision === 'reject');
  return [
    `# Stage 17 Auto Publication Review - ${result.batch_id}`,
    '',
    `- Generated: ${result.generated_at}`,
    `- Total decisions: ${result.total_decisions}`,
    `- Approved: ${result.approved}`,
    `- Rejected: ${result.rejected}`,
    `- Blocked by gallery depth: ${result.blocked_by_gallery}`,
    `- Minimum staging score: ${result.options.minStagingScore}`,
    `- Minimum gallery images: ${result.options.minGalleryImages}`,
    '',
    '## Approved',
    '',
    ...(approved.length > 0 ? approved.map((decision) => `- ${escapeMd(decision.venue_name)}: score ${decision.staging_score}`) : ['- none']),
    '',
    '## Rejected',
    '',
    ...(rejected.length > 0 ? rejected.map((decision) => `- ${escapeMd(decision.venue_name)}: ${escapeMd(decision.reviewer_notes)}`) : ['- none']),
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
  const [, , batchName] = process.argv;
  if (!batchName) {
    console.error('Usage: npx tsx pipeline/stages/17_auto_publication_review.ts <batch_id>');
    process.exit(1);
  }

  try {
    generateAutoPublicationReview(batchName);
  } catch (error) {
    console.error(`Stage 17 auto publication review failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
