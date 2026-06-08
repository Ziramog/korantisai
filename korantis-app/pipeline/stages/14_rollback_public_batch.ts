import { existsSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { loadLocalEnv } from './01_extract_data';

interface PublicProjectionApplyResult {
  batch_id: string;
  venue_ids_written: string[];
}

interface VenueRow {
  id: string;
  name?: string | null;
  curation_status?: string | null;
  publication_metadata?: unknown;
}

interface RollbackVenueCheck {
  venue_id: string;
  name?: string;
  current_status?: string;
  metadata_batch_match: boolean;
  eligible_for_rollback: boolean;
  blockers: string[];
  warnings: string[];
}

interface RollbackResult {
  batch_id: string;
  generated_at: string;
  mode: 'dry_run' | 'apply';
  requested: number;
  eligible: number;
  blocked: number;
  rolled_back: number;
  target_status: 'pending_review';
  checks: RollbackVenueCheck[];
  safety_checks: Record<string, boolean>;
}

export async function rollbackPublicBatch(batchName: string, args: string[]): Promise<RollbackResult> {
  if (args.includes('--apply') && args.includes('--dry-run')) {
    throw new Error('Stage 14 received both --apply and --dry-run. Choose exactly one mode.');
  }

  loadLocalEnv();

  const apply = args.includes('--apply');
  const outputDir = path.join(process.cwd(), 'data', 'batches', batchName);
  const projectionPath = path.join(outputDir, 'public_projection_apply_result.json');
  if (!existsSync(projectionPath)) throw new Error(`Missing public projection apply result: ${projectionPath}`);

  const projection = readJson<PublicProjectionApplyResult>(projectionPath);
  const venueIds = unique(projection.venue_ids_written || []).filter(Boolean);
  if (venueIds.length === 0) throw new Error('Stage 14 found no projected venue ids to rollback.');

  const supabase = createSupabaseClient();
  if (!supabase) throw new Error('Stage 14 requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL.');

  const venues = await fetchVenues(supabase, venueIds);
  const checks = buildRollbackChecks(batchName, venueIds, venues);
  const eligibleIds = checks.filter((check) => check.eligible_for_rollback).map((check) => check.venue_id);

  let rolledBack = 0;
  if (apply) {
    if (eligibleIds.length === 0) throw new Error('Stage 14 apply aborted: no active batch venues eligible for rollback.');
    const { data, error } = await supabase
      .from('venues')
      .update({
        curation_status: 'pending_review',
        updated_at: new Date().toISOString(),
      })
      .in('id', eligibleIds)
      .eq('curation_status', 'active')
      .select('id');
    if (error) throw new Error(`Stage 14 rollback apply failed: ${error.message}`);
    rolledBack = Array.isArray(data) ? data.length : eligibleIds.length;
  }

  const result: RollbackResult = {
    batch_id: projection.batch_id || batchName,
    generated_at: new Date().toISOString(),
    mode: apply ? 'apply' : 'dry_run',
    requested: venueIds.length,
    eligible: eligibleIds.length,
    blocked: checks.filter((check) => !check.eligible_for_rollback).length,
    rolled_back: rolledBack,
    target_status: 'pending_review',
    checks,
    safety_checks: {
      requires_explicit_apply_for_writes: true,
      writes_only_venues_curation_status: true,
      rollback_changes_active_to_pending_review_only: true,
      no_deletes: true,
      no_cloudinary_changes: true,
      no_venue_images_changes: true,
      no_external_model_calls: true,
      no_consumer_ui_changes: true,
      no_deploy: true,
    },
  };

  const jsonName = apply ? 'public_rollback_apply_result.json' : 'public_rollback_dry_run.json';
  const reportName = apply ? 'public_rollback_apply_report.md' : 'public_rollback_dry_run_report.md';
  writeFileSync(path.join(outputDir, jsonName), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  writeFileSync(path.join(outputDir, reportName), buildReport(result), 'utf8');
  console.log(`Public rollback ${result.mode} JSON written to ${path.join(outputDir, jsonName)}`);
  console.log(`Public rollback ${result.mode} report written to ${path.join(outputDir, reportName)}`);
  console.log(`Stage 14 ${result.mode} summary: requested=${result.requested}, eligible=${result.eligible}, blocked=${result.blocked}, rolled_back=${result.rolled_back}`);
  return result;
}

async function fetchVenues(supabase: SupabaseClient, venueIds: string[]): Promise<VenueRow[]> {
  const { data, error } = await supabase
    .from('venues')
    .select('id,name,curation_status,publication_metadata')
    .in('id', venueIds);
  if (error) throw new Error(`Stage 14 venues read failed: ${error.message}`);
  return (data || []) as VenueRow[];
}

function buildRollbackChecks(batchName: string, venueIds: string[], venues: VenueRow[]): RollbackVenueCheck[] {
  const venuesById = new Map(venues.map((venue) => [venue.id, venue]));
  return venueIds.map((venueId) => {
    const venue = venuesById.get(venueId);
    const metadata = isRecord(venue?.publication_metadata) ? venue.publication_metadata : {};
    const metadataBatchMatch = String(metadata.batch_id || '') === batchName;
    const blockers: string[] = [];
    const warnings: string[] = [];

    if (!venue) blockers.push('venue_row_missing');
    if (venue && venue.curation_status !== 'active') blockers.push(`status_not_active:${venue.curation_status || 'missing'}`);
    if (venue && !metadataBatchMatch) blockers.push('publication_metadata_batch_mismatch');
    if (venue?.curation_status === 'pending_review') warnings.push('already_pending_review');

    return {
      venue_id: venueId,
      name: venue?.name || undefined,
      current_status: venue?.curation_status || undefined,
      metadata_batch_match: metadataBatchMatch,
      eligible_for_rollback: blockers.length === 0,
      blockers,
      warnings,
    };
  });
}

function createSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function buildReport(result: RollbackResult): string {
  return [
    `# Stage 14 Public Batch Rollback ${result.mode === 'apply' ? 'Apply' : 'Dry Run'} - ${result.batch_id}`,
    '',
    `- Generated: ${result.generated_at}`,
    `- Requested: ${result.requested}`,
    `- Eligible: ${result.eligible}`,
    `- Blocked: ${result.blocked}`,
    `- Rolled back: ${result.rolled_back}`,
    `- Target status: ${result.target_status}`,
    '',
    '## Venue Checks',
    '',
    '| Venue | Current Status | Batch Match | Eligible | Blockers | Warnings |',
    '| --- | --- | --- | --- | --- | --- |',
    ...result.checks.map((check) => [
      escapeMd(check.name || check.venue_id),
      escapeMd(check.current_status || ''),
      check.metadata_batch_match ? 'yes' : 'no',
      check.eligible_for_rollback ? 'yes' : 'no',
      escapeMd(check.blockers.join(', ') || 'none'),
      escapeMd(check.warnings.join(', ') || 'none'),
    ].join(' | ')).map((row) => `| ${row} |`),
    '',
    '## Safety',
    '',
    ...Object.entries(result.safety_checks).map(([key, value]) => `- ${key}: ${value}`),
  ].join('\n');
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, 'utf8')) as T;
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function escapeMd(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

const isDirectRun = process.argv[1] ? fileURLToPath(import.meta.url) === path.resolve(process.argv[1]) : false;

if (isDirectRun) {
  const [, , batchName, ...args] = process.argv;
  if (!batchName) {
    console.error('Usage: npx tsx pipeline/stages/14_rollback_public_batch.ts <batch_id> [--dry-run|--apply]');
    process.exit(1);
  }

  rollbackPublicBatch(batchName, args).catch((error: unknown) => {
    console.error(`Stage 14 rollback failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  });
}
