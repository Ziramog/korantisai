import { useMemo } from 'react';

import { useVenueCatalog, useVenues } from '@/features/venues/hooks/use-venues';
import type { CityCode } from '@/shared/cities';
import { useSavedVenues } from '@/shared/hooks/use-saved-venues';

import { rankVenues } from './circadian-ranking';
import { useTasteProfile } from './taste-profile-context';

export function useRankedVenues(city: CityCode) {
  const query = useVenues(city);
  const { savedIds } = useSavedVenues();
  const { tasteVector } = useTasteProfile();
  const data = useMemo(() => rankVenues(query.data ?? [], { hour: new Date().getHours(), savedIds, tasteVector }), [query.data, savedIds, tasteVector]);
  return { ...query, data };
}

export function useRankedVenueCatalog() {
  const query = useVenueCatalog();
  const { savedIds } = useSavedVenues();
  const { tasteVector } = useTasteProfile();
  const data = useMemo(() => rankVenues(query.data ?? [], { hour: new Date().getHours(), savedIds, tasteVector }), [query.data, savedIds, tasteVector]);
  return { ...query, data };
}
