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
            if (dwellTime >= 2000) {
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

  // Use the exact canonical classes.
  const baseCardClass = "k-card k-reveal is-visible";
  let variantClass = "";
  
  if (venue.cardSize === 'immersive') variantClass = "k-card--immersive";
  else if (venue.cardSize === 'cinematic') variantClass = "k-card--cinematic";
  else if (venue.cardSize === 'layered') variantClass = "k-card--layered";
  else if (venue.cardSize === 'compact') variantClass = "k-card--compact";
  else variantClass = "k-card--immersive"; // fallback

  const renderCardContent = () => {
    if (venue.cardSize === 'layered') {
      return (
        <article className={`${baseCardClass} ${variantClass}`} onClick={() => onSelect(venue)}>
          <div className="k-card__image-wrap">
            <Image src={venue.heroImage} alt={venue.name} fill className="k-card__image" />
            <div className="k-card__vignette"></div>
          </div>
          <div className="k-card__panel">
            <div className="k-card__panel-header">
              <div>
                <h3 className="k-card__name">{venue.name}</h3>
                <p className="k-card__location">{cat}</p>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); toggleSaveVenue(venue.id); }}
                className={`k-card__panel-bookmark ${isSaved ? 'is-visible' : ''}`}
                aria-label="Save venue"
              >
                <Bookmark size={14} fill={isSaved ? "currentColor" : "none"} />
              </button>
            </div>
            <p className="k-card__tagline">{tagline}</p>
            <div className="k-card__tags">
              {venue.tags.slice(0, 3).map(tag => (
                <span key={tag} className="k-tag k-tag--ghost">{t(tag, language)}</span>
              ))}
            </div>
          </div>
        </article>
      );
    }

    if (venue.cardSize === 'compact') {
      return (
        <article className={`${baseCardClass} ${variantClass}`} onClick={() => onSelect(venue)}>
          <div className="k-card__image-wrap">
            <Image src={venue.heroImage} alt={venue.name} fill className="k-card__image" />
          </div>
          <div className="k-card__content">
            <h3 className="k-card__name">{venue.name}</h3>
            <p className="k-card__location">{cat}</p>
            <p className="k-card__tagline">{tagline}</p>
            <div className="k-card__meta">
              <MapPin size={10} className="k-gold-light" />
              <span>{venue.location}</span>
              <span className="k-card__meta-dot"></span>
              <span className="capitalize">{venue.atmosphere.replace('-', ' ')} {language === 'es' ? 'vibras' : 'vibe'}</span>
            </div>
          </div>
        </article>
      );
    }

    // Default to Immersive / Cinematic standard layout
    return (
      <article className={`${baseCardClass} ${variantClass}`} onClick={() => onSelect(venue)}>
        <div className="k-card__image-wrap">
          <Image src={venue.heroImage} alt={venue.name} fill className="k-card__image" />
          <div className="k-card__gradient"></div>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); toggleSaveVenue(venue.id); }}
          className={`k-card__bookmark ${isSaved ? 'is-visible' : ''}`}
          aria-label="Save venue"
        >
          <Bookmark size={14} fill={isSaved ? "currentColor" : "none"} />
        </button>
        <div className="k-card__content">
          {venue.cardSize === 'immersive' && <div className="k-card__accent-line"></div>}
          <h3 className="k-card__name">{venue.name}</h3>
          <p className="k-card__location">{cat}</p>
          <p className="k-card__tagline">{tagline}</p>
          <div className="k-card__tags">
            {venue.tags.slice(0, 3).map(tag => (
              <span key={tag} className="k-tag k-tag--ghost">{t(tag, language)}</span>
            ))}
          </div>
        </div>
      </article>
    );
  };

  // Keep the tracking div wrapper but use the exact spacing classes from base.css
  const spacingClass = {
    tight: 'k-section',
    breathe: 'k-section', // Usually mapped via custom structural layout rules
    isolated: 'k-section'
  }[venue.spacing];

  return (
    <div 
      ref={ref}
      className={`w-full flex justify-center my-16 md:my-24`} // Outer spacing preserved for Feed mechanics
    >
      <div className="relative w-full max-w-lg md:max-w-xl flex justify-center group">
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
      </div>
    </div>
  );
}

