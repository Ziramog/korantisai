"use client";

import { motion } from 'framer-motion';
import { Heart, FolderHeart, ArrowRight } from 'lucide-react';
import { useCircadian, ScoredVenue } from '../contexts/CircadianContext';
import CompactCard from './CompactCard';
import EmptyState from './EmptyState';

interface GuardadosTabProps {
  onVenueClick: (venue: ScoredVenue) => void;
  onExploreClick: () => void;
}

export default function GuardadosTab({ onVenueClick, onExploreClick }: GuardadosTabProps) {
  const { savedVenueIds, rankedVenues } = useCircadian();

  const savedVenues = rankedVenues.filter(v => savedVenueIds.includes(v.id));

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pt-6 pb-24 min-h-[60vh]">
      <h2 className="text-2xl font-display text-[#F5F0E8] mb-8 px-2">Guardados</h2>

      {savedVenues.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Aún no tienes lugares guardados"
          description="Guarda los lugares que te gustan para tenerlos siempre a mano y organizarlos en listas."
          actionLabel="Explorar lugares"
          onAction={onExploreClick}
          actionIcon={<ArrowRight size={16} />}
        />
      ) : (
        <div className="flex flex-col gap-8">
          <section>
            <h3 className="text-xs font-sans uppercase tracking-widest text-[#8A7A5A] mb-4 px-2">Tus listas</h3>
            <div className="flex flex-col gap-2">
              <button className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/20 transition-all text-left">
                <div className="w-12 h-12 rounded-xl bg-[#C9A96E]/20 flex items-center justify-center">
                  <Heart size={20} className="text-[#C9A96E] fill-[#C9A96E]" />
                </div>
                <div className="flex flex-col flex-1">
                  <span className="text-white font-sans font-medium text-base">Todos los guardados</span>
                  <span className="text-[#8A7A5A] text-sm font-sans">{savedVenues.length} lugares</span>
                </div>
              </button>
              
              <button className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/20 transition-all text-left opacity-50 cursor-not-allowed">
                <div className="w-12 h-12 rounded-xl bg-black/50 flex items-center justify-center">
                  <FolderHeart size={20} className="text-[#8A7A5A]" />
                </div>
                <div className="flex flex-col flex-1">
                  <span className="text-white font-sans font-medium text-base">Cafés de Domingo</span>
                  <span className="text-[#8A7A5A] text-sm font-sans">Próximamente</span>
                </div>
              </button>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-sans uppercase tracking-widest text-[#8A7A5A] mb-4 px-2">Agregados recientemente</h3>
            <div className="flex flex-col gap-3">
              {savedVenues.map(venue => (
                <CompactCard 
                  key={venue.id} 
                  venue={venue} 
                  onSelect={() => onVenueClick(venue)} 
                />
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
