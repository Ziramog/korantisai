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

const CATEGORIES = ['Café de Especialidad', 'Vino Natural', 'Cocktails', 'Cita', 'Para Leer', 'Restaurante'];

export default function SearchModal({ isOpen, onClose, onSelectVenue }: SearchModalProps) {
  const { searchQuery, setSearchQuery, rankedVenues } = useCircadian();
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Local state for instant input feeling, syncs with context with a slight debounce
  const [localQuery, setLocalQuery] = useState(searchQuery);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
      setLocalQuery(searchQuery);
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
    }, 300);
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
          {/* Header & Input */}
          <div className="w-full px-4 pt-6 pb-4 border-b border-white/5 bg-[#0F0D0B]/80 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-3 w-full max-w-4xl mx-auto">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A7A5A]" />
                <input
                  ref={inputRef}
                  type="text"
                  value={localQuery}
                  onChange={(e) => setLocalQuery(e.target.value)}
                  placeholder="Buscar lugar, mood, barrio..."
                  className="w-full bg-white/5 border border-white/10 rounded-full py-3.5 pl-11 pr-10 text-[15px] font-sans text-white placeholder-[#8A7A5A] focus:outline-none focus:border-[#C9A96E]/50 transition-colors"
                />
                {localQuery && (
                  <button
                    onClick={() => setLocalQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8A7A5A] hover:text-white"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <button onClick={handleClose} className="p-2 text-[#8A7A5A] hover:text-white font-sans text-sm">
                Cancelar
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 py-6 w-full max-w-4xl mx-auto scrollbar-hide">
            {!localQuery ? (
              <div className="flex flex-col gap-8">
                {/* Categories */}
                <section>
                  <h3 className="text-xs font-sans uppercase tracking-widest text-[#8A7A5A] mb-4">Categorías</h3>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        onClick={() => {
                          setLocalQuery(cat);
                          trackEvent('search_category_clicked', { category: cat });
                        }}
                        className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-sm font-sans text-[#E8D4A6] hover:bg-[#C9A96E]/20 hover:border-[#C9A96E]/50 transition-colors"
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </section>
                
                {/* Recent or Suggestions */}
                <section>
                  <h3 className="text-xs font-sans uppercase tracking-widest text-[#8A7A5A] mb-4 flex items-center gap-2">
                    <History size={14} /> Búsquedas recientes
                  </h3>
                  <div className="flex flex-col gap-1">
                    {['Chacarita', 'Patio', 'Vino'].map(term => (
                      <button
                        key={term}
                        onClick={() => {
                          setLocalQuery(term);
                          trackEvent('search_recent_clicked', { term });
                        }}
                        className="w-full text-left py-3 border-b border-white/5 text-sm font-sans text-white hover:text-[#C9A96E] transition-colors"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <h3 className="text-xs font-sans uppercase tracking-widest text-[#8A7A5A] mb-2 flex items-center gap-2">
                  <Sparkles size={14} /> Resultados para &quot;{localQuery}&quot;
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
                  <div className="text-center py-12">
                    <p className="text-[#8A7A5A] font-sans text-sm">No encontramos lugares que coincidan.</p>
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
