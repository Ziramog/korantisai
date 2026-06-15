"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, History, Sparkles } from 'lucide-react';
import { useCircadian, ScoredVenue } from '../contexts/CircadianContext';
import { trackEvent } from '@/lib/analytics';
import CompactCard from './CompactCard';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVenue: (venue: ScoredVenue) => void;
}

const SEARCH_COPY = {
  es: {
    placeholder: 'Buscar lugar, mood, barrio...',
    cancel: 'Cancelar',
    categories: 'Categorías',
    ideas: 'Ideas rápidas',
    resultsFor: 'Resultados para',
    empty: 'No encontramos lugares que coincidan.',
    categoryOptions: [
      { label: 'Café de especialidad', query: 'café' },
      { label: 'Vino natural', query: 'vino natural' },
      { label: 'Cocktails', query: 'cocktails' },
      { label: 'Cita', query: 'cita íntima' },
      { label: 'Para leer', query: 'leer tranquilo' },
      { label: 'Restaurante', query: 'restaurante' },
    ],
    quickIdeas: ['Chacarita', 'Palermo', 'Patio', 'Vino', 'Íntimo', 'Café'],
  },
  en: {
    placeholder: 'Search place, mood, neighborhood...',
    cancel: 'Cancel',
    categories: 'Categories',
    ideas: 'Quick ideas',
    resultsFor: 'Results for',
    empty: 'No matching places found.',
    categoryOptions: [
      { label: 'Specialty coffee', query: 'coffee' },
      { label: 'Natural wine', query: 'natural wine' },
      { label: 'Cocktails', query: 'cocktails' },
      { label: 'Date night', query: 'intimate date' },
      { label: 'For reading', query: 'quiet read' },
      { label: 'Restaurant', query: 'restaurant' },
    ],
    quickIdeas: ['Chacarita', 'Palermo', 'Patio', 'Wine', 'Intimate', 'Coffee'],
  },
};

export default function SearchModal({ isOpen, onClose, onSelectVenue }: SearchModalProps) {
  const { searchQuery, setSearchQuery, rankedVenues, language } = useCircadian();
  const inputRef = useRef<HTMLInputElement>(null);
  const searchQueryRef = useRef(searchQuery);
  const locale = language === 'es' ? 'es' : 'en';
  const copy = SEARCH_COPY[locale];
  
  const [localQuery, setLocalQuery] = useState(searchQuery);

  useEffect(() => {
    searchQueryRef.current = searchQuery;
  }, [searchQuery]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
      setLocalQuery(searchQueryRef.current);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(localQuery);
    }, 200);
    return () => clearTimeout(handler);
  }, [localQuery, setSearchQuery]);

  const handleClose = () => {
    trackEvent('search_modal_closed');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-0 z-50 flex flex-col bg-[#0F0D0B] pb-20"
        >
          <div className="sticky top-0 z-10 w-full border-b border-white/5 bg-[#0F0D0B]/80 px-4 pb-4 pt-6 backdrop-blur-md">
            <div className="mx-auto flex w-full max-w-4xl items-center gap-3">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A7A5A]" />
                <input
                  ref={inputRef}
                  type="text"
                  value={localQuery}
                  onChange={(e) => setLocalQuery(e.target.value)}
                  placeholder={copy.placeholder}
                  className="w-full rounded-full border border-white/10 bg-white/5 py-3.5 pl-11 pr-10 font-sans text-[15px] text-white placeholder-[#8A7A5A] transition-colors focus:border-[#C9A96E]/50 focus:outline-none"
                />
                {localQuery && (
                  <button
                    type="button"
                    onClick={() => setLocalQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8A7A5A] hover:text-white"
                    aria-label={language === 'es' ? 'Limpiar búsqueda' : 'Clear search'}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <button type="button" onClick={handleClose} className="p-2 font-sans text-sm text-[#8A7A5A] hover:text-white">
                {copy.cancel}
              </button>
            </div>
          </div>

          <div className="scrollbar-hide mx-auto w-full max-w-4xl flex-1 overflow-y-auto px-4 py-6">
            {!localQuery.trim() ? (
              <div className="flex flex-col gap-8">
                <section>
                  <h3 className="mb-4 font-sans text-xs uppercase tracking-widest text-[#8A7A5A]">{copy.categories}</h3>
                  <div className="flex flex-wrap gap-2">
                    {copy.categoryOptions.map((category) => (
                      <button
                        key={category.label}
                        type="button"
                        onClick={() => {
                          setLocalQuery(category.query);
                          trackEvent('search_category_clicked', { category: category.query });
                        }}
                        className="rounded-full border border-white/10 bg-white/5 px-4 py-2 font-sans text-sm text-[#E8D4A6] transition-colors hover:border-[#C9A96E]/50 hover:bg-[#C9A96E]/20"
                      >
                        {category.label}
                      </button>
                    ))}
                  </div>
                </section>
                
                <section>
                  <h3 className="mb-4 flex items-center gap-2 font-sans text-xs uppercase tracking-widest text-[#8A7A5A]">
                    <History size={14} /> {copy.ideas}
                  </h3>
                  <div className="flex flex-col gap-1">
                    {copy.quickIdeas.map(term => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => {
                          setLocalQuery(term);
                          trackEvent('search_quick_idea_clicked', { term });
                        }}
                        className="w-full border-b border-white/5 py-3 text-left font-sans text-sm text-white transition-colors hover:text-[#C9A96E]"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <h3 className="mb-2 flex items-center gap-2 font-sans text-xs uppercase tracking-widest text-[#8A7A5A]">
                  <Sparkles size={14} /> {copy.resultsFor} &quot;{localQuery}&quot; · {rankedVenues.length}
                </h3>
                {rankedVenues.slice(0, 10).map(venue => (
                  <CompactCard
                    key={venue.id}
                    venue={venue}
                    onSelect={() => {
                      onSelectVenue(venue);
                      handleClose();
                    }}
                  />
                ))}
                {rankedVenues.length === 0 && (
                  <div className="py-12 text-center">
                    <p className="font-sans text-sm text-[#8A7A5A]">{copy.empty}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
