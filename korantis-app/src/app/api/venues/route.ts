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
  curation_status?: 'active' | 'pending_review' | 'rejected' | 'quarantined' | 'needs_reprocess' | null;
  taste_vector?: string | number[] | null;
};

type VenueImageRow = {
  id: string;
  venue_id: string;
  photo_reference: string;
  width: number | null;
  height: number | null;
  is_cover: boolean | null;
  role?: 'hero' | 'card' | 'gallery' | null;
  sort_order?: number | null;
  url?: string | null;
  secure_url?: string | null;
  public_id?: string | null;
};

function imageUrl(id: string) {
  return `/api/venue-images/${id}`;
}

function resolveImageSrc(image: VenueImageRow) {
  return image.secure_url || image.url || imageUrl(image.id);
}

function imageRank(image: VenueImageRow) {
  if (image.role === 'hero') return 0;
  if (image.is_cover) return 1;
  if (image.role === 'card') return 2;
  if (image.role === 'gallery') return 3;
  return 4;
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
    const preferredImages = await supabase
      .from('venue_images')
      .select('id, venue_id, photo_reference, width, height, is_cover, role, sort_order, url, secure_url, public_id')
      .in('venue_id', venueIds);

    const legacyImages = preferredImages.error
      ? await supabase
        .from('venue_images')
        .select('id, venue_id, photo_reference, width, height, is_cover')
        .in('venue_id', venueIds)
      : preferredImages;

    if (legacyImages.error) {
      console.error('Supabase venue_images error:', legacyImages.error);
    }

    const imagesByVenue = new Map<string, VenueImageRow[]>();
    for (const image of (legacyImages.data || []) as VenueImageRow[]) {
      const images = imagesByVenue.get(image.venue_id) || [];
      images.push(image);
      imagesByVenue.set(image.venue_id, images);
    }

    const mappedVenues = (data as PublicVenueRow[])
      .filter((venue) => {
        if (!venue.curation_status) return true;
        return venue.curation_status === 'active';
      })
      .map((venue) => {
        const coordinates = parseCoordinates(venue.coordinates);

        if (!coordinates) {
          console.warn(`Skipping venue without canonical coordinates: ${venue.name}`);
          return null;
        }

        const galleryImages = (imagesByVenue.get(venue.id) || [])
          .sort((a, b) => imageRank(a) - imageRank(b) || (a.sort_order || 0) - (b.sort_order || 0))
          .map((image) => ({
            id: image.id,
            src: resolveImageSrc(image),
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
