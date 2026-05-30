"use client";

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Bookmark, MapPin } from 'lucide-react';
import { ScoredVenue, useCircadian } from '../contexts/CircadianContext';
import { t } from '../utils/i18n';

interface VenueCardProps {
  venue: ScoredVenue;
  onSelect: (venue: ScoredVenue) => void;
}

export default function VenueCard({ venue, onSelect }: VenueCardProps) {
  const { 
    recordDwell, 
    recordPassThrough, 
    savedVenueIds, 
    toggleSaveVenue,
    language 
  } = useCircadian();

  const ref = useRef<HTMLDivElement>(null);
  const [debugMode, setDebugMode] = useState(false);

  const isSaved = savedVenueIds.includes(venue.id);
  const cat = language === 'es' && venue.category_es ? venue.category_es : venue.category;
  const tagline = language === 'es' && venue.tagline_es ? venue.tagline_es : venue.tagline;

  // Check URL query parameters for taste debugging HUD
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('debug') === 'taste' || params.get('debug') === 'circadian') {
        setDebugMode(true);
      }
    }
  }, []);

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
    return () => {
      observer.disconnect();
    };
  }, [venue.atmosphere, recordDwell, recordPassThrough]);

  // Map card size to custom classes
  const cardSizeStyles = {
    immersive: 'h-[75vh] w-full max-w-md',
    cinematic: 'aspect-[16/9] w-full max-w-xl',
    layered: 'aspect-square w-full max-w-lg',
    compact: 'aspect-[4/5] w-full max-w-sm',
  }[venue.cardSize];

  // Map spacing layout attributes
  const spacingStyles = {
    tight: 'my-6 md:my-10',
    breathe: 'my-16 md:my-28',
    isolated: 'my-24 md:my-40',
  }[venue.spacing];

  // Render specific layout compositions based on prototype card variants
  const renderCardContent = () => {
    switch (venue.cardSize) {
      case 'layered':
        return (
          <div className="relative w-full h-full flex flex-col justify-end">
            <div className="absolute inset-0">
              <Image
                src={venue.heroImage}
                alt={venue.name}
                fill
                priority={venue.id === 'floreria'}
                className="object-cover transition-transform duration-[1200ms] group-hover:scale-[1.03] opacity-80"
              />
              <div className="absolute inset-0 bg-black/20 mix-blend-multiply"></div>
            </div>
            
            {/* Frosted panel floating at the bottom */}
            <div className="relative z-10 m-5 p-5 bg-[#0F0D0B]/75 backdrop-blur-xl border border-white/5 rounded-xl shadow-2xl flex flex-col gap-2.5 transition-transform duration-500 group-hover:translate-y-[-4px]">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] text-k-gold tracking-widest uppercase font-sans font-medium">
                    {cat}
                  </span>
                  <h3 className="text-k-text font-display text-2xl font-normal mt-0.5 leading-tight">
                    {venue.name}
                  </h3>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSaveVenue(venue.id);
                  }}
                  className="text-k-text-secondary hover:text-k-gold transition-colors cursor-pointer"
                  aria-label="Save venue"
                >
                  <Bookmark size={17} fill={isSaved ? "currentColor" : "none"} className={isSaved ? "text-k-gold" : ""} />
                </button>
              </div>
              <p className="text-xs text-k-text-secondary font-sans font-light leading-relaxed">
                {tagline}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {venue.tags.map((tag) => (
                  <span key={tag} className="px-2.5 py-0.5 rounded-full border border-k-gold/10 text-[9px] font-sans tracking-wide text-k-gold-muted bg-k-gold/5">
                    {t(tag, language)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );

      case 'immersive':
        return (
          <div className="relative w-full h-full flex flex-col justify-end p-6">
            <div className="absolute inset-0">
              <Image
                src={venue.heroImage}
                alt={venue.name}
                fill
                priority={venue.id === 'floreria'}
                className="object-cover transition-transform duration-[1200ms] group-hover:scale-[1.03] opacity-85"
              />
              {/* Bottom Bleed Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/40 to-transparent"></div>
            </div>

            <button 
              onClick={(e) => {
                e.stopPropagation();
                toggleSaveVenue(venue.id);
              }}
              className="absolute top-6 right-6 z-20 text-k-text-secondary hover:text-k-gold transition-colors cursor-pointer"
              aria-label="Save venue"
            >
              <Bookmark size={18} fill={isSaved ? "currentColor" : "none"} className={isSaved ? "text-k-gold" : ""} />
            </button>

            <div className="relative z-10 flex flex-col gap-2.5">
              <div className="w-8 h-[2px] bg-k-gold mb-1"></div>
              <span className="text-[10px] text-k-gold tracking-widest uppercase font-sans font-medium">
                {cat}
              </span>
              <h3 className="text-k-text font-display text-3xl md:text-4xl font-normal leading-tight">
                {venue.name}
              </h3>
              <p className="text-xs text-k-text-secondary font-sans font-light leading-relaxed max-w-sm">
                {tagline}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {venue.tags.map((tag) => (
                  <span key={tag} className="px-2.5 py-0.5 rounded-full border border-white/5 text-[9px] font-sans tracking-wide text-k-text-secondary bg-white/[0.03]">
                    {t(tag, language)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );

      case 'cinematic':
        return (
          <div className="relative w-full h-full flex flex-col justify-end p-6">
            <div className="absolute inset-0">
              <Image
                src={venue.heroImage}
                alt={venue.name}
                fill
                className="object-cover transition-transform duration-[1200ms] group-hover:scale-[1.03] opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent opacity-95"></div>
            </div>

            <button 
              onClick={(e) => {
                e.stopPropagation();
                toggleSaveVenue(venue.id);
              }}
              className="absolute top-6 right-6 z-20 text-k-text-secondary hover:text-k-gold transition-colors cursor-pointer"
              aria-label="Save venue"
            >
              <Bookmark size={18} fill={isSaved ? "currentColor" : "none"} className={isSaved ? "text-k-gold" : ""} />
            </button>

            <div className="relative z-10 flex flex-col gap-1.5">
              <span className="text-[9px] text-k-gold tracking-widest uppercase font-sans font-medium">
                {cat}
              </span>
              <h3 className="text-k-text font-display text-3xl font-normal leading-tight">
                {venue.name}
              </h3>
              <p className="text-xs text-k-text-secondary font-sans font-light leading-relaxed max-w-md">
                {tagline}
              </p>
            </div>
          </div>
        );

      case 'compact':
      default:
        return (
          <div className="w-full h-full flex flex-col bg-k-surface-elevated/40 border border-k-border-light rounded-2xl overflow-hidden hover:border-k-gold-muted/20 transition-colors">
            <div className="relative w-full aspect-[4/3]">
              <Image
                src={venue.heroImage}
                alt={venue.name}
                fill
                className="object-cover transition-transform duration-[1200ms] group-hover:scale-[1.03] opacity-90"
              />
            </div>
            <div className="p-5 flex flex-col flex-grow justify-between relative">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSaveVenue(venue.id);
                }}
                className="absolute top-5 right-5 z-20 text-k-text-secondary hover:text-k-gold transition-colors cursor-pointer"
                aria-label="Save venue"
              >
                <Bookmark size={16} fill={isSaved ? "currentColor" : "none"} className={isSaved ? "text-k-gold" : ""} />
              </button>

              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] text-k-gold tracking-widest uppercase font-sans font-medium">
                  {cat}
                </span>
                <h3 className="text-k-text font-display text-2xl font-normal leading-tight">
                  {venue.name}
                </h3>
                <p className="text-xs text-k-text-secondary font-sans font-light leading-relaxed">
                  {tagline}
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] text-k-text-tertiary font-sans mt-3.5 pt-3 border-t border-k-border/40">
                <MapPin size={10} className="text-k-gold-muted" />
                <span>{venue.location}</span>
                <span className="w-1 h-1 rounded-full bg-k-border-light"></span>
                <span className="capitalize">{venue.atmosphere.replace('-', ' ')} {language === 'es' ? 'vibras' : 'vibe'}</span>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div 
      ref={ref}
      className={`w-full flex justify-center ${spacingStyles}`}
    >
      <motion.div
        onClick={() => onSelect(venue)}
        className={`relative overflow-hidden cursor-pointer group shadow-2xl transition-all duration-[600ms] ${
          venue.cardSize !== 'compact' 
            ? 'rounded-2xl border border-k-border-light hover:border-k-gold-muted/30 hover:scale-[1.015]' 
            : 'hover:scale-[1.01]'
        } ${cardSizeStyles}`}
      >
        {renderCardContent()}

        {/* Dynamic Vector Score Debug HUD badge */}
        {debugMode && (
          <div className="absolute bottom-4 right-4 z-30 bg-black/85 border border-white/10 rounded px-2 py-1 font-mono text-[8px] text-white/70 pointer-events-none tracking-tight">
            <span className="text-k-gold font-bold">S:{venue.scoreFinal}</span> | 
            <span> C:{venue.breakdown.circadian.toFixed(2)}</span> | 
            <span> T:{venue.breakdown.taste.toFixed(2)}</span> | 
            <span> I:{venue.breakdown.intent.toFixed(2)}</span> | 
            <span> X:{venue.breakdown.context.toFixed(2)}</span>
          </div>
        )}
      </motion.div>
    </div>
  );
}
