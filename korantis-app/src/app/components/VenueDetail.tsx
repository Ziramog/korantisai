"use client";

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, DollarSign, MapPin, Heart } from 'lucide-react';
import { ScoredVenue, useCircadian } from '../contexts/CircadianContext';
import { localizeVenueForDisplay, t } from '../utils/i18n';
import VenueDetailMapBlock from './map/VenueDetailMapBlock';
import VenueImageLightbox from './VenueImageLightbox';
import { localizeVenueDescriptionForDisplay } from '@/lib/descriptions/venueDescriptionModel';

interface VenueDetailProps {
  venue: ScoredVenue;
  onBack: () => void;
  onOpenInAtlas: () => void;
}

const practicalSignalPattern = /precio|price|reserva|reservation|ruido|noise|confirmed|confirmado|confidence|confianza|editorial/i;
const internalTagPattern = /consumer|ready|lista|sistema|system|staging|published|public|google|cloudinary|fallback/i;

function venueText(venue: ScoredVenue) {
  return [
    venue.name,
    venue.category,
    venue.atmosphere,
    venue.location,
    ...(venue.tags || []),
  ].join(' ').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

function getRhythmNote(venue: ScoredVenue, fallbackNotes: string[], language: 'en' | 'es') {
  const usefulNote = fallbackNotes.find((note) => !practicalSignalPattern.test(note));
  if (usefulNote) return usefulNote;

  const text = venueText(venue);
  const isCafe = /cafe|coffee|bakery|brunch|panaderia/.test(text);
  const isWine = /wine|vino|bodega/.test(text);
  const isBar = /bar|cocktail|coctel|speakeasy|rooftop|lounge/.test(text);
  const isRestaurant = /restaurant|parrilla|comedor|cena|dinner/.test(text);

  if (language === 'es') {
    if (isWine) return 'Pausa lenta. Mejor para una copa, conversación y quedarse un poco más.';
    if (isBar) return 'Ritmo social. Mejor para una salida sin apuro.';
    if (isRestaurant) return 'Ritmo de mesa. Mejor cuando la comida es el plan.';
    if (isCafe) return 'Pausa breve. Mejor para café o un encuentro sin demasiada presión.';
    return 'Pausa lenta. Mejor cuando no hay apuro.';
  }

  if (isWine) return 'Slow pause. Better for a glass, conversation, and staying a little longer.';
  if (isBar) return 'Social rhythm. Better for a night out without rushing.';
  if (isRestaurant) return 'Table-paced. Better when the meal is the plan.';
  if (isCafe) return 'Short pause. Better for coffee or a low-pressure meeting.';
  return 'Slow pause. Better when there is no rush.';
}

function getMomentDescription(venue: ScoredVenue, phase: 'morning' | 'afternoon' | 'night', language: 'en' | 'es') {
  const text = venueText(venue);
  const isCafe = /cafe|coffee|bakery|brunch|panaderia/.test(text);
  const isWine = /wine|vino|bodega/.test(text);
  const isBar = /bar|cocktail|coctel|speakeasy|rooftop|lounge/.test(text);
  const isRestaurant = /restaurant|parrilla|comedor|cena|dinner/.test(text);

  if (language === 'es') {
    if (phase === 'morning') {
      if (isCafe) return 'Más calmo temprano. Mejor para café o una pausa breve.';
      if (isBar || isWine) return 'Más bajo temprano. Mejor dejarlo para una pausa más tarde.';
      if (isRestaurant) return 'Más tranquilo fuera del ritmo principal. Mejor si buscás menos escena.';
      return 'Más calmo temprano. Mejor para empezar sin apuro.';
    }

    if (phase === 'afternoon') {
      if (isWine || isBar) return 'Buen momento para una copa lenta, algo simple y conversación.';
      if (isRestaurant) return 'Buen momento para almuerzo, sobremesa o una mesa sin tanta prisa.';
      if (isCafe) return 'Buen momento para una pausa lenta, lectura breve o algo dulce.';
      return 'Buen momento para una pausa lenta y conversación.';
    }

    if (isWine) return 'Más cálido y social. Mejor para vino, comida y quedarse un poco más.';
    if (isBar) return 'Más social y producido. Mejor para una salida con energía.';
    if (isRestaurant) return 'Más cálido y de mesa. Mejor para cenar y quedarse un poco más.';
    if (isCafe) return 'Más bajo y tranquilo. Mejor para una pausa corta si sigue abierto.';
    return 'Más cálido y social. Mejor para quedarse un poco más.';
  }

  if (phase === 'morning') {
    if (isCafe) return 'Calmer early. Better for coffee or a brief pause.';
    if (isBar || isWine) return 'Quieter early. Better saved for a later pause.';
    if (isRestaurant) return 'Quieter outside the main rhythm. Better if you want less scene.';
    return 'Calmer early. Better for starting without rushing.';
  }

  if (phase === 'afternoon') {
    if (isWine || isBar) return 'A good moment for a slow glass, something simple, and conversation.';
    if (isRestaurant) return 'A good moment for lunch, a longer table, or less rush.';
    if (isCafe) return 'A good moment for a slow pause, short reading, or something sweet.';
    return 'A good moment for a slow pause and conversation.';
  }

  if (isWine) return 'Warmer and more social. Better for wine, food, and staying a little longer.';
  if (isBar) return 'More social and produced. Better for an energetic night out.';
  if (isRestaurant) return 'Warmer and table-led. Better for dinner and staying a little longer.';
  if (isCafe) return 'Lower and quieter. Better for a short pause if it is still open.';
  return 'Warmer and more social. Better for staying a little longer.';
}

export default function VenueDetail({ venue, onBack, onOpenInAtlas }: VenueDetailProps) {
  const { savedVenueIds, toggleSaveVenue, language } = useCircadian();
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const isSaved = savedVenueIds.includes(venue.id);
  const displayVenue = localizeVenueForDisplay(venue, language);
  const description = localizeVenueDescriptionForDisplay(venue, language);
  const galleryImages = (venue.galleryImages || [])
    .filter((image) => image.src && !image.src.includes('/venue_invernadero.png'))
    .slice(0, 6);
  const viewerImages = [
    { src: venue.heroImage, role: 'hero' },
    ...galleryImages,
  ];
  const ambientSignals = [
    ...venue.tags.map((tag, index) => displayVenue.displayTags[index] || tag),
    ...description.bestFor,
  ].filter((tag, index, values) => (
    tag
    && !practicalSignalPattern.test(tag)
    && !internalTagPattern.test(tag)
    && values.findIndex((value) => value.toLowerCase() === tag.toLowerCase()) === index
  ));
  const visibleAmbientSignals = ambientSignals.slice(0, 7);
  const hiddenAmbientSignalCount = Math.max(0, ambientSignals.length - visibleAmbientSignals.length);
  const rhythmNote = getRhythmNote(venue, description.goodToKnow, language);

  // Scroll back to the top of the detail view on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [venue.id]);

  const closeLightbox = useCallback(() => {
    setSelectedImageIndex(null);
  }, []);

  // Derived timeline attributes matching the design mock
  const timeBlocks = [
    {
      phase: 'morning',
      label: t('morning', language),
      desc: getMomentDescription(venue, 'morning', language),
    },
    {
      phase: 'afternoon',
      label: t('afternoon', language),
      desc: getMomentDescription(venue, 'afternoon', language),
    },
    {
      phase: 'night',
      label: t('night', language),
      desc: getMomentDescription(venue, 'night', language),
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

        <button
          type="button"
          onClick={() => setSelectedImageIndex(0)}
          className="absolute inset-0 z-10 cursor-zoom-in focus:outline-none focus-visible:ring-1 focus-visible:ring-k-gold/60 focus-visible:ring-inset"
          aria-label={`${language === 'es' ? 'Ampliar imagen principal de' : 'Expand hero image of'} ${venue.name}`}
        />

        {/* Hero Meta Info - Responsive bottom positioning */}
        <div className="absolute bottom-7 left-5 right-5 md:bottom-10 md:left-12 z-20 flex flex-col gap-2.5 max-w-2xl">
          <span className="text-[10px] text-k-gold tracking-widest uppercase font-sans font-medium">
            {displayVenue.displayCategory}
          </span>
          <h1 className="text-k-text font-display text-3xl md:text-5xl lg:text-6xl font-normal tracking-wide drop-shadow-md leading-[0.98]">
            {venue.name}
          </h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-k-text-secondary font-sans text-xs mt-1">
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
        <section className="mb-11 border-b border-k-border/30 pb-11">
          <div className="flex flex-col gap-5">
            <p className="text-lg md:text-2xl text-k-gold-light font-display italic font-light leading-[1.42] max-w-3xl">
              &ldquo;{description.oneLiner}&rdquo;
            </p>
            <p className="text-[13px] md:text-sm text-k-text-secondary font-sans font-light leading-[1.9] md:leading-[1.95] text-left md:text-justify max-w-3xl">
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
            {visibleAmbientSignals.map((tag) => (
              <span key={tag} className="px-3.5 py-1.5 rounded-lg border border-k-gold/10 text-[11px] font-sans tracking-wide text-k-gold bg-k-gold-dim/40 shadow-sm">
                {tag}
              </span>
            ))}
            {hiddenAmbientSignalCount > 0 && (
              <span className="px-3.5 py-1.5 rounded-lg border border-white/5 text-[11px] font-sans tracking-wide text-k-text-secondary/70 bg-white/[0.015]">
                +{hiddenAmbientSignalCount} {language === 'es' ? 'señales' : 'signals'}
              </span>
            )}
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
                    <span className="text-[8px] font-sans px-2 py-0.5 rounded-full border border-k-gold/15 text-k-gold/75 font-medium bg-k-gold/5">
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
          <section className="mb-14 -mx-5 md:mx-0">
            <div className="px-5 md:px-0">
              <h3 className="text-[10px] font-sans uppercase tracking-widest text-k-text-tertiary mb-4">
                {t('vignettes', language)}
              </h3>
            </div>
            <div
              className="flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 pr-[14vw] pb-2 [-ms-overflow-style:none] [scrollbar-width:none] md:px-0 md:pr-0 [&::-webkit-scrollbar]:hidden"
              aria-label={language === 'es' ? 'Escenas del ambiente' : 'Atmospheric scenes'}
            >
              {galleryImages.map((image, index) => (
                <button
                  type="button"
                  key={image.id || `${venue.id}-gallery-${index}`}
                  onClick={() => setSelectedImageIndex(index + 1)}
                  className="group relative aspect-[4/5] w-[80vw] max-w-[360px] shrink-0 snap-start cursor-zoom-in overflow-hidden rounded-2xl border border-k-gold/10 bg-[#100D0A] shadow-[0_24px_70px_rgba(0,0,0,0.34)] focus:outline-none focus-visible:ring-1 focus-visible:ring-k-gold/70 focus-visible:ring-offset-2 focus-visible:ring-offset-k-black md:w-[min(38vw,360px)]"
                  aria-label={`${language === 'es' ? 'Ampliar imagen' : 'Expand image'} ${index + 1} ${language === 'es' ? 'de' : 'of'} ${venue.name}`}
                >
                  <Image
                    src={image.src || venue.heroImage}
                    alt={`${venue.name} ${t('detailVignetteAlt', language)}`}
                    fill
                    sizes="(min-width: 768px) 360px, 80vw"
                    className="object-cover opacity-90 saturate-[0.92] transition duration-1000 ease-out group-hover:scale-[1.025] group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0705]/45 via-transparent to-[#0A0705]/10 opacity-70 transition-opacity duration-700 group-hover:opacity-45" />
                  <div className="absolute inset-x-3 bottom-3 flex justify-between text-[9px] uppercase tracking-[0.24em] text-k-text/45">
                    <span>{language === 'es' ? 'Escena' : 'Scene'}</span>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        <VenueImageLightbox
          images={viewerImages}
          index={selectedImageIndex}
          venueName={venue.name}
          language={language}
          onClose={closeLightbox}
          onChange={setSelectedImageIndex}
        />

        {/* Spatial Placement Map Block */}
        <VenueDetailMapBlock venue={venue} onOpenInAtlas={onOpenInAtlas} />

        {/* Quiet Structural Utilities - Responsive stacking layout */}
        <section className="mb-8 p-5 bg-k-surface/20 border border-k-border/30 rounded-2xl">
          <h3 className="text-[10px] font-sans uppercase tracking-widest text-k-text-tertiary mb-5">
            {t('beforeGoing', language)}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 divide-y md:divide-y-0 md:divide-x divide-k-border/30">
            <div className="flex gap-3.5 items-start pb-4 md:pb-0">
              <Clock className="text-k-gold flex-shrink-0 mt-0.5" size={14} />
              <div>
                <span className="text-[9px] text-k-text-tertiary font-sans tracking-wider uppercase block mb-1 font-medium">
                  {t('temporalPace', language)}
                </span>
                <span className="text-[11px] text-k-text-secondary font-sans leading-relaxed">
                  {rhythmNote}
                </span>
              </div>
            </div>
            <div className="flex gap-3.5 items-start pt-4 md:pt-0 md:pl-8">
              <DollarSign className="text-k-gold flex-shrink-0 mt-0.5" size={14} />
              <div>
                <span className="text-[9px] text-k-text-tertiary font-sans tracking-wider uppercase block mb-1 font-medium">
                  {t('investment', language)}
                </span>
                <span className="text-[11px] text-k-text-secondary font-sans leading-relaxed block">
                  {description.priceLabel}.
                </span>
                <span className="text-[11px] text-k-text-secondary font-sans leading-relaxed block">
                  {description.reservationHint}.
                </span>
                <span className="text-[11px] text-k-gold/70 font-sans leading-relaxed block mt-1">
                  {description.confidenceLabel}.
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
