import { useQuery } from '@tanstack/react-query';

import type { CityCode } from '@/shared/cities';

import { getVenueCatalog } from '../api/venues-repository';

export const venueCatalogQuery = {
  queryKey: ['venues', 'compatibility-catalog'] as const,
  queryFn: getVenueCatalog,
  staleTime: 5 * 60 * 1000,
};

export function useVenues(city: CityCode) {
  return useQuery({
    ...venueCatalogQuery,
    select: (venues) => venues.filter((venue) => venue.cityCode === city),
  });
}

export function useVenueCatalog() {
  return useQuery(venueCatalogQuery);
}

export function useVenue(venueId: string) {
  return useQuery({
    ...venueCatalogQuery,
    select: (venues) => venues.find((venue) => venue.id === venueId) ?? null,
  });
}
