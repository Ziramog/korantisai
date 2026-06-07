import {
  createValidationReport,
  createVisualAnalysis,
  loadBatchData,
  validationMarkdown,
  visualAnalysisMarkdown,
  writeJsonReport,
  writeMarkdownReport,
} from './batch_02_common';

const batch = loadBatchData();
const validation = createValidationReport(batch);
const visualAnalysis = createVisualAnalysis(batch);

writeJsonReport('batch_02_codex_validation_report.json', validation);
writeMarkdownReport('batch_02_codex_validation_report.md', validationMarkdown(validation));
writeJsonReport('batch_02_visual_analysis_report.json', visualAnalysis);
writeMarkdownReport('batch_02_visual_analysis_report.md', visualAnalysisMarkdown(visualAnalysis));

if (validation.failures.length > 0) {
  console.error(`Batch 02 validation failed with ${validation.failures.length} failing checks.`);
  process.exit(1);
}

console.log('Batch 02 validation passed. Reports written to data/.');
