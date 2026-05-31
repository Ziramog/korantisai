import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '..', '..', '.env.local') });
import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';
import { PHASE_A_PLACE_IDS } from './phase_a_ids';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const PROMPT_TEMPLATE = `
Write grounded Korantis venue microcopy from the evidence below.

Rules:
- Do not invent details.
- Do not beautify weak evidence.
- Avoid generic poetic phrases including: nestled, sanctuary, embrace, waft, serenade, harmonic blend, world beyond drifts.
- Also avoid: tranquil charm, linger in its gentle, and poetic cafe cliches.
- Main description must be 45-70 words.
- Use direct atmospheric language grounded in reviews/category evidence.
- If evidence suggests takeaway, limited seating, product-only, or weak atmosphere, say that clearly.

Return:
- primary_atmosphere: short label, e.g. Quick Specialty Coffee, Warm Neighborhood Cafe, Low-lit Dinner Spot.
- short_description: 2-4 short sentences, 45-70 words.
- best_for: 1-3 practical use cases.
- not_ideal_for: 0-3 constraints.
- atmosphere_tags: 3-6 structured lowercase tags.
- confidence: 0-100.
- evidence_used: category, review_signals, photo_signals, constraints.

Evidence:
{REVIEWS_TEXT}
`;

function hasFlag(name: string) {
  return process.argv.includes(`--${name}`);
}

function getArgValue(name: string) {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

function selectedIds() {
  if (hasFlag('phase-a')) return [...PHASE_A_PLACE_IDS];
  const ids = getArgValue('ids');
  return ids ? ids.split(',').map((id) => id.trim()).filter(Boolean) : [];
}

async function main() {
  console.log("Starting Step 3: Extract Atmosphere...");

  const ids = selectedIds();
  let query = supabase.from('staging_venues').select('*');

  if (ids.length > 0) {
    query = query.in('id', ids);
  } else {
    query = query.eq('status', 'processing');
  }

  if (!hasFlag('force')) {
    query = query.is('atmosphere_prose', null);
  }

  const { data: venues } = await query;

  if (!venues || venues.length === 0) return;

  for (const venue of venues) {
    console.log(`Extracting atmosphere for ${venue.name}...`);
    
    const { data: reviews } = await supabase.from('venue_reviews').select('text').eq('venue_id', venue.id).neq('text', '');
    
    if (!reviews || reviews.length === 0) {
      console.log(`  Skipping: No reviews found.`);
      continue;
    }

    const reviewsText = [
      `Venue: ${venue.name}`,
      `Category seed: ${venue.category_seed}`,
      `Google canonical data: ${JSON.stringify(venue.canonical_data || {}).slice(0, 4000)}`,
      'Reviews:',
      reviews.map(r => r.text).join('\n---\n').slice(0, 26000)
    ].join('\n');

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You write restrained, evidence-based venue microcopy for a curated discovery product. Do not use generic poetic language.' },
        { role: 'user', content: PROMPT_TEMPLATE.replace('{REVIEWS_TEXT}', reviewsText) }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'atmospheric_extraction',
          schema: {
            type: 'object',
            properties: {
              primary_atmosphere: { type: 'string' },
              short_description: { type: 'string', description: 'Grounded 45-70 word venue description.' },
              best_for: { type: 'array', items: { type: 'string' } },
              not_ideal_for: { type: 'array', items: { type: 'string' } },
              atmosphere_tags: { type: 'array', items: { type: 'string' } },
              confidence: { type: 'number' },
              evidence_used: {
                type: 'object',
                properties: {
                  category: { type: 'string' },
                  review_signals: { type: 'array', items: { type: 'string' } },
                  photo_signals: { type: 'array', items: { type: 'string' } },
                  constraints: { type: 'array', items: { type: 'string' } }
                },
                required: ['category', 'review_signals', 'photo_signals', 'constraints'],
                additionalProperties: false
              }
            },
            required: ['primary_atmosphere', 'short_description', 'best_for', 'not_ideal_for', 'atmosphere_tags', 'confidence', 'evidence_used'],
            additionalProperties: false
          },
          strict: true
        }
      }
    });

    const parsed = JSON.parse(response.choices[0].message.content || '{"primary_atmosphere":"","short_description":"","best_for":[],"not_ideal_for":[],"atmosphere_tags":[],"confidence":0,"evidence_used":{"category":"","review_signals":[],"photo_signals":[],"constraints":[]}}');
    const prose = parsed.short_description;

    if (prose) {
      const updatePayload: Record<string, unknown> = { atmosphere_prose: prose };
      const { error: curationColumnError } = await supabase.from('staging_venues').select('primary_atmosphere').limit(1);

      if (!curationColumnError) {
        updatePayload.primary_atmosphere = parsed.primary_atmosphere;
        updatePayload.best_for = parsed.best_for;
        updatePayload.not_ideal_for = parsed.not_ideal_for;
        updatePayload.grounded_description = prose;
      }

      await supabase.from('staging_venues').update(updatePayload).eq('id', venue.id);
      
      const wordCount = prose.split(' ').length;
      await supabase.from('quality_scores').upsert({
        venue_id: venue.id,
        review_count: reviews.length,
        has_prose: true,
        atmosphere_word_count: wordCount,
        interpretation_notes: JSON.stringify({
          ...(parsed.evidence_used || {}),
          primary_atmosphere: parsed.primary_atmosphere,
          best_for: parsed.best_for,
          not_ideal_for: parsed.not_ideal_for,
          atmosphere_tags: parsed.atmosphere_tags,
          confidence: parsed.confidence,
          copy_style: 'grounded_microcopy'
        })
      }, { onConflict: 'venue_id' });
      
      console.log(`✅ Extracted prose (${wordCount} words).`);
    }
  }
}
main().catch(console.error);
