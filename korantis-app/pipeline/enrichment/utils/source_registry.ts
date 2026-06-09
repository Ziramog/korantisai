import type { AuthorityLevel, SourceType } from './enrichment_types';

export interface SourceDefinition {
  source_id: string;
  source_name: string;
  source_type: SourceType;
  authority_level: AuthorityLevel;
  cities: string[];
  fetch_method: 'stored' | 'http_head' | 'manual';
  max_age_days: number;
}

export const SOURCE_REGISTRY: SourceDefinition[] = [
  {
    source_id: 'official_website',
    source_name: 'Official website',
    source_type: 'official',
    authority_level: 5,
    cities: ['*'],
    fetch_method: 'http_head',
    max_age_days: 90,
  },
  {
    source_id: 'instagram_profile',
    source_name: 'Instagram profile link',
    source_type: 'social_profile',
    authority_level: 5,
    cities: ['*'],
    fetch_method: 'stored',
    max_age_days: 90,
  },
  {
    source_id: 'google_places',
    source_name: 'Google Places stored data',
    source_type: 'maps_places',
    authority_level: 3,
    cities: ['*'],
    fetch_method: 'stored',
    max_age_days: 180,
  },
  {
    source_id: 'menu_url',
    source_name: 'Menu URL',
    source_type: 'booking_menu',
    authority_level: 5,
    cities: ['*'],
    fetch_method: 'http_head',
    max_age_days: 60,
  },
  {
    source_id: 'reservation_url',
    source_name: 'Reservation URL',
    source_type: 'booking_menu',
    authority_level: 5,
    cities: ['*'],
    fetch_method: 'http_head',
    max_age_days: 60,
  },
  {
    source_id: 'michelin',
    source_name: 'Michelin Guide',
    source_type: 'editorial_trusted',
    authority_level: 4,
    cities: ['Buenos Aires', 'New York', 'New York City', 'Dubai'],
    fetch_method: 'manual',
    max_age_days: 365,
  },
  {
    source_id: 'fifty_best_discovery',
    source_name: '50 Best Discovery',
    source_type: 'editorial_trusted',
    authority_level: 4,
    cities: ['Buenos Aires', 'New York', 'New York City', 'Dubai'],
    fetch_method: 'manual',
    max_age_days: 365,
  },
  {
    source_id: 'eater',
    source_name: 'Eater',
    source_type: 'editorial_trusted',
    authority_level: 4,
    cities: ['New York', 'New York City'],
    fetch_method: 'manual',
    max_age_days: 180,
  },
  {
    source_id: 'infatuation',
    source_name: 'The Infatuation',
    source_type: 'editorial_trusted',
    authority_level: 4,
    cities: ['New York', 'New York City'],
    fetch_method: 'manual',
    max_age_days: 180,
  },
  {
    source_id: 'timeout',
    source_name: 'Time Out',
    source_type: 'local_media',
    authority_level: 3,
    cities: ['Buenos Aires', 'Dubai', 'New York', 'New York City'],
    fetch_method: 'manual',
    max_age_days: 180,
  },
];

export function sourceAppliesToCity(source: SourceDefinition, city: string): boolean {
  return source.cities.includes('*') || source.cities.some((item) => item.toLowerCase() === city.toLowerCase());
}

