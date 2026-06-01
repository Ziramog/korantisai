import * as path from 'path';
import './script_env';
import { writeFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import { validateCloudinaryEnvForImages } from './cloudinary_utils';

const DATA_DIR = path.join(__dirname, '..', '..', 'data');

const REQUIRED_ENV = [
  'GOOGLE_PLACES_API_KEY',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
];

const REQUIRED_IMAGE_COLUMNS = [
  'public_id',
  'source',
  'google_photo_reference',
  'width',
  'height',
  'quality_score',
  'hero_suitability_score',
  'role',
  'sort_order',
  'url',
];

function createSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or Supabase key.');
  return createClient(url, key, { auth: { persistSession: false } });
}

async function tableExists(supabase: ReturnType<typeof createSupabase>, table: string) {
  const { error } = await supabase.from(table).select('*', { count: 'exact', head: true });
  return !error;
}

async function hasColumn(supabase: ReturnType<typeof createSupabase>, table: string, column: string) {
  const { error } = await supabase.from(table).select(column).limit(1);
  return !error;
}

async function main() {
  const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key]);
  const cloudinary = validateCloudinaryEnvForImages();
  const supabase = createSupabase();
  const venueImagesExists = await tableExists(supabase, 'venue_images');
  const columnChecks = venueImagesExists
    ? await Promise.all(REQUIRED_IMAGE_COLUMNS.map(async (column) => ({
      column,
      exists: await hasColumn(supabase, 'venue_images', column),
    })))
    : REQUIRED_IMAGE_COLUMNS.map((column) => ({ column, exists: false }));
  const missingColumns = columnChecks.filter((check) => !check.exists).map((check) => check.column);
  const writeReady = missingEnv.length === 0 && cloudinary.ok && venueImagesExists && missingColumns.length === 0;

  const payload = {
    generated_at: new Date().toISOString(),
    env: {
      required_present: missingEnv.length === 0,
      missing: missingEnv,
      cloudinary_present: cloudinary.ok,
      cloudinary_missing: cloudinary.missing,
      write_requires_service_role: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    },
    schema: {
      venue_images_exists: venueImagesExists,
      required_columns: columnChecks,
      missing_columns: missingColumns,
    },
    write_ready: writeReady,
    instruction: missingColumns.length > 0
      ? 'Apply supabase/07_cloudinary_image_materialization.sql in Supabase SQL Editor.'
      : null,
  };

  writeFileSync(path.join(DATA_DIR, 'image_materialization_preflight_report.json'), JSON.stringify(payload, null, 2));

  const report = [
    '# Image Materialization Preflight Report',
    '',
    `Generated: ${payload.generated_at}`,
    '',
    '## Env',
    '',
    `- Required env present: ${payload.env.required_present ? 'yes' : 'no'}`,
    `- Cloudinary env present: ${payload.env.cloudinary_present ? 'yes' : 'no'}`,
    `- Service role available for writes: ${payload.env.write_requires_service_role ? 'yes' : 'no'}`,
    `- Missing env: ${payload.env.missing.length ? payload.env.missing.join(', ') : 'none'}`,
    '',
    '## Schema',
    '',
    `- venue_images table exists: ${venueImagesExists ? 'yes' : 'no'}`,
    `- Missing Cloudinary columns: ${missingColumns.length ? missingColumns.join(', ') : 'none'}`,
    '',
    '## Write Readiness',
    '',
    `- Write ready: ${writeReady ? 'yes' : 'no'}`,
    payload.instruction ? `- Instruction: ${payload.instruction}` : '- Instruction: none',
    '',
  ].join('\n');

  writeFileSync(path.join(DATA_DIR, 'image_materialization_preflight_report.md'), report);
  console.log(report);

  if (!writeReady) {
    process.exitCode = 2;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
