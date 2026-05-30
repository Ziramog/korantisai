import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '..', '..', '.env.local') });
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!);

async function main() {
  console.log("Starting Step 4: Generate Embeddings...");
  
  // We need dynamic import for transformers to avoid issues in CommonJS/ESM
  const { pipeline } = await import('@xenova/transformers');
  
  console.log("Loading embedding model...");
  const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
    quantized: true,
  });

  const { data: venues } = await supabase
    .from('staging_venues')
    .select('id, name, atmosphere_prose')
    .eq('status', 'processing')
    .not('atmosphere_prose', 'is', null);

  if (!venues || venues.length === 0) return;

  for (const venue of venues) {
    console.log(`Embedding ${venue.name}...`);
    
    try {
      const output = await extractor(venue.atmosphere_prose!, { pooling: 'mean', normalize: true });
      const vector = Array.from(output.data);

      await supabase.from('venue_embeddings').insert({
        venue_id: venue.id,
        layer: 'L3',
        embedding: vector,
        model_name: 'Xenova/all-MiniLM-L6-v2'
      });
      
      await supabase.from('quality_scores').upsert({
        venue_id: venue.id,
        has_embeddings: true,
        embedding_generated: true
      }, { onConflict: 'venue_id' });

      console.log(`✅ Embedded L3 for ${venue.name}`);
    } catch (e: any) {
      console.error(`❌ Error embedding ${venue.name}: ${e.message}`);
    }
  }
}
main().catch(console.error);
