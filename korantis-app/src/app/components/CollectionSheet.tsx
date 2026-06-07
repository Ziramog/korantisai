"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, FolderHeart } from 'lucide-react';
import { ScoredVenue } from '../contexts/CircadianContext';
import { trackEvent } from '@/lib/analytics';
import Image from 'next/image';

interface CollectionSheetProps {
  isOpen: boolean;
  venue: ScoredVenue | null;
  onClose: () => void;
}

const DUMMY_LISTS = [
  { id: '1', name: 'Cafés de Domingo', count: 12 },
  { id: '2', name: 'Citas', count: 4 },
  { id: '3', name: 'Para trabajar', count: 8 },
];

export default function CollectionSheet({ isOpen, venue, onClose }: CollectionSheetProps) {
  const handleClose = () => {
    trackEvent('collection_sheet_closed');
    onClose();
  };

  const handleAddToList = (listName: string) => {
    trackEvent('venue_added_to_list', { venue_id: venue?.id, list_name: listName });
    // TODO: implement actual saving to lists in backend
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && venue && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-[60] bg-[#1A1A1A] rounded-t-3xl border-t border-white/10 flex flex-col max-h-[85vh] mx-auto max-w-2xl"
          >
            {/* Handle */}
            <div className="w-full flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-white/20 rounded-full" />
            </div>

            <div className="px-6 py-4 flex items-center justify-between border-b border-white/5">
              <h3 className="text-lg font-display text-white">Guardar en lista</h3>
              <button onClick={handleClose} className="p-2 text-white/40 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto px-6 py-6 scrollbar-hide flex-1">
              <div className="flex items-center gap-4 mb-8">
                {venue.images && venue.images.length > 0 && (
                  <div className="w-16 h-16 rounded-lg overflow-hidden relative flex-shrink-0">
                    <Image src={typeof venue.images[0] === 'string' ? venue.images[0] : venue.images[0]?.src || ''} alt={venue.name} fill className="object-cover" />
                  </div>
                )}
                <div>
                  <h4 className="text-white font-sans font-medium">{venue.name}</h4>
                  <p className="text-[#8A7A5A] text-sm font-sans">{venue.location}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => handleAddToList('Nueva Lista')}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-[#C9A96E]/30 hover:bg-[#C9A96E]/5 transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#C9A96E]/10 flex items-center justify-center group-hover:bg-[#C9A96E]/20 transition-colors">
                    <Plus size={20} className="text-[#C9A96E]" />
                  </div>
                  <span className="text-[#C9A96E] font-sans font-medium">Nueva lista</span>
                </button>

                {DUMMY_LISTS.map(list => (
                  <button 
                    key={list.id}
                    onClick={() => handleAddToList(list.name)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/20 hover:bg-white/10 transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center">
                      <FolderHeart size={18} className="text-[#8A7A5A]" />
                    </div>
                    <div className="flex flex-col flex-1">
                      <span className="text-white font-sans font-medium">{list.name}</span>
                      <span className="text-[#8A7A5A] text-xs font-sans">{list.count} lugares</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
