export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-G68F03280D';

type AnalyticsValue = string | number | boolean | null | undefined;
type AnalyticsParams = Record<string, AnalyticsValue>;

type AnalyticsVenue = {
  id?: string;
  name?: string;
  category?: string;
  location?: string;
  atmosphere?: string;
  quality?: number;
  cardSize?: string;
  scoreFinal?: string;
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (command: 'event', eventName: string, params?: AnalyticsParams) => void;
  }
}

function cleanParams(params: AnalyticsParams) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  ) as Record<string, string | number | boolean>;
}

export function trackEvent(eventName: string, params: AnalyticsParams = {}) {
  if (typeof window === 'undefined' || !window.gtag || !GA_MEASUREMENT_ID) return;

  window.gtag('event', eventName, cleanParams(params));
}

export function trackVenueEvent(eventName: string, venue: AnalyticsVenue, params: AnalyticsParams = {}) {
  trackEvent(eventName, {
    venue_id: venue.id,
    venue_name: venue.name,
    venue_category: venue.category,
    venue_location: venue.location,
    venue_atmosphere: venue.atmosphere,
    venue_quality: typeof venue.quality === 'number' ? Number(venue.quality.toFixed(3)) : undefined,
    venue_card_size: venue.cardSize,
    venue_rank_score: venue.scoreFinal,
    ...params,
  });
}
