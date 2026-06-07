import { execSync } from 'child_process';
import * as path from 'path';

const steps = [
  '2_fetch_reviews.ts',
  '3_extract_atmosphere.ts',
  '4_generate_embeddings.ts',
  '5_resonance_analysis.ts',
  '6_quality_check.ts'
];

console.log("Starting Phase 5.2A Ingestion Pipeline (Steps 2-6)...");

for (const step of steps) {
  const scriptPath = path.join(__dirname, step);
  console.log(`\n================================`);
  console.log(`Executing: ${step}`);
  console.log(`================================`);
  try {
    // Run synchronously, redirect stdout and stderr to the current process
    execSync(`npx tsx "${scriptPath}"`, { stdio: 'inherit' });
  } catch {
    console.error(`\n❌ Pipeline failed at step: ${step}`);
    process.exit(1);
  }
}

console.log("\n✅ Ingestion Pipeline Complete.");
