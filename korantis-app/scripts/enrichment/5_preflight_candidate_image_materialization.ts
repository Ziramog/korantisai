import { readFile } from 'node:fs/promises';
import { validateCloudinaryEnv } from '../../src/lib/cloudinary';
import {
  escapeMd,
  loadControlledBatch,
  mapByCandidateId,
  normalizeName,
  readJson,
  writeJsonAndMarkdown,
} from './enrichment_utils';
import {
  createServiceSupabaseClient,
  loadPublicVenueLookup,
  tableExists,
  validateSupabaseServiceEnv,
} from './supabase_enrichment_utils';

type PhotoRefsFile = {
  venues?: Array<{
    candidate_id: string;
    google_place_id: string | null;
    venue_name: string;
    selected_photos?: unknown[];
  }>;
};

type PreflightRow = {
  candidate_id: string;
  venue_name: string;
  match_status: string;
  eligibility_status: string;
  selected_photos: number;
  public_venue_id: string | null;
  target: 'venue_images' | 'candidate_image_assets';
  safe: boolean;
  blockers: string[];
};

async function candidateSql() {
  return await readFile('supabase/09_candidate_image_assets.sql', 'utf8');
}

function markdown(params: {
  cloudinaryOk: boolean;
  cloudinaryMissing: string[];
  supabaseOk: boolean;
  supabaseMissing: string[];
  refsExists: boolean;
  candidateImageAssetsExists: boolean;
  venueImagesExists: boolean;
  needsCandidateImageAssets: boolean;
  rows: PreflightRow[];
  sql: string;
}) {
  const blockers = [
    ...(!params.cloudinaryOk ? [`Missing Cloudinary env: ${params.cloudinaryMissing.join(', ')}`] : []),
    ...(!params.supabaseOk ? [`Missing Supabase service env: ${params.supabaseMissing.join(', ')}`] : []),
    ...(!params.refsExists ? ['Missing data/publish_candidate_photo_refs.json'] : []),
    ...(!params.venueImagesExists ? ['Missing venue_images table'] : []),
    ...(params.needsCandidateImageAssets && !params.candidateImageAssetsExists ? ['Missing candidate_image_assets table'] : []),
    ...params.rows.flatMap((row) => row.blockers.map((blocker) => `${row.venue_name}: ${blocker}`)),
  ];

  return [
    '# Candidate Image Materialization Preflight',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Summary',
    '',
    `- Cloudinary env OK: ${params.cloudinaryOk ? 'yes' : 'no'}`,
    `- Supabase service role OK: ${params.supabaseOk ? 'yes' : 'no'}`,
    `- Photo refs file exists: ${params.refsExists ? 'yes' : 'no'}`,
    `- Candidate rows checked: ${params.rows.length}`,
    `- Public venue targets: ${params.rows.filter((row) => row.target === 'venue_images').length}`,
    `- Candidate asset targets: ${params.rows.filter((row) => row.target === 'candidate_image_assets').length}`,
    `- venue_images table exists: ${params.venueImagesExists ? 'yes' : 'no'}`,
    `- candidate_image_assets needed: ${params.needsCandidateImageAssets ? 'yes' : 'no'}`,
    `- candidate_image_assets table exists: ${params.candidateImageAssetsExists ? 'yes' : 'no'}`,
    `- Write readiness: ${blockers.length === 0 ? 'yes' : 'no'}`,
    '',
    '## Candidate Targets',
    '',
    '| Venue | Match | Eligibility | Photos | Public venue ID | Target | Safe | Blockers |',
    '| --- | --- | --- | ---: | --- | --- | --- | --- |',
    ...params.rows.map((row) => `| ${escapeMd(row.venue_name)} | ${row.match_status} | ${row.eligibility_status} | ${row.selected_photos} | ${escapeMd(row.public_venue_id)} | ${row.target} | ${row.safe ? 'yes' : 'no'} | ${escapeMd(row.blockers.join('; '))} |`),
    '',
    '## Blocking Conditions',
    '',
    ...(blockers.length ? blockers.map((blocker) => `- ${blocker}`) : ['- None']),
    '',
    ...(params.needsCandidateImageAssets && !params.candidateImageAssetsExists ? [
      '## SQL To Apply Before Write',
      '',
      'Apply this migration manually in Supabase SQL Editor:',
      '',
      '```sql',
      params.sql.trim(),
      '```',
    ] : []),
  ].join('\n');
}

async function main() {
  const cloudinary = validateCloudinaryEnv();
  const supabaseEnv = validateSupabaseServiceEnv();
  const refs = await readJson<PhotoRefsFile>('data/publish_candidate_photo_refs.json', { venues: [] });
  const refsExists = Boolean(refs.venues);
  const batch = await loadControlledBatch();
  const googleById = mapByCandidateId(batch.googleRecords);
  const outputById = mapByCandidateId(batch.intelligence);
  let venueImagesExists = false;
  let candidateImageAssetsExists = false;
  let publicVenueByName = new Map<string, string>();

  if (supabaseEnv.ok) {
    const supabase = createServiceSupabaseClient();
    venueImagesExists = await tableExists(supabase, 'venue_images');
    candidateImageAssetsExists = await tableExists(supabase, 'candidate_image_assets');
    const publicVenues = await loadPublicVenueLookup(supabase);
    publicVenueByName = new Map(publicVenues.map((venue) => [normalizeName(venue.name), venue.id]));
  }

  const rows: PreflightRow[] = (refs.venues || []).map((venue) => {
    const output = outputById.get(venue.candidate_id);
    const google = googleById.get(venue.candidate_id);
    const publicVenueId = publicVenueByName.get(normalizeName(venue.venue_name)) || null;
    const matchStatus = google?.status || output?.match_status || 'missing';
    const eligibilityStatus = output?.eligibility?.status || 'missing';
    const blockers = [
      matchStatus !== 'matched' ? `match status ${matchStatus}` : '',
      eligibilityStatus !== 'active' ? `eligibility ${eligibilityStatus}` : '',
      !venue.selected_photos?.length ? 'no selected photos' : '',
    ].filter(Boolean);

    return {
      candidate_id: venue.candidate_id,
      venue_name: venue.venue_name,
      match_status: matchStatus,
      eligibility_status: eligibilityStatus,
      selected_photos: venue.selected_photos?.length || 0,
      public_venue_id: publicVenueId,
      target: publicVenueId ? 'venue_images' : 'candidate_image_assets',
      safe: blockers.length === 0,
      blockers,
    };
  });
  const needsCandidateImageAssets = rows.some((row) => row.target === 'candidate_image_assets');
  const sql = await candidateSql();
  const payload = {
    generated_at: new Date().toISOString(),
    cloudinary_env_ok: cloudinary.ok,
    cloudinary_missing: cloudinary.missing,
    supabase_service_role_ok: supabaseEnv.ok,
    supabase_missing: supabaseEnv.missing,
    refs_exists: refsExists,
    venue_images_exists: venueImagesExists,
    candidate_image_assets_needed: needsCandidateImageAssets,
    candidate_image_assets_exists: candidateImageAssetsExists,
    write_ready: cloudinary.ok && supabaseEnv.ok && refsExists && venueImagesExists && (!needsCandidateImageAssets || candidateImageAssetsExists) && rows.every((row) => row.safe),
    rows,
  };

  await writeJsonAndMarkdown(
    'candidate_image_materialization_preflight.json',
    'candidate_image_materialization_preflight.md',
    payload,
    markdown({
      cloudinaryOk: cloudinary.ok,
      cloudinaryMissing: cloudinary.missing,
      supabaseOk: supabaseEnv.ok,
      supabaseMissing: supabaseEnv.missing,
      refsExists,
      candidateImageAssetsExists,
      venueImagesExists,
      needsCandidateImageAssets,
      rows,
      sql,
    }),
  );

  console.log(`Candidate image preflight write_ready=${payload.write_ready ? 'yes' : 'no'}`);
  if (!payload.write_ready) process.exitCode = 2;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

