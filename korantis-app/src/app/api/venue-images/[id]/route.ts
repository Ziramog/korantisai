import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

type RouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

type VenueImage = {
  photo_reference: string;
  url?: string | null;
  secure_url?: string | null;
};

async function resolvePhotoUri(photoReference: string) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return null;

  const url = new URL(`https://places.googleapis.com/v1/${photoReference}/media`);
  url.searchParams.set('maxWidthPx', '1600');
  url.searchParams.set('skipHttpRedirect', 'true');
  url.searchParams.set('key', apiKey);

  const response = await fetch(url, {
    headers: {
      'X-Goog-Api-Key': apiKey,
    },
    next: { revalidate: 60 * 60 * 24 },
  });

  if (!response.ok) return null;
  const payload = await response.json() as { photoUri?: string };
  return payload.photoUri || null;
}

export async function GET(_request: Request, context: RouteContext) {
  const params = await context.params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('venue_images')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !data) {
    return NextResponse.redirect(new URL('/venue_invernadero.png', _request.url));
  }

  const venueImage = data as VenueImage;
  const ownedImageUrl = venueImage.secure_url || venueImage.url;

  if (ownedImageUrl) {
    return NextResponse.redirect(ownedImageUrl);
  }

  const photoUri = await resolvePhotoUri(venueImage.photo_reference);
  if (!photoUri) {
    return NextResponse.redirect(new URL('/venue_invernadero.png', _request.url));
  }

  const imageResponse = await fetch(photoUri, {
    next: { revalidate: 60 * 60 * 24 },
  });

  if (!imageResponse.ok || !imageResponse.body) {
    return NextResponse.redirect(new URL('/venue_invernadero.png', _request.url));
  }

  return new NextResponse(imageResponse.body, {
    headers: {
      'Content-Type': imageResponse.headers.get('content-type') || 'image/jpeg',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    },
  });
}

