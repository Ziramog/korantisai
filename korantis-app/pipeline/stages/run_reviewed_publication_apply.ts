import { existsSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { materializeCloudinary } from './10_materialize_cloudinary';
import { projectToPublicDryRun } from './11_project_to_public';
import { activatePublicVenues } from './12_activate_public_venues';
import { runPostActivationAudit } from './13_post_activation_audit';

interface StepResult {
  step: string;
  status: 'completed' | 'failed' | 'skipped';
  started_at: string;
  finished_at: string;
  summary: Record<string, unknown>;
  error?: string;
}

interface ReviewedPublicationApplyResult {
  batch_id: string;
  generated_at: string;
  mode: 'apply';
  steps: StepResult[];
  approved_requested: number;
  cloudinary_uploaded_or_existing: number;
  public_projected: number;
  activation_ready: number;
  activated: number;
  post_activation_audit_passed: number;
  post_activation_audit_failed: number;
  blocked: number;
  safety_checks: Record<string, boolean>;
}

interface ReviewedDecisionManifest {
  decisions: Array<{
    publication_decision?: string;
    publish_eligible?: boolean;
    blockers?: string[];
  }>;
}

export async function runReviewedPublicationApply(batchName: string): Promise<ReviewedPublicationApplyResult> {
  const outputDir = path.join(process.cwd(), 'data', 'batches', batchName);
  const reviewedManifestPath = path.join(outputDir, 'publication_decision_manifest.reviewed.json');
  if (!existsSync(reviewedManifestPath)) {
    throw new Error(`Missing reviewed manifest: ${reviewedManifestPath}`);
  }

  const manifest = readJson<ReviewedDecisionManifest>(reviewedManifestPath);
  const approvedRequested = manifest.decisions.filter((decision) =>
    decision.publication_decision === 'approve' &&
    decision.publish_eligible &&
    (decision.blockers || []).length === 0,
  ).length;
  if (approvedRequested <= 0) throw new Error('No approved publish-eligible venues found in reviewed manifest.');

  const steps: StepResult[] = [];
  let cloudinaryUploadedOrExisting = 0;
  let publicProjected = 0;
  let activationReady = 0;
  let activated = 0;
  let postActivationAuditPassed = 0;
  let postActivationAuditFailed = 0;
  let blocked = 0;

  try {
    await runStep(steps, '11_public_projection_dry_run', async () => {
      const dryRun = await projectToPublicDryRun(batchName, ['--dry-run']);
      if (!('stage_11_public_projection' in dryRun)) throw new Error('Stage 11 did not return dry-run result.');
      const unexpectedBlockers = dryRun.blockers_before_apply.filter((blocker) => !isExpectedPreCloudinaryBlocker(blocker));
      if (unexpectedBlockers.length > 0) {
        throw new Error(`Public projection dry-run blockers: ${unexpectedBlockers.join(', ')}`);
      }
      if (dryRun.stage_11_public_projection.approved_projected !== approvedRequested) {
        throw new Error(`Dry-run projected ${dryRun.stage_11_public_projection.approved_projected} but reviewed manifest approved ${approvedRequested}.`);
      }
      return {
        approved_projected: dryRun.stage_11_public_projection.approved_projected,
        skipped_count: dryRun.stage_11_public_projection.skipped_count,
        tolerated_pre_cloudinary_blockers: dryRun.blockers_before_apply.filter(isExpectedPreCloudinaryBlocker),
      };
    });

    await runStep(steps, '10_cloudinary_apply', async () => {
      const cloudinary = await materializeCloudinary(batchName, ['--apply']);
      cloudinaryUploadedOrExisting = cloudinary.uploaded + cloudinary.skipped_existing;
      if (cloudinary.blockers.length > 0) throw new Error(`Cloudinary blockers: ${cloudinary.blockers.join(', ')}`);
      if (cloudinary.errors > 0) throw new Error(`Cloudinary upload errors: ${cloudinary.errors}`);
      if (cloudinaryUploadedOrExisting !== approvedRequested) {
        throw new Error(`Cloudinary asset count ${cloudinaryUploadedOrExisting} does not match approved count ${approvedRequested}.`);
      }
      return {
        uploaded: cloudinary.uploaded,
        skipped_existing: cloudinary.skipped_existing,
        errors: cloudinary.errors,
      };
    });

    await runStep(steps, '11_public_projection_apply', async () => {
      const projection = await projectToPublicDryRun(batchName, ['--apply']);
      if (!('approved_projected' in projection)) throw new Error('Stage 11 did not return apply result.');
      publicProjected = projection.approved_projected;
      if (projection.blockers_before_apply.length > 0) throw new Error(`Public projection apply blockers: ${projection.blockers_before_apply.join(', ')}`);
      if (publicProjected !== approvedRequested) {
        throw new Error(`Projected count ${publicProjected} does not match approved count ${approvedRequested}.`);
      }
      return {
        approved_projected: projection.approved_projected,
        intended_write_count: projection.intended_write_count,
      };
    });

    await runStep(steps, '12_activation_dry_run', async () => {
      const activation = await activatePublicVenues(batchName, ['--dry-run']);
      activationReady = activation.ready_to_activate;
      blocked = activation.blocked;
      if (activation.ready_to_activate !== activation.requested || activation.blocked > 0) {
        throw new Error(`Activation dry-run blocked: ready=${activation.ready_to_activate}, requested=${activation.requested}, blocked=${activation.blocked}`);
      }
      return {
        requested: activation.requested,
        ready_to_activate: activation.ready_to_activate,
        blocked: activation.blocked,
      };
    });

    await runStep(steps, '12_activation_apply', async () => {
      const activation = await activatePublicVenues(batchName, ['--apply']);
      activated = activation.activated;
      blocked = activation.blocked;
      if (activation.activated !== activation.requested) {
        throw new Error(`Activation applied ${activation.activated}/${activation.requested}.`);
      }
      return {
        requested: activation.requested,
        activated: activation.activated,
        blocked: activation.blocked,
      };
    });

    await runStep(steps, '13_post_activation_audit', async () => {
      const audit = await runPostActivationAudit(batchName);
      postActivationAuditPassed = audit.passed;
      postActivationAuditFailed = audit.failed;
      if (audit.failed > 0) throw new Error(`Post-activation audit failed for ${audit.failed}/${audit.requested} venues.`);
      return {
        requested: audit.requested,
        passed: audit.passed,
        failed: audit.failed,
      };
    });
  } catch (error) {
    const result = buildResult(batchName, steps, approvedRequested, cloudinaryUploadedOrExisting, publicProjected, activationReady, activated, postActivationAuditPassed, postActivationAuditFailed, blocked);
    writeOutputs(outputDir, result);
    throw error;
  }

  const result = buildResult(batchName, steps, approvedRequested, cloudinaryUploadedOrExisting, publicProjected, activationReady, activated, postActivationAuditPassed, postActivationAuditFailed, blocked);
  writeOutputs(outputDir, result);
  console.log(`Reviewed publication apply result written to ${path.join(outputDir, 'reviewed_publication_apply_result.json')}`);
  console.log(`Reviewed publication apply report written to ${path.join(outputDir, 'reviewed_publication_apply_report.md')}`);
  console.log(`Reviewed publication apply summary: approved=${approvedRequested}, cloudinary=${cloudinaryUploadedOrExisting}, projected=${publicProjected}, activated=${activated}, audit_failed=${postActivationAuditFailed}`);
  return result;
}

async function runStep(
  steps: StepResult[],
  step: string,
  action: () => Promise<Record<string, unknown>>,
): Promise<void> {
  const startedAt = new Date().toISOString();
  try {
    const summary = await action();
    steps.push({
      step,
      status: 'completed',
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      summary,
    });
  } catch (error) {
    steps.push({
      step,
      status: 'failed',
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      summary: {},
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

function isExpectedPreCloudinaryBlocker(blocker: string): boolean {
  return blocker === 'Manual final approval is required before any public venues write.' ||
    blocker === 'Projected public venues must be inserted as curation_status pending_review; activation to active must be a separate later step.' ||
    /^Cloudinary materialization missing for \d+ approved venue hero image\(s\)\.$/.test(blocker);
}

function buildResult(
  batchName: string,
  steps: StepResult[],
  approvedRequested: number,
  cloudinaryUploadedOrExisting: number,
  publicProjected: number,
  activationReady: number,
  activated: number,
  postActivationAuditPassed: number,
  postActivationAuditFailed: number,
  blocked: number,
): ReviewedPublicationApplyResult {
  return {
    batch_id: batchName,
    generated_at: new Date().toISOString(),
    mode: 'apply',
    steps,
    approved_requested: approvedRequested,
    cloudinary_uploaded_or_existing: cloudinaryUploadedOrExisting,
    public_projected: publicProjected,
    activation_ready: activationReady,
    activated,
    post_activation_audit_passed: postActivationAuditPassed,
    post_activation_audit_failed: postActivationAuditFailed,
    blocked,
    safety_checks: {
      requires_reviewed_manifest: true,
      requires_explicit_run_confirmation_in_control_center: true,
      no_external_model_calls: true,
      cloudinary_uploads_only_approved_heroes: true,
      public_projection_writes_pending_review_before_activation: true,
      activation_requires_cloudinary_hero: true,
      activation_requires_minimum_gallery: true,
      post_activation_audit_required: true,
      no_consumer_ui_changes: true,
    },
  };
}

function writeOutputs(outputDir: string, result: ReviewedPublicationApplyResult): void {
  writeFileSync(path.join(outputDir, 'reviewed_publication_apply_result.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  writeFileSync(path.join(outputDir, 'reviewed_publication_apply_report.md'), buildReport(result), 'utf8');
}

function buildReport(result: ReviewedPublicationApplyResult): string {
  return [
    '# Reviewed Publication Apply Report',
    '',
    `- Batch: ${result.batch_id}`,
    `- Generated: ${result.generated_at}`,
    `- Approved requested: ${result.approved_requested}`,
    `- Cloudinary uploaded/existing: ${result.cloudinary_uploaded_or_existing}`,
    `- Public projected: ${result.public_projected}`,
    `- Activation ready: ${result.activation_ready}`,
    `- Activated: ${result.activated}`,
    `- Post-activation audit passed: ${result.post_activation_audit_passed}`,
    `- Post-activation audit failed: ${result.post_activation_audit_failed}`,
    `- Blocked: ${result.blocked}`,
    '',
    '## Steps',
    '',
    '| Step | Status | Summary | Error |',
    '| --- | --- | --- | --- |',
    ...result.steps.map((step) => `| ${step.step} | ${step.status} | ${escapeMd(JSON.stringify(step.summary))} | ${escapeMd(step.error || '')} |`),
    '',
    '## Safety',
    '',
    ...Object.entries(result.safety_checks).map(([key, value]) => `- ${key}: ${value}`),
  ].join('\n') + '\n';
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, 'utf8')) as T;
}

function escapeMd(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

const isDirectRun = process.argv[1] ? fileURLToPath(import.meta.url) === path.resolve(process.argv[1]) : false;

if (isDirectRun) {
  const batchName = process.argv[2];
  if (!batchName) {
    console.error('Usage: npx tsx pipeline/stages/run_reviewed_publication_apply.ts <batch_id>');
    process.exit(1);
  }

  runReviewedPublicationApply(batchName).catch((error: unknown) => {
    console.error(`Reviewed publication apply failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  });
}
