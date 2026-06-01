"use client";

import { useState, useMemo, useRef } from 'react';
import Image from 'next/image';
import { Bookmark, Heart } from 'lucide-react';
import Map, { Marker } from 'react-map-gl/mapbox';
import type { MapRef } from 'react-map-gl/mapbox';
import useSupercluster from 'use-supercluster';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { ScoredVenue } from '../../contexts/CircadianContext';
import { useCircadian } from '../../contexts/CircadianContext';
import { t, translateVenueField } from '../../utils/i18n';
import { MAPBOX_STYLE } from './mapStyle';
import KorantisMarker from './KorantisMarker';
import AtlasVenuePreview from './AtlasVenuePreview';

interface SpatialAtlasProps {
  onVenueClick: (venue: ScoredVenue) => void;
  onExploreClick: () => void;
  initialSelectedVenueId?: string | null;
}

export default function SpatialAtlas({ onVenueClick, onExploreClick, initialSelectedVenueId }: SpatialAtlasProps) {
  const { language, savedVenueIds, toggleSaveVenue, rankedVenues } = useCircadian();
  const [atlasMode, setAtlasMode] = useState<'spatial' | 'saved'>('spatial');
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(initialSelectedVenueId || null);
  const initialSelectedVenue = initialSelectedVenueId
    ? rankedVenues.find((venue) => venue.id === initialSelectedVenueId)
    : null;

  const [viewState, setViewState] = useState({
    longitude: initialSelectedVenue?.lng || -58.4314,
    latitude: initialSelectedVenue?.lat || -34.5885,
    zoom: initialSelectedVenue ? 15.5 : 13,
    pitch: 45
  });

  const mapRef = useRef<MapRef>(null);
  const [bounds, setBounds] = useState<[number, number, number, number]>([-180, -85, 180, 85]);

  const points = useMemo(() => {
    return rankedVenues
      .filter(v => v.lat && v.lng)
      .map(venue => ({
        type: 'Feature' as const,
        properties: {
          cluster: false,
          venueId: venue.id,
          isActive: selectedVenueId === venue.id,
          isSaved: savedVenueIds.includes(venue.id)
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [venue.lng, venue.lat]
        }
      }));
  }, [rankedVenues, selectedVenueId, savedVenueIds]);

  const { clusters, supercluster } = useSupercluster({
    points,
    bounds,
    zoom: viewState.zoom,
    options: { radius: 60, maxZoom: 16 }
  });

  const selectedVenue = useMemo(() => {
    return rankedVenues.find(v => v.id === selectedVenueId) || null;
  }, [rankedVenues, selectedVenueId]);

  // Compute saved venues
  const savedVenues = useMemo(() => {
    return rankedVenues.filter(v => savedVenueIds.includes(v.id));
  }, [rankedVenues, savedVenueIds]);

  // Compute collection counts
  const collectionCounts = useMemo(() => {
    return {
      afterMidnight: rankedVenues.filter(v => v.atmosphere === 'late-night' || v.atmosphere === 'night').length,
      morningRitual: rankedVenues.filter(v => v.atmosphere === 'morning').length,
      sundayCalm: rankedVenues.filter(v => v.atmosphere === 'afternoon' || v.atmosphere === 'dawn').length,
    };
  }, [rankedVenues]);

  return (
    <div className="max-w-4xl mx-auto px-6 md:px-12 pt-12 md:pt-24 animate-fade-in">
      <header className="mb-10 flex flex-col items-center md:items-start text-center md:text-left">
        <h1 className="text-k-text font-display text-4xl md:text-5xl mb-3 tracking-wide">
          {t('atlas', language)}
        </h1>
        <p className="text-sm text-k-text-secondary font-sans font-light max-w-lg">
          {atlasMode === 'spatial' 
            ? t('atlasSpatialDesc', language)
            : t('atlasDesc', language)}
        </p>
      </header>

      {/* Mode Switch */}
      <div className="flex items-center justify-center md:justify-start gap-4 mb-12">
        <button 
          onClick={() => setAtlasMode('spatial')}
          className={`px-5 py-2 rounded-full border text-xs font-sans transition-all duration-300 ${
            atlasMode === 'spatial' 
              ? 'border-k-gold/30 text-k-gold bg-k-gold/5 shadow-[0_0_15px_rgba(201,169,110,0.1)]' 
              : 'border-white/5 text-k-text-secondary hover:text-k-text hover:border-white/10'
          }`}
        >
          {t('spatialAtlas', language)}
        </button>
        <button 
          onClick={() => setAtlasMode('saved')}
          className={`px-5 py-2 rounded-full border text-xs font-sans transition-all duration-300 ${
            atlasMode === 'saved' 
              ? 'border-k-gold/30 text-k-gold bg-k-gold/5 shadow-[0_0_15px_rgba(201,169,110,0.1)]' 
              : 'border-white/5 text-k-text-secondary hover:text-k-text hover:border-white/10'
          }`}
        >
          {t('yourAtlas', language)}
        </button>
      </div>

      <main className="w-full flex flex-col gap-12">
        {atlasMode === 'spatial' ? (
          /* SPATIAL ATLAS VIEW (PLACEHOLDER) */
          <section className="flex flex-col gap-6">
            <div className="w-full h-[60vh] md:h-[70vh] rounded-3xl border border-white/5 bg-[#0A0806] overflow-hidden relative shadow-xl">
              <Map
                {...viewState}
                ref={mapRef}
                onMove={evt => {
                  setViewState(evt.viewState);
                  const b = mapRef.current?.getMap().getBounds();
                  if (b) {
                    setBounds([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
                  }
                }}
                onLoad={() => {
                  const b = mapRef.current?.getMap().getBounds();
                  if (b) {
                    setBounds([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
                  }
                }}
                mapStyle={MAPBOX_STYLE}
                mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
                attributionControl={false}
                cooperativeGestures={true}
              >
                {clusters.map(cluster => {
                  const [longitude, latitude] = cluster.geometry.coordinates;
                  const { cluster: isCluster } = cluster.properties;
                  const pointCount = 'point_count' in cluster.properties ? cluster.properties.point_count : 0;

                  if (isCluster) {
                    return (
                      <Marker key={`cluster-${cluster.id}`} longitude={longitude} latitude={latitude} anchor="center">
                        <KorantisMarker
                          type="cluster"
                          clusterCount={pointCount}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (supercluster) {
                              const expansionZoom = Math.min(supercluster.getClusterExpansionZoom(cluster.id as number), 20);
                              setViewState({ ...viewState, longitude, latitude, zoom: expansionZoom });
                            }
                          }}
                        />
                      </Marker>
                    );
                  }

                  return (
                    <Marker key={`venue-${cluster.properties.venueId}`} longitude={longitude} latitude={latitude} anchor="center">
                      <KorantisMarker 
                        isActive={cluster.properties.isActive} 
                        isSaved={cluster.properties.isSaved} 
                        onClick={(e) => { e.stopPropagation(); setSelectedVenueId(cluster.properties.venueId); }} 
                      />
                    </Marker>
                  );
                })}
              </Map>
              
              {/* Cinematic Map Filters */}
              <div className="absolute inset-0 pointer-events-none mix-blend-color flex bg-[#2E251E]/30" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(201,169,110,0.03)_0%,rgba(10,8,6,0.5)_100%)] pointer-events-none" />

              {/* Selected Venue HUD */}
              {selectedVenue && (
                <AtlasVenuePreview 
                  venue={selectedVenue} 
                  onOpenDetail={() => onVenueClick(selectedVenue)} 
                />
              )}
            </div>
            
            <h2 className="text-[10px] font-sans uppercase tracking-widest text-k-text-tertiary mt-6 mb-2">
              {t('nearbyAtmospheres', language)}
            </h2>
            <div className="py-8 text-center border border-dashed border-white/5 rounded-2xl bg-white/[0.02]">
               <p className="text-xs text-k-text-secondary font-sans font-light">{t('nearbyAtmospheresPlaceholder', language)}</p>
            </div>
          </section>
        ) : (
          /* YOUR ATLAS (SAVED / COLLECTIONS) VIEW */
          <>
            <section>
              <h2 className="text-[10px] font-sans uppercase tracking-widest text-k-text-tertiary mb-6">
                {t('dynamicCollections', language)}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* Collection 1: After Midnight */}
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-k-border-light group cursor-pointer">
                  <Image 
                    src="/venue_floreria.png" 
                    alt={t('afterMidnightImageAlt', language)}
                    fill 
                    className="object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-k-black via-k-black/20 to-transparent"></div>
                  <div className="absolute bottom-5 left-5 right-5 flex flex-col gap-1">
                    <h3 className="font-display text-xl font-normal text-k-text leading-tight">{t('afterMidnight', language)}</h3>
                    <p className="text-[10px] font-sans text-k-gold-light uppercase tracking-wider">{collectionCounts.afterMidnight} {t('atmospheres', language)}</p>
                  </div>
                </div>

                {/* Collection 2: Morning Ritual */}
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-k-border-light group cursor-pointer">
                  <Image 
                    src="/venue_crisol.png" 
                    alt={t('morningRitualImageAlt', language)}
                    fill 
                    className="object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-k-black via-k-black/20 to-transparent"></div>
                  <div className="absolute bottom-5 left-5 right-5 flex flex-col gap-1">
                    <h3 className="font-display text-xl font-normal text-k-text leading-tight">{t('morningRitual', language)}</h3>
                    <p className="text-[10px] font-sans text-k-gold-light uppercase tracking-wider">{collectionCounts.morningRitual} {t('atmospheres', language)}</p>
                  </div>
                </div>

                {/* Collection 3: Sunday Calm */}
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-k-border-light group cursor-pointer">
                  <Image 
                    src="/venue_invernadero.png" 
                    alt={t('sundayCalmImageAlt', language)}
                    fill 
                    className="object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-k-black via-k-black/20 to-transparent"></div>
                  <div className="absolute bottom-5 left-5 right-5 flex flex-col gap-1">
                    <h3 className="font-display text-xl font-normal text-k-text leading-tight">{t('sundayCalm', language)}</h3>
                    <p className="text-[10px] font-sans text-k-gold-light uppercase tracking-wider">{collectionCounts.sundayCalm} {t('atmospheres', language)}</p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-[10px] font-sans uppercase tracking-widest text-k-text-tertiary mb-6">
                {t('allSavedPlaces', language)}
              </h2>
              
              {savedVenues.length === 0 ? (
                <div className="py-16 text-center border border-dashed border-white/5 rounded-2xl bg-white/[0.02]">
                  <Bookmark className="mx-auto text-k-text-tertiary mb-4 opacity-40" size={32} />
                  <p className="text-sm text-k-text-secondary font-sans font-light">{t('atlasEmpty', language)}</p>
                  <button 
                    onClick={onExploreClick}
                    className="mt-4 px-5 py-2 rounded-full border border-k-gold-muted/40 text-xs font-sans text-k-gold bg-k-gold-dim hover:bg-k-gold-dim/60 transition-colors cursor-pointer"
                  >
                    {t('discoverAtmospheres', language)}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {savedVenues.map((venue) => (
                    <div 
                      key={venue.id}
                      onClick={() => onVenueClick(venue)}
                      className="p-4 bg-[#0A0806] border border-white/5 rounded-xl flex items-center gap-4 hover:border-k-gold/20 hover:bg-[#0F0D0B] transition-all duration-300 cursor-pointer shadow-md group"
                    >
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-white/5">
                        <Image src={venue.heroImage} alt={venue.name} fill className="object-cover" />
                      </div>
                      <div className="flex-grow min-w-0">
                        <h3 className="font-display text-lg font-normal text-k-text leading-snug group-hover:text-k-gold-light transition-colors">
                          {venue.name}
                        </h3>
                        <p className="text-[11px] text-k-text-secondary font-sans truncate">
                          {venue.location} &middot; <span className="capitalize">{t(venue.atmosphere, language) || venue.atmosphere.replace('-', ' ')} {t('atmosphereSuffix', language)}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-3.5 flex-shrink-0">
                        <span className="hidden md:inline px-3 py-1 rounded border border-k-gold-muted/10 text-[9px] font-sans tracking-wide text-k-gold-muted bg-k-gold/5 uppercase">
                          {language === 'es' && venue.category_es ? venue.category_es : translateVenueField(venue.category, language, 'category')}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSaveVenue(venue.id);
                          }}
                          className="p-2 text-k-gold hover:text-k-text-secondary transition-colors cursor-pointer"
                          aria-label={t('removeBookmark', language)}
                        >
                          <Heart size={15} fill="currentColor" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
