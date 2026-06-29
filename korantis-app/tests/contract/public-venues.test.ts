import assert from 'node:assert/strict';

import { mapPublicVenues, normalizePublicVenueLimit, type PublicVenueRow, type VenueImageRow } from '../../src/lib/publicVenues';

const baseVenue: PublicVenueRow = {
  id: 'venue-1',
  name: 'Casa Test',
  created_at: '2026-06-01T00:00:00.000Z',
  updated_at: '2026-06-02T00:00:00.000Z',
  category: 'cafe',
  city: 'Buenos Aires',
  location: 'Palermo',
  coordinates: JSON.stringify({ lat: -34.58, lng: -58.43 }),
  card_size: null,
  spacing: null,
  hero_image: '/fallback.png',
  atmosphere: null,
  quality: null,
  tagline: null,
  narrative: null,
  tags: null,
  curation_status: 'active',
  taste_vector: '[1,2,3,4,5,6,7,8]',
};

const images: VenueImageRow[] = [
  {
    id: 'legacy-hero',
    venue_id: 'venue-1',
    photo_reference: 'places/abc/photos/legacy',
    width: 800,
    height: 600,
    is_cover: true,
    role: 'hero',
  },
  {
    id: 'card',
    venue_id: 'venue-1',
    photo_reference: null,
    width: 1200,
    height: 1500,
    is_cover: false,
    role: 'card',
    secure_url: 'https://res.cloudinary.com/demo/image/upload/card.jpg',
  },
  {
    id: 'gallery',
    venue_id: 'venue-1',
    photo_reference: null,
    width: 1600,
    height: 900,
    is_cover: false,
    role: 'gallery',
    sort_order: 1,
    url: 'https://cdn.example.com/gallery.jpg',
  },
];

const [venue] = mapPublicVenues([baseVenue], images);

assert.equal(venue.id, 'venue-1');
assert.equal(venue.cardImage, 'https://res.cloudinary.com/demo/image/upload/card.jpg');
assert.equal(venue.heroImage, 'https://res.cloudinary.com/demo/image/upload/card.jpg');
assert.equal(venue.galleryImages.length, 1);
assert.equal(venue.galleryImages[0]?.source, 'direct');
assert.equal(venue.atmosphere, 'night');
assert.equal(venue.quality, 0.8);
assert.deepEqual(venue.tasteVector, [1, 2, 3, 4, 5, 6, 7, 8]);

assert.equal(mapPublicVenues([{ ...baseVenue, id: 'bad', coordinates: '{}' }], []).length, 0);
assert.equal(normalizePublicVenueLimit(null), 200);
assert.equal(normalizePublicVenueLimit('0'), 1);
assert.equal(normalizePublicVenueLimit('9999'), 500);
assert.equal(normalizePublicVenueLimit('not-a-number'), 200);

console.log('public venue contract checks passed');
