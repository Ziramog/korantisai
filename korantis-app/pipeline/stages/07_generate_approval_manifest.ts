import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { BatchResult, ReviewQueueItem } from '../types';

interface ManifestVenue {
  venue_name: string;
  status: string;
  staging_score: number;
  approval_reason?: string;
  blocker_reasons?: string[];
  warning_reasons?: string[];
  hero_image_url?: string;
  image_publication_status?: string;
}

interface ApprovalManifest {
  batch_id: string;
  generated_at: string;
  approved_for_db_staging: ManifestVenue[];
  needs_review: ManifestVenue[];
  blocked: ManifestVenue[];
}

export function generateApprovalManifest(batchName: string): ApprovalManifest {
  const outputDir = path.join(process.cwd(), 'data', 'batches', batchName);
  const input = readJson<BatchResult>(path.join(outputDir, 'batch_result_quality_gated.json'));
  const generatedAt = new Date().toISOString();

  const manifest: ApprovalManifest = {
    batch_id: input.batch_id,
    generated_at: generatedAt,
    approved_for_db_staging: input.candidates
      .filter((candidate) => candidate.status === 'ready_for_db_staging')
      .map((candidate) => toManifestVenue(candidate, 'Quality gate passed; eligible for Supabase staging sync only.')),
    needs_review: input.candidates
      .filter((candidate) => candidate.status === 'needs_review')
      .map((candidate) => toManifestVenue(candidate)),
    blocked: input.candidates
      .filter((candidate) => candidate.status === 'blocked')
      .map((candidate) => toManifestVenue(candidate)),
  };

  writeFileSync(path.join(outputDir, 'approval_manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  writeFileSync(path.join(outputDir, 'approval_manifest.md'), buildManifestMarkdown(manifest), 'utf8');
  writeFileSync(path.join(outputDir, 'approval_manifest_report.md'), buildReportMarkdown(manifest), 'utf8');

  console.log(`Approval manifest JSON written to ${path.join(outputDir, 'approval_manifest.json')}`);
  console.log(`Approval manifest Markdown written to ${path.join(outputDir, 'approval_manifest.md')}`);
  console.log(`Approval manifest report written to ${path.join(outputDir, 'approval_manifest_report.md')}`);
  console.log(
    `Approval manifest summary: total=${totalCount(manifest)}, approved=${manifest.approved_for_db_staging.length}, needs_review=${manifest.needs_review.length}, blocked=${manifest.blocked.length}`,
  );

  return manifest;
}

function toManifestVenue(candidate: ReviewQueueItem, approvalReason?: string): ManifestVenue {
  const hero = candidate.venue.hero_image || candidate.venue.images.hero;
  return {
    venue_name: candidate.venue_name,
    status: candidate.status,
    staging_score: candidate.staging_score,
    approval_reason: approvalReason,
    blocker_reasons: candidate.errors,
    warning_reasons: candidate.warnings,
    hero_image_url: hero?.resolved_image_url,
    image_publication_status: hero?.publication_status || 'not_approved_for_publication',
  };
}

function buildManifestMarkdown(manifest: ApprovalManifest): string {
  return [
    '# Approval Manifest',
    '',
    `- Batch: ${manifest.batch_id}`,
    `- Generated: ${manifest.generated_at}`,
    '',
    '## Approved For DB Staging',
    '',
    ...listVenueNames(manifest.approved_for_db_staging),
    '',
    '## Needs Review',
    '',
    ...listVenueNames(manifest.needs_review),
    '',
    '## Blocked',
    '',
    ...manifest.blocked.map((venue) => `- ${venue.venue_name} (${venue.blocker_reasons?.join(', ') || 'no reason'})`),
  ].join('\n') + '\n';
}

function buildReportMarkdown(manifest: ApprovalManifest): string {
  return [
    '# Approval Manifest Report',
    '',
    `- Batch identifier: ${manifest.batch_id}`,
    `- Approval timestamp: ${manifest.generated_at}`,
    `- Total venues: ${totalCount(manifest)}`,
    `- Approved count: ${manifest.approved_for_db_staging.length}`,
    `- Needs review count: ${manifest.needs_review.length}`,
    `- Blocked count: ${manifest.blocked.length}`,
    '',
    '## Approval Reasons',
    '',
    ...manifest.approved_for_db_staging.map((venue) =>
      `- ${venue.venue_name}: ${venue.approval_reason || 'approved by deterministic quality gate'}`,
    ),
    '',
    '## Blocker Reasons',
    '',
    ...(manifest.blocked.length > 0
      ? manifest.blocked.map((venue) => `- ${venue.venue_name}: ${venue.blocker_reasons?.join(', ') || 'none'}`)
      : ['- none']),
    '',
    '## Safety',
    '',
    '- No Supabase writes were performed.',
    '- No publication path was run.',
    '- No Cloudinary upload was performed.',
    '- No external model calls were made.',
    '- This manifest is an approval layer for future staging sync only.',
  ].join('\n') + '\n';
}

function listVenueNames(venues: ManifestVenue[]): string[] {
  return venues.length > 0 ? venues.map((venue) => `- ${venue.venue_name}`) : ['- none'];
}

function totalCount(manifest: ApprovalManifest): number {
  return manifest.approved_for_db_staging.length + manifest.needs_review.length + manifest.blocked.length;
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, 'utf8')) as T;
}

const currentFile = path.resolve(fileURLToPath(import.meta.url));
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : '';

if (currentFile === invokedFile) {
  const batchName = process.argv[2];
  if (!batchName) {
    console.error('Usage: npx tsx pipeline/stages/07_generate_approval_manifest.ts <batch_id>');
    process.exitCode = 1;
  } else {
    try {
      generateApprovalManifest(batchName);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Approval manifest generation failed: ${message}`);
      process.exitCode = 1;
    }
  }
}
