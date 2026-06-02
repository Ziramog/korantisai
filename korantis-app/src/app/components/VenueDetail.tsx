"use client";

import { useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, DollarSign, MapPin, Heart } from 'lucide-react';
import { ScoredVenue, useCircadian } from '../contexts/CircadianContext';
import { localizeVenueForDisplay, t } from '../utils/i18n';
import VenueDetailMapBlock from './map/VenueDetailMapBlock';
import { localizeVenueDescriptionForDisplay } from '@/lib/descriptions/venueDescriptionModel';

interface VenueDetailProps {
  venue: ScoredVenue;
  onBack: () => void;
  onOpenInAtlas: () => void;
}

export default function VenueDetail({ venue, onBack, onOpenInAtlas }: VenueDetailProps) {
  const { savedVenueIds, toggleSaveVenue, language } = useCircadian();

  const isSaved = savedVenueIds.includes(venue.id);
  const displayVenue = localizeVenueForDisplay(venue, language);
  const description = localizeVenueDescriptionForDisplay(venue, language);
  const galleryImages = (venue.galleryImages || [])
    .filter((image) => image.src && !image.src.includes('/venue_invernadero.png'))
    .slice(0, 6);

  // Scroll back to the top of the detail view on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [venue.id]);

  // Derived timeline attributes matching the design mock
  const timeBlocks = [
    {
      phase: 'morning',
      label: t('morning', language),
      desc: venue.atmosphere === 'morning' 
        ? t('morningActiveDesc', language)
        : t('morningDefaultDesc', language)
    },
    {
      phase: 'afternoon',
      label: t('afternoon', language),
      desc: venue.atmosphere === 'afternoon'
        ? t('afternoonActiveDesc', language)
        : t('afternoonDefaultDesc', language)
    },
    {
      phase: 'night',
      label: t('night', language),
      desc: (venue.atmosphere === 'night' || venue.atmosphere === 'late-night')
        ? t('nightActiveDesc', language)
        : t('nightDefaultDesc', language)
    }
  ];

  return (
    <div className="w-full min-h-screen bg-k-black pb-32 text-k-text relative z-40 overflow-x-hidden">
      {/* Immersive Parallax Header - Optimized height for mobile */}
      <header className="relative w-full h-[52vh] md:h-[75vh] overflow-hidden">
        {/* Floating Controls */}
        <div className="absolute top-6 left-5 right-5 z-50 flex gap-4 justify-between items-center">
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-[#0F0D0B]/60 backdrop-blur-xl border border-white/5 flex items-center justify-center text-k-text-secondary hover:text-k-text hover:bg-[#0F0D0B]/90 transition-all cursor-pointer shadow-lg"
            aria-label={t('back', language)}
          >
            <ArrowLeft size={16} />
          </button>
          
          <button 
            onClick={() => toggleSaveVenue(venue.id)}
            className="w-10 h-10 rounded-full bg-[#0F0D0B]/60 backdrop-blur-xl border border-white/5 flex items-center justify-center text-k-text-secondary hover:text-k-gold hover:bg-[#0F0D0B]/90 transition-all cursor-pointer shadow-lg"
            aria-label={isSaved ? t('unsave', language) : t('save', language)}
          >
            <Heart size={16} fill={isSaved ? "#C9A96E" : "none"} className={isSaved ? "text-k-gold" : ""} />
          </button>
        </div>

        {/* Parallax Image Wrap */}
        <motion.div 
          layoutId={`card-wrap-${venue.id}`}
          className="absolute inset-0 w-full h-full"
        >
          <Image
            src={venue.heroImage}
            alt={venue.name}
            fill
            priority
            className="object-cover opacity-90"
          />
          {/* Rich Cinematic Dark Gradient Mask */}
          <div className="absolute inset-0 bg-gradient-to-t from-k-black via-k-black/40 to-transparent"></div>
        </motion.div>

        {/* Hero Meta Info - Responsive bottom positioning */}
        <div className="absolute bottom-6 left-5 right-5 md:left-12 z-20 flex flex-col gap-2 max-w-2xl">
          <span className="text-[10px] text-k-gold tracking-widest uppercase font-sans font-medium">
            {displayVenue.displayCategory}
          </span>
          <h1 className="text-k-text font-display text-3xl md:text-5xl lg:text-6xl font-normal tracking-wide drop-shadow-md leading-tight">
            {venue.name}
          </h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-k-text-secondary font-sans text-xs mt-0.5">
            <div className="flex items-center gap-1">
              <MapPin size={11} className="text-k-gold-muted" />
              <span>{venue.location}</span>
            </div>
            <span className="hidden sm:inline w-1 h-1 rounded-full bg-k-border-light"></span>
            <span className="capitalize">{displayVenue.displayAtmosphere}</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-5 md:px-12 mt-8 md:mt-12">
        {/* Poetic Narrative Section */}
        <section className="mb-10 border-b border-k-border/30 pb-10">
          <div className="flex flex-col gap-3">
            <p className="text-lg md:text-2xl text-k-gold-light font-display italic font-light leading-relaxed max-w-3xl">
              &ldquo;{description.oneLiner}&rdquo;
            </p>
            <p className="text-xs md:text-sm text-k-text-secondary font-sans font-light leading-relaxed mt-3 text-justify">
              {description.summary}
            </p>
          </div>
        </section>

        {/* Ambient Characteristic Tags */}
        <section className="mb-12">
          <h3 className="text-[10px] font-sans uppercase tracking-widest text-k-text-tertiary mb-4">
            {t('atmosphericCharacter', language)}
          </h3>
          <div className="flex flex-wrap gap-2">
            {venue.tags.map((tag, index) => (
              <span key={tag} className="px-3.5 py-1.5 rounded-lg border border-k-gold/10 text-[11px] font-sans tracking-wide text-k-gold bg-k-gold-dim/40 shadow-sm">
                {displayVenue.displayTags[index] || tag}
              </span>
            ))}
            {description.bestFor.map((value) => (
              <span key={value} className="px-3.5 py-1.5 rounded-lg border border-k-gold/10 text-[11px] font-sans tracking-wide text-k-gold bg-k-gold-dim/40 shadow-sm">
                {value}
              </span>
            ))}
            <span className="px-3.5 py-1.5 rounded-lg border border-white/5 text-[11px] font-sans tracking-wide text-k-text-secondary bg-white/[0.02]">
              {description.energyLabel}
            </span>
            <span className="px-3.5 py-1.5 rounded-lg border border-white/5 text-[11px] font-sans tracking-wide text-k-text-secondary bg-white/[0.02]">
              {description.noiseLabel}
            </span>
          </div>
        </section>

        {/* Chrono-Atmospheric Shifts (Circadian Drift) */}
        <section className="mb-14 border-t border-k-border/30 pt-10">
          <h3 className="text-[10px] font-sans uppercase tracking-widest text-k-text-tertiary mb-5">
            {t('circadianShifts', language)}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {timeBlocks.map((block) => (
              <div 
                key={block.phase}
                className={`p-5 rounded-xl border transition-all duration-500 ${
                  venue.atmosphere === block.phase || (venue.atmosphere === 'late-night' && block.phase === 'night')
                    ? 'border-k-gold/20 bg-k-gold-glow/50 shadow-md'
                    : 'border-k-border bg-k-surface/20'
                }`}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[9px] font-sans tracking-widest uppercase font-semibold text-k-text-tertiary">
                    {block.label}
                  </span>
                  {(venue.atmosphere === block.phase || (venue.atmosphere === 'late-night' && block.phase === 'night')) && (
                    <span className="text-[8px] font-sans px-2 py-0.5 rounded-full border border-k-gold/20 text-k-gold font-medium bg-k-gold-dim">
                      {t('activePhase', language)}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-k-text-secondary font-sans font-light leading-relaxed">
                  {block.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Cinematic Visual Gallery */}
        {galleryImages.length > 0 && (
          <section className="mb-14">
            <h3 className="text-[10px] font-sans uppercase tracking-widest text-k-text-tertiary mb-4">
              {t('vignettes', language)}
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {galleryImages.map((image, index) => (
                <div
                  key={image.id || `${venue.id}-gallery-${index}`}
                  className="relative aspect-[4/5] rounded-lg overflow-hidden border border-k-border/40 group"
                >
                  <Image
                    src={image.src || venue.heroImage}
                    alt={`${venue.name} ${t('detailVignetteAlt', language)}`}
                    fill
                    sizes="(min-width: 768px) 220px, 30vw"
                    className="object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Spatial Placement Map Block */}
        <VenueDetailMapBlock venue={venue} onOpenInAtlas={onOpenInAtlas} />

        {/* Quiet Structural Utilities - Responsive stacking layout */}
        <section className="mb-8 p-5 bg-k-surface/20 border border-k-border/30 rounded-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 divide-y md:divide-y-0 md:divide-x divide-k-border/30">
            <div className="flex gap-3.5 items-start pb-4 md:pb-0">
              <Clock className="text-k-gold flex-shrink-0 mt-0.5" size={14} />
              <div>
                <span className="text-[9px] text-k-text-tertiary font-sans tracking-wider uppercase block mb-1 font-medium">
                  {t('temporalPace', language)}
                </span>
                <span className="text-[11px] text-k-text-secondary font-sans leading-relaxed">
                  {description.goodToKnow.join(' ')}
                </span>
              </div>
            </div>
            <div className="flex gap-3.5 items-start pt-4 md:pt-0 md:pl-8">
              <DollarSign className="text-k-gold flex-shrink-0 mt-0.5" size={14} />
              <div>
                <span className="text-[9px] text-k-text-tertiary font-sans tracking-wider uppercase block mb-1 font-medium">
                  {t('investment', language)}
                </span>
                <span className="text-[11px] text-k-text-secondary font-sans leading-relaxed">
                  {description.priceLabel}. {description.reservationHint}. {description.confidenceLabel}.
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
