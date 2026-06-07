import {
  createPublishReadinessReport,
  loadBatchData,
  readinessMarkdown,
  writeJsonReport,
  writeMarkdownReport,
} from './batch_02_common';

const report = createPublishReadinessReport(loadBatchData());

writeJsonReport('batch_02_publish_readiness_report.json', report);
writeMarkdownReport('batch_02_publish_readiness_report.md', readinessMarkdown(report));

console.log('Batch 02 publish readiness report written to data/.');
