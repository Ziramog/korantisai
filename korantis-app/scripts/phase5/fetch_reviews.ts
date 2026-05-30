import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '..', '..', '.env.local') });
import { MOCK_VENUES } from '../../src/app/data/venues';

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const CORPUS_DIR = path.join(__dirname, '..', '..', 'data', 'review_corpus');

interface Review {
  author_name: string;
  rating: number;
  text: string;
  time: number;
}

interface VenueReviews {
  venueId: string;
  venueName: string;
  reviews: Review[];
  source: string;
}

async function searchPlaceId(query: string): Promise<string | null> {
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query + ' Buenos Aires')}&key=${API_KEY}`;
  const response = await fetch(url);
  const data = await response.json();
  if (data.status === 'OK' && data.results.length > 0) {
    return data.results[0].place_id;
  }
  console.warn(`Place ID not found for query: ${query}`);
  return null;
}

async function fetchPlaceReviews(placeId: string): Promise<Review[]> {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews&key=${API_KEY}`;
  const response = await fetch(url);
  const data = await response.json();
  if (data.status === 'OK' && data.result.reviews) {
    return data.result.reviews.filter((r: Review) => r.text && r.text.length > 20); 
  }
  return [];
}

async function main() {
  if (!API_KEY) {
    console.error('Error: GOOGLE_PLACES_API_KEY is not set in environment.');
    process.exit(1);
  }

  if (!fs.existsSync(CORPUS_DIR)) {
    fs.mkdirSync(CORPUS_DIR, { recursive: true });
  }

  for (const venue of MOCK_VENUES) {
    const venueFile = path.join(CORPUS_DIR, `${venue.id}.json`);
    
    if (fs.existsSync(venueFile)) {
      console.log(`[SKIP] ${venue.name} already in cache.`);
      continue;
    }

    console.log(`[FETCH] Searching for ${venue.name}...`);
    const placeId = await searchPlaceId(venue.name);
    if (placeId) {
      console.log(`        Found Place ID: ${placeId}, fetching reviews...`);
      const reviews = await fetchPlaceReviews(placeId);
      console.log(`        Got ${reviews.length} reviews.`);
      
      const payload: VenueReviews = {
        venueId: venue.id,
        venueName: venue.name,
        reviews,
        source: 'Google Places'
      };
      fs.writeFileSync(venueFile, JSON.stringify(payload, null, 2), 'utf-8');
    } else {
      const payload: VenueReviews = {
        venueId: venue.id,
        venueName: venue.name,
        reviews: [],
        source: 'Not Found'
      };
      fs.writeFileSync(venueFile, JSON.stringify(payload, null, 2), 'utf-8');
    }

    // Small delay to respect rate limits
    await new Promise(r => setTimeout(r, 1000));
  }
  console.log('\nReview acquisition complete.');
}

main().catch(console.error);
