import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set in .env.local');
  process.exit(1);
}

// We need the service role key if RLS blocks inserts, but for now we'll use Anon since we enabled public access.
// Wait, we only enabled public SELECT access in RLS in our schema.sql!
// So for inserting, we should probably use a service role key or just disable RLS on insert temporarily,
// or we can just ask the user to provide NEXT_PUBLIC_SUPABASE_ANON_KEY and we assume they can insert.
// Actually, let's just instruct them to use the service role key for seeding.
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

import { MOCK_VENUES } from '../src/app/data/venues';

// Helper to generate a random 8D vector for the mock seed (normalized between -1 and 1)
function generateRandomVector() {
  return Array.from({ length: 8 }, () => (Math.random() * 2) - 1);
}

async function seed() {
  console.log('Seeding venues to Supabase...');

  for (const venue of MOCK_VENUES) {
    const vector = generateRandomVector();

    // Map venue to the database schema
    const record = {
      id: venue.id,
      name: venue.name,
      category: venue.category,
      location: venue.location,
      card_size: venue.cardSize,
      spacing: venue.spacing,
      hero_image: venue.heroImage,
      atmosphere: venue.atmosphere,
      quality: venue.quality,
      tagline: venue.tagline,
      narrative: venue.narrative,
      tags: venue.tags,
      taste_vector: `[${vector.join(',')}]`
    };

    const { error } = await supabase.from('venues').upsert(record);

    if (error) {
      console.error(`Failed to seed ${venue.name}:`, error.message);
    } else {
      console.log(`Successfully seeded ${venue.name}`);
    }
  }

  console.log('Seeding complete.');
}

seed().catch(console.error);
