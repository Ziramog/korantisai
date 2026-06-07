import path from 'path';
import {
  dataPath,
  extractCandidates,
  readJsonFile,
  validateFinalVisionQueue,
  validationMarkdown,
  writeJsonFile,
  writeMarkdownFile,
} from './image_prefilter_utils';

const inputFile = getArg('--input') || getArg('-i');

if (!inputFile) {
  console.error('Usage: npx tsx scripts/pipeline/validate_final_vision_queue.ts --input <queue.json>');
  process.exit(1);
}

const input = readJsonFile(path.resolve(inputFile));
const candidates = extractCandidates(input);
const report = validateFinalVisionQueue(candidates, path.resolve(inputFile));

writeJsonFile(dataPath('final_vision_queue_validation_report.json'), report);
writeMarkdownFile(dataPath('final_vision_queue_validation_report.md'), validationMarkdown(report));

if (report.failures.length > 0) {
  console.error(`Final vision queue validation failed with ${report.failures.length} failing checks.`);
  process.exit(1);
}

console.log('Final vision queue validation passed. Reports written to data/.');

function getArg(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}
