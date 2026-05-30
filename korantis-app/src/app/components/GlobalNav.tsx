"use client";

import { useEffect, useState } from 'react';
import { Search, Bookmark, User } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { useCircadian } from '../contexts/CircadianContext';

import { t } from '../utils/i18n';

interface GlobalNavProps {
  activeTab: 'search' | 'saved' | 'profile';
  setActiveTab: (tab: 'search' | 'saved' | 'profile') => void;
  selectedVenue: any; // Hide nav when venue is expanded
}

export default function GlobalNav({ activeTab, setActiveTab, selectedVenue }: GlobalNavProps) {
  const { language } = useCircadian();
  if (selectedVenue) return null;

  return (
    <AnimatePresence>
      <div className="fixed bottom-6 sm:bottom-8 left-0 right-0 z-50 flex justify-center px-4">
        <motion.nav 
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="flex items-center gap-8 sm:gap-12 px-6 sm:px-8 py-3 rounded-full bg-[#0F0D0B]/90 backdrop-blur-xl border border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.7)] w-full max-w-[280px] sm:max-w-none sm:w-auto justify-around sm:justify-center"
          >
            {/* Search / Explore Tab */}
            <button 
              onClick={() => setActiveTab('search')}
              className={`flex flex-col items-center gap-1.5 transition-all duration-300 relative cursor-pointer ${
                activeTab === 'search' 
                  ? 'text-k-gold opacity-100 scale-105' 
                  : 'text-k-text-secondary opacity-50 hover:opacity-80'
              }`}
            >
              <Search size={18} strokeWidth={activeTab === 'search' ? 2.5 : 1.8} />
              <span className="text-[9px] font-sans tracking-widest uppercase font-semibold">{t('explore', language)}</span>
              {activeTab === 'search' && (
                <motion.div 
                  className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-k-gold"
                />
              )}
            </button>
            
            {/* Saved Atlas Tab */}
            <button 
              onClick={() => setActiveTab('saved')}
              className={`flex flex-col items-center gap-1.5 transition-all duration-300 relative cursor-pointer ${
                activeTab === 'saved' 
                  ? 'text-k-gold opacity-100 scale-105' 
                  : 'text-k-text-secondary opacity-50 hover:opacity-80'
              }`}
            >
              <Bookmark size={18} strokeWidth={activeTab === 'saved' ? 2.5 : 1.8} />
              <span className="text-[9px] font-sans tracking-widest uppercase font-semibold">{t('atlas', language)}</span>
              {activeTab === 'saved' && (
                <motion.div 
                  className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-k-gold"
                />
              )}
            </button>
            
            {/* Profile & Taste Tab */}
            <button 
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center gap-1.5 transition-all duration-300 relative cursor-pointer ${
                activeTab === 'profile' 
                  ? 'text-k-gold opacity-100 scale-105' 
                  : 'text-k-text-secondary opacity-50 hover:opacity-80'
              }`}
            >
              <User size={18} strokeWidth={activeTab === 'profile' ? 2.5 : 1.8} />
              <span className="text-[9px] font-sans tracking-widest uppercase font-semibold">{t('taste', language)}</span>
              {activeTab === 'profile' && (
                <motion.div 
                  className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-k-gold"
                />
              )}
            </button>
          </motion.nav>
        </div>
    </AnimatePresence>
  );
}
