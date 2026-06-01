import * as path from 'path';
import './script_env';
import { existsSync, readFileSync, writeFileSync } from 'fs';

const DATA_DIR = path.join(__dirname, '..', '..', 'data');

type Preflight = {
  write_ready?: boolean;
  schema?: { missing_columns?: string[] };
};

type Audit = {
  totals?: {
    total_public_venues?: number;
    venues_using_invernadero_fallback?: number;
    venues_using_legacy_venue_images_proxy?: number;
    images_missing_cloudinary_public_id?: number;
  };
  venues?: Array<{
    id: string;
    name: string;
    uses_invernadero_fallback?: boolean;
    uses_legacy_venue_images_proxy?: boolean;
    has_cloudinary_image?: boolean;
  }>;
};

type Refs = {
  target_venues?: number;
  venues_with_photo_refs?: number;
  api_errors?: string[];
  venues?: Array<{
    venue_id: string;
    venue_name: string;
    selected_photos?: unknown[];
    photo_ref_source?: string;
  }>;
};

type Materialization = {
  mode?: string;
  uploaded_images?: number;
  dry_run_images?: number;
  errored_images?: number;
  api_errors?: string[];
};

type Upsert = {
  mode?: string;
  inserted?: number;
  updated?: number;
  skipped?: number;
  missing_schema_columns?: string[];
};

type Verification = {
  totals?: {
    venue_count?: number;
    cloudinary_hero_count?: number;
    fallback_venue_count?: number;
    legacy_google_proxy_venue_count?: number;
    gallery_complete_count?: number;
    gallery_missing_count?: number;
  };
  venues?: Array<{
    id: string;
    name: string;
    uses_fallback?: boolean;
    uses_legacy_google_proxy?: boolean;
    gallery_count?: number;
  }>;
};

function readJson<T>(fileName: string, fallback: T) {
  const filePath = path.join(DATA_DIR, fileName);
  if (!existsSync(filePath)) return fallback;
  return JSON.parse(readFileSync(filePath, 'utf8')) as T;
}

function unresolvedReason(
  venue: NonNullable<Audit['venues']>[number],
  refs: Refs,
  preflight: Preflight,
  verification: Verification
) {
  const refVenue = refs.venues?.find((row) => row.venue_id === venue.id || row.venue_name === venue.name);
  const verified = verification.venues?.find((row) => row.id === venue.id || row.name === venue.name);

  if (preflight.schema?.missing_columns?.length) return 'schema missing';
  if (!refVenue || (refVenue.selected_photos || []).length === 0) return 'no photo refs or unsafe match';
  if (verified?.uses_fallback) return 'API verification failed: fallback still used';
  if (verified?.uses_legacy_google_proxy) return 'API verification failed: legacy Google proxy still used';
  return 'not Cloudinary-backed yet';
}

function recommendedAction(reason: string) {
  if (reason === 'schema missing') return 'apply supabase/07_cloudinary_image_materialization.sql, then rerun materialization write and upsert write';
  if (reason === 'no photo refs or unsafe match') return 'manual photo upload or alias/match repair';
  if (reason.includes('legacy')) return 'materialize existing Google references to Cloudinary';
  if (reason.includes('fallback')) return 'materialize safe Google refs or add manual curated image';
  return 'rerun verification after write mode';
}

function main() {
  const preflight = readJson<Preflight>('image_materialization_preflight_report.json', {});
  const audit = readJson<Audit>('public_venue_image_audit.json', {});
  const refs = readJson<Refs>('missing_venue_photo_refs.json', {});
  const materialization = readJson<Materialization>('cloudinary_materialization_output.json', {});
  const upsert = readJson<Upsert>('venue_images_upsert_output.json', {});
  const verification = readJson<Verification>('public_venue_image_verification.json', {});

  const unresolved = (audit.venues || [])
    .filter((venue) => !venue.has_cloudinary_image)
    .map((venue) => {
      const reason = unresolvedReason(venue, refs, preflight, verification);
      return {
        venue_name: venue.name,
        venue_id: venue.id,
        reason,
        recommended_next_action: recommendedAction(reason),
      };
    });

  const unresolvedReport = [
    '# Public Venue Unresolved Images',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    ...unresolved.map((venue) => [
      `## ${venue.venue_name}`,
      '',
      `- venue_id: ${venue.venue_id}`,
      `- reason unresolved: ${venue.reason}`,
      `- recommended next action: ${venue.recommended_next_action}`,
      '',
    ].join('\n')),
  ].join('\n');

  writeFileSync(path.join(DATA_DIR, 'public_venue_unresolved_images.md'), unresolvedReport);

  const finalReport = [
    '# Cloudinary Image Migration Final Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Preflight',
    '',
    `- Write ready: ${preflight.write_ready ? 'yes' : 'no'}`,
    `- Schema missing columns: ${preflight.schema?.missing_columns?.length ? preflight.schema.missing_columns.join(', ') : 'none'}`,
    '',
    '## Database Coverage After Upsert',
    '',
    `- Total public venues: ${audit.totals?.total_public_venues ?? 0}`,
    `- Database fallback count: ${audit.totals?.venues_using_invernadero_fallback ?? 0}`,
    `- Database legacy proxy count: ${audit.totals?.venues_using_legacy_venue_images_proxy ?? 0}`,
    `- Image rows missing Cloudinary public_id: ${audit.totals?.images_missing_cloudinary_public_id ?? 0}`,
    '',
    '## Ref Collection',
    '',
    `- Target venues: ${refs.target_venues ?? 0}`,
    `- Venues with refs: ${refs.venues_with_photo_refs ?? 0}`,
    `- Unsafe/no-match warnings: ${refs.api_errors?.length ?? 0}`,
    '',
    '## Materialization',
    '',
    `- Mode: ${materialization.mode || 'not run'}`,
    `- Images uploaded: ${materialization.uploaded_images ?? 0}`,
    `- Dry-run images: ${materialization.dry_run_images ?? 0}`,
    `- Upload/materialization errors: ${materialization.errored_images ?? 0}`,
    '',
    '## Upsert',
    '',
    `- Mode: ${upsert.mode || 'not run'}`,
    `- venue_images inserted: ${upsert.inserted ?? 0}`,
    `- venue_images updated: ${upsert.updated ?? 0}`,
    `- venue_images skipped: ${upsert.skipped ?? 0}`,
    `- Upsert schema blockers: ${upsert.missing_schema_columns?.length ? upsert.missing_schema_columns.join(', ') : 'none'}`,
    '',
    '## Final Coverage',
    '',
    `- /api/venues count: ${verification.totals?.venue_count ?? 0}`,
    `- Cloudinary hero count: ${verification.totals?.cloudinary_hero_count ?? 0}`,
    `- Final fallback count: ${verification.totals?.fallback_venue_count ?? 0}`,
    `- Final legacy proxy count: ${verification.totals?.legacy_google_proxy_venue_count ?? 0}`,
    `- Final gallery complete count: ${verification.totals?.gallery_complete_count ?? 0}`,
    '',
    '## Unresolved Venues',
    '',
    `- Total unresolved: ${unresolved.length}`,
    ...unresolved.map((venue) => `- ${venue.venue_name}: ${venue.reason}`),
    '',
    '## Commands Run',
    '',
    '- npx tsx scripts/images/00_preflight_image_materialization.ts',
    '- npx tsx scripts/images/0_audit_public_venue_images.ts',
    '- npx tsx scripts/images/1_collect_missing_venue_photo_refs.ts --include-legacy --google-search',
    '- npx tsx scripts/images/2_materialize_google_place_images_to_cloudinary.ts --dry-run',
    '- npx tsx scripts/images/2_materialize_google_place_images_to_cloudinary.ts --write',
    '- npx tsx scripts/images/3_upsert_venue_images.ts --dry-run',
    '- npx tsx scripts/images/3_upsert_venue_images.ts --write',
    '- npx tsx scripts/images/4_verify_public_venue_images.ts',
    '',
    '## Visual Production Readiness',
    '',
    !preflight.write_ready
      ? 'NOT READY: schema is missing required Cloudinary columns, so no Cloudinary uploads/upserts were executed.'
      : (verification.totals?.legacy_google_proxy_venue_count || 0) > 0
        ? 'PENDING DEPLOY: database has Cloudinary-backed venue_images, but production /api/venues is still returning legacy /api/venue-images proxy URLs.'
        : (verification.totals?.fallback_venue_count || 0) > 0
          ? 'PARTIAL: Cloudinary migration succeeded for matched venues, but unresolved venues still use fallback imagery.'
          : 'READY: production /api/venues is Cloudinary-backed with no fallback venues.',
    '',
  ].join('\n');

  writeFileSync(path.join(DATA_DIR, 'cloudinary_image_migration_final_report.md'), finalReport);
  console.log(finalReport);
}

main();
