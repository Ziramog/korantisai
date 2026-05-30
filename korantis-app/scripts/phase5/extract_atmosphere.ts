import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '..', '..', '.env.local') });
import { OpenAI } from 'openai';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('Error: OPENAI_API_KEY is not set in environment.');
  process.exit(1);
}

const client = new OpenAI({
  apiKey: OPENAI_API_KEY
});

const CORPUS_DIR = path.join(__dirname, '..', '..', 'data', 'review_corpus');
const OUT_FILE = path.join(__dirname, '..', '..', 'data', 'l3_prose.json');

async function extractAtmosphere(venueName: string, reviews: string[]): Promise<string> {
  const prompt = `
You are an atmospheric archivist for Buenos Aires.
Study the following raw signals about "${venueName}" and write a single dense paragraph (80–120 words) describing what this place FEELS LIKE.

CRITICAL INSTRUCTIONS:
- IGNORE: food quality, service quality, pricing.
- FOCUS ON: atmosphere, light quality, pacing, solitude, intimacy, social energy, emotional texture, environmental feeling.
- TONE: Korantis editorial voice. Literary, precise, atmospheric.
- CONSTRAINTS: No marketing language. No superlatives. Do not summarize or list.

REVIEWS (sample):
${reviews.join('\n---\n')}
`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.6,
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'atmospheric_extraction',
        schema: {
          type: 'object',
          properties: {
            prose: {
              type: 'string',
              description: 'The final atmospheric prose meeting all constraints.'
            }
          },
          required: ['prose'],
          additionalProperties: false
        },
        strict: true
      }
    }
  });

  const rawContent = response.choices[0].message.content;
  if (!rawContent) throw new Error('No content returned from OpenAI');

  const parsed = JSON.parse(rawContent);
  return parsed.prose.trim();
}

async function main() {
  if (!fs.existsSync(CORPUS_DIR)) {
    console.error(`Corpus dir not found: ${CORPUS_DIR}. Run fetch_reviews.ts first.`);
    process.exit(1);
  }

  // We are forcing a fresh regeneration of all L3 prose using GPT-4o-mini
  // to ensure a clean baseline for the divergence report.
  let l3Prose: Record<string, any> = {};
  
  const files = fs.readdirSync(CORPUS_DIR).filter(f => f.endsWith('.json'));
  let updated = false;

  console.log(`Starting Phase 5.1 Extraction with GPT-4o-mini (Structured Outputs)...`);

  for (const file of files) {
    const venueId = path.basename(file, '.json');
    const filePath = path.join(CORPUS_DIR, file);
    const venueData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    if (!venueData.reviews || venueData.reviews.length === 0) {
      console.log(`[SKIP] No reviews found for ${venueData.venueName}, cannot generate prose.`);
      continue;
    }

    console.log(`[EXTRACT] Generating atmospheric prose for ${venueData.venueName}...`);
    const reviewTexts = venueData.reviews.map((r: any) => r.text);
    
    // Safety protection against infinite loops
    let success = false;
    let attempts = 0;
    const MAX_RETRIES = 2;

    while (!success && attempts < MAX_RETRIES) {
      attempts++;
      try {
        const prose = await extractAtmosphere(venueData.venueName, reviewTexts);
        l3Prose[venueId] = {
          venueId,
          venueName: venueData.venueName,
          prose
        };
        success = true;
        updated = true;
        console.log(`        Success.`);
      } catch (e: any) {
        console.error(`        Attempt ${attempts} failed for ${venueData.venueName}:`, e.message);
        if (attempts >= MAX_RETRIES) {
          console.error(`        Giving up on ${venueData.venueName} after ${MAX_RETRIES} attempts.`);
        } else {
          // Wait before retrying
          await new Promise(r => setTimeout(r, 1000));
        }
      }
    }
  }

  if (updated) {
    fs.writeFileSync(OUT_FILE, JSON.stringify(l3Prose, null, 2), 'utf-8');
    console.log(`\nAtmospheric prose successfully written to ${OUT_FILE}`);
  } else {
    console.log('\nNo updates needed.');
  }
}

main().catch(console.error);
