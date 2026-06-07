import path from 'path';
import {
  buildQueueMarkdown,
  buildVisionQueue,
  dataPath,
  extractCandidates,
  readJsonFile,
  writeJsonFile,
  writeMarkdownFile,
} from './image_prefilter_utils';

const inputFile = getArg('--input') || getArg('-i');
const outputFile = getArg('--output') || dataPath('batch_vision_queue_hardened.json');

if (!inputFile) {
  console.error('Usage: npx tsx scripts/pipeline/build_batch_vision_queue.ts --input <candidates.json> [--output <queue.json>]');
  process.exit(1);
}

const input = readJsonFile(path.resolve(inputFile));
const candidates = extractCandidates(input);
const report = buildVisionQueue(candidates);

writeJsonFile(path.resolve(outputFile), {
  generated_at: report.generated_at,
  ready_for_m3: Object.values(report.success_criteria).every(Boolean),
  queue: report.final_queue,
  rejected_candidates: report.rejected_candidates,
  summary: report.summary,
  success_criteria: report.success_criteria,
});
writeJsonFile(dataPath('batch_vision_queue_build_report.json'), report);
writeMarkdownFile(dataPath('batch_vision_queue_build_report.md'), buildQueueMarkdown(report));

console.log(`Hardened queue written to ${path.resolve(outputFile)}. No M3, Supabase, or Cloudinary calls performed.`);

function getArg(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}
