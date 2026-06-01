'use client';

import { useMemo } from 'react';
import { useCircadian } from '@/app/contexts/CircadianContext';
import {
  localizeVenueForDisplay,
  t,
  translateIntent,
  translateTag,
  translateVenueField,
} from './index';

export function useI18n() {
  const { language, setLanguage } = useCircadian();

  return useMemo(
    () => ({
      locale: language,
      setLocale: setLanguage,
      t: (key: string, params?: Record<string, string | number>) =>
        t(key, language, params),
      translateTag: (tag: string) => translateTag(tag, language),
      translateIntent: (intent: string) => translateIntent(intent, language),
      translateVenueField: (
        value: string | null | undefined,
        context?: Parameters<typeof translateVenueField>[2],
      ) => translateVenueField(value, language, context),
      localizeVenueForDisplay: <TVenue extends Parameters<typeof localizeVenueForDisplay>[0]>(
        venue: TVenue,
      ) => localizeVenueForDisplay(venue, language),
    }),
    [language, setLanguage],
  );
}
