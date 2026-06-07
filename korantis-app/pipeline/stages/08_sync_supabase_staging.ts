import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { loadLocalEnv } from './01_extract_data';
import type { BatchResult, ReviewQueueItem, VenueComplete } from '../types';

interface ApprovalManifestVenue {
  venue_name: string;
  status: string;
  blocker_reasons?: string[];
}

interface ApprovalManifest {
  batch_id: string;
  generated_at: string;
  approved_for_db_staging: ApprovalManifestVenue[];
  needs_review: ApprovalManifestVenue[];
  blocked: ApprovalManifestVenue[];
}

interface ColumnCompatibility {
  column: string;
  found: boolean;
}

interface TableCompatibility {
  table: string;
  found: boolean;
  columns_found: string[];
  missing_columns: string[];
  checked_columns: ColumnCompatibility[];
  fallback_decision: string;
}

interface IntendedWrite {
  table: string;
  operation: 'insert' | 'upsert' | 'update';
  operation_type: 'insert' | 'upsert' | 'update';
  unique_key_used: string;
  fields_to_write: Record<string, unknown>;
  source_fields: Record<string, string>;
  transformation_logic: string[];
  fields_skipped: Array<{
    field: string;
    reason: string;
  }>;
}

interface VenueDryRunMapping {
  venue_name: string;
  source_id: string;
  target_staging_id: string;
  category: string;
  neighborhood: string;
  canonical_data_payload_preview: Record<string, unknown>;
  hero_image_reference: string | null;
  image_rights_status: string;
  tags: string[];
  tagline: string;
  description: string;
  quality_status: string;
  warnings: string[];
  intended_writes: IntendedWrite[];
}

interface SupabaseStagingDryRun {
  batch_id: string;
  generated_at: string;
  mode: 'dry_run';
  dry_run_only: true;
  approved_count: number;
  blocked_count: number;
  schema_compatibility: {
    read_only_live_probe_attempted: boolean;
    read_only_live_probe_succeeded: boolean;
    tables: TableCompatibility[];
  };
  venue_mappings: VenueDryRunMapping[];
  skipped_venues: Array<{
    venue_name: string;
    reasons: string[];
  }>;
  apply_preflight: {
    venue_images_conflict_key: string;
    required_unique_index_sql: string;
    required_unique_index_verified: boolean;
    required_unique_index_assumed: boolean;
    required_unique_index_note: string;
    venue_atmosphere_excluded_from_apply: true;
    apply_idempotent_after_index: true;
    partial_writes_detected: PartialWriteDetection;
  };
  safety_checks: Record<string, boolean>;
}

interface PartialWriteDetection {
  checked: boolean;
  staging_venues_for_batch: number;
  venue_images_for_approved_venues: number;
  selected_hero_images_for_approved_venues: number;
  quality_scores_for_approved_venues: number;
  partial_writes_detected: boolean;
  notes: string[];
}

interface ApplyTableResult {
  table: string;
  operation: 'upsert';
  attempted_rows: number;
  affected_rows: number;
}

interface SupabaseStagingApplyResult {
  batch_id: string;
  generated_at: string;
  mode: 'apply';
  approved_count: number;
  blocked_count: number;
  intended_write_count: number;
  venue_images_conflict_key: string;
  required_unique_index_sql: string;
  required_unique_index_verified: boolean;
  required_unique_index_assumed: boolean;
  partial_writes_detected: PartialWriteDetection;
  table_results: ApplyTableResult[];
  venue_ids_synced: string[];
  skipped_venues: SupabaseStagingDryRun['skipped_venues'];
  warnings: string[];
  safety_checks: Record<string, boolean>;
}

const APPLY_TABLES = new Set(['staging_venues', 'venue_images', 'quality_scores']);
const VENUE_IMAGES_CONFLICT_KEY = 'venue_id,photo_reference';
const REQUIRED_VENUE_IMAGES_INDEX_SQL = [
  'create unique index if not exists venue_images_venue_photo_reference_uidx',
  'on venue_images (venue_id, photo_reference);',
].join('\n');
const REQUIRED_BRIDGE_COLUMNS: Record<string, string[]> = {
  staging_venues: [
    'enrichment_data',
    'pipeline_batch_id',
    'pipeline_status',
    'eligibility_score',
    'primary_atmosphere',
    'mood_tags',
  ],
  venue_images: ['selection_data', 'rights_status', 'is_selected_hero'],
  quality_scores: ['pipeline_quality_data'],
};
const REQUIRED_APPLY_COLUMNS: Record<string, string[]> = {
  staging_venues: [
    'id',
    'name',
    'city',
    'category_seed',
    'status',
    'canonical_data',
    'atmosphere_prose',
    'enrichment_data',
    'pipeline_batch_id',
    'pipeline_status',
    'eligibility_score',
    'primary_atmosphere',
    'mood_tags',
  ],
  venue_images: [
    'venue_id',
    'photo_reference',
    'width',
    'height',
    'is_cover',
    'status',
    'url',
    'role',
    'source',
    'quality_score',
    'hero_suitability_score',
    'selection_data',
    'rights_status',
    'is_selected_hero',
    'sort_order',
  ],
  quality_scores: [
    'venue_id',
    'review_count',
    'has_images',
    'has_prose',
    'has_embeddings',
    'editorial_themes',
    'interpretation_notes',
    'atmosphere_word_count',
    'last_processed_at',
    'pipeline_quality_data',
  ],
};

const TARGET_TABLE_COLUMNS: Record<string, string[]> = {
  staging_venues: [
    'id',
    'name',
    'city',
    'category_seed',
    'status',
    'canonical_data',
    'atmosphere_prose',
    'enrichment_data',
    'pipeline_batch_id',
    'pipeline_status',
    'curation_status',
    'eligibility_score',
    'eligibility',
    'evidence',
    'primary_atmosphere',
    'mood_tags',
    'best_for',
    'grounded_description',
    'curation_notes',
  ],
  venue_images: [
    'id',
    'venue_id',
    'photo_reference',
    'google_photo_reference',
    'width',
    'height',
    'is_cover',
    'status',
    'url',
    'role',
    'source',
    'quality_score',
    'hero_suitability_score',
    'photo_scores',
    'selection_data',
    'rights_status',
    'is_selected_hero',
    'sort_order',
  ],
  venue_atmosphere: [
    'id',
    'venue_id',
    'prose',
    'word_count',
    'model',
  ],
  quality_scores: [
    'venue_id',
    'review_count',
    'has_images',
    'has_prose',
    'has_embeddings',
    'resonance_score',
    'editorial_themes',
    'interpretation_notes',
    'atmosphere_word_count',
    'last_processed_at',
    'pipeline_quality_data',
  ],
  venue_quality: [
    'id',
    'venue_id',
    'review_count',
    'has_atmosphere',
    'has_embedding',
    'has_images',
    'completeness_score',
    'ready_for_review',
  ],
};

export async function runSupabaseStagingDryRun(batchName: string, args: string[]): Promise<SupabaseStagingDryRun | SupabaseStagingApplyResult> {
  if (args.includes('--apply') && args.includes('--dry-run')) {
    throw new Error('Stage 08 received both --apply and --dry-run. Choose exactly one mode.');
  }

  loadLocalEnv();

  const outputDir = path.join(process.cwd(), 'data', 'batches', batchName);
  const manifest = readJson<ApprovalManifest>(path.join(outputDir, 'approval_manifest.json'));
  const batchResult = readJson<BatchResult>(path.join(outputDir, 'batch_result_quality_gated.json'));
  const approvedNames = new Set(manifest.approved_for_db_staging.map((venue) => normalizeVenueName(venue.venue_name)));
  const approvedCandidates = batchResult.candidates.filter((candidate) => approvedNames.has(normalizeVenueName(candidate.venue_name)));
  const skippedVenues = manifest.blocked.map((venue) => ({
    venue_name: venue.venue_name,
    reasons: venue.blocker_reasons || ['blocked_in_approval_manifest'],
  }));

  const schemaCompatibility = await probeSchemaCompatibility();
  const venueMappings = approvedCandidates.map((candidate) => buildVenueMapping(candidate, schemaCompatibility.tables, manifest.batch_id));
  const partialWritesDetected = await detectPartialWrites(manifest.batch_id, venueMappings.map((venue) => venue.target_staging_id));
  const dryRun: SupabaseStagingDryRun = {
    batch_id: manifest.batch_id,
    generated_at: new Date().toISOString(),
    mode: 'dry_run',
    dry_run_only: true,
    approved_count: approvedCandidates.length,
    blocked_count: skippedVenues.length,
    schema_compatibility: schemaCompatibility,
    venue_mappings: venueMappings,
    skipped_venues: skippedVenues,
    apply_preflight: {
      venue_images_conflict_key: VENUE_IMAGES_CONFLICT_KEY,
      required_unique_index_sql: REQUIRED_VENUE_IMAGES_INDEX_SQL,
      required_unique_index_verified: false,
      required_unique_index_assumed: false,
      required_unique_index_note: 'Index metadata is not exposed through the current Supabase/PostgREST schemas; --apply must fail before writes unless explicitly confirmed.',
      venue_atmosphere_excluded_from_apply: true,
      apply_idempotent_after_index: true,
      partial_writes_detected: partialWritesDetected,
    },
    safety_checks: {
      no_supabase_writes: true,
      no_public_venues_writes: true,
      no_cloudinary_uploads: true,
      no_image_rights_approval: true,
      no_ui_files_touched: true,
      no_external_model_calls: true,
      no_migrations_created_or_applied: true,
    },
  };

  if (args.includes('--apply')) {
    return applySupabaseStagingSync(batchName, dryRun, args);
  }

  writeFileSync(path.join(outputDir, 'supabase_staging_dry_run.json'), `${JSON.stringify(dryRun, null, 2)}\n`, 'utf8');
  writeFileSync(path.join(outputDir, 'supabase_staging_mapping.md'), buildMappingMarkdown(dryRun), 'utf8');
  writeFileSync(path.join(outputDir, 'supabase_staging_dry_run_report.md'), buildReportMarkdown(dryRun), 'utf8');

  console.log(`Supabase staging dry-run JSON written to ${path.join(outputDir, 'supabase_staging_dry_run.json')}`);
  console.log(`Supabase staging mapping written to ${path.join(outputDir, 'supabase_staging_mapping.md')}`);
  console.log(`Supabase staging dry-run report written to ${path.join(outputDir, 'supabase_staging_dry_run_report.md')}`);
  console.log(
    `Supabase staging dry-run summary: approved=${dryRun.approved_count}, blocked=${dryRun.blocked_count}, tables=${dryRun.schema_compatibility.tables.filter((table) => table.found).map((table) => table.table).join(', ') || 'none'}`,
  );

  return dryRun;
}

async function probeSchemaCompatibility(): Promise<SupabaseStagingDryRun['schema_compatibility']> {
  const supabase = createSupabaseReadOnlyClient();
  if (!supabase) {
    return {
      read_only_live_probe_attempted: false,
      read_only_live_probe_succeeded: false,
      tables: Object.keys(TARGET_TABLE_COLUMNS).map((table) => ({
        table,
        found: false,
        columns_found: [],
        missing_columns: TARGET_TABLE_COLUMNS[table],
        checked_columns: TARGET_TABLE_COLUMNS[table].map((column) => ({ column, found: false })),
        fallback_decision: 'Live schema not probed because Supabase read env was unavailable.',
      })),
    };
  }

  const tables: TableCompatibility[] = [];
  for (const [table, columns] of Object.entries(TARGET_TABLE_COLUMNS)) {
    const found = await tableExists(supabase, table);
    const checkedColumns = found
      ? await Promise.all(columns.map(async (column) => ({ column, found: await columnExists(supabase, table, column) })))
      : columns.map((column) => ({ column, found: false }));
    const columnsFound = checkedColumns.filter((column) => column.found).map((column) => column.column);
    const missingColumns = checkedColumns.filter((column) => !column.found).map((column) => column.column);
    tables.push({
      table,
      found,
      columns_found: columnsFound,
      missing_columns: missingColumns,
      checked_columns: checkedColumns,
      fallback_decision: fallbackDecision(table, found, columnsFound, missingColumns),
    });
  }

  return {
    read_only_live_probe_attempted: true,
    read_only_live_probe_succeeded: tables.some((table) => table.found),
    tables,
  };
}

async function detectPartialWrites(batchId: string, venueIds: string[]): Promise<PartialWriteDetection> {
  const supabase = createSupabaseReadOnlyClient();
  if (!supabase) {
    return {
      checked: false,
      staging_venues_for_batch: 0,
      venue_images_for_approved_venues: 0,
      selected_hero_images_for_approved_venues: 0,
      quality_scores_for_approved_venues: 0,
      partial_writes_detected: false,
      notes: ['Supabase read env unavailable; partial writes were not checked.'],
    };
  }

  const staging = await supabase
    .from('staging_venues')
    .select('id', { count: 'exact', head: true })
    .eq('pipeline_batch_id', batchId);
  const images = await supabase
    .from('venue_images')
    .select('venue_id', { count: 'exact', head: true })
    .in('venue_id', venueIds);
  const selectedHeroes = await supabase
    .from('venue_images')
    .select('venue_id', { count: 'exact', head: true })
    .in('venue_id', venueIds)
    .eq('is_selected_hero', true);
  const quality = await supabase
    .from('quality_scores')
    .select('venue_id', { count: 'exact', head: true })
    .in('venue_id', venueIds);

  const notes = [staging, images, selectedHeroes, quality]
    .map((result) => result.error?.message)
    .filter((message): message is string => Boolean(message));
  const stagingCount = staging.count || 0;
  const imageCount = images.count || 0;
  const selectedHeroCount = selectedHeroes.count || 0;
  const qualityCount = quality.count || 0;

  return {
    checked: notes.length === 0,
    staging_venues_for_batch: stagingCount,
    venue_images_for_approved_venues: imageCount,
    selected_hero_images_for_approved_venues: selectedHeroCount,
    quality_scores_for_approved_venues: qualityCount,
    partial_writes_detected: stagingCount > 0 || selectedHeroCount > 0 || qualityCount > 0,
    notes: notes.length > 0
      ? notes
      : [
          `${stagingCount} staging_venues rows found for batch ${batchId}.`,
          `${imageCount} venue_images rows found for approved venue ids.`,
          `${selectedHeroCount} selected Stage 08 hero image rows found for approved venue ids.`,
          `${qualityCount} quality_scores rows found for approved venue ids.`,
        ],
  };
}

async function applySupabaseStagingSync(batchName: string, dryRun: SupabaseStagingDryRun, args: string[]): Promise<SupabaseStagingApplyResult> {
  const outputDir = path.join(process.cwd(), 'data', 'batches', batchName);
  const supabase = createSupabaseApplyClient();
  if (!supabase) throw new Error('Missing Supabase env; --apply requires NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');

  const applyWrites = dryRun.venue_mappings.flatMap((venue) =>
    venue.intended_writes
      .filter((write) => APPLY_TABLES.has(write.table))
      .map((write) => ({ venue_name: venue.venue_name, target_staging_id: venue.target_staging_id, write })),
  );
  const intendedWriteCount = applyWrites.length;
  console.log(`Stage 08 apply requested. Intended writes: ${intendedWriteCount} across ${dryRun.approved_count} approved venues.`);

  const preflightWarnings = validateApplyPreflight(dryRun, intendedWriteCount, args);
  const tableResults: ApplyTableResult[] = [];
  for (const table of ['staging_venues', 'venue_images', 'quality_scores']) {
    const rows = applyWrites
      .filter((item) => item.write.table === table)
      .map((item) => item.write.fields_to_write);
    if (rows.length === 0) continue;

    const { data, error } = await supabase
      .from(table)
      .upsert(rows, { onConflict: onConflictForTable(table) })
      .select();
    if (error) throw new Error(`Supabase ${table} upsert failed: ${error.message}`);
    tableResults.push({
      table,
      operation: 'upsert',
      attempted_rows: rows.length,
      affected_rows: Array.isArray(data) ? data.length : rows.length,
    });
  }

  const applyResult: SupabaseStagingApplyResult = {
    batch_id: dryRun.batch_id,
    generated_at: new Date().toISOString(),
    mode: 'apply',
    approved_count: dryRun.approved_count,
    blocked_count: dryRun.blocked_count,
    intended_write_count: intendedWriteCount,
    venue_images_conflict_key: VENUE_IMAGES_CONFLICT_KEY,
    required_unique_index_sql: REQUIRED_VENUE_IMAGES_INDEX_SQL,
    required_unique_index_verified: false,
    required_unique_index_assumed: args.includes('--confirm-venue-images-index'),
    partial_writes_detected: dryRun.apply_preflight.partial_writes_detected,
    table_results: tableResults,
    venue_ids_synced: dryRun.venue_mappings.map((venue) => venue.target_staging_id),
    skipped_venues: dryRun.skipped_venues,
    warnings: [
      ...preflightWarnings,
      'venue_images unique index was manually confirmed via --confirm-venue-images-index; metadata verification is not exposed through current Supabase read APIs.',
      'venue_atmosphere skipped because it references public.venues, not staging_venues.',
      'Images remain not_approved_for_publication; publication rights were not approved.',
    ],
    safety_checks: {
      no_public_venues_writes: true,
      no_cloudinary_uploads: true,
      no_image_rights_approval: true,
      no_external_model_calls: true,
      no_consumer_ui_changes: true,
      no_publication: true,
      venue_atmosphere_skipped: true,
    },
  };

  writeFileSync(path.join(outputDir, 'supabase_staging_apply_result.json'), `${JSON.stringify(applyResult, null, 2)}\n`, 'utf8');
  writeFileSync(path.join(outputDir, 'supabase_staging_apply_report.md'), buildApplyReportMarkdown(applyResult), 'utf8');

  console.log(`Supabase staging apply result written to ${path.join(outputDir, 'supabase_staging_apply_result.json')}`);
  console.log(`Supabase staging apply report written to ${path.join(outputDir, 'supabase_staging_apply_report.md')}`);
  console.log(
    `Supabase staging apply summary: venues=${applyResult.venue_ids_synced.length}, writes=${applyResult.intended_write_count}, tables=${tableResults.map((result) => result.table).join(', ') || 'none'}`,
  );

  return applyResult;
}

function validateApplyPreflight(dryRun: SupabaseStagingDryRun, intendedWriteCount: number, args: string[]): string[] {
  if (dryRun.approved_count === 0) throw new Error('Stage 08 apply aborted: approved count is 0.');
  if (intendedWriteCount === 0) throw new Error('Stage 08 apply aborted: intended write count is 0.');

  const tableByName = new Map(dryRun.schema_compatibility.tables.map((table) => [table.table, table]));
  const missingApplyTables = [...APPLY_TABLES].filter((table) => !tableByName.get(table)?.found);
  if (missingApplyTables.length > 0) {
    throw new Error(`Stage 08 apply aborted: missing apply target tables: ${missingApplyTables.join(', ')}.`);
  }

  const missingApplyColumns = missingRequiredApplyColumns(dryRun.schema_compatibility.tables);
  if (missingApplyColumns.length > 0) {
    throw new Error(`Stage 08 apply aborted: missing required apply columns: ${missingApplyColumns.join(', ')}.`);
  }

  const missingBridge = missingBridgeColumns(dryRun.schema_compatibility.tables);
  if (missingBridge.length > 0) {
    throw new Error(`Stage 08 apply aborted: missing schema bridge columns: ${missingBridge.join(', ')}.`);
  }

  const writeTargets = dryRun.venue_mappings.flatMap((venue) => venue.intended_writes.map((write) => write.table));
  if (writeTargets.includes('public.venues') || writeTargets.includes('venues')) {
    throw new Error('Stage 08 apply aborted: intended writes include public.venues/venues.');
  }

  const approvedImageRights = dryRun.venue_mappings
    .filter((venue) => venue.image_rights_status === 'approved_for_publication')
    .map((venue) => venue.venue_name);
  if (approvedImageRights.length > 0) {
    throw new Error(`Stage 08 apply aborted: image rights would be approved for publication: ${approvedImageRights.join(', ')}.`);
  }

  const venueImageWrites = dryRun.venue_mappings
    .flatMap((venue) => venue.intended_writes)
    .filter((write) => write.table === 'venue_images');
  const missingPhotoReference = venueImageWrites.filter((write) => !write.fields_to_write.photo_reference);
  if (missingPhotoReference.length > 0) {
    throw new Error(`Stage 08 apply aborted: ${missingPhotoReference.length} venue_images payload(s) missing photo_reference.`);
  }

  const indexConfirmed = args.includes('--confirm-venue-images-index');
  if (!indexConfirmed) {
    throw new Error([
      'Missing required unique index for venue_images upsert.',
      'Run this SQL in Supabase before --apply:',
      '',
      REQUIRED_VENUE_IMAGES_INDEX_SQL,
      '',
      'Then rerun with --apply --confirm-venue-images-index after manually confirming the index exists.',
    ].join('\n'));
  }

  return dryRun.schema_compatibility.tables
    .filter((table) => table.missing_columns.length > 0 && APPLY_TABLES.has(table.table))
    .map((table) => `${table.table} skipped unavailable optional columns: ${table.missing_columns.join(', ')}`);
}

function missingBridgeColumns(tables: TableCompatibility[]): string[] {
  const tableByName = new Map(tables.map((table) => [table.table, table]));
  return Object.entries(REQUIRED_BRIDGE_COLUMNS).flatMap(([table, columns]) => {
    const found = new Set(tableByName.get(table)?.columns_found || []);
    return columns.filter((column) => !found.has(column)).map((column) => `${table}.${column}`);
  });
}

function missingRequiredApplyColumns(tables: TableCompatibility[]): string[] {
  const tableByName = new Map(tables.map((table) => [table.table, table]));
  return Object.entries(REQUIRED_APPLY_COLUMNS).flatMap(([table, columns]) => {
    const found = new Set(tableByName.get(table)?.columns_found || []);
    return columns.filter((column) => !found.has(column)).map((column) => `${table}.${column}`);
  });
}

function onConflictForTable(table: string): string {
  if (table === 'staging_venues') return 'id';
  if (table === 'venue_images') return VENUE_IMAGES_CONFLICT_KEY;
  if (table === 'quality_scores') return 'venue_id';
  return 'id';
}

function buildVenueMapping(candidate: ReviewQueueItem, tables: TableCompatibility[], batchId: string): VenueDryRunMapping {
  const venue = candidate.venue;
  const stagingId = venue.raw.place_id || slugify(venue.raw.name);
  const hero = venue.hero_image || venue.images.hero;
  const qualityStatus = candidate.status;
  const intendedWrites: IntendedWrite[] = [];
  const tableByName = new Map(tables.map((table) => [table.table, table]));

  intendedWrites.push(buildStagingVenueWrite(venue, candidate, stagingId, tableByName.get('staging_venues'), batchId));
  if (hero) {
    intendedWrites.push(buildVenueImageWrite(venue, candidate, stagingId, tableByName.get('venue_images')));
  }
  const qualityTable = chooseQualityTable(tableByName);
  intendedWrites.push(buildQualityWrite(venue, candidate, stagingId, qualityTable, batchId));
  const atmosphereTable = tableByName.get('venue_atmosphere');
  if (atmosphereTable?.found) {
    intendedWrites.push(buildAtmosphereSkippedWrite(venue, stagingId, atmosphereTable));
  }

  return {
    venue_name: candidate.venue_name,
    source_id: venue.raw.place_id || venue.raw.google_maps_url || venue.raw.name,
    target_staging_id: stagingId,
    category: venue.raw.type || 'unknown',
    neighborhood: venue.raw.neighborhood || venue.raw.input.neighborhood || 'unknown',
    canonical_data_payload_preview: buildCanonicalData(venue, candidate),
    hero_image_reference: hero?.resolved_image_url || null,
    image_rights_status: hero?.publication_status || 'not_approved_for_publication',
    tags: venue.editorial.mood_tags,
    tagline: venue.editorial.tagline || '',
    description: venue.editorial.description || '',
    quality_status: qualityStatus,
    warnings: candidate.warnings,
    intended_writes: intendedWrites,
  };
}

function buildStagingVenueWrite(
  venue: VenueComplete,
  candidate: ReviewQueueItem,
  stagingId: string,
  table: TableCompatibility | undefined,
  batchId: string,
): IntendedWrite {
  const payload = {
    id: stagingId,
    name: venue.raw.name,
    city: normalizeCity(venue.raw.city),
    category_seed: venue.raw.type || 'unknown',
    status: 'ready_for_review',
    canonical_data: buildCanonicalData(venue, candidate),
    atmosphere_prose: venue.editorial.description,
    enrichment_data: buildEnrichmentData(venue, candidate, batchId),
    pipeline_batch_id: batchId,
    pipeline_status: candidate.status,
    curation_status: 'pending_review',
    eligibility_score: candidate.staging_score,
    eligibility: {
      status: candidate.status,
      warnings: candidate.warnings,
      source: 'batch_003_quality_gate',
    },
    evidence: {
      confidence: venue.evidence.confidence,
      sources: venue.evidence.sources,
      notes: venue.evidence.factual_notes,
    },
    primary_atmosphere: venue.hero_image?.classification?.atmosphere_signal || 'none',
    mood_tags: venue.editorial.mood_tags,
    best_for: venue.editorial.mood_tags,
    grounded_description: venue.editorial.description,
    curation_notes: 'Dry-run only. Eligible for staging sync, not public publication.',
  };
  return buildWrite('staging_venues', 'upsert', 'id', payload, table, {
    id: 'venue.raw.place_id',
    name: 'venue.raw.name',
    city: 'venue.raw.city',
    category_seed: 'venue.raw.type',
    status: 'quality_gate.status',
    canonical_data: 'VenueComplete raw/editorial/evidence/hero_image',
    atmosphere_prose: 'venue.editorial.description',
    enrichment_data: 'VenueComplete evidence/editorial/hero_image plus quality gate metadata',
    pipeline_batch_id: 'approval_manifest.batch_id',
    pipeline_status: 'quality_gate.status',
    mood_tags: 'venue.editorial.mood_tags',
  });
}

function buildVenueImageWrite(
  venue: VenueComplete,
  candidate: ReviewQueueItem,
  stagingId: string,
  table: TableCompatibility | undefined,
): IntendedWrite {
  const hero = venue.hero_image || venue.images.hero;
  const photoReference = buildStablePhotoReference(stagingId, hero);
  const payload = {
    venue_id: stagingId,
    photo_reference: photoReference,
    google_photo_reference: hero?.source_type === 'google_places' ? hero.original_image_url || hero.resolved_image_url || photoReference : null,
    width: hero?.width,
    height: hero?.height,
    is_cover: true,
    status: 'reference_only',
    url: hero?.resolved_image_url,
    role: 'hero',
    source: hero?.source_type,
    quality_score: candidate.staging_score,
    hero_suitability_score: hero?.usable ? 100 : 0,
    photo_scores: {
      scene: hero?.classification?.scene,
      atmosphere_signal: hero?.classification?.atmosphere_signal,
      quality: hero?.classification?.quality,
      model_used: hero?.classification?.model_used,
      rights_risk: hero?.rights_risk,
      publication_status: hero?.publication_status || 'not_approved_for_publication',
    },
    selection_data: buildImageSelectionData(hero, candidate),
    rights_status: hero?.publication_status || 'not_approved_for_publication',
    is_selected_hero: true,
    sort_order: 0,
  };
  return buildWrite('venue_images', 'upsert', 'venue_id + photo_reference', payload, table, {
    venue_id: 'venue.raw.place_id',
    photo_reference: 'venue.hero_image.original_image_url fallback resolved_image_url fallback deterministic venue/source/role/sort_order reference',
    google_photo_reference: 'venue.hero_image source if google_places',
    url: 'venue.hero_image.resolved_image_url',
    role: 'hero_image.role',
    photo_scores: 'venue.hero_image.classification',
    selection_data: 'venue.hero_image metadata plus Stage 04 selection context',
    rights_status: 'venue.hero_image.publication_status',
    is_selected_hero: 'true for selected Stage 04 hero image',
  });
}

function buildQualityWrite(
  venue: VenueComplete,
  candidate: ReviewQueueItem,
  stagingId: string,
  table: TableCompatibility | undefined,
  batchId: string,
): IntendedWrite {
  const useVenueQuality = table?.table === 'venue_quality';
  const payload = useVenueQuality
    ? {
        venue_id: stagingId,
        review_count: venue.raw.user_ratings_total || venue.review_count,
        has_atmosphere: Boolean(venue.editorial.description),
        has_embedding: false,
        has_images: Boolean(venue.hero_image),
        completeness_score: candidate.staging_score / 100,
        ready_for_review: true,
      }
    : {
        venue_id: stagingId,
        review_count: venue.raw.user_ratings_total || venue.review_count,
        has_images: Boolean(venue.hero_image),
        has_prose: Boolean(venue.editorial.description),
        has_embeddings: false,
        editorial_themes: venue.editorial.mood_tags,
        interpretation_notes: `Quality gate ${candidate.status}; dry-run only.`,
        atmosphere_word_count: wordCount(venue.editorial.description || ''),
        last_processed_at: new Date().toISOString(),
        pipeline_quality_data: buildPipelineQualityData(candidate, batchId),
      };
  return buildWrite(table?.table || 'quality_scores', 'upsert', 'venue_id', payload, table, {
    venue_id: 'venue.raw.place_id',
    review_count: 'venue.raw.user_ratings_total',
    has_images: 'Boolean(venue.hero_image)',
    has_prose: 'Boolean(venue.editorial.description)',
    editorial_themes: 'venue.editorial.mood_tags',
    pipeline_quality_data: 'candidate status/staging_score/errors/warnings/review_reason',
  });
}

function buildAtmosphereSkippedWrite(
  venue: VenueComplete,
  stagingId: string,
  table: TableCompatibility,
): IntendedWrite {
  const payload = {
    venue_id: stagingId,
    prose: venue.editorial.description,
    word_count: wordCount(venue.editorial.description || ''),
    model: 'deterministic_stage_05_no_model_call',
  };
  const write = buildWrite('venue_atmosphere', 'insert', 'venue_id', payload, table, {
    venue_id: 'venue.raw.place_id',
    prose: 'venue.editorial.description',
    word_count: 'computed from description',
    model: 'constant deterministic_stage_05_no_model_call',
  });
  write.fields_skipped.push({
    field: '*',
    reason: 'Skipped for real sync unless confirmed compatible: known venue_atmosphere schema references public.venues, not staging_venues.',
  });
  write.transformation_logic.push('Dry-run documents possible payload only; real sync should prefer staging_venues.atmosphere_prose unless venue_atmosphere is confirmed staging-compatible.');
  return write;
}

function buildWrite(
  tableName: string,
  operationType: IntendedWrite['operation_type'],
  uniqueKey: string,
  payload: Record<string, unknown>,
  table: TableCompatibility | undefined,
  sourceFields: Record<string, string>,
): IntendedWrite {
  const foundColumns = new Set(table?.columns_found || []);
  const fieldsToWrite = Object.fromEntries(
    Object.entries(payload).filter(([key]) => !table || !table.found || foundColumns.has(key)),
  );
  const fieldsSkipped = Object.keys(payload)
    .filter((key) => table?.found && !foundColumns.has(key))
    .map((field) => ({
      field,
      reason: `Column ${field} not found on live ${tableName} schema probe.`,
    }));

  if (!table?.found) {
    fieldsSkipped.push({
      field: '*',
      reason: `Table ${tableName} not found or not readable in live schema probe.`,
    });
  }

  return {
    table: tableName,
    operation: operationType,
    operation_type: operationType,
    unique_key_used: uniqueKey,
    fields_to_write: fieldsToWrite,
    source_fields: sourceFields,
    transformation_logic: [
      'No write performed; payload is a deterministic dry-run preview.',
      'Only approval_manifest.approved_for_db_staging venues are mapped.',
      'Images remain reference-only and not approved for publication.',
    ],
    fields_skipped: fieldsSkipped,
  };
}

function chooseQualityTable(tableByName: Map<string, TableCompatibility>): TableCompatibility | undefined {
  const qualityScores = tableByName.get('quality_scores');
  if (qualityScores?.found && qualityScores.columns_found.includes('venue_id')) return qualityScores;
  return tableByName.get('venue_quality');
}

function fallbackDecision(table: string, found: boolean, foundColumns: string[], missingColumns: string[]): string {
  if (!found) return 'Do not map writes to this table until it exists or is readable.';
  if (table === 'venue_atmosphere') {
    return 'Treat as not staging-compatible unless FK compatibility with staging venue ids is confirmed; use staging_venues.atmosphere_prose fallback.';
  }
  if (missingColumns.length === 0) return 'All expected dry-run columns found.';
  return `Map only found columns and skip missing columns: ${missingColumns.join(', ')}.`;
}

function buildCanonicalData(venue: VenueComplete, candidate: ReviewQueueItem): Record<string, unknown> {
  return {
    place_id: venue.raw.place_id,
    name: venue.raw.name,
    address: venue.raw.address,
    neighborhood: venue.raw.neighborhood,
    city: venue.raw.city,
    coordinates: venue.raw.coordinates,
    google_maps_url: venue.raw.google_maps_url,
    website_url: venue.raw.website_url,
    phone: venue.raw.phone,
    venue_type: venue.raw.type,
    tagline: venue.editorial.tagline,
    description: venue.editorial.description,
    mood_tags: venue.editorial.mood_tags,
    evidence_confidence: venue.evidence.confidence,
    quality_gate_status: candidate.status,
    staging_score: candidate.staging_score,
    hero_image: venue.hero_image ? {
      resolved_image_url: venue.hero_image.resolved_image_url,
      source_url: venue.hero_image.source_url,
      source_type: venue.hero_image.source_type,
      width: venue.hero_image.width,
      height: venue.hero_image.height,
      publication_status: venue.hero_image.publication_status,
      classification: venue.hero_image.classification,
    } : null,
  };
}

function buildEnrichmentData(venue: VenueComplete, candidate: ReviewQueueItem, batchId: string): Record<string, unknown> {
  const hero = venue.hero_image || venue.images.hero;
  return {
    pipeline_batch_id: batchId,
    pipeline_status: candidate.status,
    quality_gate: buildPipelineQualityData(candidate, batchId),
    raw: {
      place_id: venue.raw.place_id,
      google_maps_url: venue.raw.google_maps_url,
      website_url: venue.raw.website_url,
      address: venue.raw.address,
      coordinates: venue.raw.coordinates,
      rating: venue.raw.rating,
      user_ratings_total: venue.raw.user_ratings_total,
      business_status: venue.raw.business_status,
      operational_status: venue.raw.operational_status,
    },
    evidence: venue.evidence,
    editorial: {
      tagline: venue.editorial.tagline,
      description: venue.editorial.description,
      description_short: venue.editorial.description_short,
      mood_tags: venue.editorial.mood_tags,
      mood_confidence: venue.editorial.mood_confidence,
      moments: venue.editorial.moments,
    },
    selected_hero_image: buildImageSelectionData(hero, candidate),
  };
}

function buildImageSelectionData(
  hero: NonNullable<VenueComplete['hero_image']> | undefined,
  candidate: ReviewQueueItem,
): Record<string, unknown> | null {
  if (!hero) return null;
  return {
    resolved_image_url: hero.resolved_image_url,
    source_url: hero.source_url,
    source_type: hero.source_type,
    width: hero.width,
    height: hero.height,
    content_type: hero.content_type,
    rights_risk: hero.rights_risk,
    risk_flags: hero.risk_flags || [],
    publication_status: hero.publication_status || 'not_approved_for_publication',
    validation_status: hero.validation_status,
    classification: hero.classification,
    quality_gate_status: candidate.status,
    staging_score: candidate.staging_score,
  };
}

function buildStablePhotoReference(
  venueId: string,
  hero: NonNullable<VenueComplete['hero_image']> | undefined,
): string {
  const reference = hero?.original_image_url || hero?.resolved_image_url || hero?.source_url;
  if (reference) return reference;
  return [
    'stage08',
    venueId,
    hero?.source_type || 'unknown_source',
    hero?.role || 'hero',
    '0',
  ].join(':');
}

function buildPipelineQualityData(candidate: ReviewQueueItem, batchId: string): Record<string, unknown> {
  return {
    pipeline_batch_id: batchId,
    status: candidate.status,
    staging_score: candidate.staging_score,
    errors: candidate.errors,
    warnings: candidate.warnings,
    review_reason: candidate.review_reason,
  };
}

async function tableExists(supabase: SupabaseClient, table: string): Promise<boolean> {
  const { error } = await supabase.from(table).select('*', { count: 'exact', head: true });
  return !error;
}

async function columnExists(supabase: SupabaseClient, table: string, column: string): Promise<boolean> {
  const { error } = await supabase.from(table).select(column, { head: true }).limit(1);
  return !error;
}

function createSupabaseReadOnlyClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function createSupabaseApplyClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function buildMappingMarkdown(dryRun: SupabaseStagingDryRun): string {
  const lines = [
    '# Supabase Staging Mapping Dry Run',
    '',
    `- Batch: ${dryRun.batch_id}`,
    `- Generated: ${dryRun.generated_at}`,
    `- Dry-run only: ${dryRun.dry_run_only ? 'yes' : 'no'}`,
    `- venue_images conflict key for apply: ${dryRun.apply_preflight.venue_images_conflict_key}`,
    `- venue_atmosphere excluded from apply: ${dryRun.apply_preflight.venue_atmosphere_excluded_from_apply ? 'yes' : 'no'}`,
    '',
    '## Required venue_images Index',
    '',
    '```sql',
    dryRun.apply_preflight.required_unique_index_sql,
    '```',
    '',
    '## Venue Mapping',
    '',
  ];

  for (const venue of dryRun.venue_mappings) {
    lines.push(`### ${venue.venue_name}`, '');
    lines.push(`- Source id/name: ${venue.source_id}`);
    lines.push(`- Target staging id: ${venue.target_staging_id}`);
    lines.push(`- Category: ${venue.category}`);
    lines.push(`- Neighborhood: ${venue.neighborhood}`);
    lines.push(`- Hero image reference: ${venue.hero_image_reference || 'none'}`);
    lines.push(`- Image rights status: ${venue.image_rights_status}`);
    lines.push(`- Tags: ${venue.tags.join(', ') || 'none'}`);
    lines.push(`- Tagline: ${venue.tagline}`);
    lines.push(`- Description: ${venue.description}`);
    lines.push(`- Quality status: ${venue.quality_status}`);
    lines.push(`- Warnings: ${venue.warnings.join(', ') || 'none'}`);
    lines.push('');
    for (const write of venue.intended_writes) {
      lines.push(`#### ${write.table}`);
      lines.push(`- Operation: ${write.operation}`);
      lines.push(`- Unique key: ${write.unique_key_used}`);
      lines.push(`- Fields: ${Object.keys(write.fields_to_write).join(', ') || 'none'}`);
      lines.push(`- Skipped: ${write.fields_skipped.map((field) => `${field.field} (${field.reason})`).join('; ') || 'none'}`);
      lines.push('');
    }
  }

  return `${lines.join('\n')}\n`;
}

function buildApplyReportMarkdown(result: SupabaseStagingApplyResult): string {
  const lines = [
    '# Supabase Staging Apply Report',
    '',
    `- Batch id: ${result.batch_id}`,
    `- Generated: ${result.generated_at}`,
    `- Approved venues synced: ${result.approved_count}`,
    `- Blocked venues skipped: ${result.blocked_count}`,
    `- Intended writes: ${result.intended_write_count}`,
    `- venue_images conflict key: ${result.venue_images_conflict_key}`,
    `- Required venue_images unique index verified: ${result.required_unique_index_verified ? 'yes' : 'no'}`,
    `- Required venue_images unique index manually assumed: ${result.required_unique_index_assumed ? 'yes' : 'no'}`,
    '',
    '## Required Unique Index SQL',
    '',
    '```sql',
    result.required_unique_index_sql,
    '```',
    '',
    '## Partial Writes Before Apply',
    '',
    `- Checked: ${result.partial_writes_detected.checked ? 'yes' : 'no'}`,
    `- Partial writes detected: ${result.partial_writes_detected.partial_writes_detected ? 'yes' : 'no'}`,
    `- staging_venues rows for batch: ${result.partial_writes_detected.staging_venues_for_batch}`,
    `- venue_images rows for approved venues: ${result.partial_writes_detected.venue_images_for_approved_venues}`,
    `- selected hero image rows for approved venues: ${result.partial_writes_detected.selected_hero_images_for_approved_venues}`,
    `- quality_scores rows for approved venues: ${result.partial_writes_detected.quality_scores_for_approved_venues}`,
    '',
    '## Rows Upserted Per Table',
    '',
    ...(result.table_results.length > 0
      ? result.table_results.map((table) =>
          `- ${table.table}: ${table.operation}, attempted ${table.attempted_rows}, affected ${table.affected_rows}`,
        )
      : ['- none']),
    '',
    '## Venue IDs Synced',
    '',
    ...result.venue_ids_synced.map((id) => `- ${id}`),
    '',
    '## Skipped Venues',
    '',
    ...(result.skipped_venues.length > 0
      ? result.skipped_venues.map((venue) => `- ${venue.venue_name}: ${venue.reasons.join(', ')}`)
      : ['- none']),
    '',
    '## Warnings',
    '',
    ...(result.warnings.length > 0 ? result.warnings.map((warning) => `- ${warning}`) : ['- none']),
    '',
    '## Idempotency',
    '',
    '- staging_venues uses upsert on id.',
    '- venue_images uses upsert on venue_id,photo_reference after normalizing photo_reference to a stable non-null value.',
    '- quality_scores uses upsert on venue_id.',
    '- venue_atmosphere is not written.',
    '',
    ...stage08ExplanationLines(),
    '',
    ...scaleToFiftyPlanLines(),
    '',
    '## Safety Confirmations',
    '',
    ...Object.entries(result.safety_checks).map(([key, value]) => `- ${key}: ${value ? 'yes' : 'no'}`),
  ];

  return `${lines.join('\n')}\n`;
}

function stage08ExplanationLines(): string[] {
  return [
    '## How Stage 08 Works',
    '',
    '- Reads `approval_manifest.json` and `batch_result_quality_gated.json` for the batch.',
    '- Qualifies only venues listed in `approved_for_db_staging`; blocked and needs-review venues are skipped.',
    '- Dry-run probes live schema, builds deterministic payload previews, detects partial writes, and writes only local JSON/Markdown reports.',
    '- Apply requires explicit `--apply`, service-role credentials, successful preflight, required bridge columns, and manual confirmation of the venue image unique index.',
    '- Apply writes only `staging_venues`, `venue_images`, and `quality_scores`.',
    '- Apply intentionally does not write `public.venues`, `venues`, `venue_atmosphere`, Cloudinary, image storage, public publication state, auth, ranking, API, Mapbox, or consumer UI.',
    '- Image rights remain `not_approved_for_publication`; selected heroes are staging references only.',
    '- Idempotency comes from upserts on `staging_venues.id`, `venue_images(venue_id, photo_reference)`, and `quality_scores.venue_id`.',
    '- After a partial failure, rerun dry-run first, confirm the required index exists, then rerun apply; existing partial rows are updated rather than duplicated.',
  ];
}

function scaleToFiftyPlanLines(): string[] {
  return [
    '## Path To 50 Buenos Aires Venues',
    '',
    '1. Finish Stage 08 test apply for `batch_003_stage01_test` after the required `venue_images` unique index is in place.',
    '2. Confirm the 4 approved venues are staged correctly in `staging_venues`, `venue_images`, and `quality_scores`.',
    '3. Prepare a new Buenos Aires batch of 50 venues.',
    '4. Run Stages 01-08 in dry-run mode first.',
    '5. Review blocked venues and missing hero images before any apply.',
    '6. Apply only approved venues to staging.',
    '7. Do not publish to `public.venues` until image rights and editorial review are complete.',
    '',
    'Ready for 50 venues means Stage 08 apply is idempotent, reports are clear, failed venues do not block valid venues, skipped venues have actionable reasons, no public tables are touched, and image rights remain blocked for publication.',
  ];
}

function buildReportMarkdown(dryRun: SupabaseStagingDryRun): string {
  const lines = [
    '# Supabase Staging Dry Run Report',
    '',
    '## Summary',
    '',
    `- Batch id: ${dryRun.batch_id}`,
    `- Approved count: ${dryRun.approved_count}`,
    `- Blocked count: ${dryRun.blocked_count}`,
    `- Dry-run only: ${dryRun.dry_run_only ? 'yes' : 'no'}`,
    `- venue_images conflict key: ${dryRun.apply_preflight.venue_images_conflict_key}`,
    `- venue_atmosphere excluded from apply: ${dryRun.apply_preflight.venue_atmosphere_excluded_from_apply ? 'yes' : 'no'}`,
    `- Apply idempotent after required index: ${dryRun.apply_preflight.apply_idempotent_after_index ? 'yes' : 'no'}`,
    '',
    '## Required Unique Index',
    '',
    `- Verified through schema introspection: ${dryRun.apply_preflight.required_unique_index_verified ? 'yes' : 'no'}`,
    `- Manually assumed: ${dryRun.apply_preflight.required_unique_index_assumed ? 'yes' : 'no'}`,
    `- Note: ${dryRun.apply_preflight.required_unique_index_note}`,
    '',
    '```sql',
    dryRun.apply_preflight.required_unique_index_sql,
    '```',
    '',
    '## Partial Write Detection',
    '',
    `- Checked: ${dryRun.apply_preflight.partial_writes_detected.checked ? 'yes' : 'no'}`,
    `- Partial writes detected: ${dryRun.apply_preflight.partial_writes_detected.partial_writes_detected ? 'yes' : 'no'}`,
    `- staging_venues rows for batch: ${dryRun.apply_preflight.partial_writes_detected.staging_venues_for_batch}`,
    `- venue_images rows for approved venues: ${dryRun.apply_preflight.partial_writes_detected.venue_images_for_approved_venues}`,
    `- selected hero image rows for approved venues: ${dryRun.apply_preflight.partial_writes_detected.selected_hero_images_for_approved_venues}`,
    `- quality_scores rows for approved venues: ${dryRun.apply_preflight.partial_writes_detected.quality_scores_for_approved_venues}`,
    ...dryRun.apply_preflight.partial_writes_detected.notes.map((note) => `- ${note}`),
    '',
    '## Schema Compatibility',
    '',
    `- Read-only live probe attempted: ${dryRun.schema_compatibility.read_only_live_probe_attempted ? 'yes' : 'no'}`,
    `- Read-only live probe succeeded: ${dryRun.schema_compatibility.read_only_live_probe_succeeded ? 'yes' : 'no'}`,
    '',
    '| Table | Found | Columns Found | Missing Columns | Fallback Decision |',
    '| --- | --- | --- | --- | --- |',
    ...dryRun.schema_compatibility.tables.map((table) =>
      `| ${table.table} | ${table.found ? 'yes' : 'no'} | ${table.columns_found.join(', ') || 'none'} | ${table.missing_columns.join(', ') || 'none'} | ${escapeTable(table.fallback_decision)} |`,
    ),
    '',
    '## Venue Mapping',
    '',
    ...dryRun.venue_mappings.map((venue) =>
      `- ${venue.venue_name}: target ${venue.target_staging_id}; category ${venue.category}; neighborhood ${venue.neighborhood}; hero ${venue.hero_image_reference || 'none'}; image rights ${venue.image_rights_status}; writes ${venue.intended_writes.map((write) => write.table).join(', ')}; warnings ${venue.warnings.join(', ') || 'none'}`,
    ),
    '',
    '## Skipped Venues',
    '',
    ...(dryRun.skipped_venues.length > 0
      ? dryRun.skipped_venues.map((venue) => `- ${venue.venue_name}: ${venue.reasons.join(', ')}`)
      : ['- none']),
    '',
    '## Safety Checks',
    '',
    ...Object.entries(dryRun.safety_checks).map(([key, value]) => `- ${key}: ${value ? 'yes' : 'no'}`),
    '',
    ...stage08ExplanationLines(),
    '',
    ...scaleToFiftyPlanLines(),
  ];

  return `${lines.join('\n')}\n`;
}

function normalizeVenueName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function normalizeCity(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function slugify(value: string): string {
  return normalizeVenueName(value).replace(/\s+/g, '-');
}

function wordCount(value: string): number {
  return value.trim() ? value.trim().split(/\s+/).length : 0;
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, 'utf8')) as T;
}

function escapeTable(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

const currentFile = path.resolve(fileURLToPath(import.meta.url));
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : '';

if (currentFile === invokedFile) {
  const batchName = process.argv[2];
  if (!batchName) {
    console.error('Usage: npx tsx pipeline/stages/08_sync_supabase_staging.ts <batch_id> [--dry-run|--apply]');
    process.exitCode = 1;
  } else {
    runSupabaseStagingDryRun(batchName, process.argv.slice(3)).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Supabase staging sync failed: ${message}`);
      process.exitCode = 1;
    });
  }
}
