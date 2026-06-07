import {
  createSafeFilenameReport,
  loadBatchData,
  safeFilenameMarkdown,
  writeMarkdownReport,
} from './batch_02_common';

const report = createSafeFilenameReport(loadBatchData());

writeMarkdownReport('batch_02_safe_filename_check.md', safeFilenameMarkdown(report));

console.log('Batch 02 safe filename check written to data/.');
