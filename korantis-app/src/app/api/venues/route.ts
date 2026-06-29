import { NextResponse } from 'next/server';

import { mapPublicVenues, normalizePublicVenueLimit, type PublicVenueRow, type VenueImageRow } from '@/lib/publicVenues';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limit = normalizePublicVenueLimit(url.searchParams.get('limit'));
    const city = url.searchParams.get('city');
    const supabase = await createClient();
    let venueQuery = supabase
      .from('venues')
      .select(`
        id,
        name,
        created_at,
        updated_at,
        category,
        city,
        location,
        coordinates,
        card_size,
        spacing,
        hero_image,
        atmosphere,
        quality,
        tagline,
        narrative,
        tags,
        curation_status,
        taste_vector
      `)
      .eq('curation_status', 'active')
      .order('quality', { ascending: false })
      .limit(limit);

    if (city) {
      venueQuery = venueQuery.eq('city', city);
    }

    const { data, error } = await venueQuery;

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

    const venues = mapPublicVenues(data as PublicVenueRow[], (legacyImages.data || []) as VenueImageRow[]);

    return NextResponse.json({ venues });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
