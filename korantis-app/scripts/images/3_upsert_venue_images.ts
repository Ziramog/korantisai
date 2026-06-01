import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '..', '..', '.env.local') });
import { readFileSync, writeFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

type MaterializedImage = {
  venue_id: string;
  venue_name: string;
  role: 'hero' | 'card' | 'gallery';
  sort_order: number;
  source: 'google_places';
  google_photo_reference: string;
  quality_score: number | null;
  hero_suitability_score: number | null;
  status: 'dry_run' | 'uploaded' | 'error';
  url?: string;
  secure_url?: string;
  public_id?: string;
  width?: number;
  height?: number;
  bytes?: number;
  format?: string;
};

type InputPayload = {
  images: MaterializedImage[];
};

type ExistingImage = {
  id: string;
  venue_id: string;
  photo_reference?: string | null;
  google_photo_reference?: string | null;
  public_id?: string | null;
  role?: string | null;
  source?: string | null;
  is_cover?: boolean | null;
};

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const REQUIRED_COLUMNS = [
  'url',
  'secure_url',
  'public_id',
  'role',
  'sort_order',
  'source',
  'google_photo_reference',
  'bytes',
  'format',
  'quality_score',
  'hero_suitability_score',
  'updated_at',
];

function hasFlag(name: string) {
  return process.argv.includes(`--${name}`);
}

function getArgValue(name: string) {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

function createSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or Supabase key.');
  return createClient(url, key, { auth: { persistSession: false } });
}

async function hasColumn(supabase: ReturnType<typeof createSupabase>, column: string) {
  const { error } = await supabase.from('venue_images').select(column).limit(1);
  return !error;
}

async function getMissingSchemaColumns(supabase: ReturnType<typeof createSupabase>) {
  const results = await Promise.all(REQUIRED_COLUMNS.map(async (column) => [column, await hasColumn(supabase, column)] as const));
  return results.filter(([, exists]) => !exists).map(([column]) => column);
}

function groupExisting(images: ExistingImage[]) {
  const grouped = new Map<string, ExistingImage[]>();
  for (const image of images) {
    const rows = grouped.get(image.venue_id) || [];
    rows.push(image);
    grouped.set(image.venue_id, rows);
  }
  return grouped;
}

function isDuplicate(existing: ExistingImage[], image: MaterializedImage) {
  return existing.some((row) => (
    row.public_id === image.public_id ||
    row.google_photo_reference === image.google_photo_reference ||
    row.photo_reference === image.google_photo_reference
  ));
}

function hasOwnedHero(existing: ExistingImage[]) {
  return existing.some((row) => (
    (row.role === 'hero' || row.is_cover) &&
    (Boolean(row.public_id) || row.source === 'cloudinary' || row.source === 'curated')
  ));
}

async function main() {
  const write = hasFlag('write');
  const replaceHero = hasFlag('replace-hero');
  const inputPath = getArgValue('input') || path.join(DATA_DIR, 'materialized_venue_images_cloudinary.json');
  const payload = JSON.parse(readFileSync(inputPath, 'utf8')) as InputPayload;
  const uploadedImages = payload.images.filter((image) => image.status === 'uploaded' && image.secure_url && image.public_id);
  const supabase = createSupabase();
  const missingColumns = await getMissingSchemaColumns(supabase);
  const actions: Array<{ venue_name: string; role: string; action: string; reason?: string }> = [];

  if (missingColumns.length > 0) {
    const output = {
      generated_at: new Date().toISOString(),
      mode: write ? 'write' : 'dry-run',
      inserted: 0,
      updated: 0,
      skipped: uploadedImages.length,
      missing_schema_columns: missingColumns,
      actions: uploadedImages.map((image) => ({
        venue_name: image.venue_name,
        role: image.role,
        action: 'skipped',
        reason: `missing venue_images columns: ${missingColumns.join(', ')}`,
      })),
    };

    writeFileSync(path.join(DATA_DIR, 'venue_images_upsert_report.json'), JSON.stringify(output, null, 2));
    writeFileSync(path.join(DATA_DIR, 'venue_images_upsert_report.md'), [
      '# Venue Images Upsert',
      '',
      `Generated: ${output.generated_at}`,
      `Mode: ${output.mode}`,
      '',
      'Schema is missing required Cloudinary columns. Apply `supabase/07_cloudinary_image_materialization.sql` before write mode.',
      '',
      ...missingColumns.map((column) => `- ${column}`),
      '',
    ].join('\n'));
    console.log(`Missing required venue_images columns: ${missingColumns.join(', ')}`);
    return;
  }

  const venueIds = Array.from(new Set(uploadedImages.map((image) => image.venue_id)));
  const { data: existingRows, error: existingError } = await supabase
    .from('venue_images')
    .select('id, venue_id, photo_reference, google_photo_reference, public_id, role, source, is_cover')
    .in('venue_id', venueIds);

  if (existingError) throw new Error(`Unable to read existing venue_images: ${existingError.message}`);

  const existingByVenue = groupExisting((existingRows || []) as ExistingImage[]);
  let inserted = 0;
  let skipped = 0;

  for (const image of uploadedImages) {
    const existing = existingByVenue.get(image.venue_id) || [];

    if (image.role === 'hero' && hasOwnedHero(existing) && !replaceHero) {
      skipped++;
      actions.push({ venue_name: image.venue_name, role: image.role, action: 'skipped', reason: 'existing owned/curated hero image present' });
      continue;
    }

    if (isDuplicate(existing, image)) {
      skipped++;
      actions.push({ venue_name: image.venue_name, role: image.role, action: 'skipped', reason: 'duplicate image reference' });
      continue;
    }

    const row = {
      venue_id: image.venue_id,
      photo_reference: image.google_photo_reference,
      google_photo_reference: image.google_photo_reference,
      url: image.url,
      secure_url: image.secure_url,
      public_id: image.public_id,
      role: image.role,
      sort_order: image.sort_order,
      source: image.source,
      width: image.width,
      height: image.height,
      bytes: image.bytes,
      format: image.format,
      quality_score: image.quality_score,
      hero_suitability_score: image.hero_suitability_score,
      is_cover: image.role === 'hero',
      status: 'processed',
      updated_at: new Date().toISOString(),
    };

    if (write) {
      const { data, error } = await supabase.from('venue_images').insert(row).select('id').single();
      if (error) throw new Error(`Unable to insert ${image.venue_name} ${image.role}: ${error.message}`);
      existing.push({ id: String(data.id), venue_id: image.venue_id, ...row });
      existingByVenue.set(image.venue_id, existing);
    }

    inserted++;
    actions.push({ venue_name: image.venue_name, role: image.role, action: write ? 'inserted' : 'would_insert' });
  }

  const output = {
    generated_at: new Date().toISOString(),
    mode: write ? 'write' : 'dry-run',
    replace_hero: replaceHero,
    uploaded_images_available: uploadedImages.length,
    inserted,
    updated: 0,
    skipped,
    missing_schema_columns: missingColumns,
    actions,
  };

  writeFileSync(path.join(DATA_DIR, 'venue_images_upsert_report.json'), JSON.stringify(output, null, 2));

  const report = [
    '# Venue Images Upsert',
    '',
    `Generated: ${output.generated_at}`,
    `Mode: ${output.mode}`,
    '',
    `- Uploaded images available: ${output.uploaded_images_available}`,
    `- ${write ? 'Inserted' : 'Would insert'}: ${output.inserted}`,
    `- Skipped: ${output.skipped}`,
    '',
    '## Actions',
    '',
    ...actions.map((action) => `- ${action.venue_name} ${action.role}: ${action.action}${action.reason ? ` (${action.reason})` : ''}`),
    '',
  ].join('\n');

  writeFileSync(path.join(DATA_DIR, 'venue_images_upsert_report.md'), report);
  console.log(report);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
