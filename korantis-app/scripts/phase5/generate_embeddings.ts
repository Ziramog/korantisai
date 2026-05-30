import * as fs from 'fs';
import * as path from 'path';
import { pipeline, env } from '@xenova/transformers';
import { MOCK_VENUES } from '../../src/app/data/venues';

// Disable remote models if needed, but here we want to download once and cache locally
env.allowLocalModels = false;
env.useBrowserCache = false;

const PROSE_FILE = path.join(__dirname, '..', '..', 'data', 'l3_prose.json');
const OUT_FILE = path.join(__dirname, '..', '..', 'data', 'embeddings.json');

async function main() {
  if (!fs.existsSync(PROSE_FILE)) {
    console.error(`L3 Prose file not found: ${PROSE_FILE}. Run extract_atmosphere.ts first.`);
    process.exit(1);
  }

  const l3Prose = JSON.parse(fs.readFileSync(PROSE_FILE, 'utf-8'));
  const embeddingsData: Record<string, any> = {};

  console.log('Loading embedding model (this may take a moment on first run)...');
  // Use a fast, small, capable embedding model
  const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  console.log('Model loaded.');

  for (const venue of MOCK_VENUES) {
    if (!l3Prose[venue.id]) {
      console.log(`[SKIP] Missing L3 prose for ${venue.name}`);
      continue;
    }

    console.log(`[EMBED] Generating vectors for ${venue.name}...`);
    
    // L2 Source: Human Curator
    const l2Text = `${venue.tagline} ${venue.narrative}`;
    
    // L3 Source: LLM generated atmospheric prose from reviews
    const l3Text = l3Prose[venue.id].prose;

    // Generate embeddings
    const l2Output = await extractor(l2Text, { pooling: 'mean', normalize: true });
    const l3Output = await extractor(l3Text, { pooling: 'mean', normalize: true });

    // Store as plain arrays
    embeddingsData[venue.id] = {
      venueId: venue.id,
      venueName: venue.name,
      l2Vector: Array.from(l2Output.data),
      l3Vector: Array.from(l3Output.data),
      l2Text,
      l3Text
    };
  }

  fs.writeFileSync(OUT_FILE, JSON.stringify(embeddingsData, null, 2), 'utf-8');
  console.log(`\nEmbeddings successfully written to ${OUT_FILE}`);
}

main().catch(console.error);
