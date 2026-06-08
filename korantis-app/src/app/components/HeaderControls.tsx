"use client";

import { useState } from 'react';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import Image from 'next/image';
import { useCircadian } from '../contexts/CircadianContext';
import { t } from '../utils/i18n';

export default function HeaderControls() {
  const { city, setCity, language } = useCircadian();
  const { scrollY } = useScroll();
  const [isVisible, setIsVisible] = useState(true);

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest < 60) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  });

  return (
    <motion.div 
      initial={true}
      animate={{ y: isVisible ? 0 : -100, opacity: isVisible ? 1 : 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed top-6 left-0 right-0 z-50 flex items-center justify-between px-6 pointer-events-none"
    >
      <div className="pointer-events-auto flex items-center gap-2.5">
        <Image 
          src="/korantislogo.jpeg" 
          alt="Korantis" 
          width={44} 
          height={44} 
          className="rounded-[4px] object-cover mix-blend-screen opacity-90"
        />
        <h1 className="font-display text-xl tracking-[0.2em] text-k-text uppercase mt-[2px]">Korantis</h1>
      </div>
      
      <div className="pointer-events-auto">
        <button
          onClick={() => setCity(city === 'BUE' ? 'NYC' : 'BUE')}
          aria-label={t('switchCity', language)}
          className="text-[10px] font-sans font-light tracking-wider text-k-text-secondary hover:text-k-text transition-colors flex items-center gap-1.5 uppercase"
        >
          {city === 'BUE' ? 'Buenos Aires' : 'New York'} <span className="text-[8px] opacity-60">▼</span>
        </button>
      </div>
    </motion.div>
  );
}
