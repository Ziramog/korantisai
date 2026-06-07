"use client";

import { memo, useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCircadian } from '../contexts/CircadianContext';
import { trackEvent } from '@/lib/analytics';

interface SearchBarProps {
  onOpenSearch: () => void;
}

const PLACEHOLDERS = [
  "Buscar lugar, mood, barrio...",
  "Lugares para una cita...",
  "Cafés para trabajar...",
  "Refugios para leer..."
];

function SearchBar({ onOpenSearch }: SearchBarProps) {
  const { searchQuery } = useCircadian();
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    if (searchQuery) return;
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [searchQuery]);

  return (
    <div className="w-full max-w-xl mx-auto px-6 z-40 mt-4 mb-8">
      <button
        type="button"
        onClick={() => {
          trackEvent('search_button_clicked');
          onOpenSearch();
        }}
        className="w-full flex items-center gap-3 px-5 py-4 rounded-[2rem] text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
        style={{ 
          background: 'rgba(15, 13, 11, 0.75)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(201, 169, 110, 0.3)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.8), inset 0 0 20px rgba(0,0,0,0.3)'
        }}
      >
        <Search size={18} className="text-[#8A7A5A] shrink-0" />
        <div className="relative flex-1 h-[22px] overflow-hidden">
          <AnimatePresence mode="popLayout">
            <motion.span
              key={searchQuery ? 'query' : placeholderIndex}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 text-[15px] font-sans text-[#8A7A5A] truncate flex items-center"
            >
              {searchQuery || PLACEHOLDERS[placeholderIndex]}
            </motion.span>
          </AnimatePresence>
        </div>
      </button>
    </div>
  );
}

export default memo(SearchBar);
