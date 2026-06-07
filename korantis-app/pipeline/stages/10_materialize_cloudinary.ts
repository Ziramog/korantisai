import { createHash } from 'crypto';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { fileURLToPath } from 'url';
import type { UploadApiResponse } from 'cloudinary';
import { cloudinary, configureCloudinary, validateCloudinaryEnv } from '../../src/lib/cloudinary';
import { loadLocalEnv } from './01_extract_data';

type PublicationDecision = 'approve' | 'reject' | 'pause';

interface PublicationDecisionRecord {
  venue_name: string;
  publication_decision: PublicationDecision;
  publish_eligible: boolean;
  blockers: string[];
}

interface PublicationDecisionManifest {
  batch_id: string;
  decisions: PublicationDecisionRecord[];
}

interface PublicProjectionDryRun {
  batch_id: string;
  approved_venue_mappings: Array<{
    venue_name: string;
    target_public_venue_id: string;
    hero_image_url: string;
    image_payload_preview: {
      width?: number;
      height?: number;
      source?: string;
      rights_status?: string;
      selection_data?: Record<string, unknown>;
    };
  }>;
}

interface CloudinaryAsset {
  venue_name: string;
  target_public_venue_id: string;
  role: 'hero';
  source_url: string;
  source_sha256?: string;
  source_content_type?: string;
  width?: number;
  height?: number;
  cloudinary_public_id: string;
  secure_url?: string;
  url?: string;
  bytes?: number;
  format?: string;
  status: 'dry_run' | 'uploaded' | 'skipped_existing' | 'error';
  error?: string;
}

interface CloudinaryMaterializationResult {
  batch_id: string;
  generated_at: string;
  mode: 'dry_run' | 'apply';
  approved_decisions: number;
  projected_venues: number;
  images_considered: number;
  uploaded: number;
  dry_run: number;
  skipped_existing: number;
  errors: number;
  cloudinary_env_present: boolean;
  safety_checks: Record<string, boolean>;
  assets: CloudinaryAsset[];
  blockers: string[];
}

export async function materializeCloudinary(batchName: string, args: string[]): Promise<CloudinaryMaterializationResult> {
  if (args.includes('--apply') && args.includes('--dry-run')) {
    throw new Error('Stage 10 received both --apply and --dry-run. Choose exactly one mode.');
  }

  loadLocalEnv();

  const apply = args.includes('--apply');
  const outputDir = path.join(process.cwd(), 'data', 'batches', batchName);
  const manifest = readJson<PublicationDecisionManifest>(path.join(outputDir, 'publication_decision_manifest.reviewed.json'));
  const projection = readJson<PublicProjectionDryRun>(path.join(outputDir, 'public_projection_dry_run.json'));
  const approvedDecisions = manifest.decisions.filter((decision) =>
    decision.publication_decision === 'approve' &&
    decision.publish_eligible &&
    decision.blockers.length === 0,
  );
  const cloudinaryValidation = validateCloudinaryEnv();
  const blockers: string[] = [];
  if (apply && !cloudinaryValidation.ok) blockers.push(`Missing Cloudinary env vars: ${cloudinaryValidation.missing.join(', ')}`);
  if (projection.approved_venue_mappings.length !== approvedDecisions.length) {
    blockers.push(`Projection count ${projection.approved_venue_mappings.length} does not match approved decision count ${approvedDecisions.length}. Rerun Stage 11 dry-run before Cloudinary apply.`);
  }
  if (apply && blockers.length === 0) configureCloudinary();

  const assets: CloudinaryAsset[] = [];
  for (const mapping of projection.approved_venue_mappings) {
    const publicId = `korantis/public/${slugify(projection.batch_id)}/${slugify(mapping.venue_name)}/hero`;
    const base: CloudinaryAsset = {
      venue_name: mapping.venue_name,
      target_public_venue_id: mapping.target_public_venue_id,
      role: 'hero',
      source_url: mapping.hero_image_url,
      width: mapping.image_payload_preview.width,
      height: mapping.image_payload_preview.height,
      cloudinary_public_id: publicId,
      status: apply ? 'error' : 'dry_run',
    };

    if (!apply || blockers.length > 0) {
      assets.push(base);
      continue;
    }

    try {
      const existing = await findExistingCloudinaryAsset(publicId);
      if (existing) {
        assets.push({
          ...base,
          status: 'skipped_existing',
          secure_url: existing.secure_url,
          url: existing.url,
          width: existing.width || base.width,
          height: existing.height || base.height,
          bytes: existing.bytes,
          format: existing.format,
        });
        continue;
      }

      const downloaded = await downloadImage(mapping.hero_image_url);
      const uploaded = await uploadToCloudinary(downloaded.bytes, publicId, {
        batchId: projection.batch_id,
        venueName: mapping.venue_name,
        sourceUrl: mapping.hero_image_url,
      });
      assets.push({
        ...base,
        status: 'uploaded',
        source_sha256: downloaded.sha256,
        source_content_type: downloaded.contentType,
        secure_url: uploaded.secure_url,
        url: uploaded.url,
        width: uploaded.width,
        height: uploaded.height,
        bytes: uploaded.bytes,
        format: uploaded.format,
      });
    } catch (error) {
      assets.push({
        ...base,
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const result: CloudinaryMaterializationResult = {
    batch_id: projection.batch_id,
    generated_at: new Date().toISOString(),
    mode: apply ? 'apply' : 'dry_run',
    approved_decisions: approvedDecisions.length,
    projected_venues: projection.approved_venue_mappings.length,
    images_considered: assets.length,
    uploaded: assets.filter((asset) => asset.status === 'uploaded').length,
    dry_run: assets.filter((asset) => asset.status === 'dry_run').length,
    skipped_existing: assets.filter((asset) => asset.status === 'skipped_existing').length,
    errors: assets.filter((asset) => asset.status === 'error').length,
    cloudinary_env_present: cloudinaryValidation.ok,
    safety_checks: {
      no_supabase_writes: true,
      no_public_venues_writes: true,
      no_public_activation: true,
      no_external_model_calls: true,
      no_consumer_ui_changes: true,
      cloudinary_upload_requires_apply: true,
    },
    assets,
    blockers,
  };

  writeFileSync(path.join(outputDir, 'cloudinary_materialization_result.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  writeFileSync(path.join(outputDir, 'cloudinary_materialization_report.md'), buildReport(result), 'utf8');
  writeFileSync(path.join(outputDir, 'cloudinary_public_assets.json'), `${JSON.stringify({
    batch_id: result.batch_id,
    generated_at: result.generated_at,
    assets: result.assets.filter((asset) => asset.status === 'uploaded' || asset.status === 'skipped_existing'),
  }, null, 2)}\n`, 'utf8');

  console.log(`Cloudinary materialization result written to ${path.join(outputDir, 'cloudinary_materialization_result.json')}`);
  console.log(`Cloudinary materialization report written to ${path.join(outputDir, 'cloudinary_materialization_report.md')}`);
  console.log(`Cloudinary public assets written to ${path.join(outputDir, 'cloudinary_public_assets.json')}`);
  console.log(`Stage 10 summary: mode=${result.mode}, considered=${result.images_considered}, uploaded=${result.uploaded}, skipped_existing=${result.skipped_existing}, errors=${result.errors}`);

  return result;
}

async function findExistingCloudinaryAsset(publicId: string): Promise<UploadApiResponse | null> {
  try {
    return await cloudinary.api.resource(publicId, { resource_type: 'image' }) as UploadApiResponse;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.toLowerCase().includes('not found')) return null;
    return null;
  }
}

async function downloadImage(url: string): Promise<{ bytes: Buffer; contentType: string; sha256: string }> {
  const response = await fetch(url, {
    headers: {
      Accept: 'image/jpeg,image/png,image/webp;q=0.9,*/*;q=0.1',
      'User-Agent': 'KorantisCloudinaryMaterialization/1.0',
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

async function uploadToCloudinary(
  bytes: Buffer,
  publicId: string,
  context: { batchId: string; venueName: string; sourceUrl: string },
): Promise<UploadApiResponse> {
  return await new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        overwrite: false,
        resource_type: 'image',
        fetch_format: 'auto',
        quality: 'auto',
        width: 1800,
        crop: 'limit',
        tags: ['korantis', 'pipeline', context.batchId],
        context: {
          batch_id: context.batchId,
          venue_name: context.venueName,
          source_url: context.sourceUrl,
        },
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        if (!result) {
          reject(new Error('Cloudinary upload returned no result.'));
          return;
        }
        resolve(result);
      },
    );
    Readable.from(bytes).pipe(stream);
  });
}

function buildReport(result: CloudinaryMaterializationResult): string {
  return [
    `# Stage 10 Cloudinary Materialization - ${result.batch_id}`,
    '',
    `- Generated: ${result.generated_at}`,
    `- Mode: ${result.mode}`,
    `- Approved decisions: ${result.approved_decisions}`,
    `- Projected venues: ${result.projected_venues}`,
    `- Images considered: ${result.images_considered}`,
    `- Uploaded: ${result.uploaded}`,
    `- Skipped existing: ${result.skipped_existing}`,
    `- Dry-run: ${result.dry_run}`,
    `- Errors: ${result.errors}`,
    `- Cloudinary env present: ${result.cloudinary_env_present}`,
    '',
    '## Blockers',
    '',
    ...(result.blockers.length > 0 ? result.blockers.map((blocker) => `- ${blocker}`) : ['- None']),
    '',
    '## Assets',
    '',
    '| Venue | Status | Public ID | Secure URL | Error |',
    '| --- | --- | --- | --- | --- |',
    ...result.assets.map((asset) => `| ${escapeMd(asset.venue_name)} | ${asset.status} | ${escapeMd(asset.cloudinary_public_id)} | ${escapeMd(asset.secure_url || '')} | ${escapeMd(asset.error || '')} |`),
  ].join('\n');
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, 'utf8')) as T;
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90) || 'unknown';
}

function escapeMd(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

const isDirectRun = process.argv[1] ? fileURLToPath(import.meta.url) === path.resolve(process.argv[1]) : false;

if (isDirectRun) {
  const [, , batchName, ...args] = process.argv;
  if (!batchName) {
    console.error('Usage: npx tsx pipeline/stages/10_materialize_cloudinary.ts <batch_id> [--dry-run|--apply]');
    process.exit(1);
  }

  materializeCloudinary(batchName, args).catch((error: unknown) => {
    console.error(`Stage 10 Cloudinary materialization failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  });
}
