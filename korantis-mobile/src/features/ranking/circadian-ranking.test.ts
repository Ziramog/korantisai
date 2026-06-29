import { describe, expect, it } from 'vitest';

import type { Venue } from '@/features/venues/api/venue-schema';

import { rankVenues } from './circadian-ranking';

function venue(id: string, category: string, atmosphere: string, tags: string[] = []): Venue {
  return {
    id,
    name: id,
    category,
    atmosphere,
    tags,
    quality: 0.9,
    location: 'Buenos Aires',
    tagline: '',
    narrative: '',
    tasteVector: [],
    lat: -34.6,
    lng: -58.4,
    cityCode: 'BUE',
    city: 'Buenos Aires',
    heroUrl: null,
    galleryImages: [],
  };
}

describe('rankVenues', () => {
  it('prioritizes a morning cafe during the morning', () => {
    const result = rankVenues([
      venue('night-bar', 'bar', 'night', ['late_night']),
      venue('morning-cafe', 'cafe', 'morning', ['breakfast']),
    ], { hour: 9, tasteVector: Array(8).fill(0), savedIds: new Set() });
    expect(result[0].id).toBe('morning-cafe');
  });

  it('adds memory resonance to saved venues', () => {
    const venues = [venue('first', 'cafe', 'afternoon'), venue('saved', 'cafe', 'afternoon')];
    const result = rankVenues(venues, { hour: 15, tasteVector: Array(8).fill(0), savedIds: new Set(['saved']) });
    expect(result[0].id).toBe('saved');
    expect(result[0].scoreBreakdown.memory).toBe(1);
  });
});
