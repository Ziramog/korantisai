"use client";

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MapPin } from 'lucide-react';
import { ScoredVenue, useCircadian } from '../contexts/CircadianContext';
import { localizeVenueForDisplay, t } from '../utils/i18n';
import { formatTagsForCard, isMoodTag } from '../utils/tags';

interface VenueCardProps {
  venue: ScoredVenue;
  onSelect: (venue: ScoredVenue) => void;
  onSpatialTap?: (venue: ScoredVenue) => void;
  variant?: 'hero' | 'standard';
}

export default function VenueCard({ venue, onSelect, onSpatialTap, variant = 'standard' }: VenueCardProps) {
  const {
    recordDwell,
    recordPassThrough,
    savedVenueIds,
    toggleSaveVenue,
    language
  } = useCircadian();

  const ref = useRef<HTMLDivElement>(null);
  const [debugMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return params.get('debug') === 'taste' || params.get('debug') === 'circadian';
  });
  
  const [showToast, setShowToast] = useState(false);

  const isSaved = savedVenueIds.includes(venue.id);
  const displayVenue = localizeVenueForDisplay(venue, language);
  const placeCue = venue.location || displayVenue.displayAtmosphere;

  // Telemetry: Graded Dwell & Scroll Pass-through
  useEffect(() => {
    if (typeof window === 'undefined' || !("IntersectionObserver" in window)) return;
    const cardEl = ref.current;
    if (!cardEl) return;

    let entryTime = 0;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entryTime = performance.now();
        } else {
          if (entryTime > 0) {
            const dwellTime = performance.now() - entryTime;
            if (dwellTime < 800) {
              recordPassThrough(venue.atmosphere);
            } else if (dwellTime >= 2000) {
              recordDwell(venue.atmosphere, dwellTime);
            }
            entryTime = 0;
          }
        }
      },
      { threshold: 0.6 } // Card must be 60% visible to qualify
    );

    observer.observe(cardEl);
    return () => observer.disconnect();
  }, [venue.atmosphere, recordDwell, recordPassThrough]);

  return (
    <div ref={ref} className="w-full relative group">
      <motion.article
        layoutId={`card-wrap-${venue.id}`}
        onClick={() => onSelect(venue)}
        className="w-full flex flex-col gap-4 cursor-pointer relative"
      >
        {/* Full-width atmospheric image */}
        <div className={`relative w-full rounded-2xl overflow-hidden bg-[#0F0D0B] border border-white/5 group-hover:border-[#C9A96E]/30 transition-colors ${
          variant === 'hero' ? 'aspect-[3/2] sm:aspect-[16/10]' : 'aspect-[4/3] sm:aspect-[3/2]'
        }`}>
          <Image
            src={venue.heroImage || '/venue_floreria.png'}
            alt={venue.name}
            fill
            sizes="(max-width: 768px) 100vw, 800px"
            className="object-cover transition-transform duration-1000 group-hover:scale-105"
            priority={venue.id === 'floreria'}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/50 opacity-50 group-hover:opacity-70 transition-opacity duration-500" />
          
          {/* Bookmark Corner */}
          <motion.button
            whileTap={{ scale: 0.8 }}
            animate={isSaved ? { scale: [1, 1.3, 1] } : { scale: 1 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => {
              e.stopPropagation();
              toggleSaveVenue(venue.id);
              if (!isSaved) {
                setShowToast(true);
                setTimeout(() => setShowToast(false), 3000);
              }
            }}
            className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              isSaved 
                ? 'bg-[#C9A96E] text-black shadow-[0_0_15px_rgba(201,169,110,0.5)]' 
                : 'bg-black/50 text-white/70 hover:bg-black/80 hover:text-white backdrop-blur-md border border-white/10'
            }`}
            aria-label={isSaved ? t('unsave', language) : t('save', language)}
          >
            <Heart size={20} className={isSaved ? "fill-current" : ""} />
          </motion.button>
        </div>

        {/* Content Block */}
        <div className="flex flex-col px-1">
          <div className="flex items-start justify-between gap-4 mb-1">
            <h3 className="font-display text-2xl text-[#F5F0E8] tracking-wide">
              {venue.name}
            </h3>
            <button
              onClick={(e) => { e.stopPropagation(); onSpatialTap?.(venue); }}
              className="flex items-center gap-1 text-[#8A7A5A] hover:text-[#C9A96E] transition-colors mt-2"
            >
              <MapPin size={14} />
              <span className="text-[11px] font-sans font-light uppercase tracking-widest">{placeCue}</span>
            </button>
          </div>
          
          <p className="font-display italic text-sm text-[#B0A898]/90 leading-relaxed mb-4">
            {displayVenue.displayTagline}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            {formatTagsForCard(displayVenue.displayTags || venue.tags).map((tag) => {
              const mood = isMoodTag(tag);
              return (
                <span 
                  key={tag} 
                  className={`px-3 py-1.5 rounded-sm ${
                    mood 
                      ? 'text-[10px] font-sans font-medium uppercase tracking-[0.1em] text-[#C9A96E] bg-[#C9A96E]/10 border border-[#C9A96E]/40'
                      : 'text-[10px] font-sans font-medium uppercase tracking-[0.1em] text-white/50 bg-white/5 border border-white/10'
                  }`}
                >
                  {tag}
                </span>
              );
            })}
          </div>
        </div>

        {/* Dynamic Vector Score Debug HUD badge */}
        {debugMode && (
          <div className="absolute top-4 left-4 z-30 bg-black/85 border border-white/10 rounded px-2 py-1 font-mono text-[8px] text-white/70 pointer-events-none tracking-tight">
            <span className="text-[#C9A96E] font-bold">S:{venue.scoreFinal}</span> |
            <span> C:{venue.breakdown.circadian.toFixed(2)}</span> |
            <span> T:{venue.breakdown.taste.toFixed(2)}</span> |
            <span> I:{venue.breakdown.intent.toFixed(2)}</span> |
            <span> X:{venue.breakdown.context.toFixed(2)}</span>
          </div>
        )}
      </motion.article>

      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-[#C9A96E] text-[#1a1a1a] px-4 py-2 rounded-full font-sans text-sm shadow-[0_0_20px_rgba(201,169,110,0.3)] flex items-center gap-2 pointer-events-none"
          >
            <Heart size={16} className="fill-current" />
            <span className="font-medium tracking-wide">Guardado</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
