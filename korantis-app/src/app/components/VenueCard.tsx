"use client";

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Compass } from 'lucide-react';
import { ScoredVenue, useCircadian } from '../contexts/CircadianContext';
import { t } from '../utils/i18n';

interface VenueCardProps {
  venue: ScoredVenue;
  onSelect: (venue: ScoredVenue) => void;
  onSpatialTap?: (venue: ScoredVenue) => void;
}

export default function VenueCard({ venue, onSelect, onSpatialTap }: VenueCardProps) {
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
  const tagline = language === 'es' && venue.tagline_es ? venue.tagline_es : venue.tagline;
  const placeCue = venue.location || venue.atmosphere.replace('-', ' ');

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

  // Map spacing layout attributes
  const spacingStyles = {
    tight: 'my-6 md:my-10',
    breathe: 'my-16 md:my-28',
    isolated: 'my-24 md:my-40',
  }[venue.spacing];

  const renderBookmark = (className = 'k-card__bookmark') => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        toggleSaveVenue(venue.id);
      }}
      className={`${className} ${isSaved ? 'is-saved is-visible' : ''}`}
      aria-label={isSaved ? 'Unsave venue' : 'Save venue'}
      aria-pressed={isSaved}
    >
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-3.5L5 21V5z" />
      </svg>
    </button>
  );

  const renderTags = (variant: 'frost' | 'ghost' | 'gold' | 'outlined') => (
    <div className="k-card__tags">
      {venue.tags.map((tag) => (
        <span key={tag} className={`k-tag k-tag--${variant}`}>
          {t(tag, language)}
        </span>
      ))}
    </div>
  );

  // Render specific layout compositions based on prototype card variants
  const renderCardContent = () => {
    switch (venue.cardSize) {
      case 'layered':
        return (
          <>
            <div className="k-card__image-wrap">
              <Image
                src={venue.heroImage}
                alt={venue.name}
                fill
                priority={venue.id === 'floreria'}
                className="k-card__image"
              />
              <div className="k-card__vignette"></div>
            </div>
            {renderBookmark()}
            <div className="k-card__panel">
              <div className="k-card__panel-header">
                <div>
                  <h3 className="k-card__name">{venue.name}</h3>
                  <p 
                    className="k-card__location flex items-center gap-1.5 cursor-pointer hover:text-k-gold transition-colors group/spatial"
                    onClick={(e) => { e.stopPropagation(); onSpatialTap?.(venue); }}
                    aria-label={`Open ${venue.name} in Spatial Atlas`}
                  >
                    <Compass size={13} className="opacity-70 group-hover/spatial:opacity-100" />
                    {placeCue}
                  </p>
                </div>
              </div>
              <p className="k-card__tagline">{tagline}</p>
              {renderTags('gold')}
            </div>
          </>
        );

      case 'immersive':
        return (
          <>
            <div className="k-card__image-wrap">
              <Image
                src={venue.heroImage}
                alt={venue.name}
                fill
                priority={venue.id === 'floreria'}
                className="k-card__image"
              />
              <div className="k-card__gradient"></div>
            </div>
            {renderBookmark()}
            <div className="k-card__content">
              <div className="k-card__accent-line"></div>
              <h3 className="k-card__name">{venue.name}</h3>
              <p 
                className="k-card__location flex items-center gap-1.5 cursor-pointer hover:text-k-gold transition-colors group/spatial"
                onClick={(e) => { e.stopPropagation(); onSpatialTap?.(venue); }}
                aria-label={`Open ${venue.name} in Spatial Atlas`}
              >
                <Compass size={13} className="opacity-70 group-hover/spatial:opacity-100" />
                {placeCue}
              </p>
              <p className="k-card__tagline">{tagline}</p>
              {renderTags('ghost')}
            </div>
          </>
        );

      case 'cinematic':
        return (
          <>
            <div className="k-card__image-wrap">
              <Image
                src={venue.heroImage}
                alt={venue.name}
                fill
                className="k-card__image"
              />
              <div className="k-card__gradient"></div>
            </div>
            {renderBookmark()}
            <div className="k-card__content">
              <h3 className="k-card__name">{venue.name}</h3>
              <p 
                className="k-card__location flex items-center gap-1.5 cursor-pointer hover:text-k-gold transition-colors group/spatial"
                onClick={(e) => { e.stopPropagation(); onSpatialTap?.(venue); }}
                aria-label={`Open ${venue.name} in Spatial Atlas`}
              >
                <Compass size={13} className="opacity-70 group-hover/spatial:opacity-100" />
                {placeCue}
              </p>
              <p className="k-card__tagline">{tagline}</p>
              {renderTags('frost')}
            </div>
          </>
        );

      case 'compact':
      default:
        return (
          <>
            <div className="k-card__image-wrap">
              <Image
                src={venue.heroImage}
                alt={venue.name}
                fill
                className="k-card__image"
              />
            </div>
            <div className="k-card__content">
              <h3 className="k-card__name">{venue.name}</h3>
              <p 
                className="k-card__location flex items-center gap-1.5 cursor-pointer hover:text-k-gold transition-colors group/spatial"
                onClick={(e) => { e.stopPropagation(); onSpatialTap?.(venue); }}
                aria-label={`Open ${venue.name} in Spatial Atlas`}
              >
                <Compass size={13} className="opacity-70 group-hover/spatial:opacity-100" />
                {placeCue}
              </p>
              <p className="k-card__tagline">{tagline}</p>
              {renderTags('ghost')}
            </div>
          </>
        );
    }
  };

  return (
    <div
      ref={ref}
      className={`w-full max-w-[var(--k-mobile-max)] ${spacingStyles}`}
    >
      <motion.article
        layoutId={`card-wrap-${venue.id}`}
        onClick={() => onSelect(venue)}
        className={`k-card k-card--${venue.cardSize} ${isSaved ? 'is-saved' : ''}`}
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
      </motion.article>
    </div>
  );
}
