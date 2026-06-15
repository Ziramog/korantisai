"use client";

import { memo, useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCircadian } from '../contexts/CircadianContext';
import { trackEvent } from '@/lib/analytics';

interface SearchBarProps {
  onOpenSearch: () => void;
}

const PLACEHOLDERS = {
  es: [
    'Buscar lugar, mood, barrio...',
    'Lugares para una cita...',
    'Cafés para trabajar...',
    'Refugios para leer...',
  ],
  en: [
    'Search place, mood, neighborhood...',
    'Places for a date...',
    'Cafes for working...',
    'Quiet places to read...',
  ],
};

function SearchBar({ onOpenSearch }: SearchBarProps) {
  const { searchQuery, language } = useCircadian();
  const locale = language === 'es' ? 'es' : 'en';
  const placeholders = PLACEHOLDERS[locale];
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    if (searchQuery) return;
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [searchQuery, placeholders.length]);

  return (
    <div className="z-40 mx-auto mb-8 mt-4 w-full max-w-xl px-6">
      <button
        type="button"
        onClick={() => {
          trackEvent('search_button_clicked');
          onOpenSearch();
        }}
        className="flex w-full items-center gap-3 rounded-[2rem] px-5 py-4 text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
        style={{ 
          background: 'rgba(15, 13, 11, 0.75)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(201, 169, 110, 0.3)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.8), inset 0 0 20px rgba(0,0,0,0.3)'
        }}
      >
        <Search size={18} className="shrink-0 text-[#8A7A5A]" />
        <div className="relative h-[22px] flex-1 overflow-hidden">
          <AnimatePresence mode="popLayout">
            <motion.span
              key={searchQuery ? 'query' : `${locale}-${placeholderIndex}`}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 flex items-center truncate font-sans text-[15px] text-[#8A7A5A]"
            >
              {searchQuery || placeholders[placeholderIndex]}
            </motion.span>
          </AnimatePresence>
        </div>
      </button>
    </div>
  );
}

export default memo(SearchBar);
