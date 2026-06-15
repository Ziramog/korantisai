"use client";

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { ArrowLeft, Clock, DollarSign, MapPin, Heart, Share, Navigation } from 'lucide-react';
import { ScoredVenue, useCircadian } from '../contexts/CircadianContext';
import { localizeVenueForDisplay, t } from '../utils/i18n';
import VenueDetailMapBlock from './map/VenueDetailMapBlock';
import VenueImageLightbox from './VenueImageLightbox';
import { localizeVenueDescriptionForDisplay } from '@/lib/descriptions/venueDescriptionModel';
import SaveToast from './SaveToast';
import CollectionSheet from './CollectionSheet';

interface VenueDetailProps {
  venue: ScoredVenue;
  onBack: () => void;
  onOpenInAtlas: () => void;
}

const practicalSignalPattern = /precio|price|reserva|reservation|ruido|noise|confirmed|confirmado|confidence|confianza|editorial/i;

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
  const [showToast, setShowToast] = useState(false);
  const [showSheet, setShowSheet] = useState(false);

  const isSaved = savedVenueIds.includes(venue.id);
  const displayVenue = localizeVenueForDisplay(venue, language);
  const description = localizeVenueDescriptionForDisplay(venue, language);
  const hasEditorialCopy = (venue as Record<string, unknown>).hasEditorialCopy === true;
  const galleryImages = (venue.galleryImages || [])
    .filter((image) => image.src && !image.src.includes('/venue_invernadero.png'))
    .slice(0, 6);
  const viewerImages = [
    { src: venue.heroImage, role: 'hero' },
    ...galleryImages,
  ];

  const rhythmNote = getRhythmNote(venue, description.goodToKnow, language);
  
  const isConfirmedPrice = description.priceLabel && !description.priceLabel.toLowerCase().includes('no confirmad');
  const isConfirmedRes = description.reservationHint && !description.reservationHint.toLowerCase().includes('no confirmad');
  const hasAntesDeIr = isConfirmedPrice || isConfirmedRes || Boolean(rhythmNote);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [venue.id]);

  const closeLightbox = useCallback(() => {
    setSelectedImageIndex(null);
  }, []);

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
    <div className="w-full min-h-screen bg-[#0F0D0B] pb-32 text-[#F5F0E8] relative z-40 overflow-x-hidden">
      {/* 1. Gallery Full-Bleed Horizontal Scroll */}
      <header className="relative w-full h-[50vh] md:h-[60vh] bg-black">
        {/* Floating Back Button */}
        <div className="absolute top-6 left-5 z-50">
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-all shadow-lg"
          >
            <ArrowLeft size={18} />
          </button>
        </div>

        {/* Gallery Carousel */}
        <div className="w-full h-full flex overflow-x-auto snap-x snap-mandatory scrollbar-hide">
          <style>{`
            .scrollbar-hide::-webkit-scrollbar { display: none; }
            @keyframes korantis-gallery-scan {
              0% { transform: translateX(-55%); opacity: .18; }
              32% { opacity: .9; }
              68% { opacity: .9; }
              100% { transform: translateX(155%); opacity: .18; }
            }
            .gallery-scroll-cue::after {
              animation: korantis-gallery-scan 2.8s cubic-bezier(.22, 1, .36, 1) infinite;
            }
          `}</style>
          {viewerImages.map((img, i) => (
            <div key={i} className="w-full h-full flex-shrink-0 snap-start relative cursor-zoom-in" onClick={() => setSelectedImageIndex(i)}>
              <Image src={img.src || ''} alt={`${venue.name} - ${i}`} fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0F0D0B] via-transparent to-black/20" />
            </div>
          ))}
        </div>

        {viewerImages.length > 1 && (
          <div className="pointer-events-none absolute bottom-9 left-1/2 z-20 w-28 -translate-x-1/2 md:bottom-12">
            <div className="gallery-scroll-cue relative h-px overflow-hidden rounded-full bg-white/20 shadow-[0_0_20px_rgba(201,169,110,0.2)] after:absolute after:inset-y-0 after:left-0 after:w-14 after:rounded-full after:bg-gradient-to-r after:from-transparent after:via-[#F5F0E8] after:to-transparent" />
            <p className="mt-3 text-center font-sans text-[9px] uppercase tracking-[0.28em] text-white/55">
              {language === 'es' ? 'deslizá' : 'swipe'}
            </p>
          </div>
        )}
      </header>

      {/* 2. Title, Barrio, Tags */}
      <section className="px-6 -mt-6 relative z-10 max-w-2xl mx-auto w-full">
        <h1 className="text-4xl font-display text-[#F5F0E8] mb-2 drop-shadow-lg">{venue.name}</h1>
        <div className="flex items-center gap-1.5 text-[#8A7A5A] font-sans text-sm mb-5">
          <MapPin size={14} />
          <span>{venue.location}</span>
          <span className="mx-1">•</span>
          <span className="capitalize">{displayVenue.displayAtmosphere}</span>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-8">
          {(displayVenue.displayTags || venue.tags).slice(0, 3).map((tag: string) => (
            <span key={tag} className="px-3 py-1.5 rounded bg-[#C9A96E]/10 border border-[#C9A96E]/20 text-[#C9A96E] text-[10px] uppercase tracking-wider font-medium">
              {tag}
            </span>
          ))}
        </div>
      </section>

      {/* 3. CTAs */}
      <section className="px-6 max-w-2xl mx-auto w-full flex items-center justify-between gap-4 mb-10 pb-10 border-b border-white/5">
        <button 
          onClick={() => {
            toggleSaveVenue(venue.id);
            if (!isSaved) setShowToast(true);
            else setShowToast(false);
          }} 
          className="flex-1 flex flex-col items-center justify-center gap-2 py-4 rounded-xl bg-white/5 hover:bg-white/10 transition border border-white/5"
        >
          <Heart size={20} className={isSaved ? "text-[#C9A96E] fill-[#C9A96E]" : "text-[#B0A898]"} />
          <span className="text-[10px] font-sans uppercase tracking-widest text-[#B0A898]">{isSaved ? t('unsave', language) : t('save', language)}</span>
        </button>
        <button 
          onClick={() => {
            if (venue.lat && venue.lng) {
              window.open(`https://www.google.com/maps/dir/?api=1&destination=${venue.lat},${venue.lng}`, '_blank');
            }
          }}
          className="flex-1 flex flex-col items-center justify-center gap-2 py-4 rounded-xl bg-white/5 hover:bg-white/10 transition border border-white/5"
        >
          <Navigation size={20} className="text-[#B0A898]" />
          <span className="text-[10px] font-sans uppercase tracking-widest text-[#B0A898]">Ir</span>
        </button>
        <button className="flex-1 flex flex-col items-center justify-center gap-2 py-4 rounded-xl bg-white/5 hover:bg-white/10 transition border border-white/5">
          <Share size={20} className="text-[#B0A898]" />
          <span className="text-[10px] font-sans uppercase tracking-widest text-[#B0A898]">Compartir</span>
        </button>
      </section>

      {/* 4. Descripción Corta */}
      {hasEditorialCopy && (
        <section className="px-6 max-w-2xl mx-auto w-full mb-12">
          <p className="text-xl md:text-2xl text-[#C9A96E] font-display italic font-light mb-6 leading-relaxed">
            &ldquo;{description.oneLiner}&rdquo;
          </p>
          <p className="text-sm md:text-base text-[#B0A898] font-sans font-light leading-[1.8] text-justify">
            {description.summary}
          </p>
        </section>
      )}

      {/* 5. Mejor Para */}
      {description.bestFor.length > 0 && (
        <section className="px-6 max-w-2xl mx-auto w-full mb-12">
          <h3 className="text-[10px] font-sans uppercase tracking-widest text-[#8A7A5A] mb-5">Mejor para</h3>
          <div className="flex flex-wrap gap-2.5">
            {description.bestFor.slice(0, 5).map(item => (
              <span key={item} className="px-4 py-2 rounded-full border border-[#C9A96E]/20 bg-[#C9A96E]/5 text-xs text-[#E8D4A6] shadow-sm">
                {item}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* 6. Por qué ir ahora (Time Blocks) */}
      <section className="px-6 max-w-2xl mx-auto w-full mb-12">
        <h3 className="text-[10px] font-sans uppercase tracking-widest text-[#8A7A5A] mb-5">El momento ideal</h3>
        <div className="flex flex-col gap-4">
          {timeBlocks.map(block => {
            const isActive = venue.atmosphere === block.phase || (venue.atmosphere === 'late-night' && block.phase === 'night');
            return (
              <div key={block.phase} className={`p-5 rounded-2xl border transition-all ${isActive ? 'border-[#C9A96E]/30 bg-[#C9A96E]/10 shadow-[0_0_20px_rgba(201,169,110,0.05)]' : 'border-white/5 bg-white/[0.02]'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-sans font-medium text-[#F5F0E8]">{block.label}</span>
                  {isActive && (
                    <span className="text-[9px] text-[#C9A96E] uppercase tracking-widest font-medium">Recomendado</span>
                  )}
                </div>
                <p className="text-xs md:text-sm text-[#B0A898] font-light leading-relaxed">{block.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. Info Práctica */}
      {hasAntesDeIr && (
        <section className="px-6 max-w-2xl mx-auto w-full mb-12">
          <h3 className="text-[10px] font-sans uppercase tracking-widest text-[#8A7A5A] mb-5">Antes de ir</h3>
          <div className="flex flex-col gap-5 p-5 rounded-2xl border border-white/5 bg-white/[0.02]">
            {Boolean(rhythmNote) && (
              <>
                <div className="flex gap-4 items-start">
                  <Clock size={16} className="text-[#C9A96E] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[9px] text-[#8A7A5A] font-sans tracking-wider uppercase block mb-1">Ritmo</span>
                    <p className="text-xs md:text-sm text-[#B0A898] leading-relaxed">{rhythmNote}</p>
                  </div>
                </div>
                {(isConfirmedPrice || isConfirmedRes) && <div className="h-px bg-white/5 w-full" />}
              </>
            )}
            
            {(isConfirmedPrice || isConfirmedRes) && (
              <div className="flex gap-4 items-start">
                <DollarSign size={16} className="text-[#C9A96E] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[9px] text-[#8A7A5A] font-sans tracking-wider uppercase block mb-1">Detalles</span>
                  {isConfirmedPrice && <p className="text-xs md:text-sm text-[#B0A898] mb-1">{description.priceLabel}</p>}
                  {isConfirmedRes && <p className="text-xs md:text-sm text-[#B0A898]">{description.reservationHint}</p>}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 8. Mapa */}
      <section className="px-6 max-w-2xl mx-auto w-full mb-12">
        <h3 className="text-[10px] font-sans uppercase tracking-widest text-[#8A7A5A] mb-5">Ubicación</h3>
        <VenueDetailMapBlock venue={venue} onOpenInAtlas={onOpenInAtlas} />
      </section>

      {/* 9. Lugares Similares */}
      <section className="px-6 max-w-2xl mx-auto w-full mb-16">
        <h3 className="text-[10px] font-sans uppercase tracking-widest text-[#8A7A5A] mb-5">Lugares Similares</h3>
        <div className="p-8 rounded-2xl border border-white/5 border-dashed flex flex-col items-center justify-center text-center opacity-50">
          <p className="text-xs font-sans tracking-widest uppercase text-[#8A7A5A]">En construcción (Sprint 2)</p>
        </div>
      </section>

      <VenueImageLightbox
        images={viewerImages}
        index={selectedImageIndex}
        venueName={venue.name}
        language={language}
        onClose={closeLightbox}
        onChange={setSelectedImageIndex}
      />

      {/* Save Flow Modals */}
      <SaveToast 
        show={showToast} 
        onClose={() => setShowToast(false)} 
        onAddToList={() => setShowSheet(true)} 
      />
      
      <CollectionSheet 
        isOpen={showSheet} 
        venue={venue} 
        onClose={() => setShowSheet(false)} 
      />
    </div>
  );
}
