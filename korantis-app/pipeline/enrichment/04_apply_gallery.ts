import { createHash } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { fileURLToPath } from 'url';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { UploadApiResponse } from 'cloudinary';
import { cloudinary, configureCloudinary, validateCloudinaryEnv } from '../../src/lib/cloudinary';
import { loadLocalEnv } from '../stages/01_extract_data';
import { escapeMd, safeNumber, safeString } from './utils/enrichment_types';

type ReviewerDecision = 'pause' | 'approve_gallery' | 'reject_gallery';

interface ReviewedGalleryImage {
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
  rights_notes?: string;
  selection_score?: number;
  selection_reason?: string[];
  gallery_rank?: number;
  raw_vision?: Record<string, unknown>;
}

interface ReviewedGalleryEntry {
  venue_id: string;
  venue_name: string;
  reviewer_decision?: ReviewerDecision;
  reviewer_notes?: string;
  images: ReviewedGalleryImage[];
}

interface ReviewedGalleryManifest {
  run_id: string;
  reviewed_at?: string;
  entries: ReviewedGalleryEntry[];
}

interface GalleryAsset {
  venue_id: string;
  venue_name: string;
  candidate_id: string;
  gallery_rank: number;
  source_url: string;
  source_type: string;
  source_image_url: string;
  width?: number;
  height?: number;
  public_id: string;
  secure_url?: string;
  url?: string;
  bytes?: number;
  format?: string;
  source_sha256?: string;
  status: 'dry_run' | 'uploaded' | 'skipped_existing' | 'error';
  error?: string;
  intended_row: Record<string, unknown>;
}

interface ApplyResult {
  run_id: string;
  generated_at: string;
  mode: 'dry_run' | 'apply';
  reviewed_entries: number;
  approved_venues: number;
  approved_images: number;
  cloudinary_uploaded: number;
  cloudinary_existing: number;
  cloudinary_errors: number;
  venue_images_written: number;
  blockers: string[];
  assets: GalleryAsset[];
  safety: {
    no_venues_writes: true;
    no_hero_changes: true;
    no_public_activation: true;
    writes_only_venue_images_gallery: true;
    apply_requires_flag: true;
  };
}

interface Options {
  runId: string;
  apply: boolean;
  reviewedFile?: string;
}

export async function applyGallery(options: Options): Promise<ApplyResult> {
  loadLocalEnv();

  const outputDir = path.join(process.cwd(), 'data', 'enrichment', options.runId);
  const reviewedPath = resolveReviewedManifestPath(outputDir, options.runId, options.reviewedFile);
  if (!reviewedPath) {
    throw new Error(`Missing reviewed gallery manifest. Save/export it as ${path.join(outputDir, 'gallery_review_manifest.reviewed.json')}`);
  }

  const manifest = readJson<ReviewedGalleryManifest>(reviewedPath);
  const approvedEntries = manifest.entries.filter((entry) => entry.reviewer_decision === 'approve_gallery');
  const images = approvedEntries.flatMap((entry) => (entry.images || []).map((image) => ({ entry, image })));
  const blockers: string[] = [];
  const cloudinaryValidation = validateCloudinaryEnv();
  const supabase = createSupabaseClient();
  if (options.apply && !cloudinaryValidation.ok) blockers.push(`Missing Cloudinary env vars: ${cloudinaryValidation.missing.join(', ')}`);
  if (options.apply && !supabase) blockers.push('Missing Supabase write env.');
  if (options.apply && images.length === 0) blockers.push('No approved gallery images in reviewed manifest.');
  if (options.apply && blockers.length === 0) configureCloudinary();

  const assets: GalleryAsset[] = [];
  for (const { entry, image } of images) {
    const galleryRank = safeNumber(image.gallery_rank) || assets.filter((asset) => asset.venue_id === entry.venue_id).length + 1;
    const publicId = `korantis/public/gallery/${slugify(options.runId)}/${slugify(entry.venue_name)}/gallery-${String(galleryRank).padStart(2, '0')}`;
    const base: GalleryAsset = {
      venue_id: entry.venue_id,
      venue_name: entry.venue_name,
      candidate_id: image.candidate_id,
      gallery_rank: galleryRank,
      source_url: image.source_url || image.resolved_image_url,
      source_type: image.source_type,
      source_image_url: image.resolved_image_url,
      width: image.width,
      height: image.height,
      public_id: publicId,
      status: options.apply ? 'error' : 'dry_run',
      intended_row: {},
    };

    if (!options.apply || blockers.length > 0) {
      assets.push({
        ...base,
        intended_row: buildVenueImageRow(base, image, undefined),
      });
      continue;
    }

    try {
      const existing = await findExistingCloudinaryAsset(publicId);
      const uploaded = existing || await uploadSourceImage(image.resolved_image_url, publicId, {
        runId: options.runId,
        venueName: entry.venue_name,
        candidateId: image.candidate_id,
      });
      const status = existing ? 'skipped_existing' : 'uploaded';
      const asset: GalleryAsset = {
        ...base,
        status,
        secure_url: uploaded.secure_url,
        url: uploaded.url,
        width: uploaded.width || base.width,
        height: uploaded.height || base.height,
        bytes: uploaded.bytes,
        format: uploaded.format,
        intended_row: {},
      };
      asset.intended_row = buildVenueImageRow(asset, image, uploaded);
      assets.push(asset);
    } catch (error) {
      assets.push({
        ...base,
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
        intended_row: buildVenueImageRow(base, image, undefined),
      });
    }
  }

  const uploadErrors = assets.filter((asset) => asset.status === 'error').length;
  if (options.apply && uploadErrors > 0) blockers.push(`Cloudinary upload errors: ${uploadErrors}`);

  let venueImagesWritten = 0;
  if (options.apply && blockers.length === 0 && supabase) {
    venueImagesWritten = await upsertGalleryRows(supabase, assets.map((asset) => asset.intended_row));
  }

  const result: ApplyResult = {
    run_id: options.runId,
    generated_at: new Date().toISOString(),
    mode: options.apply ? 'apply' : 'dry_run',
    reviewed_entries: manifest.entries.length,
    approved_venues: approvedEntries.length,
    approved_images: images.length,
    cloudinary_uploaded: assets.filter((asset) => asset.status === 'uploaded').length,
    cloudinary_existing: assets.filter((asset) => asset.status === 'skipped_existing').length,
    cloudinary_errors: uploadErrors,
    venue_images_written: venueImagesWritten,
    blockers,
    assets,
    safety: {
      no_venues_writes: true,
      no_hero_changes: true,
      no_public_activation: true,
      writes_only_venue_images_gallery: true,
      apply_requires_flag: true,
    },
  };

  mkdirSync(outputDir, { recursive: true });
  writeFileSync(path.join(outputDir, 'gallery_apply_result.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  writeFileSync(path.join(outputDir, 'gallery_apply_report.md'), buildReport(result), 'utf8');
  console.log(`Gallery apply result written to ${path.join(outputDir, 'gallery_apply_result.json')}`);
  console.log(`Gallery apply report written to ${path.join(outputDir, 'gallery_apply_report.md')}`);
  console.log(`E04 gallery apply summary: mode=${result.mode}, approved_venues=${result.approved_venues}, approved_images=${result.approved_images}, uploaded=${result.cloudinary_uploaded}, existing=${result.cloudinary_existing}, venue_images_written=${result.venue_images_written}, blockers=${result.blockers.length}`);
  return result;
}

function buildVenueImageRow(asset: GalleryAsset, image: ReviewedGalleryImage, upload?: UploadApiResponse): Record<string, unknown> {
  return {
    venue_id: asset.venue_id,
    photo_reference: `gallery:${asset.candidate_id || asset.public_id}`,
    width: upload?.width || asset.width || null,
    height: upload?.height || asset.height || null,
    is_cover: false,
    status: upload ? 'processed' : 'reference_only',
    url: upload?.url || asset.url || asset.source_image_url,
    secure_url: upload?.secure_url || asset.secure_url || null,
    public_id: asset.public_id,
    role: 'gallery',
    sort_order: asset.gallery_rank,
    source: asset.source_type,
    google_photo_reference: asset.source_type === 'google_places' ? asset.source_image_url : null,
    bytes: upload?.bytes || asset.bytes || null,
    format: upload?.format || asset.format || null,
    quality_score: safeNumber(image.selection_score) || null,
    selection_data: {
      enrichment_run_id: asset.public_id.split('/')[3],
      candidate_id: image.candidate_id,
      source_url: asset.source_url,
      original_image_url: asset.source_image_url,
      source_origin: image.source_origin,
      source_type: image.source_type,
      gallery_rank: asset.gallery_rank,
      source_role: image.role,
      selection_score: image.selection_score,
      selection_reason: image.selection_reason,
      vision: image.raw_vision,
      rights_notes: image.rights_notes,
    },
    rights_status: image.rights_status || 'not_approved_for_publication',
    is_selected_hero: false,
    updated_at: new Date().toISOString(),
  };
}

async function upsertGalleryRows(supabase: SupabaseClient, rows: Record<string, unknown>[]): Promise<number> {
  let affected = 0;
  for (const row of rows) {
    const venueId = String(row.venue_id || '');
    const sortOrder = Number(row.sort_order || 0);
    if (!venueId || !sortOrder) throw new Error('Gallery row missing venue_id or sort_order.');
    const existing = await supabase
      .from('venue_images')
      .select('id')
      .eq('venue_id', venueId)
      .eq('role', 'gallery')
      .eq('sort_order', sortOrder)
      .limit(1);
    if (existing.error) throw new Error(`venue_images lookup failed: ${existing.error.message}`);
    const existingId = existing.data?.[0]?.id as string | undefined;
    if (existingId) {
      const { error } = await supabase.from('venue_images').update(row).eq('id', existingId);
      if (error) throw new Error(`venue_images update failed: ${error.message}`);
    } else {
      const { error } = await supabase.from('venue_images').insert(row);
      if (error) throw new Error(`venue_images insert failed: ${error.message}`);
    }
    affected += 1;
  }
  return affected;
}

async function findExistingCloudinaryAsset(publicId: string): Promise<UploadApiResponse | null> {
  try {
    return await cloudinary.api.resource(publicId, { resource_type: 'image' }) as UploadApiResponse;
  } catch {
    return null;
  }
}

async function uploadSourceImage(url: string, publicId: string, context: Record<string, string>): Promise<UploadApiResponse> {
  const downloaded = await downloadImage(url);
  return await new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        overwrite: false,
        resource_type: 'image',
        folder: undefined,
        context,
      },
      (error, result) => {
        if (error) reject(error);
        else if (!result) reject(new Error('Cloudinary upload returned no result.'));
        else resolve(result);
      },
    );
    Readable.from(downloaded.bytes).pipe(stream);
  });
}

async function downloadImage(url: string): Promise<{ bytes: Buffer; contentType: string; sha256: string }> {
  const response = await fetch(url, {
    headers: {
      Accept: 'image/jpeg,image/png,image/webp;q=0.9,*/*;q=0.1',
      'User-Agent': 'KorantisGalleryApply/1.0',
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`Image download failed ${response.status}: ${response.statusText}`);
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.toLowerCase().startsWith('image/')) throw new Error(`Downloaded content is not image: ${contentType || 'unknown'}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  return {
    bytes,
    contentType,
    sha256: createHash('sha256').update(bytes).digest('hex'),
  };
}

function buildReport(result: ApplyResult): string {
  return [
    `# Gallery Apply Report - ${result.run_id}`,
    '',
    `- Generated: ${result.generated_at}`,
    `- Mode: ${result.mode}`,
    `- Reviewed entries: ${result.reviewed_entries}`,
    `- Approved venues: ${result.approved_venues}`,
    `- Approved images: ${result.approved_images}`,
    `- Cloudinary uploaded: ${result.cloudinary_uploaded}`,
    `- Cloudinary existing: ${result.cloudinary_existing}`,
    `- Cloudinary errors: ${result.cloudinary_errors}`,
    `- venue_images written: ${result.venue_images_written}`,
    '',
    '## Blockers',
    '',
    ...(result.blockers.length > 0 ? result.blockers.map((blocker) => `- ${escapeMd(blocker)}`) : ['- none']),
    '',
    '## Assets',
    '',
    '| Venue | Rank | Status | Public ID | Secure URL | Error |',
    '| --- | ---: | --- | --- | --- | --- |',
    ...result.assets.map((asset) => `| ${escapeMd(asset.venue_name)} | ${asset.gallery_rank} | ${asset.status} | ${escapeMd(asset.public_id)} | ${escapeMd(asset.secure_url || '')} | ${escapeMd(asset.error || '')} |`),
    '',
    '## Safety',
    '',
    ...Object.entries(result.safety).map(([key, value]) => `- ${key}: ${value}`),
  ].join('\n') + '\n';
}

function resolveReviewedManifestPath(outputDir: string, runId: string, explicitPath?: string): string {
  const candidates = [
    explicitPath || '',
    path.join(outputDir, 'gallery_review_manifest.reviewed.json'),
    path.join(outputDir, `${runId}_gallery_reviewed.json`),
  ].filter(Boolean);
  return candidates.find((candidate) => existsSync(candidate)) || '';
}

function createSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, 'utf8')) as T;
}

function slugify(value: string): string {
  return safeString(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'gallery';
}

function parseArgs(argv: string[]): Options {
  const valueAfter = (flag: string): string => {
    const index = argv.indexOf(flag);
    return index >= 0 ? safeString(argv[index + 1]) : '';
  };
  const runId = valueAfter('--run-id') || safeString(argv[0]);
  if (!runId) throw new Error('Usage: npx tsx pipeline/enrichment/04_apply_gallery.ts --run-id <run_id> [--dry-run|--apply]');
  if (argv.includes('--apply') && argv.includes('--dry-run')) throw new Error('Choose --apply or --dry-run, not both.');
  return {
    runId,
    apply: argv.includes('--apply'),
    reviewedFile: valueAfter('--reviewed-file') || undefined,
  };
}

const isCli = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isCli) {
  applyGallery(parseArgs(process.argv.slice(2))).catch((error: unknown) => {
    console.error(`E04 gallery apply failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
