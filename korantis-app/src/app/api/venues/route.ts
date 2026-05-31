import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

type PublicVenueRow = {
  id: string;
  name: string;
  category: string | null;
  location: string | null;
  coordinates: { lat?: number; lng?: number } | string | null;
  card_size: 'immersive' | 'cinematic' | 'layered' | 'compact' | null;
  spacing: 'tight' | 'breathe' | 'isolated' | null;
  hero_image?: string | null;
  atmosphere: 'morning' | 'afternoon' | 'golden-hour' | 'night' | 'late-night' | 'dawn' | null;
  quality: number | null;
  tagline: string | null;
  narrative: string | null;
  tags: string[] | null;
  taste_vector?: string | number[] | null;
};

type VenueImageRow = {
  id: string;
  venue_id: string;
  photo_reference: string;
  width: number | null;
  height: number | null;
  is_cover: boolean | null;
};

function imageUrl(id: string) {
  return `/api/venue-images/${id}`;
}

function parseTasteVector(data: string | number[] | null | undefined) {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data) as number[];
    } catch {
      return [0, 0, 0, 0, 0, 0, 0, 0];
    }
  }

  if (Array.isArray(data)) return data;
  return [0, 0, 0, 0, 0, 0, 0, 0];
}

function parseCoordinates(data: PublicVenueRow['coordinates']) {
  let parsed: { lat?: number; lng?: number } | null = null;

  try {
    parsed = typeof data === 'string' ? JSON.parse(data) : data;
  } catch {
    return null;
  }

  const lat = parsed?.lat;
  const lng = parsed?.lng;

  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return null;
  }

  return { lat, lng };
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('venues')
      .select('*');

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ venues: [] });
    }

    const venueIds = data.map((venue) => venue.id);
    const { data: imageRows, error: imageError } = await supabase
      .from('venue_images')
      .select('id, venue_id, photo_reference, width, height, is_cover')
      .in('venue_id', venueIds);

    if (imageError) {
      console.error('Supabase venue_images error:', imageError);
    }

    const imagesByVenue = new Map<string, VenueImageRow[]>();
    for (const image of (imageRows || []) as VenueImageRow[]) {
      const images = imagesByVenue.get(image.venue_id) || [];
      images.push(image);
      imagesByVenue.set(image.venue_id, images);
    }

    const mappedVenues = (data as PublicVenueRow[])
      .map((venue) => {
        const coordinates = parseCoordinates(venue.coordinates);

        if (!coordinates) {
          console.warn(`Skipping venue without canonical coordinates: ${venue.name}`);
          return null;
        }

        const galleryImages = (imagesByVenue.get(venue.id) || [])
          .sort((a, b) => Number(Boolean(b.is_cover)) - Number(Boolean(a.is_cover)))
          .map((image) => ({
            id: image.id,
            src: imageUrl(image.id),
            width: image.width,
            height: image.height,
            isCover: Boolean(image.is_cover),
          }));
        const canonicalHeroImage = galleryImages[0]?.src;

        return {
          id: venue.id,
          name: venue.name,
          category: venue.category || '',
          location: venue.location || '',
          cardSize: venue.card_size || 'layered',
          spacing: venue.spacing || 'breathe',
          heroImage: venue.hero_image || canonicalHeroImage || '/venue_invernadero.png',
          galleryImages,
          atmosphere: venue.atmosphere || 'night',
          quality: venue.quality || 0.8,
          tagline: venue.tagline || '',
          narrative: venue.narrative || '',
          tags: venue.tags || [],
          tasteVector: parseTasteVector(venue.taste_vector),
          lat: coordinates.lat,
          lng: coordinates.lng,
        };
      })
      .filter((venue): venue is NonNullable<typeof venue> => venue !== null);

    return NextResponse.json({ venues: mappedVenues });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
