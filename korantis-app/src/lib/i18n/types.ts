export type Locale = 'en' | 'es';

export type Dictionary = Record<string, string>;

export type TranslationParams = Record<string, string | number>;

export type VenueDisplayFields<TVenue> = TVenue & {
  displayCategory: string;
  displayTags: string[];
  displayIntents: string[];
  displayAtmosphere: string;
  displayTagline: string;
  displayDescription: string;
};
