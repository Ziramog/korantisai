import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '..', '..', '.env.local') });
import { createClient } from '@supabase/supabase-js';

type GooglePlace = {
  id: string;
  displayName?: {
    text?: string;
  };
};

type GooglePlacesSearchResponse = {
  places?: GooglePlace[];
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!GOOGLE_API_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing environment variables. Check .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const SEARCH_TARGETS = [
  { city: 'buenos_aires', category: 'cafe', query: 'best specialty coffee in Buenos Aires', limit: 10 },
  { city: 'buenos_aires', category: 'restaurant', query: 'best restaurants and cocktail bars in Buenos Aires', limit: 10 },
  { city: 'new_york', category: 'cafe', query: 'best specialty coffee in New York City', limit: 10 },
  { city: 'new_york', category: 'restaurant', query: 'best restaurants and cocktail bars in New York City', limit: 10 }
];

async function searchGooglePlaces(query: string, limit: number) {
  const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_API_KEY as string,
      'X-Goog-FieldMask': 'places.id,places.displayName'
    },
    body: JSON.stringify({
      textQuery: query,
      pageSize: limit
    })
  });

  if (!response.ok) {
    throw new Error(`Google Places API error: ${response.statusText}`);
  }

  const data = await response.json() as GooglePlacesSearchResponse;
  return data.places || [];
}

async function main() {
  console.log("Starting Phase 5.2A Venue Discovery...");
  
  let totalAdded = 0;

  for (const target of SEARCH_TARGETS) {
    console.log(`\nSearching for: "${target.query}" (Limit: ${target.limit})`);
    
    try {
      const places = await searchGooglePlaces(target.query, target.limit);
      
      for (const place of places) {
        const venueId = place.id;
        const venueName = place.displayName?.text || 'Unknown';
        
        // Insert into Supabase staging_venues
        const { error } = await supabase
          .from('staging_venues')
          .upsert({
            id: venueId,
            name: venueName,
            city: target.city,
            category_seed: target.category,
            status: 'pending'
          }, { onConflict: 'id' });
          
        if (error) {
          console.error(`❌ Error inserting ${venueName}:`, error.message);
        } else {
          console.log(`✅ Staged: ${venueName}`);
          totalAdded++;
        }
      }
    } catch (error: unknown) {
      console.error(`Failed to process target "${target.query}":`, getErrorMessage(error));
    }
  }
  
  console.log(`\nDiscovery complete. Successfully staged ${totalAdded} venues.`);
}

main().catch(console.error);
