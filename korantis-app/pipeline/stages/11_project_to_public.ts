import { existsSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { loadLocalEnv } from './01_extract_data';
import type { BatchResult, ImageCandidate, ReviewQueueItem, VenueComplete } from '../types';

type PublicationDecision = 'approve' | 'reject' | 'pause';

interface PublicationDecisionRecord {
  venue_name: string;
  current_status: string;
  publication_decision: PublicationDecision;
  publish_eligible: boolean;
  default_reason?: string;
  reviewer_notes?: string;
  staging_score: number;
  blockers: string[];
  warnings: string[];
  hero_image_url?: string;
  image_source_type?: string;
  image_publication_status?: string;
  source_url?: string;
}

interface PublicationDecisionManifest {
  batch_id: string;
  generated_at: string;
  status: string;
  decisions: PublicationDecisionRecord[];
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

interface PublicProjectionWrite {
  table: 'venues' | 'venue_images';
  operation: 'upsert';
  unique_key: string;
  fields_to_write: Record<string, unknown>;
  source_fields: Record<string, string>;
  transformation_logic: string[];
  fields_skipped: Array<{
    field: string;
    reason: string;
  }>;
}

interface PublicVenueProjection {
  venue_name: string;
  decision: PublicationDecision;
  reviewer_notes: string;
  target_public_venue_id: string;
  source_staging_status: string;
  source_staging_score: number;
  hero_image_url: string;
  hero_image_rights_status: string;
  public_payload_preview: Record<string, unknown>;
  image_payload_preview: Record<string, unknown>;
  intended_writes: PublicProjectionWrite[];
  warnings: string[];
  apply_blockers: string[];
}

interface SkippedDecision {
  venue_name: string;
  decision: PublicationDecision;
  reasons: string[];
}

interface PublicProjectionDryRun {
  batch_id: string;
  generated_at: string;
  mode: 'dry_run';
  stage_10_decision_validation: {
    reviewed_manifest_path: string;
    total_decisions: number;
    approved_decisions: number;
    paused_decisions: number;
    rejected_decisions: number;
    invalid_approved_decisions: number;
  };
  stage_11_public_projection: {
    intended_public_venue_writes: number;
    intended_venue_image_writes: number;
    approved_projected: number;
    skipped_count: number;
  };
  schema_compatibility: {
    read_only_live_probe_attempted: boolean;
    read_only_live_probe_succeeded: boolean;
    tables: TableCompatibility[];
  };
  approved_venue_mappings: PublicVenueProjection[];
  skipped_decisions: SkippedDecision[];
  blockers_before_apply: string[];
  safety_checks: Record<string, boolean>;
}

interface CloudinaryAsset {
  venue_name: string;
  target_public_venue_id: string;
  role: 'hero';
  source_url: string;
  cloudinary_public_id: string;
  secure_url?: string;
  url?: string;
  width?: number;
  height?: number;
  status: 'uploaded' | 'skipped_existing' | 'dry_run' | 'error';
}

interface CloudinaryPublicAssets {
  batch_id: string;
  assets: CloudinaryAsset[];
}

interface PublicProjectionApplyResult {
  batch_id: string;
  generated_at: string;
  mode: 'apply';
  approved_projected: number;
  intended_write_count: number;
  table_results: Array<{
    table: 'venues' | 'venue_images';
    operation: 'upsert';
    attempted_rows: number;
    affected_rows: number;
  }>;
  venue_ids_written: string[];
  skipped_decisions: SkippedDecision[];
  blockers_before_apply: string[];
  safety_checks: Record<string, boolean>;
}

const TARGET_TABLE_COLUMNS: Record<'venues' | 'venue_images', string[]> = {
  venues: [
    'id',
    'name',
    'city',
    'category',
    'location',
    'coordinates',
    'card_size',
    'spacing',
    'hero_image',
    'atmosphere',
    'quality',
    'tagline',
    'narrative',
    'tags',
    'curation_status',
    'taste_vector',
    'publication_metadata',
  ],
  venue_images: [
    'id',
    'venue_id',
    'photo_reference',
    'google_photo_reference',
    'width',
    'height',
    'is_cover',
    'role',
    'sort_order',
    'url',
    'secure_url',
    'public_id',
    'source',
    'status',
    'rights_status',
    'is_selected_hero',
    'selection_data',
  ],
};

export async function projectToPublicDryRun(batchName: string, args: string[]): Promise<PublicProjectionDryRun | PublicProjectionApplyResult> {
  if (args.includes('--apply') && args.includes('--dry-run')) {
    throw new Error('Stage 11 received both --apply and --dry-run. Choose exactly one mode.');
  }

  loadLocalEnv();

  const apply = args.includes('--apply');
  const outputDir = path.join(process.cwd(), 'data', 'batches', batchName);
  const reviewedManifestPath = path.join(outputDir, 'publication_decision_manifest.reviewed.json');
  const manifest = readJson<PublicationDecisionManifest>(reviewedManifestPath);
  const batchResult = readJson<BatchResult>(path.join(outputDir, 'batch_result_quality_gated.json'));
  const cloudinaryAssets = readCloudinaryAssets(outputDir);
  const schemaCompatibility = await probeSchemaCompatibility();
  const candidateByName = new Map(batchResult.candidates.map((candidate) => [normalizeName(candidate.venue_name), candidate]));

  const approvedMappings: PublicVenueProjection[] = [];
  const skippedDecisions: SkippedDecision[] = [];

  for (const decision of manifest.decisions) {
    const candidate = candidateByName.get(normalizeName(decision.venue_name));
    const skipReasons = validateDecisionForProjection(decision, candidate);
    if (decision.publication_decision !== 'approve' || skipReasons.length > 0 || !candidate) {
      skippedDecisions.push({
        venue_name: decision.venue_name,
        decision: decision.publication_decision,
        reasons: decision.publication_decision === 'approve' ? skipReasons : [`decision_${decision.publication_decision}`],
      });
      continue;
    }

    approvedMappings.push(buildPublicProjection(candidate, decision, schemaCompatibility.tables, cloudinaryAssets));
  }

  const approvedDecisionCount = manifest.decisions.filter((decision) => decision.publication_decision === 'approve').length;
  const dryRun: PublicProjectionDryRun = {
    batch_id: manifest.batch_id,
    generated_at: new Date().toISOString(),
    mode: 'dry_run',
    stage_10_decision_validation: {
      reviewed_manifest_path: reviewedManifestPath,
      total_decisions: manifest.decisions.length,
      approved_decisions: approvedDecisionCount,
      paused_decisions: manifest.decisions.filter((decision) => decision.publication_decision === 'pause').length,
      rejected_decisions: manifest.decisions.filter((decision) => decision.publication_decision === 'reject').length,
      invalid_approved_decisions: skippedDecisions.filter((decision) => decision.decision === 'approve').length,
    },
    stage_11_public_projection: {
      intended_public_venue_writes: approvedMappings.length,
      intended_venue_image_writes: approvedMappings.filter((mapping) => Boolean(mapping.hero_image_url)).length,
      approved_projected: approvedMappings.length,
      skipped_count: skippedDecisions.length,
    },
    schema_compatibility: schemaCompatibility,
    approved_venue_mappings: approvedMappings,
    skipped_decisions: skippedDecisions,
    blockers_before_apply: buildApplyBlockers(approvedMappings, schemaCompatibility.tables),
    safety_checks: {
      no_supabase_writes: true,
      no_public_venues_writes: true,
      no_cloudinary_uploads: true,
      no_image_rights_approval: true,
      no_external_model_calls: true,
      no_consumer_ui_changes: true,
      no_deploy: true,
      apply_disabled: true,
    },
  };

  if (apply) {
    return await applyPublicProjection(outputDir, dryRun);
  }

  writeFileSync(path.join(outputDir, 'public_projection_dry_run.json'), `${JSON.stringify(dryRun, null, 2)}\n`, 'utf8');
  writeFileSync(path.join(outputDir, 'public_projection_mapping.md'), buildMappingMarkdown(dryRun), 'utf8');
  writeFileSync(path.join(outputDir, 'public_projection_report.md'), buildReportMarkdown(dryRun), 'utf8');

  console.log(`Public projection dry-run JSON written to ${path.join(outputDir, 'public_projection_dry_run.json')}`);
  console.log(`Public projection mapping written to ${path.join(outputDir, 'public_projection_mapping.md')}`);
  console.log(`Public projection report written to ${path.join(outputDir, 'public_projection_report.md')}`);
  console.log(
    `Stage 10/11 dry-run summary: approved_projected=${approvedMappings.length}, paused=${dryRun.stage_10_decision_validation.paused_decisions}, rejected=${dryRun.stage_10_decision_validation.rejected_decisions}, skipped=${skippedDecisions.length}`,
  );

  return dryRun;
}

function validateDecisionForProjection(
  decision: PublicationDecisionRecord,
  candidate: ReviewQueueItem | undefined,
): string[] {
  const reasons: string[] = [];
  if (!candidate) reasons.push('venue_not_found_in_batch_result_quality_gated');
  if (!decision.publish_eligible) reasons.push('decision_not_publish_eligible');
  if (decision.blockers.length > 0) reasons.push(`decision_has_blockers:${decision.blockers.join('|')}`);
  if (candidate && candidate.status !== 'ready_for_db_staging') reasons.push(`candidate_status_${candidate.status}`);
  if (candidate && candidate.errors.length > 0) reasons.push(`candidate_has_errors:${candidate.errors.join('|')}`);
  const hero = candidate ? getHero(candidate.venue) : null;
  if (!hero?.resolved_image_url) reasons.push('missing_hero_image_url');
  if (decision.image_publication_status === 'approved_for_publication') reasons.push('unexpected_preapproved_image_rights_status');
  return reasons;
}

function buildPublicProjection(
  candidate: ReviewQueueItem,
  decision: PublicationDecisionRecord,
  tables: TableCompatibility[],
  cloudinaryAssets: Map<string, CloudinaryAsset>,
): PublicVenueProjection {
  const tableByName = new Map(tables.map((table) => [table.table, table]));
  const venue = candidate.venue;
  const hero = getHero(venue);
  if (!hero) throw new Error(`Approved venue ${candidate.venue_name} has no hero image after validation.`);
  const publicVenueId = buildPublicVenueId(venue);
  const rightsStatus = derivePublicRightsStatus(hero);
  const cloudinaryAsset = cloudinaryAssets.get(publicVenueId) || cloudinaryAssets.get(normalizeName(candidate.venue_name));
  const publicPayload = buildPublicVenuePayload(publicVenueId, candidate, decision, hero, cloudinaryAsset);
  const imagePayload = buildPublicHeroImagePayload(publicVenueId, candidate, hero, rightsStatus, cloudinaryAsset);
  const applyBlockers = [
    'manual_confirmation_required_before_public_venues_write',
    ...(cloudinaryAsset?.secure_url ? [] : ['cloudinary_materialization_missing_for_approved_hero']),
  ];

  return {
    venue_name: candidate.venue_name,
    decision: decision.publication_decision,
    reviewer_notes: decision.reviewer_notes || '',
    target_public_venue_id: publicVenueId,
    source_staging_status: candidate.status,
    source_staging_score: candidate.staging_score,
    hero_image_url: cloudinaryAsset?.secure_url || hero.resolved_image_url,
    hero_image_rights_status: rightsStatus,
    public_payload_preview: publicPayload,
    image_payload_preview: imagePayload,
    intended_writes: [
      buildWrite('venues', 'upsert', 'id', publicPayload, tableByName.get('venues'), {
        id: 'deterministic city/name/place_id slug',
        name: 'VenueComplete.raw.name',
        city: 'VenueComplete.raw.city',
        category: 'VenueComplete.raw.type',
        location: 'VenueComplete.raw.neighborhood + city',
        coordinates: 'VenueComplete.raw.coordinates',
        hero_image: 'VenueComplete.hero_image.resolved_image_url',
        atmosphere: 'VenueComplete.hero_image.classification.atmosphere_signal mapped to public atmosphere',
        quality: 'quality_gate.staging_score / 100',
        tagline: 'VenueComplete.editorial.tagline',
        narrative: 'VenueComplete.editorial.description',
        tags: 'VenueComplete.editorial.mood_tags',
        curation_status: 'reviewed publication_decision approve -> pending_review public gate',
      }),
      buildWrite('venue_images', 'upsert', 'id', imagePayload, tableByName.get('venue_images'), {
        id: 'deterministic public venue hero image id',
        venue_id: 'projected public venue id',
        url: 'VenueComplete.hero_image.resolved_image_url',
        width: 'VenueComplete.hero_image.width',
        height: 'VenueComplete.hero_image.height',
        source: 'VenueComplete.hero_image.source_type',
        rights_status: 'derived public traceability status, not owned/approved rights',
        selection_data: 'Stage 04 vision/selection metadata and Stage 09 reviewer decision',
      }),
    ],
    warnings: [
      ...candidate.warnings,
      ...decision.warnings,
      'Dry-run only: curation_status pending_review keeps projected public rows hidden until a later activation step.',
      'Image rights are traceable/source-attributed, not owned or auto-approved.',
    ],
    apply_blockers: applyBlockers,
  };
}

function buildPublicVenuePayload(
  publicVenueId: string,
  candidate: ReviewQueueItem,
  decision: PublicationDecisionRecord,
  hero: ImageCandidate,
  cloudinaryAsset?: CloudinaryAsset,
): Record<string, unknown> {
  const venue = candidate.venue;
  const heroUrl = cloudinaryAsset?.secure_url || hero.resolved_image_url;
  return {
    id: publicVenueId,
    name: venue.raw.name,
    city: venue.raw.city,
    category: venue.raw.type || 'unknown',
    location: [venue.raw.neighborhood || venue.raw.input.neighborhood, venue.raw.city].filter(Boolean).join(', '),
    coordinates: venue.raw.coordinates || null,
    card_size: chooseCardSize(candidate),
    spacing: 'breathe',
    hero_image: heroUrl,
    atmosphere: mapPublicAtmosphere(hero.classification?.atmosphere_signal),
    quality: round(candidate.staging_score / 100, 2),
    tagline: venue.editorial.tagline || '',
    narrative: venue.editorial.description || venue.editorial.description_short || '',
    tags: buildPublicTags(venue),
    curation_status: 'pending_review',
    taste_vector: null,
    publication_metadata: {
      batch_id: candidate.batch_id,
      source_place_id: venue.raw.place_id,
      source_google_maps_url: venue.raw.google_maps_url,
      source_website_url: venue.raw.website_url,
      reviewer_decision: decision.publication_decision,
      reviewer_notes: decision.reviewer_notes || '',
      cloudinary_public_id: cloudinaryAsset?.cloudinary_public_id || null,
      image_source_url: hero.resolved_image_url,
      projected_at: new Date().toISOString(),
      projection_status: 'pending_review_not_public',
    },
  };
}

function buildPublicHeroImagePayload(
  publicVenueId: string,
  candidate: ReviewQueueItem,
  hero: ImageCandidate,
  rightsStatus: string,
  cloudinaryAsset?: CloudinaryAsset,
): Record<string, unknown> {
  const imageUrl = cloudinaryAsset?.secure_url || hero.resolved_image_url;
  return {
    id: `${publicVenueId}_hero`,
    venue_id: publicVenueId,
    photo_reference: buildStablePhotoReference(publicVenueId, hero),
    google_photo_reference: hero.source_type === 'google_places' ? hero.original_image_url || hero.source_url || null : null,
    width: hero.width,
    height: hero.height,
    is_cover: true,
    role: 'hero',
    sort_order: 0,
    url: imageUrl,
    secure_url: cloudinaryAsset?.secure_url || null,
    public_id: cloudinaryAsset?.cloudinary_public_id || null,
    source: hero.source_type,
    status: 'mvp_public_reference',
    rights_status: rightsStatus,
    is_selected_hero: true,
    selection_data: {
      batch_id: candidate.batch_id,
      source_url: hero.source_url,
      resolved_image_url: hero.resolved_image_url,
      source_type: hero.source_type,
      rights_risk: hero.rights_risk,
      rights_hint: hero.rights_hint,
      risk_flags: hero.risk_flags || [],
      publication_status_from_pipeline: hero.publication_status || 'not_approved_for_publication',
      classification: hero.classification || null,
      attribution_required: hero.source_type === 'google_places',
      attribution_label: hero.source_type === 'google_places' ? 'Google Places' : hero.source_type,
      cloudinary_materialized: Boolean(cloudinaryAsset?.secure_url),
      original_source_url: hero.resolved_image_url,
      projection_status: 'pending_review_not_public',
    },
  };
}

function buildWrite(
  tableName: 'venues' | 'venue_images',
  operation: 'upsert',
  uniqueKey: string,
  payload: Record<string, unknown>,
  table: TableCompatibility | undefined,
  sourceFields: Record<string, string>,
): PublicProjectionWrite {
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
    operation,
    unique_key: uniqueKey,
    fields_to_write: fieldsToWrite,
    source_fields: sourceFields,
    transformation_logic: [
      'No write performed; payload is a deterministic public projection dry-run.',
      'Only publication_decision_manifest.reviewed.json approve decisions are projected.',
      'Paused, rejected, blocked, and ineligible decisions are skipped.',
      'Image rights are preserved as traceability status and are not marked approved_for_publication.',
    ],
    fields_skipped: fieldsSkipped,
  };
}

async function probeSchemaCompatibility(): Promise<PublicProjectionDryRun['schema_compatibility']> {
  const supabase = createSupabaseReadOnlyClient();
  if (!supabase) {
    return {
      read_only_live_probe_attempted: false,
      read_only_live_probe_succeeded: false,
      tables: Object.entries(TARGET_TABLE_COLUMNS).map(([table, columns]) => ({
        table,
        found: false,
        columns_found: [],
        missing_columns: columns,
        checked_columns: columns.map((column) => ({ column, found: false })),
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
      fallback_decision: fallbackDecision(table, found, missingColumns),
    });
  }

  return {
    read_only_live_probe_attempted: true,
    read_only_live_probe_succeeded: tables.some((table) => table.found),
    tables,
  };
}

function createSupabaseReadOnlyClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function createSupabaseApplyClient(): SupabaseClient | null {
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

async function applyPublicProjection(outputDir: string, dryRun: PublicProjectionDryRun): Promise<PublicProjectionApplyResult> {
  const blockers = validateApplyPreflight(dryRun);
  if (blockers.length > 0) {
    throw new Error(`Stage 11 apply aborted:\n- ${blockers.join('\n- ')}`);
  }

  const supabase = createSupabaseApplyClient();
  if (!supabase) throw new Error('Stage 11 apply requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL.');

  const venueRows = dryRun.approved_venue_mappings.map((mapping) => mapping.intended_writes.find((write) => write.table === 'venues')?.fields_to_write).filter((row): row is Record<string, unknown> => Boolean(row));
  const imageRows = dryRun.approved_venue_mappings.map((mapping) => mapping.intended_writes.find((write) => write.table === 'venue_images')?.fields_to_write).filter((row): row is Record<string, unknown> => Boolean(row));
  const tableResults: PublicProjectionApplyResult['table_results'] = [];

  if (venueRows.length > 0) {
    const { data, error } = await supabase.from('venues').upsert(venueRows, { onConflict: 'id' }).select('id');
    if (error) throw new Error(`Stage 11 venues upsert failed: ${error.message}`);
    tableResults.push({
      table: 'venues',
      operation: 'upsert',
      attempted_rows: venueRows.length,
      affected_rows: Array.isArray(data) ? data.length : venueRows.length,
    });
  }

  const imageResult = await upsertVenueImagesByVenueRole(supabase, imageRows);
  if (imageRows.length > 0) {
    tableResults.push({
      table: 'venue_images',
      operation: 'upsert',
      attempted_rows: imageRows.length,
      affected_rows: imageResult,
    });
  }

  const applyResult: PublicProjectionApplyResult = {
    batch_id: dryRun.batch_id,
    generated_at: new Date().toISOString(),
    mode: 'apply',
    approved_projected: dryRun.approved_venue_mappings.length,
    intended_write_count: venueRows.length + imageRows.length,
    table_results: tableResults,
    venue_ids_written: dryRun.approved_venue_mappings.map((mapping) => mapping.target_public_venue_id),
    skipped_decisions: dryRun.skipped_decisions,
    blockers_before_apply: [],
    safety_checks: {
      no_public_activation: true,
      all_rows_inserted_pending_review: true,
      no_cloudinary_uploads_in_stage_11: true,
      no_external_model_calls: true,
      no_consumer_ui_changes: true,
      no_deploy: true,
    },
  };

  writeFileSync(path.join(outputDir, 'public_projection_apply_result.json'), `${JSON.stringify(applyResult, null, 2)}\n`, 'utf8');
  writeFileSync(path.join(outputDir, 'public_projection_apply_report.md'), buildApplyReportMarkdown(applyResult), 'utf8');
  console.log(`Public projection apply result written to ${path.join(outputDir, 'public_projection_apply_result.json')}`);
  console.log(`Public projection apply report written to ${path.join(outputDir, 'public_projection_apply_report.md')}`);
  console.log(`Stage 11 apply summary: venues=${venueRows.length}, images=${imageRows.length}, curation_status=pending_review`);
  return applyResult;
}

async function upsertVenueImagesByVenueRole(supabase: SupabaseClient, imageRows: Record<string, unknown>[]): Promise<number> {
  let affected = 0;
  for (const row of imageRows) {
    const insertable = { ...row };
    delete insertable.id;
    const venueId = String(row.venue_id || '');
    const role = String(row.role || 'hero');
    if (!venueId) throw new Error('Stage 11 venue_images apply found image row without venue_id.');

    const existing = await supabase
      .from('venue_images')
      .select('id')
      .eq('venue_id', venueId)
      .eq('role', role)
      .limit(1);
    if (existing.error) throw new Error(`Stage 11 venue_images lookup failed: ${existing.error.message}`);

    const existingId = existing.data?.[0]?.id as string | undefined;
    if (existingId) {
      const { error } = await supabase.from('venue_images').update(insertable).eq('id', existingId);
      if (error) throw new Error(`Stage 11 venue_images update failed: ${error.message}`);
      affected += 1;
    } else {
      const { error } = await supabase.from('venue_images').insert(insertable);
      if (error) throw new Error(`Stage 11 venue_images insert failed: ${error.message}`);
      affected += 1;
    }
  }
  return affected;
}

function validateApplyPreflight(dryRun: PublicProjectionDryRun): string[] {
  const blockers: string[] = [];
  if (dryRun.approved_venue_mappings.length === 0) blockers.push('No approved venues projected.');
  const tableByName = new Map(dryRun.schema_compatibility.tables.map((table) => [table.table, table]));
  for (const tableName of ['venues', 'venue_images']) {
    const table = tableByName.get(tableName);
    if (!table?.found) blockers.push(`Required table missing/unreadable: ${tableName}.`);
  }
  const missingRequired = dryRun.schema_compatibility.tables.flatMap((table) => {
    if (!table.found) return [];
    if (table.table === 'venues') return ['id', 'name', 'coordinates', 'curation_status'].filter((column) => !table.columns_found.includes(column)).map((column) => `${table.table}.${column}`);
    if (table.table === 'venue_images') return ['id', 'venue_id', 'url', 'secure_url', 'public_id', 'role'].filter((column) => !table.columns_found.includes(column)).map((column) => `${table.table}.${column}`);
    return [];
  });
  if (missingRequired.length > 0) blockers.push(`Required apply columns missing: ${missingRequired.join(', ')}.`);
  const nonPending = dryRun.approved_venue_mappings.filter((mapping) => mapping.public_payload_preview.curation_status !== 'pending_review');
  if (nonPending.length > 0) blockers.push(`Apply would write non-pending_review rows: ${nonPending.map((mapping) => mapping.venue_name).join(', ')}.`);
  const missingCloudinary = dryRun.approved_venue_mappings.filter((mapping) => !String(mapping.image_payload_preview.secure_url || '').startsWith('https://res.cloudinary.com/'));
  if (missingCloudinary.length > 0) blockers.push(`Missing Cloudinary secure_url for approved venues: ${missingCloudinary.map((mapping) => mapping.venue_name).join(', ')}.`);
  return blockers;
}

async function tableExists(supabase: SupabaseClient, table: string): Promise<boolean> {
  const { error } = await supabase.from(table).select('*', { count: 'exact', head: true }).limit(1);
  return !error;
}

async function columnExists(supabase: SupabaseClient, table: string, column: string): Promise<boolean> {
  const { error } = await supabase.from(table).select(column, { count: 'exact', head: true }).limit(1);
  return !error;
}

function fallbackDecision(table: string, found: boolean, missingColumns: string[]): string {
  if (!found) return 'Do not apply public projection until this table exists or is readable.';
  if (missingColumns.length === 0) return 'All expected public projection columns found.';
  return `Dry-run maps found columns only; apply would need a conscious decision for missing columns: ${missingColumns.join(', ')}.`;
}

function buildApplyBlockers(mappings: PublicVenueProjection[], tables: TableCompatibility[]): string[] {
  const blockers = [
    'Manual final approval is required before any public venues write.',
    'Projected public venues must be inserted as curation_status pending_review; activation to active must be a separate later step.',
  ];
  const missingTables = tables.filter((table) => !table.found).map((table) => table.table);
  if (missingTables.length > 0) blockers.push(`Live schema missing/unreadable tables: ${missingTables.join(', ')}.`);
  const missingRequired = tables.flatMap((table) => {
    if (!table.found) return [];
    if (table.table === 'venues') return ['id', 'name', 'coordinates', 'curation_status'].filter((column) => !table.columns_found.includes(column)).map((column) => `${table.table}.${column}`);
    if (table.table === 'venue_images') return ['id', 'venue_id', 'url', 'role'].filter((column) => !table.columns_found.includes(column)).map((column) => `${table.table}.${column}`);
    return [];
  });
  if (missingRequired.length > 0) blockers.push(`Required public apply columns missing: ${missingRequired.join(', ')}.`);
  const missingCloudinary = mappings.filter((mapping) => !String(mapping.image_payload_preview.secure_url || '').startsWith('https://res.cloudinary.com/'));
  if (missingCloudinary.length > 0) blockers.push(`Cloudinary materialization missing for ${missingCloudinary.length} approved venue hero image(s).`);
  if (mappings.length === 0) blockers.push('No approved venues projected.');
  return blockers;
}

function buildApplyReportMarkdown(result: PublicProjectionApplyResult): string {
  return [
    `# Stage 11 Public Projection Apply - ${result.batch_id}`,
    '',
    `- Generated: ${result.generated_at}`,
    `- Approved projected: ${result.approved_projected}`,
    `- Intended writes: ${result.intended_write_count}`,
    `- Venue ids written: ${result.venue_ids_written.length}`,
    `- Public activation: false`,
    `- Curation status written: pending_review`,
    '',
    '## Table Results',
    '',
    '| Table | Operation | Attempted | Affected |',
    '| --- | --- | --- | --- |',
    ...result.table_results.map((table) => `| ${table.table} | ${table.operation} | ${table.attempted_rows} | ${table.affected_rows} |`),
    '',
    '## Safety',
    '',
    ...Object.entries(result.safety_checks).map(([check, value]) => `- ${check}: ${value}`),
  ].join('\n');
}

function buildMappingMarkdown(dryRun: PublicProjectionDryRun): string {
  const lines = [
    `# Stage 10/11 Public Projection Mapping - ${dryRun.batch_id}`,
    '',
    'Mode: dry-run only. No public write, no Supabase write, no Cloudinary upload.',
    '',
    '## Summary',
    '',
    `- Approved projected: ${dryRun.stage_11_public_projection.approved_projected}`,
    `- Paused skipped: ${dryRun.stage_10_decision_validation.paused_decisions}`,
    `- Rejected skipped: ${dryRun.stage_10_decision_validation.rejected_decisions}`,
    `- Invalid approved skipped: ${dryRun.stage_10_decision_validation.invalid_approved_decisions}`,
    '',
    '## Intended Public Writes',
    '',
  ];

  for (const mapping of dryRun.approved_venue_mappings) {
    lines.push(`### ${mapping.venue_name}`);
    lines.push('');
    lines.push(`- Target public venue id: \`${mapping.target_public_venue_id}\``);
    lines.push(`- Staging score: ${mapping.source_staging_score}`);
    lines.push(`- Hero image: ${mapping.hero_image_url}`);
    lines.push(`- Image rights status: ${mapping.hero_image_rights_status}`);
    lines.push(`- Public curation status preview: \`${String(mapping.public_payload_preview.curation_status)}\``);
    lines.push(`- Tagline: ${mapping.public_payload_preview.tagline || ''}`);
    lines.push(`- Tags: ${Array.isArray(mapping.public_payload_preview.tags) ? mapping.public_payload_preview.tags.join(', ') : ''}`);
    lines.push('');
    lines.push('| Table | Operation | Unique key | Fields |');
    lines.push('| --- | --- | --- | --- |');
    for (const write of mapping.intended_writes) {
      lines.push(`| ${write.table} | ${write.operation} | ${write.unique_key} | ${Object.keys(write.fields_to_write).join(', ')} |`);
    }
    lines.push('');
  }

  lines.push('## Skipped Decisions');
  lines.push('');
  for (const skipped of dryRun.skipped_decisions) {
    lines.push(`- ${skipped.venue_name}: ${skipped.reasons.join(', ')}`);
  }

  return `${lines.join('\n')}\n`;
}

function buildReportMarkdown(dryRun: PublicProjectionDryRun): string {
  const detectedTables = dryRun.schema_compatibility.tables.filter((table) => table.found).map((table) => table.table);
  return [
    `# Stage 10/11 Public Projection Dry Run - ${dryRun.batch_id}`,
    '',
    '## Summary',
    '',
    `- Generated at: ${dryRun.generated_at}`,
    `- Total reviewed decisions: ${dryRun.stage_10_decision_validation.total_decisions}`,
    `- Approved projected: ${dryRun.stage_11_public_projection.approved_projected}`,
    `- Paused skipped: ${dryRun.stage_10_decision_validation.paused_decisions}`,
    `- Rejected skipped: ${dryRun.stage_10_decision_validation.rejected_decisions}`,
    `- Invalid approved skipped: ${dryRun.stage_10_decision_validation.invalid_approved_decisions}`,
    `- Intended venues writes: ${dryRun.stage_11_public_projection.intended_public_venue_writes}`,
    `- Intended venue_images writes: ${dryRun.stage_11_public_projection.intended_venue_image_writes}`,
    '',
    '## Schema Compatibility',
    '',
    `- Read-only live probe attempted: ${dryRun.schema_compatibility.read_only_live_probe_attempted}`,
    `- Read-only live probe succeeded: ${dryRun.schema_compatibility.read_only_live_probe_succeeded}`,
    `- Tables detected: ${detectedTables.join(', ') || 'none'}`,
    '',
    ...dryRun.schema_compatibility.tables.flatMap((table) => [
      `### ${table.table}`,
      '',
      `- Found: ${table.found}`,
      `- Columns found: ${table.columns_found.join(', ') || 'none'}`,
      `- Missing columns: ${table.missing_columns.join(', ') || 'none'}`,
      `- Decision: ${table.fallback_decision}`,
      '',
    ]),
    '## Blockers Before Real Apply',
    '',
    ...dryRun.blockers_before_apply.map((blocker) => `- ${blocker}`),
    '',
    '## Safety Confirmations',
    '',
    ...Object.entries(dryRun.safety_checks).map(([check, value]) => `- ${check}: ${value}`),
    '',
    '## Next Step',
    '',
    'Review `public_projection_mapping.md`. A future apply stage must be explicitly enabled before any public write.',
  ].join('\n');
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, 'utf8')) as T;
}

function readCloudinaryAssets(outputDir: string): Map<string, CloudinaryAsset> {
  const filePath = path.join(outputDir, 'cloudinary_public_assets.json');
  if (!existsSync(filePath)) return new Map();
  const payload = readJson<CloudinaryPublicAssets>(filePath);
  const map = new Map<string, CloudinaryAsset>();
  for (const asset of payload.assets || []) {
    if (!asset.secure_url) continue;
    map.set(asset.target_public_venue_id, asset);
    map.set(normalizeName(asset.venue_name), asset);
  }
  return map;
}

function getHero(venue: VenueComplete): ImageCandidate | null {
  return venue.hero_image || venue.images.hero || null;
}

function buildPublicTags(venue: VenueComplete): string[] {
  return [...new Set([
    ...(venue.editorial.mood_tags || []),
    venue.raw.type || '',
    venue.raw.neighborhood || venue.raw.input.neighborhood || '',
  ].filter(Boolean))].slice(0, 8);
}

function buildPublicVenueId(venue: VenueComplete): string {
  const city = slugify(venue.raw.city || 'unknown_city');
  const name = slugify(venue.raw.name);
  const place = venue.raw.place_id ? slugify(venue.raw.place_id).slice(0, 12) : '';
  return ['korantis', city, name, place].filter(Boolean).join('_').slice(0, 120);
}

function buildStablePhotoReference(publicVenueId: string, hero: ImageCandidate): string {
  if (hero.sha256) return hero.sha256;
  if (hero.original_image_url) return hero.original_image_url;
  if (hero.resolved_image_url) return hero.resolved_image_url;
  return `${publicVenueId}:hero:0`;
}

function derivePublicRightsStatus(hero: ImageCandidate): string {
  if (hero.source_type === 'google_places') return 'google_places_sourced_attribution_required';
  if (hero.source_type === 'official_website' || hero.source_type === 'official_gallery') return 'venue_controlled_source_review_required';
  return 'source_review_required';
}

function chooseCardSize(candidate: ReviewQueueItem): string {
  if (candidate.staging_score >= 95) return 'immersive';
  if (candidate.staging_score >= 85) return 'cinematic';
  return 'layered';
}

function mapPublicAtmosphere(signal: string | undefined): string {
  if (!signal) return 'night';
  if (signal.includes('dark') || signal.includes('intimate')) return 'night';
  if (signal.includes('warm') || signal.includes('cozy')) return 'golden-hour';
  if (signal.includes('bright') || signal.includes('airy')) return 'afternoon';
  if (signal.includes('energetic')) return 'late-night';
  return 'night';
}

function normalizeName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function slugify(value: string): string {
  return normalizeName(value).replace(/\s+/g, '_') || 'unknown';
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

const isDirectRun = process.argv[1] ? fileURLToPath(import.meta.url) === path.resolve(process.argv[1]) : false;

if (isDirectRun) {
  const [, , batchName, ...args] = process.argv;
  if (!batchName) {
    console.error('Usage: npx tsx pipeline/stages/11_project_to_public.ts <batch_id> [--dry-run]');
    process.exit(1);
  }

  projectToPublicDryRun(batchName, args).catch((error: unknown) => {
    console.error(`Stage 10/11 public projection failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  });
}
