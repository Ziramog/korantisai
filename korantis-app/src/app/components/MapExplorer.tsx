"use client";

import { useMemo, useState, useCallback } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { ScoredVenue, useCircadian } from '../contexts/CircadianContext';
import { MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface MapExplorerProps {
  onSelectVenue: (venue: ScoredVenue) => void;
}

export default function MapExplorer({ onSelectVenue }: MapExplorerProps) {
  const { rankedVenues } = useCircadian();
  
  // Calculate a bounding box or central point based on top venues
  const initialViewState = useMemo(() => {
    // Default to Buenos Aires if no venues are loaded
    if (rankedVenues.length === 0) {
      return {
        longitude: -58.4,
        latitude: -34.6,
        zoom: 12,
        pitch: 45,
        bearing: -17.6,
      };
    }
    
    // Average coordinates of top 5 venues
    const topVenues = rankedVenues.slice(0, 5);
    const avgLat = topVenues.reduce((sum, v) => sum + v.lat, 0) / topVenues.length;
    const avgLng = topVenues.reduce((sum, v) => sum + v.lng, 0) / topVenues.length;

    return {
      longitude: avgLng,
      latitude: avgLat,
      zoom: 13.5,
      pitch: 45,
      bearing: -17.6,
    };
  }, [rankedVenues]);

  const [viewState, setViewState] = useState(initialViewState);

  // Use the custom dark atmospheric Mapbox style provided by the user.
  const mapStyle = "mapbox://styles/wolfim77/cmp9383dz006z01s84wrs7mju";

  if (!MAPBOX_TOKEN) {
    return (
      <div className="w-full h-[60vh] flex flex-col items-center justify-center bg-k-surface-elevated/20 border border-k-border rounded-3xl p-8 text-center mt-6">
        <MapPin size={32} className="text-k-gold-dim mb-4" />
        <h3 className="text-lg font-display text-k-text mb-2">Map Engine Offline</h3>
        <p className="text-sm font-sans text-k-text-secondary max-w-sm">
          A valid Mapbox token is required to render the atmospheric spatial canvas. Please add NEXT_PUBLIC_MAPBOX_TOKEN to your environment variables.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-[65vh] rounded-3xl overflow-hidden border border-white/[0.05] shadow-2xl relative mt-6">
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle={mapStyle}
        mapboxAccessToken={MAPBOX_TOKEN}
        attributionControl={false}
        cooperativeGestures={true}
      >
        <NavigationControl position="top-right" />
        
        {/* Breathing markers based on Hybrid Rank */}
        {rankedVenues.slice(0, 20).map((venue, index) => {
          // Calculate visual weight based on rank
          // Top rank = largest scale & opacity
          const rankWeight = Math.max(0.2, 1 - (index * 0.05));
          const baseSize = 24 + (rankWeight * 20); // 24px to 44px
          
          return (
            <Marker 
              key={venue.id} 
              longitude={venue.lng} 
              latitude={venue.lat}
              anchor="bottom"
              onClick={e => {
                e.originalEvent.stopPropagation();
                onSelectVenue(venue);
              }}
            >
              <div className="relative flex flex-col items-center cursor-pointer group">
                {/* Name Label (appears on hover) */}
                <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-k-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-k-gold/30 pointer-events-none z-50">
                  <p className="text-xs font-display text-k-gold-light">{venue.name}</p>
                  <p className="text-[9px] font-sans text-k-text-tertiary uppercase">{venue.atmosphere.replace('-', ' ')}</p>
                </div>
                
                {/* Breathing Core */}
                <motion.div 
                  className="rounded-full bg-k-gold shadow-[0_0_15px_rgba(201,169,110,0.5)]"
                  style={{
                    width: baseSize,
                    height: baseSize,
                    opacity: 0.8 + (rankWeight * 0.2)
                  }}
                  animate={{ 
                    scale: [1, 1.1 + (rankWeight * 0.2), 1],
                    opacity: [0.8, 1, 0.8] 
                  }}
                  transition={{ 
                    duration: 3 + (index * 0.2), // Staggered breathing
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  {/* Inner dark core */}
                  <div className="absolute inset-0 m-auto w-1/3 h-1/3 bg-k-black rounded-full"></div>
                </motion.div>
              </div>
            </Marker>
          );
        })}
      </Map>
      
      {/* Cinematic Map Overlay (Vignette) */}
      <div className="absolute inset-0 pointer-events-none rounded-3xl ring-1 ring-inset ring-white/10 shadow-[inset_0_0_80px_rgba(10,10,10,0.8)]"></div>
    </div>
  );
}
