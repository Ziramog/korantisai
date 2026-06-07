import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import path from 'path';

export type JsonObject = Record<string, unknown>;

export type BatchData = {
  inputDir: string;
  handoffMd: string;
  mergedMd: string;
  manifest: JsonObject;
  source: JsonObject;
  sanitized: JsonObject;
  chunks: JsonObject[];
  merged: JsonObject;
  selected: JsonObject;
};

export type CheckResult = {
  name: string;
  passed: boolean;
  details: string;
};

export type ValidationReport = {
  generated_at: string;
  input_dir: string;
  publish_ready: false;
  staging_ready: 'partial';
  counts: Record<string, unknown>;
  checks: CheckResult[];
  failures: CheckResult[];
};

const DEFAULT_INPUT_DIR = 'F:/Obsidian/obsidian-vault-main/Hermes/companies/korantis';
const OUTPUT_DIR = path.join(process.cwd(), 'data');

const REQUIRED_FILES = {
  manifest: 'korantis_ba_batch_02_m27_manifest.json',
  source: 'korantis_ba_batch_02_m27_source_fullres_queue.json',
  sanitized: 'korantis_ba_batch_02_m27_final_vision_queue_sanitized.json',
  handoffMd: 'korantis_ba_batch_02_m27_codex_handoff.md',
  chunk1: 'korantis_ba_batch_02_m3_vision_chunk_01_run02_results.json',
  chunk2: 'korantis_ba_batch_02_m3_vision_chunk_02_run02_results.json',
  chunk3: 'korantis_ba_batch_02_m3_vision_chunk_03_run02_results.json',
  merged: 'korantis_ba_batch_02_m3_vision_merged.json',
  mergedMd: 'korantis_ba_batch_02_m3_vision_merged.md',
  selected: 'korantis_ba_batch_02_m3_selected_candidates.json',
};

const FORBIDDEN_SECRET_FRAGMENTS = [
  'sk-cp',
  'X-Api-Key',
  'fdmU',
  'MINIMAX_API_KEY=',
  'SUPABASE_SERVICE_ROLE_KEY=',
  'OPENAI_API_KEY=',
];

const REQUIRED_QUEUE_FIELDS = [
  'venue_name',
  'source_url',
  'resolved_image_url',
  'dedupe_hash',
];

const REQUIRED_M3_FIELDS = [
  ...REQUIRED_QUEUE_FIELDS,
  'ok_photo',
  'skip_reason',
  'bytes_received',
  'pil_format',
  'real_width',
  'real_height',
  'sha256',
];

export function loadBatchData(): BatchData {
  const inputDir = process.env.KORANTIS_BATCH_02_INPUT_DIR || DEFAULT_INPUT_DIR;

  return {
    inputDir,
    handoffMd: readText(inputDir, REQUIRED_FILES.handoffMd),
    mergedMd: readText(inputDir, REQUIRED_FILES.mergedMd),
    manifest: readJson(inputDir, REQUIRED_FILES.manifest),
    source: readJson(inputDir, REQUIRED_FILES.source),
    sanitized: readJson(inputDir, REQUIRED_FILES.sanitized),
    chunks: [
      readJson(inputDir, REQUIRED_FILES.chunk1),
      readJson(inputDir, REQUIRED_FILES.chunk2),
      readJson(inputDir, REQUIRED_FILES.chunk3),
    ],
    merged: readJson(inputDir, REQUIRED_FILES.merged),
    selected: readJson(inputDir, REQUIRED_FILES.selected),
  };
}

export function writeJsonReport(fileName: string, data: unknown): void {
  ensureOutputDir();
  writeFileSync(path.join(OUTPUT_DIR, fileName), `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

export function writeMarkdownReport(fileName: string, markdown: string): void {
  ensureOutputDir();
  writeFileSync(path.join(OUTPUT_DIR, fileName), `${markdown.trim()}\n`, 'utf8');
}

export function createValidationReport(batch: BatchData): ValidationReport {
  const sanitizedQueue = getArray(batch.sanitized, 'queue');
  const mergedRecords = getArray(batch.merged, 'records');
  const okRecords = mergedRecords.filter((record) => getBoolean(record, 'ok_photo'));
  const skippedRecords = mergedRecords.filter((record) => !getBoolean(record, 'ok_photo'));
  const selectedCandidates = getSelectedCandidateObjects(batch.selected);
  const sceneTypeDistribution = asObject(batch.merged.scene_type_distribution);
  const checks: CheckResult[] = [];

  const addCheck = (name: string, passed: boolean, details: string): void => {
    checks.push({ name, passed, details });
  };

  addCheck('Required files parse as JSON', true, 'All required Batch 02 JSON files were parsed successfully; required Markdown handoff files were read.');
  addCheck('M2.7 provenance preserved', m27ProvenanceOk(batch), 'M2.7 manifest/source/sanitized/handoff files declare MiniMax-M2.7.');
  addCheck('M3 provenance preserved', m3ProvenanceOk(batch), 'M3 chunks, merged output, merged Markdown, and selected candidates declare MiniMax-M3.');
  addCheck('Sanitized queue count is 52', sanitizedQueue.length === 52, `Sanitized queue count: ${sanitizedQueue.length}.`);
  addCheck('M3 total items is 52', getNestedNumber(batch.merged, ['totals', 'items_processed']) === 52 && mergedRecords.length === 52, `Merged records: ${mergedRecords.length}.`);
  addCheck('M3 ok_photo count is 30', okRecords.length === 30 && getNestedNumber(batch.merged, ['totals', 'items_ok_photo']) === 30, `ok_photo records: ${okRecords.length}.`);
  addCheck('M3 skipped count is 22', skippedRecords.length === 22 && getNestedNumber(batch.merged, ['totals', 'items_skipped']) === 22, `Skipped records: ${skippedRecords.length}.`);
  addCheck('Skipped records have explicit skip_reason', skippedRecords.every((record) => getString(record, 'skip_reason').length > 0), 'Every skipped M3 record has skip_reason.');
  addCheck('No duplicate dedupe_hash', findDuplicates(mergedRecords, 'dedupe_hash').length === 0, duplicateDetails(mergedRecords, 'dedupe_hash'));
  addCheck('No duplicate resolved_image_url', findDuplicates(mergedRecords, 'resolved_image_url').length === 0, duplicateDetails(mergedRecords, 'resolved_image_url'));
  addCheck('No duplicate sha256', findDuplicates(mergedRecords, 'sha256').length === 0, duplicateDetails(mergedRecords, 'sha256'));
  addCheck('Queue fields preserved into M3 records', queueFieldsPreserved(sanitizedQueue, mergedRecords), 'venue_name/source_url/resolved_image_url/dedupe_hash are present and stable.');
  addCheck('Required per-record fields present', recordsHaveFields(sanitizedQueue, REQUIRED_QUEUE_FIELDS) && recordsHaveFields(mergedRecords, REQUIRED_M3_FIELDS), 'Required queue and M3 record fields are present.');
  addCheck('No API key exposure', noForbiddenFragments(batch), `Scanned for: ${FORBIDDEN_SECRET_FRAGMENTS.join(', ')}.`);
  addCheck('No approved_for_publication values', !recursiveValues(batch.selected).includes('approved_for_publication') && !recursiveValues(batch.merged).includes('approved_for_publication'), 'No candidate value is approved_for_publication.');
  addCheck('Selected candidates remain imported_needs_validation', selectedCandidates.every((candidate) => getString(candidate, 'validation_status') === 'imported_needs_validation'), `Selected candidate-like records checked: ${selectedCandidates.length}.`);
  addCheck('Publication status is constrained', selectedCandidates.every((candidate) => ['not_approved_for_publication', 'rejected'].includes(getString(candidate, 'publication_status'))), 'Only not_approved_for_publication/rejected appear in candidate publication_status.');
  addCheck('No vision_analyze fallback', !stringIncludes(batch.merged, 'vision_analyze') && batch.chunks.every((chunk) => !stringIncludes(chunk, 'vision_analyze')), 'M3 outputs do not mention vision_analyze.');
  addCheck('No web scouting in M3 outputs', !stringIncludes(batch.merged, 'web_scout') && !stringIncludes(batch.merged, 'web scouting'), 'M3 outputs remain visual classification outputs.');
  addCheck('No queue expansion in M3 outputs', mergedRecords.length === sanitizedQueue.length, `Sanitized queue: ${sanitizedQueue.length}; merged M3 records: ${mergedRecords.length}.`);
  addCheck('Known scene distribution confirmed', knownSceneDistributionOk(sceneTypeDistribution), `Scene distribution: ${JSON.stringify(sceneTypeDistribution)}.`);

  return {
    generated_at: new Date().toISOString(),
    input_dir: batch.inputDir,
    publish_ready: false,
    staging_ready: 'partial',
    counts: getCoreCounts(batch),
    checks,
    failures: checks.filter((check) => !check.passed),
  };
}

export function createVisualAnalysis(batch: BatchData): JsonObject {
  const sourceSummary = asObject(batch.source.summary);
  const sourceRecords = getArray(batch.source, 'records');
  const sanitizedQueue = getArray(batch.sanitized, 'queue');
  const mergedRecords = getArray(batch.merged, 'records');
  const okRecords = mergedRecords.filter((record) => getBoolean(record, 'ok_photo'));
  const selectedDecisions = asObject(batch.selected.decisions_per_venue);
  const selectedCandidates = getSelectedCandidateObjects(batch.selected);
  const heroVenues = venuesWithRole(selectedDecisions, 'best_hero_candidate');
  const cardVenues = venuesWithRole(selectedDecisions, 'best_card_candidate');
  const galleryVenues = venuesWithGallery(selectedDecisions);
  const productFoodCount = okRecords.filter((record) => getNestedString(record, ['m3_response', 'scene_type']) === 'product_food').length;
  const belowPreferred = okRecords.filter((record) => getBoolean(record, 'below_preferred_resolution')).length;
  const faces = okRecords.filter((record) => getNestedBoolean(record, ['m3_response', 'has_identifiable_faces'])).length;

  return {
    generated_at: new Date().toISOString(),
    batch_id: getString(batch.manifest, 'batch_id') || getString(batch.source, 'run_id'),
    publish_ready: false,
    staging_ready: 'partial',
    venue_coverage: {
      requested: getNumber(batch.source, 'venues_requested'),
      processed: getNumber(batch.source, 'venues_processed'),
      source_records: sourceRecords.length,
      m3_venues_unique: getNestedNumber(batch.merged, ['totals', 'venues_unique']),
    },
    evidence_coverage: {
      official_websites_found: getNumber(sourceSummary, 'official_websites_found'),
      reservation_links_found: getNumber(sourceSummary, 'reservation_links_found'),
      menu_links_found: getNumber(sourceSummary, 'menu_links_found'),
      whatsapp_links_found: getNumber(sourceSummary, 'whatsapp_links_found'),
      phone_numbers_found: getNumber(sourceSummary, 'phone_numbers_found'),
      price_hints_found: getNumber(sourceSummary, 'price_hints_found'),
      factual_evidence_items_found: getNumber(sourceSummary, 'factual_evidence_items_found'),
    },
    image_coverage: {
      raw_image_candidates_found: getNumber(sourceSummary, 'raw_image_candidates_found'),
      resolved_fullres_candidates: getNumber(sourceSummary, 'resolved_fullres_candidates'),
      final_vision_queue_size_pre_sanitizer: getNumber(sourceSummary, 'final_vision_queue_size'),
      sanitized_queue_size: sanitizedQueue.length,
    },
    m3_visual_results: getCoreCounts(batch),
    scene_type_distribution: batch.merged.scene_type_distribution,
    selected_candidates: selectedCandidates.map(summarizeCandidate),
    venues_with_hero_candidates: heroVenues,
    venues_with_card_candidates: cardVenues,
    venues_with_gallery_candidates: galleryVenues,
    venues_without_usable_visual_candidates: batch.merged.venues_without_usable_visual_candidate,
    source_poor_venues: sourceSummary.venues_still_source_poor,
    risks: {
      rights_review_needed: selectedCandidates.filter((candidate) => getRiskFlags(candidate).includes('rights_review_needed')).length,
      face_release_needed: selectedCandidates.filter((candidate) => getRiskFlags(candidate).includes('face_release_needed')).length,
      identity_review_needed: selectedCandidates.filter((candidate) => getRiskFlags(candidate).includes('identity_review_needed') || getString(candidate, 'role_allowed').includes('venue_verification')).length,
      below_preferred_resolution_candidates: selectedCandidates.filter((candidate) => getBoolean(candidate, 'below_preferred_resolution')).length,
      ok_photos_with_faces: faces,
      ok_photos_below_preferred_resolution: belowPreferred,
      product_food_ok_photos: productFoodCount,
    },
    known_findings: [
      '52 total sanitized M3 items.',
      '30 M3 ok_photo records.',
      '22 skipped below_min_dimension records.',
      'Product-food images dominated ok_photo outputs and can only be reference_only.',
      'Only Oporto Almacen has a strong full-resolution hero-interior candidate.',
      'The sanitizer must validate real dimensions before M3 in future batches.',
    ],
  };
}

export function createExternalImageCandidatesDryRun(batch: BatchData): JsonObject {
  const records = getArray(batch.merged, 'records');
  const candidates = records.map((record, index) => {
    const m3 = asObject(record.m3_response);
    const decision = asObject(record.decision);
    const sceneType = getString(m3, 'scene_type');
    const riskFlags = [...new Set([...getStringArray(record, 'risk_flags_input'), ...getStringArray(decision, 'risk_flags'), ...riskFlagsForRecord(record)])];

    return {
      dry_run_only: true,
      action: 'would_stage_external_image_candidate',
      candidate_key: `${getString(record, 'dedupe_hash') || index}`,
      run_id: getString(record, '_source_run_id') || getString(batch.merged, 'run_id'),
      batch_id: getString(batch.manifest, 'batch_id') || 'korantis_ba_batch_02',
      model_used: getString(batch.merged, 'model_used'),
      venue_name: getString(record, 'venue_name'),
      source_url: getString(record, 'source_url'),
      resolved_image_url: getString(record, 'resolved_image_url'),
      original_image_url: getString(record, 'original_image_url'),
      dedupe_hash: getString(record, 'dedupe_hash'),
      sha256: getString(record, 'sha256'),
      validation_status: 'imported_needs_validation',
      publication_status: getBoolean(record, 'ok_photo') ? 'not_approved_for_publication' : 'rejected',
      image_role: inferImageRole(record),
      scene_type: sceneType || null,
      has_identifiable_faces: getBoolean(m3, 'has_identifiable_faces'),
      text_visible: m3.text_visible ?? null,
      is_dark_or_low_contrast: getBoolean(m3, 'is_dark_or_low_contrast'),
      resolution_quality: getString(m3, 'resolution_quality') || null,
      editorial_usable: getBoolean(m3, 'editorial_usable'),
      notes: getString(m3, 'notes') || getString(record, 'skip_reason'),
      real_width: getNumber(record, 'real_width'),
      real_height: getNumber(record, 'real_height'),
      bytes_received: getNumber(record, 'bytes_received'),
      pil_format: getString(record, 'pil_format') || null,
      risk_flags: riskFlags,
      would_insert: false,
      would_upload: false,
      would_publish: false,
    };
  });

  return {
    generated_at: new Date().toISOString(),
    dry_run_only: true,
    writes_performed: false,
    supabase_called: false,
    cloudinary_called: false,
    total_candidates: candidates.length,
    candidate_counts: countBy(candidates, 'image_role'),
    candidates,
  };
}

export function createVenueEvidenceDryRun(batch: BatchData): JsonObject {
  const records = getArray(batch.source, 'records');
  const evidenceRows = records.map((record) => ({
    dry_run_only: true,
    action: 'would_stage_venue_evidence',
    run_id: getString(batch.source, 'run_id'),
    batch_id: getString(batch.manifest, 'batch_id') || 'korantis_ba_batch_02',
    model_used: getString(batch.source, 'model_used'),
    venue_name: getString(record, 'venue_name'),
    official_website: record.official_website ?? null,
    instagram: record.instagram ?? null,
    reservation_url: record.reservation_url ?? null,
    menu_url: record.menu_url ?? null,
    whatsapp: record.whatsapp ?? null,
    phone: record.phone ?? null,
    price_hint: record.price_hint ?? null,
    factual_description_evidence: record.factual_description_evidence ?? [],
    fetch_diagnostics: record.fetch_diagnostics ?? [],
    warnings: record.warnings ?? [],
    validation_status: 'imported_needs_validation',
    publication_status: 'not_approved_for_publication',
    would_insert: false,
    would_update_public_venues: false,
  }));

  return {
    generated_at: new Date().toISOString(),
    dry_run_only: true,
    writes_performed: false,
    supabase_called: false,
    total_venues: evidenceRows.length,
    coverage: asObject(batch.source.summary),
    evidence_rows: evidenceRows,
  };
}

export function createPublishReadinessReport(batch: BatchData): JsonObject {
  const analysis = createVisualAnalysis(batch);
  const risks = asObject(analysis.risks);
  const selectedCandidates = getSelectedCandidateObjects(batch.selected);

  return {
    generated_at: new Date().toISOString(),
    publish_ready: false,
    staging_ready: 'partial',
    dry_run_only: true,
    blockers: [
      'No candidate is approved for publication.',
      'Only one strong full-resolution hero candidate was found.',
      'Many ok_photo results are product_food, logo, decorative, crowd, or below preferred resolution.',
      'Face release, identity, and rights review flags must be resolved before any publication use.',
    ],
    staging_import_scope: {
      external_image_candidates: 'partial_dry_run_only',
      venue_evidence: 'partial_dry_run_only',
      public_venues: 'blocked_no_writes',
      venue_images: 'blocked_no_writes',
    },
    confirmed_counts: getCoreCounts(batch),
    risk_summary: risks,
    selected_candidate_count: selectedCandidates.length,
    next_action: 'Review dry-run staging outputs and improve pre-M3 dimension/content validation before another batch.',
  };
}

export function createSafeFilenameReport(batch: BatchData): JsonObject {
  const names = readdirSync(batch.inputDir);
  const unsafePattern = /[<>:"/\\|?*]/;
  const run01Names = names.filter((name) => name.includes('run01'));
  const run02Names = names.filter((name) => name.includes('run02'));
  const unsafeNames = names.filter((name) => unsafePattern.test(name));

  return {
    generated_at: new Date().toISOString(),
    input_dir: batch.inputDir,
    safe_for_windows: unsafeNames.length === 0,
    unsafe_names: unsafeNames,
    run_suffixes: {
      run01_names: run01Names,
      run02_names: run02Names,
    },
    recommendations: [
      'Keep run suffix configurable instead of hardcoded.',
      'Use ASCII lowercase, digits, underscore, hyphen, and dot for generated filenames.',
      'Reject Windows-reserved characters before writing chunk or merge outputs.',
      'Keep run_id inside JSON aligned with the filename suffix.',
    ],
  };
}

export function validationMarkdown(report: ValidationReport): string {
  return [
    '# Batch 02 Codex Validation Report',
    '',
    `Generated: ${report.generated_at}`,
    `Input dir: \`${report.input_dir}\``,
    '',
    `Publish ready: **${report.publish_ready}**`,
    `Staging ready: **${report.staging_ready}**`,
    '',
    '## Confirmed Counts',
    '',
    jsonTable(report.counts),
    '',
    '## Checks',
    '',
    ...report.checks.map((check) => `- ${check.passed ? 'PASS' : 'FAIL'}: ${check.name} - ${check.details}`),
    '',
    '## Conclusion',
    '',
    'Batch 02 is not ready for publishing. It is partially ready for evidence/image candidate staging as dry-run output only.',
  ].join('\n');
}

export function visualAnalysisMarkdown(analysis: JsonObject): string {
  const venueCoverage = asObject(analysis.venue_coverage);
  const evidence = asObject(analysis.evidence_coverage);
  const image = asObject(analysis.image_coverage);
  const risks = asObject(analysis.risks);

  return [
    '# Batch 02 Visual Analysis Report',
    '',
    `Generated: ${getString(analysis, 'generated_at')}`,
    '',
    '## Readiness',
    '',
    '- Publish readiness: false',
    '- Staging readiness: partial',
    '- Boundary: dry-run only; no Supabase writes, no Cloudinary uploads, no publication approval.',
    '',
    '## Venue Coverage',
    '',
    jsonTable(venueCoverage),
    '',
    '## M2.7 Evidence Coverage',
    '',
    jsonTable(evidence),
    '',
    '## Image Candidate Coverage',
    '',
    jsonTable(image),
    '',
    '## M3 Visual Results',
    '',
    jsonTable(asObject(analysis.m3_visual_results)),
    '',
    '## Scene Type Distribution',
    '',
    jsonTable(asObject(analysis.scene_type_distribution)),
    '',
    '## Selected Candidates',
    '',
    ...getArray(analysis, 'selected_candidates').map((candidate) => {
      const row = asObject(candidate);
      return `- ${getString(row, 'venue_name')}: ${getString(row, 'scene_type') || 'n/a'} / ${getString(row, 'image_role')} / ${getString(row, 'publication_status')}`;
    }),
    '',
    '## Venue Candidate Coverage',
    '',
    `Hero candidates: ${formatList(getStringArray(analysis, 'venues_with_hero_candidates'))}`,
    `Card candidates: ${formatList(getStringArray(analysis, 'venues_with_card_candidates'))}`,
    `Gallery candidates: ${formatList(getStringArray(analysis, 'venues_with_gallery_candidates'))}`,
    `Venues without usable visual candidates: ${formatVenueIssueList(analysis.venues_without_usable_visual_candidates)}`,
    `Source-poor venues: ${formatList(valueToStringArray(analysis.source_poor_venues))}`,
    '',
    '## Risks And Issues',
    '',
    jsonTable(risks),
    '',
    '## Pipeline Failures And Lessons',
    '',
    '- Too many M3 calls were spent on thumbnails, product-food images, and low-resolution assets.',
    '- The sanitizer accepted items whose real dimensions were only discovered during M3 runtime.',
    '- Product-food images can only be retained as reference_only staging records.',
    '- Below preferred resolution blocks strong staging readiness for hero/card use.',
    '',
    '## Conclusion',
    '',
    'Batch 02 is not ready for publishing. It is partially ready for evidence/image candidate staging as dry-run output only.',
  ].join('\n');
}

export function externalDryRunMarkdown(report: JsonObject): string {
  return [
    '# Batch 02 External Image Candidates Dry Run',
    '',
    `Generated: ${getString(report, 'generated_at')}`,
    '',
    `Candidates analyzed: ${getNumber(report, 'total_candidates')}`,
    'Writes performed: false',
    'Supabase called: false',
    'Cloudinary called: false',
    '',
    '## Role Counts',
    '',
    jsonTable(asObject(report.candidate_counts)),
    '',
    '## Rules Applied',
    '',
    '- Every candidate remains imported_needs_validation.',
    '- No candidate is approved_for_publication.',
    '- Product-food images are reference_only.',
    '- Logo, decorative, menu-like, crowd, skipped, and invalid items are rejected or reference_only.',
    '- Risk flags are preserved.',
  ].join('\n');
}

export function evidenceDryRunMarkdown(report: JsonObject): string {
  return [
    '# Batch 02 Venue Evidence Dry Run',
    '',
    `Generated: ${getString(report, 'generated_at')}`,
    '',
    `Venues analyzed: ${getNumber(report, 'total_venues')}`,
    'Writes performed: false',
    'Supabase called: false',
    '',
    '## Coverage',
    '',
    jsonTable(asObject(report.coverage)),
    '',
    '## Rules Applied',
    '',
    '- Venue evidence is staged only as imported_needs_validation.',
    '- public.venues remains untouched.',
    '- Source URLs, evidence text, warnings, and diagnostics are preserved.',
  ].join('\n');
}

export function readinessMarkdown(report: JsonObject): string {
  return [
    '# Batch 02 Publish Readiness Report',
    '',
    `Generated: ${getString(report, 'generated_at')}`,
    '',
    'Publish ready: **false**',
    'Staging ready: **partial**',
    '',
    '## Confirmed Counts',
    '',
    jsonTable(asObject(report.confirmed_counts)),
    '',
    '## Blockers',
    '',
    ...getStringArray(report, 'blockers').map((blocker) => `- ${blocker}`),
    '',
    '## Risk Summary',
    '',
    jsonTable(asObject(report.risk_summary)),
    '',
    '## Next Action',
    '',
    getString(report, 'next_action'),
  ].join('\n');
}

export function safeFilenameMarkdown(report: JsonObject): string {
  const runSuffixes = asObject(report.run_suffixes);
  return [
    '# Batch 02 Safe Filename Check',
    '',
    `Generated: ${getString(report, 'generated_at')}`,
    `Input dir: \`${getString(report, 'input_dir')}\``,
    '',
    `Windows-safe filenames: **${String(report.safe_for_windows)}**`,
    `Unsafe names: ${formatList(valueToStringArray(report.unsafe_names))}`,
    `run01 names: ${formatList(valueToStringArray(runSuffixes.run01_names))}`,
    `run02 names: ${formatList(valueToStringArray(runSuffixes.run02_names))}`,
    '',
    '## Recommendations',
    '',
    ...getStringArray(report, 'recommendations').map((item) => `- ${item}`),
  ].join('\n');
}

function readJson(inputDir: string, fileName: string): JsonObject {
  const filePath = path.join(inputDir, fileName);
  if (!existsSync(filePath)) {
    throw new Error(`Missing required input file: ${filePath}`);
  }

  return JSON.parse(readFileSync(filePath, 'utf8')) as JsonObject;
}

function readText(inputDir: string, fileName: string): string {
  const filePath = path.join(inputDir, fileName);
  if (!existsSync(filePath)) {
    throw new Error(`Missing required input file: ${filePath}`);
  }

  return readFileSync(filePath, 'utf8');
}

function ensureOutputDir(): void {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

function asObject(value: unknown): JsonObject {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonObject : {};
}

function getArray(object: JsonObject, key: string): JsonObject[] {
  const value = object[key];
  return Array.isArray(value) ? value.filter((item): item is JsonObject => Boolean(item) && typeof item === 'object' && !Array.isArray(item)) : [];
}

function getString(object: JsonObject, key: string): string {
  const value = object[key];
  return typeof value === 'string' ? value : '';
}

function getNumber(object: JsonObject, key: string): number {
  const value = object[key];
  return typeof value === 'number' ? value : 0;
}

function getBoolean(object: JsonObject, key: string): boolean {
  const value = object[key];
  return typeof value === 'boolean' ? value : false;
}

function getStringArray(object: JsonObject, key: string): string[] {
  return valueToStringArray(object[key]);
}

function valueToStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function getNestedNumber(object: JsonObject, keys: string[]): number {
  const value = getNestedValue(object, keys);
  return typeof value === 'number' ? value : 0;
}

function getNestedString(object: JsonObject, keys: string[]): string {
  const value = getNestedValue(object, keys);
  return typeof value === 'string' ? value : '';
}

function getNestedBoolean(object: JsonObject, keys: string[]): boolean {
  const value = getNestedValue(object, keys);
  return typeof value === 'boolean' ? value : false;
}

function getNestedValue(object: JsonObject, keys: string[]): unknown {
  let cursor: unknown = object;
  for (const key of keys) {
    if (!cursor || typeof cursor !== 'object' || Array.isArray(cursor)) {
      return undefined;
    }
    cursor = (cursor as JsonObject)[key];
  }
  return cursor;
}

function recordsHaveFields(records: JsonObject[], fields: string[]): boolean {
  return records.every((record) => fields.every((field) => Object.prototype.hasOwnProperty.call(record, field)));
}

function findDuplicates(records: JsonObject[], field: string): string[] {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const record of records) {
    const value = getString(record, field);
    if (!value) {
      continue;
    }
    if (seen.has(value)) {
      dupes.add(value);
    }
    seen.add(value);
  }
  return [...dupes];
}

function duplicateDetails(records: JsonObject[], field: string): string {
  const duplicates = findDuplicates(records, field);
  return duplicates.length === 0 ? `No duplicate ${field}.` : `Duplicate ${field}: ${duplicates.join(', ')}`;
}

function queueFieldsPreserved(queue: JsonObject[], mergedRecords: JsonObject[]): boolean {
  const byHash = new Map(queue.map((record) => [getString(record, 'dedupe_hash'), record]));
  return mergedRecords.every((record) => {
    const source = byHash.get(getString(record, 'dedupe_hash'));
    if (!source) {
      return false;
    }
    return REQUIRED_QUEUE_FIELDS.every((field) => getString(source, field) === getString(record, field));
  });
}

function recursiveValues(value: unknown): string[] {
  if (typeof value === 'string') {
    return [value];
  }
  if (Array.isArray(value)) {
    return value.flatMap(recursiveValues);
  }
  if (value && typeof value === 'object') {
    return Object.values(value).flatMap(recursiveValues);
  }
  return [];
}

function stringIncludes(value: unknown, needle: string): boolean {
  return JSON.stringify(value).toLowerCase().includes(needle.toLowerCase());
}

function noForbiddenFragments(batch: BatchData): boolean {
  const fullText = `${JSON.stringify(batch)}\n${batch.handoffMd}\n${batch.mergedMd}`;
  return FORBIDDEN_SECRET_FRAGMENTS.every((fragment) => !fullText.includes(fragment));
}

function m27ProvenanceOk(batch: BatchData): boolean {
  return getString(batch.manifest, 'model_used') === 'MiniMax-M2.7'
    && getString(batch.source, 'model_used') === 'MiniMax-M2.7'
    && getString(batch.sanitized, 'model_used_for_queue') === 'MiniMax-M2.7'
    && batch.handoffMd.includes('MiniMax-M2.7');
}

function m3ProvenanceOk(batch: BatchData): boolean {
  return batch.chunks.every((chunk) => getString(chunk, 'model_to_use') === 'MiniMax-M3')
    && getString(batch.merged, 'model_used') === 'MiniMax-M3'
    && getString(batch.selected, 'model_used') === 'MiniMax-M3'
    && batch.mergedMd.includes('MiniMax-M3');
}

function knownSceneDistributionOk(sceneTypeDistribution: JsonObject): boolean {
  const expected: Record<string, number> = {
    product_food: 18,
    hero_interior: 6,
    gallery_atmosphere: 2,
    logo: 1,
    decorative: 1,
    hero_exterior: 1,
    crowd: 1,
  };

  return Object.entries(expected).every(([key, value]) => getNumber(sceneTypeDistribution, key) === value);
}

function getCoreCounts(batch: BatchData): Record<string, unknown> {
  return {
    m2_venues_requested: getNumber(batch.source, 'venues_requested'),
    m2_venues_processed: getNumber(batch.source, 'venues_processed'),
    m2_raw_image_candidates: getArray(batch.source, 'all_image_candidates_raw').length,
    m2_final_vision_queue_pre_sanitizer: getArray(batch.source, 'final_vision_queue').length,
    sanitized_m3_items: getArray(batch.sanitized, 'queue').length,
    m3_total_items: getArray(batch.merged, 'records').length,
    m3_ok_photo: getArray(batch.merged, 'records').filter((record) => getBoolean(record, 'ok_photo')).length,
    m3_skipped: getArray(batch.merged, 'records').filter((record) => !getBoolean(record, 'ok_photo')).length,
    m3_below_preferred_resolution: getNestedNumber(batch.merged, ['totals', 'items_below_preferred_resolution']),
    m3_unique_venues: getNestedNumber(batch.merged, ['totals', 'venues_unique']),
  };
}

function getSelectedCandidateObjects(selected: JsonObject): JsonObject[] {
  const decisions = asObject(selected.decisions_per_venue);
  const candidates: JsonObject[] = [];
  for (const decision of Object.values(decisions).map(asObject)) {
    for (const key of ['best_hero_candidate', 'best_card_candidate']) {
      const candidate = asObject(decision[key]);
      if (Object.keys(candidate).length > 0) {
        candidates.push(candidate);
      }
    }
    for (const candidate of getArray(decision, 'best_gallery_candidates')) {
      candidates.push(candidate);
    }
  }
  return candidates;
}

function summarizeCandidate(candidate: JsonObject): JsonObject {
  return {
    venue_name: getString(candidate, 'venue_name'),
    scene_type: getString(candidate, 'scene_type'),
    image_role: roleFromSelectedCandidate(candidate),
    validation_status: getString(candidate, 'validation_status'),
    publication_status: getString(candidate, 'publication_status'),
    max_dim: getNumber(candidate, 'max_dim'),
    below_preferred_resolution: getBoolean(candidate, 'below_preferred_resolution'),
    risk_flags: getRiskFlags(candidate),
    source_url: getString(candidate, 'source_url'),
    resolved_image_url: getString(candidate, 'resolved_image_url'),
  };
}

function roleFromSelectedCandidate(candidate: JsonObject): string {
  const roleAllowed = getString(candidate, 'role_allowed');
  const sceneType = getString(candidate, 'scene_type');
  if (roleAllowed.includes('hero')) {
    return 'hero_candidate';
  }
  if (roleAllowed.includes('gallery')) {
    return 'gallery_candidate';
  }
  if (sceneType === 'product_food') {
    return 'reference_only';
  }
  return getString(candidate, 'decision_class') === 'rejected' ? 'rejected' : 'reference_only';
}

function venuesWithRole(decisions: JsonObject, key: string): string[] {
  return Object.entries(decisions)
    .filter(([, decision]) => Object.keys(asObject(asObject(decision)[key])).length > 0)
    .map(([venue]) => venue);
}

function venuesWithGallery(decisions: JsonObject): string[] {
  return Object.entries(decisions)
    .filter(([, decision]) => getArray(asObject(decision), 'best_gallery_candidates').length > 0)
    .map(([venue]) => venue);
}

function getRiskFlags(candidate: JsonObject): string[] {
  return getStringArray(candidate, 'risk_flags');
}

function riskFlagsForRecord(record: JsonObject): string[] {
  const flags: string[] = [];
  const m3 = asObject(record.m3_response);
  const sceneType = getString(m3, 'scene_type');
  const contentType = getString(record, 'declared_content_type');

  if (getBoolean(record, 'below_preferred_resolution')) flags.push('below_preferred_resolution');
  if (getNumber(record, 'max_dim') > 0 && getNumber(record, 'max_dim') < 512) flags.push('low_resolution');
  if (getNestedBoolean(record, ['m3_response', 'has_identifiable_faces'])) flags.push('face_release_needed');
  if (sceneType === 'product_food') flags.push('product_only');
  if (['logo', 'decorative', 'crowd'].includes(sceneType)) flags.push('source_trust_only');
  if (contentType.includes('svg') || contentType.includes('gif') || contentType.includes('avif')) flags.push('unsupported_format');
  return flags;
}

function inferImageRole(record: JsonObject): string {
  if (!getBoolean(record, 'ok_photo')) {
    return 'rejected';
  }

  const m3 = asObject(record.m3_response);
  const sceneType = getString(m3, 'scene_type');
  if (sceneType === 'hero_interior' || sceneType === 'hero_exterior') {
    return getBoolean(record, 'below_preferred_resolution') ? 'reference_only' : 'hero_candidate';
  }
  if (sceneType === 'gallery_atmosphere') {
    return getBoolean(record, 'below_preferred_resolution') ? 'reference_only' : 'gallery_candidate';
  }
  if (sceneType === 'product_food') {
    return 'reference_only';
  }
  return 'rejected';
}

function countBy(records: JsonObject[], key: string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const record of records) {
    const value = getString(record, key) || 'unknown';
    counts[value] = (counts[value] || 0) + 1;
  }
  return counts;
}

function jsonTable(object: JsonObject): string {
  const rows = Object.entries(object).map(([key, value]) => `| ${key} | ${formatValue(value)} |`);
  return ['| Metric | Value |', '|---|---:|', ...rows].join('\n');
}

function formatValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  if (value && typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

function formatList(values: string[]): string {
  return values.length > 0 ? values.join(', ') : 'none';
}

function formatVenueIssueList(value: unknown): string {
  if (!Array.isArray(value)) {
    return 'none';
  }

  const names = value
    .map(asObject)
    .map((item) => getString(item, 'venue_name'))
    .filter((name) => name.length > 0);
  return formatList(names);
}
