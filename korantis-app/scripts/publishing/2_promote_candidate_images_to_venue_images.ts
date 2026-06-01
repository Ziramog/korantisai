import { createServiceSupabaseClient } from '../enrichment/supabase_enrichment_utils';
import { escapeMd, readJson } from '../enrichment/enrichment_utils';
import {
  loadCandidateImageAssets,
  writeReport,
  type CandidateImageAsset,
  type ValidationOutput,
  type VenueImageLookup,
} from './publishing_utils';

type VenueImageInsert = {
  venue_id: string;
  photo_reference: string | null;
  width: number | null;
  height: number | null;
  html_attributions: unknown[];
  is_cover: boolean;
  status: string;
  url: string;
  secure_url: string;
  public_id: string;
  role: string;
  sort_order: number;
  source: string;
  google_photo_reference: string | null;
  quality_score: number | null;
  hero_suitability_score: number | null;
};

type PromotionResult = {
  generated_at: string;
  mode: 'dry-run' | 'write';
  write_blocked: boolean;
  candidate_assets_found: number;
  rows_to_insert: VenueImageInsert[];
  inserted: number;
  skipped: Array<{ venue: string; role: string; reason: string }>;
  errors: string[];
  role_counts: Record<string, number>;
};

function toVenueImage(asset: CandidateImageAsset): VenueImageInsert {
  return {
    venue_id: asset.google_place_id,
    photo_reference: asset.google_photo_reference ?? null,
    width: asset.width ?? null,
    height: asset.height ?? null,
    html_attributions: [],
    is_cover: asset.role === 'hero',
    status: 'active',
    url: asset.url,
    secure_url: asset.url,
    public_id: asset.public_id,
    role: asset.role,
    sort_order: asset.sort_order,
    source: asset.source,
    google_photo_reference: asset.google_photo_reference ?? null,
    quality_score: asset.quality_score ?? null,
    hero_suitability_score: asset.hero_suitability_score ?? null,
  };
}

function markdown(result: PromotionResult) {
  return [
    '# Candidate Image Promotion',
    '',
    `Generated: ${result.generated_at}`,
    `Mode: ${result.mode}`,
    `Write blocked: ${result.write_blocked ? 'yes' : 'no'}`,
    `Candidate assets found: ${result.candidate_assets_found}`,
    `Rows to insert: ${result.rows_to_insert.length}`,
    `Inserted: ${result.inserted}`,
    '',
    '## Role Counts',
    '',
    ...Object.entries(result.role_counts).map(([role, count]) => `- ${role}: ${count}`),
    '',
    '## Planned Rows',
    '',
    '| Venue ID | Role | Sort | Public ID |',
    '|---|---:|---:|---|',
    ...result.rows_to_insert.map((row) => `| ${escapeMd(row.venue_id)} | ${escapeMd(row.role)} | ${row.sort_order} | ${escapeMd(row.public_id)} |`),
    '',
    '## Skipped',
    '',
    result.skipped.length ? result.skipped.map((item) => `- ${item.venue} ${item.role}: ${item.reason}`).join('\n') : '- none',
    '',
    '## Errors',
    '',
    result.errors.length ? result.errors.map((error) => `- ${error}`).join('\n') : '- none',
  ].join('\n');
}

async function main() {
  const writeMode = process.argv.includes('--write');
  const validation = await readJson<ValidationOutput>('data/publish_batch_16_validation.json');
  const candidateIds = validation.venues.map((venue) => venue.candidate_id);
  const venueIds = validation.venues.map((venue) => venue.public_venue_id);
  const assets = await loadCandidateImageAssets(candidateIds);
  const supabase = createServiceSupabaseClient();

  const { data: publicRows, error: publicError } = await supabase
    .from('venues')
    .select('id,name')
    .in('id', venueIds);
  if (publicError) throw publicError;

  const publicIdSet = new Set((publicRows || []).map((row) => String(row.id)));
  const { data: existingImages, error: existingError } = await supabase
    .from('venue_images')
    .select('id,venue_id,public_id,google_photo_reference,role')
    .in('venue_id', venueIds);
  if (existingError) throw existingError;

  const existing = (existingImages || []) as VenueImageLookup[];
  const existingKeys = new Set(existing.map((image) => `${image.venue_id}|${image.public_id || image.google_photo_reference || ''}|${image.role || ''}`));
  const skipped: PromotionResult['skipped'] = [];
  const rowsToInsert: VenueImageInsert[] = [];

  for (const asset of assets) {
    if (!publicIdSet.has(asset.google_place_id)) {
      skipped.push({ venue: asset.venue_name, role: asset.role, reason: 'public venue row does not exist' });
      continue;
    }
    if (!asset.url.startsWith('https://res.cloudinary.com/')) {
      skipped.push({ venue: asset.venue_name, role: asset.role, reason: 'asset URL is not Cloudinary' });
      continue;
    }
    const key = `${asset.google_place_id}|${asset.public_id || asset.google_photo_reference || ''}|${asset.role}`;
    if (existingKeys.has(key)) {
      skipped.push({ venue: asset.venue_name, role: asset.role, reason: 'venue_image already exists' });
      continue;
    }
    rowsToInsert.push(toVenueImage(asset));
  }

  const roleCounts = rowsToInsert.reduce<Record<string, number>>((acc, row) => {
    acc[row.role] = (acc[row.role] || 0) + 1;
    return acc;
  }, {});

  const result: PromotionResult = {
    generated_at: new Date().toISOString(),
    mode: writeMode ? 'write' : 'dry-run',
    write_blocked: skipped.some((item) => item.reason !== 'venue_image already exists'),
    candidate_assets_found: assets.length,
    rows_to_insert: rowsToInsert,
    inserted: 0,
    skipped,
    errors: [],
    role_counts: roleCounts,
  };

  if (writeMode && !result.write_blocked) {
    const { error, count } = await supabase
      .from('venue_images')
      .insert(rowsToInsert, { count: 'exact' });

    if (error) {
      result.errors.push(error.message);
      result.write_blocked = true;
    } else {
      result.inserted = count ?? rowsToInsert.length;
    }
  }

  await writeReport('publish_batch_16_image_promotion.json', 'publish_batch_16_image_promotion.md', result, markdown(result));

  console.log(`${writeMode ? 'Write' : 'Dry-run'} image promotion: ${rowsToInsert.length} rows planned, ${result.inserted} inserted`);
  if (result.write_blocked || result.errors.length > 0) {
    console.error('Image promotion blocked');
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

