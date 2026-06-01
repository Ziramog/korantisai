'use client';

import { Map as MapIcon } from 'lucide-react';
import Map, { Marker } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { ScoredVenue } from '../../contexts/CircadianContext';
import { useCircadian } from '../../contexts/CircadianContext';
import { t } from '../../utils/i18n';
import { MAPBOX_STYLE } from './mapStyle';
import KorantisMarker from './KorantisMarker';

interface VenueDetailMapBlockProps {
  venue: ScoredVenue;
  onOpenInAtlas: () => void;
}

export default function VenueDetailMapBlock({ venue, onOpenInAtlas }: VenueDetailMapBlockProps) {
  const { language } = useCircadian();

  return (
    <section className="mb-14 border-t border-k-border/30 pt-10">
      <h3 className="text-[10px] font-sans uppercase tracking-widest text-k-text-tertiary mb-3">
        {t('spatialPlacement', language)}
      </h3>
      <h2 className="text-xl md:text-2xl font-display text-k-text mb-2 tracking-wide">
        {t('whereAtmosphereLives', language)}
      </h2>
      <p className="text-xs text-k-text-secondary font-sans font-light mb-6">
        {t('mapPointInLocation', language, { location: venue.location })}
      </p>

      {/* Mapbox Card Placeholder */}
      <div className="w-full h-[360px] md:h-[520px] rounded-[24px] border border-white/5 bg-[#0A0806] flex flex-col items-center justify-center shadow-xl relative overflow-hidden mb-6 pointer-events-none">
        {venue.lat && venue.lng ? (
          <Map
            longitude={venue.lng}
            latitude={venue.lat}
            zoom={14.5}
            pitch={30}
            mapStyle={MAPBOX_STYLE}
            mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
            attributionControl={false}
            interactive={false}
          >
            <Marker longitude={venue.lng} latitude={venue.lat} anchor="center">
              <KorantisMarker isActive={true} />
            </Marker>
          </Map>
        ) : (
          <>
            <MapIcon className="text-k-gold/20 w-12 h-12 mb-4" />
            <p className="text-k-text-secondary font-sans text-[11px] tracking-wide">
              [ {t('viewOnMap', language)} ]
            </p>
          </>
        )}

        {/* Cinematic Map Filters */}
        <div className="absolute inset-0 pointer-events-none mix-blend-color flex bg-[#2E251E]/30" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(201,169,110,0.03)_0%,rgba(10,8,6,0.6)_100%)] pointer-events-none" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 relative z-10">
        <button
          onClick={onOpenInAtlas}
          className="flex-1 py-3 px-4 rounded-full border border-k-gold/30 bg-k-gold/5 text-k-gold text-[11px] font-sans hover:bg-k-gold/10 transition-colors uppercase tracking-wider text-center cursor-pointer shadow-[0_0_15px_rgba(201,169,110,0.05)]"
        >
          {t('openInAtlas', language)}
        </button>
        <button className="flex-1 py-3 px-4 rounded-full border border-white/5 bg-white/[0.02] text-k-text-secondary text-[11px] font-sans hover:bg-white/[0.05] hover:text-k-text transition-colors uppercase tracking-wider text-center cursor-pointer">
          {t('exploreNearbyAtmospheres', language)}
        </button>
      </div>
    </section>
  );
}
