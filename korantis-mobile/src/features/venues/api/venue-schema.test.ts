import { describe, expect, it } from 'vitest';

import { parseVenueResponse } from './venue-schema';

describe('parseVenueResponse', () => {
  it('assigns a canonical city from coordinates and resolves the card image', () => {
    const [venue] = parseVenueResponse({
      venues: [{
        id: 'one', name: 'Casa', category: 'cafe', location: 'Palermo, Buenos Aires',
        cardImage: 'https://example.com/card.jpg', galleryImages: [], atmosphere: 'morning',
        quality: 0.9, tagline: '', narrative: '', tags: [], tasteVector: [], lat: -34.58, lng: -58.43,
      }],
    });

    expect(venue.cityCode).toBe('BUE');
    expect(venue.heroUrl).toBe('https://example.com/card.jpg');
  });

  it('rejects malformed catalog rows at the network boundary', () => {
    expect(() => parseVenueResponse({ venues: [{ id: 'broken' }] })).toThrow();
  });
});
