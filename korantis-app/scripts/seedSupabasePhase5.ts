import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import crypto from 'crypto';
import { MOCK_VENUES } from '../src/app/data/venues';

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Generate mock vector
function generateMockVector(dimensions = 1536) {
  return Array.from({ length: dimensions }, () => (Math.random() * 2 - 1) * 0.1);
}

// Generate random mock semantic data
function generateRandomSemanticData(venueName: string) {
  const isHighMatch = Math.random() > 0.5;
  const score = isHighMatch ? 0.7 + (Math.random() * 0.25) : 0.2 + (Math.random() * 0.4);
  const classification = score > 0.85 ? 'almost_identical' : score > 0.6 ? 'strong' : score > 0.4 ? 'partial' : 'divergent';
  
  return {
    quality: { 
      completeness_score: 0.5 + (Math.random() * 0.5), 
      review_count: Math.floor(Math.random() * 500) + 10, 
      ready_for_review: Math.random() > 0.3 
    },
    resonance: { 
      cosine_similarity: score, 
      classification, 
      editorial_themes: ['theme1', 'theme2'], 
      crowd_themes: ['crowd1', 'crowd2'] 
    },
    atmosphere: { prose: `Atmosphere generated for ${venueName}. Looks like a great place.` },
    layer2Text: `Curatorial description of ${venueName}. It is amazing.`,
    reviews: [
      { text: `Good experience at ${venueName}.`, rating: 4, language: 'en' },
      { text: `Too crowded.`, rating: 3, language: 'en' }
    ]
  };
}

async function seedPhase5() {
  console.log(`Seeding Supabase Phase 5.2B Tables with ${MOCK_VENUES.length} venues...`);

  for (const item of MOCK_VENUES) {
    const semanticData = generateRandomSemanticData(item.name);

    const venueRecord = {
      id: crypto.randomUUID(), 
      name: item.name, 
      city: item.location,
      category: item.category,
      location: item.location,
      coordinates: { lat: item.lat, lng: item.lng },
      card_size: item.cardSize,
      spacing: item.spacing,
      atmosphere: item.atmosphere,
      quality: item.quality,
      tagline: item.tagline,
      narrative: item.narrative
    };

    // 1. Insert Venue
    const { data: venue, error: vError } = await supabase
      .from('venues')
      .insert(venueRecord)
      .select('id')
      .single();

    if (vError) {
      console.error(`Failed to insert venue ${item.name}:`, vError.message);
      continue;
    }
    const venueId = venue.id;

    // 2. Insert Quality
    await supabase.from('venue_quality').insert({ venue_id: venueId, ...semanticData.quality });

    // 3. Insert Resonance
    await supabase.from('venue_resonance').insert({ venue_id: venueId, ...semanticData.resonance });

    // 4. Insert Atmosphere
    await supabase.from('venue_atmosphere').insert({ venue_id: venueId, ...semanticData.atmosphere, model: 'gpt-4o-mini' });

    // 5. Insert Layer 2 & 3 Embeddings
    await supabase.from('venue_embeddings').insert([
      { venue_id: venueId, layer: 'L2', source_text: semanticData.layer2Text, embedding: `[${generateMockVector().join(',')}]` },
      { venue_id: venueId, layer: 'L3', source_text: semanticData.atmosphere.prose, embedding: `[${generateMockVector().join(',')}]` }
    ]);

    // 6. Insert Reviews
    const reviewsToInsert = semanticData.reviews.map(r => ({ venue_id: venueId, ...r }));
    await supabase.from('venue_reviews').insert(reviewsToInsert);

    console.log(`Successfully seeded ${item.name}`);
  }

  console.log('Phase 5.2B Full Seeding complete.');
}

seedPhase5().catch(console.error);
