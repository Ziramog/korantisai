"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, X } from 'lucide-react';
import { useEffect } from 'react';

interface SaveToastProps {
  show: boolean;
  onAddToList: () => void;
  onClose: () => void;
}

export default function SaveToast({ show, onAddToList, onClose }: SaveToastProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className="fixed bottom-24 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none"
        >
          <div className="bg-[#1A1A1A] border border-white/10 shadow-2xl rounded-2xl p-4 flex items-center justify-between gap-4 w-full max-w-sm pointer-events-auto">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#C9A96E]/20 flex items-center justify-center">
                <Bookmark size={14} className="text-[#C9A96E] fill-[#C9A96E]" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-sans text-white font-medium">Guardado en Todos</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  onAddToList();
                  onClose();
                }}
                className="text-[#C9A96E] text-xs font-sans font-medium uppercase tracking-wider hover:text-white transition-colors"
              >
                Añadir a lista
              </button>
              <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
