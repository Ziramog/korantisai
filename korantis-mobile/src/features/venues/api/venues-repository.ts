import { getJson } from '@/shared/api/client';

import { parseVenueResponse, type Venue } from './venue-schema';

export async function getVenueCatalog(): Promise<Venue[]> {
  const payload = await getJson('/api/venues');
  return parseVenueResponse(payload);
}

export function cloudinaryCardUrl(source: string | null): string | null {
  if (!source?.includes('/image/upload/')) return source;
  return source.replace('/image/upload/', '/image/upload/f_auto,q_auto:eco,c_fill,g_auto,w_1200,h_1500/');
}
