import {
  createVenueEvidenceDryRun,
  evidenceDryRunMarkdown,
  loadBatchData,
  writeJsonReport,
  writeMarkdownReport,
} from './batch_02_common';

const report = createVenueEvidenceDryRun(loadBatchData());

writeJsonReport('batch_02_venue_evidence_dry_run.json', report);
writeMarkdownReport('batch_02_venue_evidence_dry_run.md', evidenceDryRunMarkdown(report));

console.log('Venue evidence dry-run report written to data/. No writes performed.');
