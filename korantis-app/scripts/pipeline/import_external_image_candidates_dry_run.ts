import {
  createExternalImageCandidatesDryRun,
  externalDryRunMarkdown,
  loadBatchData,
  writeJsonReport,
  writeMarkdownReport,
} from './batch_02_common';

const report = createExternalImageCandidatesDryRun(loadBatchData());

writeJsonReport('batch_02_external_image_candidates_dry_run.json', report);
writeMarkdownReport('batch_02_external_image_candidates_dry_run.md', externalDryRunMarkdown(report));

console.log('External image candidate dry-run report written to data/. No writes performed.');
