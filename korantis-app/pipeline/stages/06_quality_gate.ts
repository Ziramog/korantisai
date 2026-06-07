import { existsSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateDashboard } from '../review/generate_dashboard';
import type { BatchResult, CandidateStatus, ImageCandidate, ReviewQueueItem, VenueComplete } from '../types';

type QualityGateStatus = Extract<CandidateStatus, 'ready_for_db_staging' | 'needs_review' | 'blocked'>;

interface GateDecision {
  venue_name: string;
  status: QualityGateStatus;
  passed: boolean;
  reasons: string[];
  blockers: string[];
  warnings: string[];
  fields_validated: Record<string, boolean>;
}

interface QualityGateResult {
  batch_result: BatchResult;
  decisions: GateDecision[];
  report_markdown: string;
}

export function runQualityGate(batchName: string): QualityGateResult {
  const outputDir = path.join(process.cwd(), 'data', 'batches', batchName);
  const input = readJson<BatchResult>(resolveQualityGateInputPath(outputDir));
  const decisions: GateDecision[] = [];

  const candidates: ReviewQueueItem[] = input.candidates.map((candidate) => {
    const decision = evaluateVenue(candidate.venue, candidate.errors, candidate.warnings, input.config.minEvidenceConfidence);
    decisions.push(decision);
    return {
      ...candidate,
      status: decision.status,
      errors: decision.blockers,
      warnings: decision.warnings,
      review_reason: decision.passed
        ? 'Ready for Supabase staging sync. Not approved for public publication.'
        : `${decision.status === 'blocked' ? 'Blocked' : 'Needs review'}: ${decision.reasons.join(', ')}`,
    };
  });

  const generatedAt = new Date();
  const batchResult: BatchResult = {
    ...input,
    generated_at: generatedAt.toISOString(),
    summary: buildSummary(candidates),
    stage_statuses: [
      ...input.stage_statuses,
      {
        stage: '06_quality_gate',
        status: 'completed',
        notes: 'Deterministic local gate for Supabase staging eligibility only. No sync or publication.',
      },
      { stage: '07_stage_to_supabase', status: 'skipped', notes: 'Not run. No Supabase writes.' },
      { stage: '08_promote_staged', status: 'skipped', notes: 'Not run. No publication.' },
    ],
    candidates,
    cost_placeholder: {
      estimated_usd: null,
      notes: 'No MiniMax, OpenAI, external model, Supabase, Cloudinary, publication, or deploy calls were made by Stage 06.',
    },
    runtime_placeholder: {
      started_at: generatedAt.toISOString(),
      finished_at: generatedAt.toISOString(),
      duration_ms: 0,
    },
  };
  const report = buildReport(batchResult, decisions);

  writeFileSync(path.join(outputDir, 'batch_result_quality_gated.json'), `${JSON.stringify(batchResult, null, 2)}\n`, 'utf8');
  generateDashboard(batchResult, outputDir, 'dashboard_quality_gated.html');
  writeFileSync(path.join(outputDir, 'quality_gate_report.md'), report, 'utf8');

  console.log(`Quality-gated batch result written to ${path.join(outputDir, 'batch_result_quality_gated.json')}`);
  console.log(`Quality-gated dashboard written to ${path.join(outputDir, 'dashboard_quality_gated.html')}`);
  console.log(`Quality gate report written to ${path.join(outputDir, 'quality_gate_report.md')}`);
  console.log(
    `Quality gate summary: total=${candidates.length}, ready_for_db_staging=${batchResult.summary.ready_for_db_staging ?? 0}, needs_review=${batchResult.summary.needs_review}, blocked=${batchResult.summary.blocked}`,
  );

  return {
    batch_result: batchResult,
    decisions,
    report_markdown: report,
  };
}

function evaluateVenue(
  venue: VenueComplete,
  currentErrors: string[],
  currentWarnings: string[],
  minEvidenceConfidence: number,
): GateDecision {
  const hero = venue.hero_image || venue.images.hero;
  const fields = {
    has_hero_image: Boolean(hero && venue.images.has_hero_image),
    has_tagline: Boolean(venue.editorial.tagline && venue.editorial.tagline.trim().length >= 12),
    has_description: Boolean(venue.editorial.description && venue.editorial.description.trim().length >= 80),
    has_two_mood_tags: (venue.editorial.mood_tags || []).length >= 2,
    evidence_confidence_minimum: venue.evidence.confidence >= minEvidenceConfidence,
    not_published: !isPublished(venue),
    image_not_approved_for_publication: !isImageApprovedForPublication(hero),
    no_hard_blockers: currentErrors.length === 0,
  };
  const blockers = buildBlockers(fields, currentErrors, venue);
  const warnings = [...new Set([
    ...currentWarnings,
    ...buildGateWarnings(venue, hero),
  ])];
  const passed = Object.values(fields).every(Boolean) && blockers.length === 0;
  const status: QualityGateStatus = passed ? 'ready_for_db_staging' : blockers.length > 0 ? 'blocked' : 'needs_review';

  return {
    venue_name: venue.raw.name,
    status,
    passed,
    reasons: passed
      ? ['all quality gate fields passed; venue data eligible for Supabase staging sync only']
      : blockers.length > 0
        ? blockers
        : warnings,
    blockers,
    warnings,
    fields_validated: fields,
  };
}

function buildBlockers(
  fields: Record<string, boolean>,
  currentErrors: string[],
  venue: VenueComplete,
): string[] {
  const blockers = new Set<string>();
  if (!fields.has_hero_image) blockers.add('no_hero_image');
  if (!fields.has_tagline) blockers.add('missing_or_short_tagline');
  if (!fields.has_description) blockers.add('missing_description');
  if (!fields.has_two_mood_tags) blockers.add('fewer_than_two_mood_tags');
  if (!fields.evidence_confidence_minimum) blockers.add('evidence_confidence_below_minimum');
  if (!fields.not_published) blockers.add('venue_already_published');
  if (!fields.image_not_approved_for_publication) blockers.add('image_publication_rights_auto_approved');
  for (const error of currentErrors) blockers.add(error);
  if (venue.hero_image?.publication_status && venue.hero_image.publication_status !== 'not_approved_for_publication') {
    blockers.add('image_publication_status_not_allowed');
  }
  return [...blockers];
}

function buildGateWarnings(venue: VenueComplete, hero: ImageCandidate | undefined): string[] {
  const warnings: string[] = [];
  if (hero?.rights_risk === 'medium') warnings.push('image_rights_review_required_before_publication');
  if (hero?.risk_flags?.includes('rights_review_needed')) warnings.push('rights_review_needed');
  if (!venue.raw.instagram_url && !venue.evidence.contact?.instagram) warnings.push('missing_instagram');
  return warnings;
}

function isPublished(venue: VenueComplete): boolean {
  return Boolean(
    venue.pipeline_notes?.some((note) => note.toLowerCase().includes('published')) ||
    venue.hero_image?.publication_status === undefined && false,
  );
}

function isImageApprovedForPublication(hero: ImageCandidate | undefined): boolean {
  if (!hero) return false;
  return hero.publication_status !== 'not_approved_for_publication';
}

function buildSummary(items: ReviewQueueItem[]): BatchResult['summary'] {
  return {
    input: items.length,
    ready_for_db_staging: items.filter((item) => item.status === 'ready_for_db_staging').length,
    auto_staged: items.filter((item) => item.status === 'auto_staged').length,
    needs_review: items.filter((item) => item.status === 'needs_review').length,
    blocked: items.filter((item) => item.status === 'blocked').length,
    approved: items.filter((item) => item.status === 'approved').length,
    rejected: items.filter((item) => item.status === 'rejected').length,
    staged: items.filter((item) => item.status === 'staged').length,
    published: items.filter((item) => item.status === 'published').length,
  };
}

function buildReport(batchResult: BatchResult, decisions: GateDecision[]): string {
  const blockerCounts = countByFlat(decisions.flatMap((decision) => decision.blockers));
  const lines = [
    '# Stage 06 Final Quality Gate Report',
    '',
    `- Batch: ${batchResult.batch_id}`,
    `- Total venues: ${decisions.length}`,
    `- Ready for DB staging: ${batchResult.summary.ready_for_db_staging ?? 0}`,
    `- Needs review: ${batchResult.summary.needs_review}`,
    `- Blocked: ${batchResult.summary.blocked}`,
    '',
    '## Fields Validated',
    '',
    '- has_hero_image',
    '- has_tagline',
    '- has_description',
    '- has_two_mood_tags',
    '- evidence_confidence_minimum',
    '- not_published',
    '- image_not_approved_for_publication',
    '- no_hard_blockers',
    '',
    '## Venue Decisions',
    '',
    '| Venue | Status | Passed | Blockers | Warnings | Reason |',
    '| --- | --- | --- | --- | --- | --- |',
    ...decisions.map((decision) =>
      `| ${escapeTable(decision.venue_name)} | ${decision.status} | ${decision.passed ? 'yes' : 'no'} | ${escapeTable(decision.blockers.join(', ') || 'none')} | ${escapeTable(decision.warnings.join(', ') || 'none')} | ${escapeTable(decision.reasons.join('; '))} |`,
    ),
    '',
    '## Blocker Counts',
    '',
    ...entriesOrNone(blockerCounts),
    '',
    '## Safety',
    '',
    '- This gate only marks eligibility for future Supabase staging sync.',
    '- No Supabase sync was run.',
    '- No venue was published.',
    '- No image was approved for publication.',
    '- No MiniMax M3, MiniMax 2.7, OpenAI, or external model calls were made.',
  ];

  return `${lines.join('\n')}\n`;
}

function countByFlat(values: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const value of values) {
    counts[value] = (counts[value] || 0) + 1;
  }
  return counts;
}

function entriesOrNone(values: Record<string, number>): string[] {
  const entries = Object.entries(values);
  return entries.length > 0 ? entries.map(([key, value]) => `- ${key}: ${value}`) : ['- none'];
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, 'utf8')) as T;
}

function resolveQualityGateInputPath(outputDir: string): string {
  const preferred = path.join(outputDir, 'batch_result_with_editorial.json');
  if (existsSync(preferred)) return preferred;
  return path.join(outputDir, 'batch_result_enriched.json');
}

function escapeTable(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

const currentFile = path.resolve(fileURLToPath(import.meta.url));
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : '';

if (currentFile === invokedFile) {
  const batchName = process.argv[2];
  if (!batchName) {
    console.error('Usage: npx tsx pipeline/stages/06_quality_gate.ts <batch_id>');
    process.exitCode = 1;
  } else {
    try {
      runQualityGate(batchName);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Stage 06 quality gate failed: ${message}`);
      process.exitCode = 1;
    }
  }
}
