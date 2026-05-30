import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '..', '..', '.env.local') });
import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

function cosineSimilarity(A: number[], B: number[]): number {
  let dotProduct = 0, normA = 0, normB = 0;
  for (let i = 0; i < A.length; i++) {
    dotProduct += A[i] * B[i];
    normA += A[i] * A[i];
    normB += B[i] * B[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function getEmbedding(text: string) {
  const { pipeline } = await import('@xenova/transformers');
  const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', { quantized: true });
  const output = await extractor(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data) as number[];
}

async function analyzeResonance(l2Text: string, l3Text: string, venueName: string) {
  const prompt = `Analyze these two atmospheric descriptions of the venue "${venueName}".
Layer 2 (Category/Editorial Expectation): "${l2Text}"
Layer 3 (Observed Public Perception): "${l3Text}"
Extract the underlying atmospheric themes from both. Identify overlaps and divergences.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'layer_comparison',
        schema: {
          type: 'object',
          properties: {
            editorialThemes: { type: 'array', items: { type: 'string' } },
            crowdThemes: { type: 'array', items: { type: 'string' } },
            overlapThemes: { type: 'array', items: { type: 'string' } },
            interpretationNotes: { type: 'string' }
          },
          required: ['editorialThemes', 'crowdThemes', 'overlapThemes', 'interpretationNotes'],
          additionalProperties: false
        },
        strict: true
      }
    }
  });
  return JSON.parse(response.choices[0].message.content || '{}');
}

async function main() {
  console.log("Starting Step 5: Resonance Analysis...");

  const { data: venues } = await supabase.from('staging_venues').select('*').eq('status', 'processing').not('atmosphere_prose', 'is', null);

  if (!venues || venues.length === 0) return;

  for (const venue of venues) {
    console.log(`Analyzing resonance for ${venue.name}...`);
    
    // Fetch L3 vector
    const { data: l3Records } = await supabase.from('venue_embeddings').select('embedding').eq('venue_id', venue.id).eq('layer', 'L3').limit(1);
    if (!l3Records || l3Records.length === 0) continue;
    const l3Vector = l3Records[0].embedding;

    // Fetch L2 vector, if not found, we use category_seed as a proxy baseline
    let l2Vector;
    const { data: l2Records } = await supabase.from('venue_embeddings').select('embedding').eq('venue_id', venue.id).eq('layer', 'L2').limit(1);
    let l2Text = `This is a high-quality ${venue.category_seed} venue located in ${venue.city}.`;
    
    if (l2Records && l2Records.length > 0) {
      l2Vector = l2Records[0].embedding;
    } else {
      console.log(`  No L2 found. Generating baseline L2 vector from category seed...`);
      l2Vector = await getEmbedding(l2Text);
    }

    const similarity = cosineSimilarity(l2Vector, l3Vector);
    const comparison = await analyzeResonance(l2Text, venue.atmosphere_prose, venue.name);

    await supabase.from('quality_scores').upsert({
      venue_id: venue.id,
      resonance_score: similarity,
      editorial_themes: comparison.editorialThemes,
      crowd_themes: comparison.crowdThemes,
      overlap_themes: comparison.overlapThemes,
      interpretation_notes: comparison.interpretationNotes
    }, { onConflict: 'venue_id' });

    console.log(`✅ Resonance calculated (Score: ${similarity.toFixed(3)})`);
  }
}
main().catch(console.error);
