import { escapeMd, readJson, writeJsonAndMarkdown } from './enrichment_utils';
import { createServiceSupabaseClient, tableExists, validateSupabaseServiceEnv } from './supabase_enrichment_utils';

type MaterializedImage = {
  candidate_id: string;
  google_place_id: string | null;
  venue_name: string;
  city: string;
  target: 'venue_images' | 'candidate_image_assets';
  venue_id: string | null;
  role: 'hero' | 'card' | 'gallery';
  sort_order: number;
  source: 'google_places';
  google_photo_reference: string;
  width?: number;
  height?: number;
  quality_score: number | null;
  hero_suitability_score: number | null;
  status: 'dry_run' | 'uploaded' | 'skipped' | 'error';
  public_id?: string;
  secure_url?: string;
  url?: string;
};

type MaterializationOutput = {
  images?: MaterializedImage[];
};

type CategoryMappingFile = {
  mappings?: Array<{
    venue: string;
    normalized_category: string;
  }>;
};

function hasFlag(name: string) {
  return process.argv.includes(`--${name}`);
}

function normalizedName(value: string) {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function markdown(mode: string, rows: UpsertRow[], blockers: string[]) {
  return [
    '# Candidate Image Assets Upsert',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Mode: ${mode}`,
    '',
    `- Inserted/updated: ${rows.filter((row) => row.status === 'upserted').length}`,
    `- Dry-run: ${rows.filter((row) => row.status === 'dry_run').length}`,
    `- Skipped: ${rows.filter((row) => row.status === 'skipped').length}`,
    `- Errors: ${rows.filter((row) => row.status === 'error').length}`,
    '',
    '## Blocking Conditions',
    '',
    ...(blockers.length ? blockers.map((blocker) => `- ${blocker}`) : ['- None']),
    '',
    '| Venue | Target | Role | Status | Public ID | Error |',
    '| --- | --- | --- | --- | --- | --- |',
    ...rows.map((row) => `| ${escapeMd(row.venue_name)} | ${row.target_table} | ${row.role} | ${row.status} | ${escapeMd(row.public_id)} | ${escapeMd(row.error)} |`),
  ].join('\n');
}

type UpsertRow = {
  venue_name: string;
  target_table: 'venue_images' | 'candidate_image_assets';
  role: string;
  public_id?: string;
  status: 'dry_run' | 'upserted' | 'skipped' | 'error';
  error?: string;
};

async function main() {
  const write = hasFlag('write');
  const [materialization, categoryMapping] = await Promise.all([
    readJson<MaterializationOutput>('data/candidate_image_materialization_output.json', { images: [] }),
    readJson<CategoryMappingFile>('data/category_normalization_publish_mapping.json', { mappings: [] }),
  ]);
  const categoryByName = new Map((categoryMapping.mappings || []).map((mapping) => [normalizedName(mapping.venue), mapping.normalized_category]));
  const serviceEnv = validateSupabaseServiceEnv();
  const blockers: string[] = [];
  const rows: UpsertRow[] = [];

  if (!serviceEnv.ok) blockers.push(`Missing Supabase env vars: ${serviceEnv.missing.join(', ')}`);

  const uploadedImages = (materialization.images || []).filter((image) => image.status === 'uploaded' || (!write && image.status === 'dry_run'));
  const needsCandidateAssets = uploadedImages.some((image) => image.target === 'candidate_image_assets');
  let candidateTableExists = false;
  let venueImagesExists = false;
  const supabase = serviceEnv.ok ? createServiceSupabaseClient() : null;

  if (supabase) {
    venueImagesExists = await tableExists(supabase, 'venue_images');
    candidateTableExists = await tableExists(supabase, 'candidate_image_assets');
  }

  if (!venueImagesExists && uploadedImages.some((image) => image.target === 'venue_images')) blockers.push('venue_images table missing');
  if (needsCandidateAssets && !candidateTableExists) blockers.push('candidate_image_assets table missing; apply supabase/09_candidate_image_assets.sql before --write');

  for (const image of uploadedImages) {
    if (!image.public_id) {
      rows.push({ venue_name: image.venue_name, target_table: image.target, role: image.role, status: 'skipped', error: 'missing public_id' });
      continue;
    }

    if (write && image.status !== 'uploaded') {
      rows.push({ venue_name: image.venue_name, target_table: image.target, role: image.role, public_id: image.public_id, status: 'skipped', error: 'not uploaded' });
      continue;
    }

    if (!write || blockers.length > 0 || !supabase) {
      rows.push({ venue_name: image.venue_name, target_table: image.target, role: image.role, public_id: image.public_id, status: 'dry_run' });
      continue;
    }

    try {
      if (image.target === 'venue_images') {
        if (!image.venue_id) throw new Error('venue_id missing for venue_images target');
        const { error } = await supabase
          .from('venue_images')
          .upsert({
            venue_id: image.venue_id,
            url: image.url || image.secure_url,
            secure_url: image.secure_url || image.url,
            public_id: image.public_id,
            role: image.role,
            sort_order: image.sort_order,
            source: image.source,
            google_photo_reference: image.google_photo_reference,
            width: image.width,
            height: image.height,
            quality_score: image.quality_score,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'venue_id,google_photo_reference', ignoreDuplicates: false });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('candidate_image_assets')
          .upsert({
            candidate_id: image.candidate_id,
            google_place_id: image.google_place_id,
            venue_name: image.venue_name,
            city: image.city,
            normalized_category: categoryByName.get(normalizedName(image.venue_name)) || null,
            url: image.secure_url || image.url,
            public_id: image.public_id,
            role: image.role,
            sort_order: image.sort_order,
            source: image.source,
            google_photo_reference: image.google_photo_reference,
            width: image.width,
            height: image.height,
            quality_score: image.quality_score,
            hero_suitability_score: image.hero_suitability_score,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'candidate_id,google_photo_reference', ignoreDuplicates: false });
        if (error) throw error;
      }

      rows.push({ venue_name: image.venue_name, target_table: image.target, role: image.role, public_id: image.public_id, status: 'upserted' });
    } catch (error) {
      rows.push({
        venue_name: image.venue_name,
        target_table: image.target,
        role: image.role,
        public_id: image.public_id,
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const output = {
    generated_at: new Date().toISOString(),
    mode: write ? 'write' : 'dry-run',
    write_blocked: write && blockers.length > 0,
    blockers,
    inserted_or_updated: rows.filter((row) => row.status === 'upserted').length,
    rows,
  };

  await writeJsonAndMarkdown('candidate_image_assets_upsert_output.json', 'candidate_image_assets_upsert_report.md', output, markdown(output.mode, rows, blockers));
  console.log(`Candidate image asset upsert ${output.mode}: upserted=${output.inserted_or_updated}`);
  if (write && blockers.length > 0) process.exitCode = 2;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

