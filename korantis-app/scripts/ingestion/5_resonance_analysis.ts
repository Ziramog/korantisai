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

async function analyzeResonance(l2Text: string, l3Text: string, venueName: string) {
  const prompt = `Analyze these two atmospheric descriptions of the venue "${venueName}".
Layer 2 (Editorial Interpretation): "${l2Text}"
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
  console.log('Starting Step 5: Resonance Analysis...');

  const { data: venues } = await supabase
    .from('staging_venues')
    .select('*')
    .eq('status', 'processing')
    .not('atmosphere_prose', 'is', null);

  if (!venues || venues.length === 0) return;

  for (const venue of venues) {
    console.log(`Analyzing resonance for ${venue.name}...`);

    const { data: l3Records } = await supabase
      .from('venue_embeddings')
      .select('embedding')
      .eq('venue_id', venue.id)
      .eq('layer', 'L3')
      .limit(1);

    if (!l3Records || l3Records.length === 0) {
      console.log('  Skipping: missing L3 embedding.');
      continue;
    }

    const { data: l2Records } = await supabase
      .from('venue_embeddings')
      .select('embedding')
      .eq('venue_id', venue.id)
      .eq('layer', 'L2')
      .limit(1);

    if (!l2Records || l2Records.length === 0) {
      await supabase.from('quality_scores').upsert({
        venue_id: venue.id,
        resonance_score: null,
        interpretation_notes: 'resonance_status: insufficient_l2',
        last_processed_at: new Date().toISOString()
      }, { onConflict: 'venue_id' });

      console.log('  Skipped: resonance_status=insufficient_l2');
      continue;
    }

    const l3VectorRaw = l3Records[0].embedding;
    const l2VectorRaw = l2Records[0].embedding;
    const l3Vector = typeof l3VectorRaw === 'string' ? JSON.parse(l3VectorRaw) : l3VectorRaw;
    const l2Vector = typeof l2VectorRaw === 'string' ? JSON.parse(l2VectorRaw) : l2VectorRaw;

    const similarity = cosineSimilarity(l2Vector, l3Vector);
    const l2Text = `Existing Layer 2 editorial embedding for ${venue.name}.`;
    const comparison = await analyzeResonance(l2Text, venue.atmosphere_prose, venue.name);

    await supabase.from('quality_scores').upsert({
      venue_id: venue.id,
      resonance_score: similarity,
      editorial_themes: comparison.editorialThemes,
      crowd_themes: comparison.crowdThemes,
      overlap_themes: comparison.overlapThemes,
      interpretation_notes: comparison.interpretationNotes,
      last_processed_at: new Date().toISOString()
    }, { onConflict: 'venue_id' });

    console.log(`Resonance calculated (Score: ${similarity.toFixed(3)})`);
  }
}

main().catch(console.error);
