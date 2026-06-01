"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { useCircadian, ScoredVenue } from "../../contexts/CircadianContext";
import { RefreshCw } from "lucide-react";
import { localizeVenueForDisplay, t } from "../../utils/i18n";

interface OracleCardProps {
  venue: ScoredVenue;
  isTop: boolean;
  onSave: (id: string) => void;
  onDismiss: (id: string) => void;
}

const SWIPE_THRESHOLD = 120;
const SWIPE_VELOCITY = 600;

function OracleCard({ venue, isTop, onSave, onDismiss }: OracleCardProps) {
  const { language } = useCircadian();
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null);
  const displayVenue = localizeVenueForDisplay(venue, language);

  const x = useMotionValue(0);
  // Rotation tied to horizontal drag (tilt effect)
  const rotate = useTransform(x, [-220, 0, 220], [-8, 0, 8]);
  
  // Overlays
  const goldOpacity = useTransform(x, [40, 180], [0, 0.55]);
  const shadowOpacity = useTransform(x, [-180, -40], [0.55, 0]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const isFast = Math.abs(info.velocity.x) > SWIPE_VELOCITY;
    const isFar = Math.abs(info.offset.x) > SWIPE_THRESHOLD;

    if (isFast || isFar) {
      if (info.offset.x > 0 || info.velocity.x > SWIPE_VELOCITY) {
        setExitDirection('right');
        onSave(venue.id);
      } else {
        setExitDirection('left');
        onDismiss(venue.id);
      }
    }
  };

  // If not top, just render a scaled down background card
  if (!isTop) {
    return (
      <motion.div
        className="absolute inset-0 rounded-[32px] overflow-hidden bg-[#0A0A0A] border border-[#C9A96E]/5"
        initial={{ scale: 0.96, y: 12, opacity: 0 }}
        animate={{ scale: 0.96, y: 12, opacity: 0.4 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <Image src={venue.heroImage} alt={venue.name} fill className="object-cover opacity-30 brightness-50" />
        <div className="absolute inset-0 bg-black/70" />
      </motion.div>
    );
  }

  // Animation variants for entering and exiting the stack
  const variants = {
    enter: { scale: 0.96, y: 12, opacity: 0.4 },
    center: { scale: 1, y: 0, opacity: 1, rotate: 0, x: 0 },
    exit: (direction: 'left' | 'right') => ({
      x: direction === 'right' ? 400 : -400,
      opacity: 0,
      scale: 0.96,
      transition: { duration: 0.4, ease: "easeIn" }
    })
  };

  return (
    <motion.div
      className="absolute inset-0 rounded-[32px] overflow-hidden bg-[#0A0A0A] border border-[#C9A96E]/15 shadow-2xl cursor-grab active:cursor-grabbing origin-bottom"
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.3}
      onDragEnd={handleDragEnd}
      style={{ x, rotate }}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      custom={exitDirection}
      layout
    >
      {/* Background Image */}
      <Image 
        src={venue.heroImage} 
        alt={venue.name} 
        fill 
        className="object-cover brightness-90 contrast-125 saturate-50" 
        draggable={false}
      />

      {/* Base Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/40 to-transparent pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#0A0A0A]/60 to-transparent pointer-events-none" />

      {/* Dynamic Drag Overlays */}
      <motion.div 
        className="absolute inset-0 bg-[#C9A96E] mix-blend-overlay pointer-events-none"
        style={{ opacity: goldOpacity }}
      />
      <motion.div 
        className="absolute inset-0 bg-black pointer-events-none"
        style={{ opacity: shadowOpacity }}
      />

      {/* Dynamic Text Copy on Drag */}
      <motion.div 
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ opacity: goldOpacity }}
      >
        <span className="font-sans font-medium uppercase tracking-[0.2em] text-sm text-[#C9A96E] drop-shadow-2xl border border-[#C9A96E]/30 rounded-full px-8 py-3 bg-black/60 backdrop-blur-md">
          {t('drawCloser', language)}
        </span>
      </motion.div>

      <motion.div 
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ opacity: shadowOpacity }}
      >
        <span className="font-sans font-medium uppercase tracking-[0.2em] text-sm text-[#F5F0E8] drop-shadow-2xl border border-white/10 rounded-full px-8 py-3 bg-black/60 backdrop-blur-md">
          {t('letItPass', language)}
        </span>
      </motion.div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col gap-2 pointer-events-none">
        <div className="w-12 h-[1px] bg-[#C9A96E]/30 mb-2" />
        <h3 className="font-display text-4xl text-[#F5F0E8] leading-none drop-shadow-lg">
          {venue.name}
        </h3>
        <p className="text-[10px] text-[#C9A96E] uppercase tracking-[0.2em] font-medium mt-1">
          {displayVenue.displayTagline}
        </p>
        <p className="text-sm text-[#B0A898] font-sans mt-2 line-clamp-2">
          {displayVenue.displayAtmosphere}
        </p>
      </div>
    </motion.div>
  );
}

export default function TheOracle() {
  const { 
    rankedVenues, 
    savedVenueIds, 
    toggleSaveVenue, 
    dismissedVenueIds, 
    dismissVenue, 
    resetDismissedVenues,
    language
  } = useCircadian();

  // Compute remaining venues
  const oracleVenues = useMemo(() => {
    return rankedVenues.filter(venue => 
      !savedVenueIds.includes(venue.id) && 
      !dismissedVenueIds.includes(venue.id)
    );
  }, [rankedVenues, savedVenueIds, dismissedVenueIds]);

  // If no venues left, show empty state
  if (oracleVenues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[640px] w-full text-center px-6">
        <h2 className="font-display text-2xl text-k-text mb-2">{t('oracleEmptyTitle', language)}</h2>
        <p className="text-sm text-k-text-secondary mb-8">{t('oracleEmptyDescription', language)}</p>
        
        <button 
          onClick={resetDismissedVenues}
          className="flex items-center gap-2 px-6 py-3 rounded-full border border-k-border text-sm text-k-text-secondary hover:text-k-gold hover:border-k-gold/30 transition-all"
        >
          <RefreshCw size={14} /> {t('resetSession', language)}
        </button>
      </div>
    );
  }

  // We only render the top 2 cards
  const currentVenue = oracleVenues[0];
  const nextVenue = oracleVenues[1]; // might be undefined

  return (
    <div className="w-full max-w-[420px] mx-auto flex flex-col items-center">
      {/* Header */}
      <div className="text-center mb-6">
        <p className="text-[10px] text-k-gold uppercase tracking-[0.3em] mb-2 font-medium">{t('theOracle', language)}</p>
        <h2 className="font-display text-2xl text-k-text">{t('oracleTitle', language)}</h2>
        <p className="text-xs text-k-text-secondary mt-1">{t('oracleDescription', language)}</p>
      </div>

      {/* Card Stack */}
      <div className="relative w-full aspect-[9/16] h-[60vh] min-h-[460px] max-h-[640px] perspective-1000">
        <AnimatePresence mode="popLayout">
          {nextVenue && (
            <OracleCard 
              key={nextVenue.id} 
              venue={nextVenue} 
              isTop={false} 
              onSave={toggleSaveVenue} 
              onDismiss={dismissVenue} 
            />
          )}
          {currentVenue && (
            <OracleCard 
              key={currentVenue.id} 
              venue={currentVenue} 
              isTop={true} 
              onSave={toggleSaveVenue} 
              onDismiss={dismissVenue} 
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
