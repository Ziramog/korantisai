import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '..', '..', '.env.local') });
import { createClient } from '@supabase/supabase-js';

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!GOOGLE_API_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing environment variables.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fetchPlaceDetails(placeId: string) {
  const url = `https://places.googleapis.com/v1/places/${placeId}?fields=id,displayName,formattedAddress,location,regularOpeningHours,websiteUri,photos`;
  const response = await fetch(url, {
    headers: {
      'X-Goog-Api-Key': GOOGLE_API_KEY as string
    }
  });
  if (!response.ok) throw new Error(`Google API Error: ${response.statusText}`);
  return await response.json();
}

async function main() {
  console.log("Starting Step 1: Fetch Canonical Data...");

  // Get pending venues
  const { data: venues, error } = await supabase
    .from('staging_venues')
    .select('*')
    .eq('status', 'pending');

  if (error || !venues || venues.length === 0) {
    console.log("No pending venues found.");
    return;
  }

  console.log(`Found ${venues.length} pending venues.`);

  for (const venue of venues) {
    console.log(`Processing ${venue.name} (${venue.id})...`);
    
    // Mark as processing
    await supabase.from('staging_venues').update({ status: 'processing' }).eq('id', venue.id);
    
    try {
      const details = await fetchPlaceDetails(venue.id);
      
      // Update canonical data
      await supabase.from('staging_venues').update({ 
        canonical_data: details 
      }).eq('id', venue.id);

      // Save photos
      if (details.photos && details.photos.length > 0) {
        for (let i = 0; i < details.photos.length; i++) {
          const photo = details.photos[i];
          await supabase.from('venue_images').insert({
            venue_id: venue.id,
            photo_reference: photo.name,
            width: photo.widthPx,
            height: photo.heightPx,
            html_attributions: photo.authorAttributions,
            is_cover: i === 0,
            status: 'reference_only'
          });
        }
        console.log(`  Saved ${details.photos.length} photo references.`);
      }
      
      console.log(`✅ Success: ${venue.name}`);
    } catch (e: any) {
      console.error(`❌ Error processing ${venue.name}: ${e.message}`);
      // Mark as error
      await supabase.from('pipeline_jobs').insert({
        venue_id: venue.id,
        step_name: '1_fetch_places',
        status: 'error',
        error_message: e.message,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      });
    }
  }
  
  console.log("Step 1 Complete.");
}

main().catch(console.error);
