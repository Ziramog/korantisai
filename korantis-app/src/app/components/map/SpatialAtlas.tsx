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
import { trackEvent, trackVenueEvent } from '@/lib/analytics';

interface SpatialAtlasProps {
  onVenueClick: (venue: ScoredVenue) => void;
  onExploreClick: () => void;
  initialSelectedVenueId?: string | null;
}

export default function SpatialAtlas({ onVenueClick, onExploreClick, initialSelectedVenueId }: SpatialAtlasProps) {
  const { language, savedVenueIds, toggleSaveVenue, rankedVenues } = useCircadian();
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(initialSelectedVenueId || null);
  
  const mapVenues = useMemo(() => {
    return rankedVenues.filter(v => typeof v.lat === 'number' && typeof v.lng === 'number');
  }, [rankedVenues]);

  const initialSelectedVenue = initialSelectedVenueId
    ? mapVenues.find((venue) => venue.id === initialSelectedVenueId)
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
    return mapVenues.map(venue => ({
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
  }, [mapVenues, selectedVenueId, savedVenueIds]);

  const { clusters, supercluster } = useSupercluster({
    points,
    bounds,
    zoom: viewState.zoom,
    options: { radius: 60, maxZoom: 16 }
  });

  const selectedVenue = useMemo(() => {
    return mapVenues.find(v => v.id === selectedVenueId) || null;
  }, [mapVenues, selectedVenueId]);

  // Compute saved venues
  const savedVenues = useMemo(() => {
    return mapVenues.filter(v => savedVenueIds.includes(v.id));
  }, [mapVenues, savedVenueIds]);

  // Compute collection counts
  const collectionCounts = useMemo(() => {
    return {
      afterMidnight: mapVenues.filter(v => v.atmosphere === 'late-night' || v.atmosphere === 'night').length,
      morningRitual: mapVenues.filter(v => v.atmosphere === 'morning').length,
      sundayCalm: mapVenues.filter(v => v.atmosphere === 'afternoon' || v.atmosphere === 'dawn').length,
    };
  }, [mapVenues]);

  return (
    <div className="w-full h-[calc(100vh-120px)] flex flex-col pt-4 animate-fade-in relative z-0">
      <main className="w-full flex-1 flex flex-col relative">
        <div className="w-full flex-1 bg-[#0A0806] overflow-hidden relative shadow-xl">
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
                            trackEvent('atlas_cluster_clicked', {
                              point_count: pointCount,
                              zoom: Number(viewState.zoom.toFixed(2)),
                            });
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
                        onClick={(e) => {
                          e.stopPropagation();
                          const venue = rankedVenues.find((item) => item.id === cluster.properties.venueId);
                          if (venue) {
                            trackVenueEvent('atlas_marker_clicked', venue, {
                              zoom: Number(viewState.zoom.toFixed(2)),
                            });
                          }
                          setSelectedVenueId(cluster.properties.venueId);
                        }} 
                      />
                    </Marker>
                  );
                })}
              </Map>
              
              {/* Cinematic Map Filters */}
              <div className="absolute inset-0 pointer-events-none mix-blend-color flex bg-[#2E251E]/30" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(201,169,110,0.03)_0%,rgba(10,8,6,0.5)_100%)] pointer-events-none" />

              {/* Removed Selected Venue HUD overlay as requested (Fix 4 Option A) */}
          </div>
          
          {/* Horizontal Scrolling Cards Below Map */}
          <div className="absolute bottom-6 left-0 right-0 z-10">
            <div className="flex gap-4 overflow-x-auto px-6 pb-4 scrollbar-hide snap-x">
              <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
              {mapVenues.map(venue => (
                <div key={venue.id} className="w-[280px] shrink-0 snap-center cursor-pointer" onClick={() => {
                  if (selectedVenueId === venue.id) {
                    trackVenueEvent('atlas_card_opened', venue);
                    onVenueClick(venue);
                  } else {
                    setSelectedVenueId(venue.id);
                    setViewState({
                      ...viewState,
                      longitude: venue.lng || viewState.longitude,
                      latitude: venue.lat || viewState.latitude,
                      zoom: 15.5
                    });
                  }
                }}>
                  <div className={`p-3 rounded-2xl bg-[#0F0D0B] border transition-all ${selectedVenueId === venue.id ? 'border-[#C9A96E]/50 shadow-lg' : 'border-white/10'}`}>
                    <div className="relative w-full h-32 rounded-lg overflow-hidden mb-3">
                      <Image src={venue.heroImage} alt={venue.name} fill className="object-cover" />
                      {savedVenueIds.includes(venue.id) && (
                        <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center">
                          <Heart size={14} className="text-[#C9A96E] fill-[#C9A96E]" />
                        </div>
                      )}
                    </div>
                    <h3 className="text-white font-sans font-medium text-sm truncate">{venue.name}</h3>
                    <p className="text-[#8A7A5A] font-sans text-xs truncate">{venue.location} • <span className="capitalize">{venue.atmosphere}</span></p>
                  </div>
                </div>
              ))}
            </div>
          </div>
      </main>
    </div>
  );
}
