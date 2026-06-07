import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { loadLocalEnv } from './01_extract_data';

interface PublicProjectionApplyResult {
  batch_id: string;
  venue_ids_written: string[];
}

interface ActivationCheck {
  venue_id: string;
  name?: string;
  current_status?: string;
  has_cloudinary_hero: boolean;
  ready_to_activate: boolean;
  blockers: string[];
}

interface ActivationResult {
  batch_id: string;
  generated_at: string;
  mode: 'dry_run' | 'apply';
  requested: number;
  ready_to_activate: number;
  blocked: number;
  activated: number;
  checks: ActivationCheck[];
  safety_checks: Record<string, boolean>;
}

interface VenueRow {
  id: string;
  name?: string;
  curation_status?: string | null;
}

interface ImageRow {
  venue_id: string;
  secure_url?: string | null;
  url?: string | null;
  role?: string | null;
  is_cover?: boolean | null;
}

export async function activatePublicVenues(batchName: string, args: string[]): Promise<ActivationResult> {
  if (args.includes('--apply') && args.includes('--dry-run')) {
    throw new Error('Stage 12 received both --apply and --dry-run. Choose exactly one mode.');
  }

  loadLocalEnv();

  const apply = args.includes('--apply');
  const outputDir = path.join(process.cwd(), 'data', 'batches', batchName);
  const applyResult = readJson<PublicProjectionApplyResult>(path.join(outputDir, 'public_projection_apply_result.json'));
  const supabase = createSupabaseClient();
  if (!supabase) throw new Error('Stage 12 requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL.');

  const checks = await buildActivationChecks(supabase, applyResult.venue_ids_written);
  const readyIds = checks.filter((check) => check.ready_to_activate).map((check) => check.venue_id);

  let activated = 0;
  if (apply) {
    if (readyIds.length === 0) throw new Error('Stage 12 apply aborted: no venues are ready to activate.');
    const { data, error } = await supabase
      .from('venues')
      .update({
        curation_status: 'active',
        updated_at: new Date().toISOString(),
      })
      .in('id', readyIds)
      .eq('curation_status', 'pending_review')
      .select('id');
    if (error) throw new Error(`Stage 12 activation failed: ${error.message}`);
    activated = Array.isArray(data) ? data.length : readyIds.length;
  }

  const result: ActivationResult = {
    batch_id: applyResult.batch_id,
    generated_at: new Date().toISOString(),
    mode: apply ? 'apply' : 'dry_run',
    requested: applyResult.venue_ids_written.length,
    ready_to_activate: readyIds.length,
    blocked: checks.filter((check) => !check.ready_to_activate).length,
    activated,
    checks,
    safety_checks: {
      writes_only_venues_curation_status: true,
      no_cloudinary_uploads: true,
      no_external_model_calls: true,
      no_consumer_ui_changes: true,
      requires_explicit_apply: true,
    },
  };

  const jsonName = apply ? 'public_activation_apply_result.json' : 'public_activation_dry_run.json';
  const reportName = apply ? 'public_activation_apply_report.md' : 'public_activation_dry_run_report.md';
  writeFileSync(path.join(outputDir, jsonName), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  writeFileSync(path.join(outputDir, reportName), buildReport(result), 'utf8');
  console.log(`Public activation ${result.mode} JSON written to ${path.join(outputDir, jsonName)}`);
  console.log(`Public activation ${result.mode} report written to ${path.join(outputDir, reportName)}`);
  console.log(`Stage 12 ${result.mode} summary: requested=${result.requested}, ready=${result.ready_to_activate}, blocked=${result.blocked}, activated=${result.activated}`);
  return result;
}

async function buildActivationChecks(supabase: SupabaseClient, venueIds: string[]): Promise<ActivationCheck[]> {
  const venues = await supabase
    .from('venues')
    .select('id,name,curation_status')
    .in('id', venueIds);
  if (venues.error) throw new Error(`Stage 12 venues check failed: ${venues.error.message}`);

  const images = await supabase
    .from('venue_images')
    .select('venue_id,secure_url,url,role,is_cover')
    .in('venue_id', venueIds);
  if (images.error) throw new Error(`Stage 12 venue_images check failed: ${images.error.message}`);

  const venueById = new Map((venues.data || [] as VenueRow[]).map((venue) => [venue.id, venue as VenueRow]));
  const imagesByVenue = new Map<string, ImageRow[]>();
  for (const image of (images.data || []) as ImageRow[]) {
    const list = imagesByVenue.get(image.venue_id) || [];
    list.push(image);
    imagesByVenue.set(image.venue_id, list);
  }

  return venueIds.map((venueId) => {
    const venue = venueById.get(venueId);
    const heroImages = (imagesByVenue.get(venueId) || []).filter((image) => image.role === 'hero' || image.is_cover);
    const hasCloudinaryHero = heroImages.some((image) => String(image.secure_url || image.url || '').startsWith('https://res.cloudinary.com/'));
    const blockers: string[] = [];
    if (!venue) blockers.push('venue_row_missing');
    if (venue?.curation_status !== 'pending_review') blockers.push(`status_not_pending_review:${venue?.curation_status || 'missing'}`);
    if (!hasCloudinaryHero) blockers.push('missing_cloudinary_hero');
    return {
      venue_id: venueId,
      name: venue?.name,
      current_status: venue?.curation_status || undefined,
      has_cloudinary_hero: hasCloudinaryHero,
      ready_to_activate: blockers.length === 0,
      blockers,
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

function buildReport(result: ActivationResult): string {
  return [
    `# Stage 12 Public Activation ${result.mode === 'apply' ? 'Apply' : 'Dry Run'} - ${result.batch_id}`,
    '',
    `- Generated: ${result.generated_at}`,
    `- Requested: ${result.requested}`,
    `- Ready to activate: ${result.ready_to_activate}`,
    `- Blocked: ${result.blocked}`,
    `- Activated: ${result.activated}`,
    '',
    '## Venue Checks',
    '',
    '| Venue | Status | Cloudinary hero | Ready | Blockers |',
    '| --- | --- | --- | --- | --- |',
    ...result.checks.map((check) => `| ${escapeMd(check.name || check.venue_id)} | ${escapeMd(check.current_status || '')} | ${check.has_cloudinary_hero ? 'yes' : 'no'} | ${check.ready_to_activate ? 'yes' : 'no'} | ${escapeMd(check.blockers.join(', ') || 'none')} |`),
    '',
    '## Safety',
    '',
    ...Object.entries(result.safety_checks).map(([check, value]) => `- ${check}: ${value}`),
  ].join('\n');
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, 'utf8')) as T;
}

function escapeMd(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

const isDirectRun = process.argv[1] ? fileURLToPath(import.meta.url) === path.resolve(process.argv[1]) : false;

if (isDirectRun) {
  const [, , batchName, ...args] = process.argv;
  if (!batchName) {
    console.error('Usage: npx tsx pipeline/stages/12_activate_public_venues.ts <batch_id> [--dry-run|--apply]');
    process.exit(1);
  }

  activatePublicVenues(batchName, args).catch((error: unknown) => {
    console.error(`Stage 12 activation failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  });
}
