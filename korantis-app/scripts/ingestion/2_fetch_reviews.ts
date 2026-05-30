import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '..', '..', '.env.local') });
import { createClient } from '@supabase/supabase-js';

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!);

async function fetchPlaceReviews(placeId: string) {
  const url = `https://places.googleapis.com/v1/places/${placeId}?fields=reviews`;
  const response = await fetch(url, {
    headers: { 'X-Goog-Api-Key': GOOGLE_API_KEY as string }
  });
  if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
  const data = await response.json();
  return data.reviews || [];
}

async function main() {
  console.log("Starting Step 2: Fetch Reviews...");

  const { data: venues, error } = await supabase
    .from('staging_venues')
    .select('*')
    .eq('status', 'processing');

  if (error || !venues || venues.length === 0) return;

  for (const venue of venues) {
    console.log(`Fetching reviews for ${venue.name}...`);
    try {
      // Check if we already have reviews to make it idempotent
      const { count } = await supabase.from('venue_reviews').select('*', { count: 'exact', head: true }).eq('venue_id', venue.id);
      if (count && count > 0) {
        console.log(`  Skipping: Already has ${count} reviews.`);
        continue;
      }

      const reviews = await fetchPlaceReviews(venue.id);
      
      for (const review of reviews) {
        await supabase.from('venue_reviews').insert({
          venue_id: venue.id,
          author_name: review.authorAttribution?.displayName || 'Anonymous',
          rating: review.rating,
          text: review.text?.text || '',
          language: review.text?.languageCode || 'en',
          time: review.publishTime
        });
      }
      console.log(`✅ Saved ${reviews.length} reviews.`);
    } catch (e: any) {
      console.error(`❌ Error fetching reviews for ${venue.name}: ${e.message}`);
    }
  }
}
main().catch(console.error);
