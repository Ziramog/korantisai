import { z } from 'zod';

import { cityForCoordinates, type CityCode } from '@/shared/cities';

const GalleryImageSchema = z.object({
  id: z.string(),
  src: z.string().min(1),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
  role: z.string().nullable().optional(),
});

const RawVenueSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  city: z.string().nullable().optional(),
  category: z.string().catch('place'),
  location: z.string().catch(''),
  heroImage: z.string().nullable().optional(),
  cardImage: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  galleryImages: z.array(GalleryImageSchema).catch([]),
  atmosphere: z.string().catch('night'),
  quality: z.number().catch(0),
  tagline: z.string().catch(''),
  narrative: z.string().catch(''),
  tags: z.array(z.string()).catch([]),
  tasteVector: z.array(z.number()).catch([]),
  lat: z.number(),
  lng: z.number(),
});

const VenueResponseSchema = z.object({
  venues: z.array(RawVenueSchema),
});

export type Venue = z.infer<typeof RawVenueSchema> & {
  cityCode: CityCode | null;
  heroUrl: string | null;
};

export function parseVenueResponse(payload: unknown): Venue[] {
  const { venues } = VenueResponseSchema.parse(payload);
  return venues.map((venue) => ({
    ...venue,
    cityCode: cityForCoordinates(venue.lat, venue.lng),
    heroUrl: venue.cardImage || venue.heroImage || venue.imageUrl || null,
  }));
}
