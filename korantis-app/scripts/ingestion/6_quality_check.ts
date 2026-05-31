import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '..', '..', '.env.local') });
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!);

async function main() {
  console.log('Starting Step 6: Quality Check...');

  const { data: venues } = await supabase.from('staging_venues').select('*').eq('status', 'processing');

  if (!venues || venues.length === 0) return;

  for (const venue of venues) {
    console.log(`Checking quality for ${venue.name}...`);

    const { data: scores } = await supabase.from('quality_scores').select('*').eq('venue_id', venue.id).single();

    if (!scores) {
      console.log('  Missing quality scores.');
      continue;
    }

    const { count: reviewCount, error: reviewError } = await supabase
      .from('venue_reviews')
      .select('*', { count: 'exact', head: true })
      .eq('venue_id', venue.id)
      .neq('text', '');

    if (reviewError) {
      console.log(`  Could not verify reviews: ${reviewError.message}`);
      continue;
    }

    const isComplete = Boolean(
      reviewCount &&
      reviewCount > 0 &&
      scores.has_prose &&
      scores.has_embeddings
    );

    if (isComplete) {
      await supabase.from('staging_venues').update({ status: 'ready_for_review' }).eq('id', venue.id);
      console.log("Passed. Status updated to 'ready_for_review'.");
    } else {
      console.log('  Incomplete data. Remains in processing.');
    }
  }
}

main().catch(console.error);
