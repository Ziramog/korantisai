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

const PROMPT_TEMPLATE = `
Analyze the following Google Reviews for the venue and extract the "Atmospheric Prose".
Ignore all comments about food quality, service speed, or pricing.
Focus ONLY on: Light quality, pacing, solitude vs social energy, emotional texture, environmental feeling.
Output a single, evocative, beautifully written paragraph (max 150 words) in the Korantis editorial voice (literary, precise, atmospheric).

Reviews:
{REVIEWS_TEXT}
`;

async function main() {
  console.log("Starting Step 3: Extract Atmosphere...");

  const { data: venues } = await supabase.from('staging_venues').select('*').eq('status', 'processing').is('atmosphere_prose', null);

  if (!venues || venues.length === 0) return;

  for (const venue of venues) {
    console.log(`Extracting atmosphere for ${venue.name}...`);
    
    const { data: reviews } = await supabase.from('venue_reviews').select('text').eq('venue_id', venue.id).neq('text', '');
    
    if (!reviews || reviews.length === 0) {
      console.log(`  Skipping: No reviews found.`);
      continue;
    }

    const reviewsText = reviews.map(r => r.text).join('\n---\n').slice(0, 30000); // safety crop

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an expert architectural and atmospheric writer.' },
        { role: 'user', content: PROMPT_TEMPLATE.replace('{REVIEWS_TEXT}', reviewsText) }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'atmospheric_extraction',
          schema: {
            type: 'object',
            properties: {
              prose: { type: 'string', description: 'The 150-word atmospheric paragraph.' }
            },
            required: ['prose'],
            additionalProperties: false
          },
          strict: true
        }
      }
    });

    const parsed = JSON.parse(response.choices[0].message.content || '{"prose": ""}');
    const prose = parsed.prose;

    if (prose) {
      await supabase.from('staging_venues').update({ atmosphere_prose: prose }).eq('id', venue.id);
      
      const wordCount = prose.split(' ').length;
      await supabase.from('quality_scores').upsert({
        venue_id: venue.id,
        review_count: reviews.length,
        has_prose: true,
        atmosphere_word_count: wordCount
      }, { onConflict: 'venue_id' });
      
      console.log(`✅ Extracted prose (${wordCount} words).`);
    }
  }
}
main().catch(console.error);
