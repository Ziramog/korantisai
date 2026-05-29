"use client";

import { useEffect, useState } from 'react';
import { Search, Bookmark, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface GlobalNavProps {
  activeTab: 'search' | 'saved' | 'profile';
  setActiveTab: (tab: 'search' | 'saved' | 'profile') => void;
  selectedVenue: any; // Hide nav when venue is expanded
}

export default function GlobalNav({ activeTab, setActiveTab, selectedVenue }: GlobalNavProps) {
  const [isVisible, setIsVisible] = useState(true);

  // Velocity-aware scrolling hide/show behavior
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let lastScrollY = window.scrollY;
    let lastTime = performance.now();
    let hideTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const currentTime = performance.now();

      const deltaY = Math.abs(currentScrollY - lastScrollY);
      const deltaTime = Math.max(1, currentTime - lastTime);
      const velocity = deltaY / deltaTime; // pixels per ms

      // Hide on rapid scroll velocity
      if (velocity > 1.2) {
        setIsVisible(false);
      }

      clearTimeout(hideTimeout);
      hideTimeout = setTimeout(() => {
        setIsVisible(true);
      }, 400);

      lastScrollY = currentScrollY;
      lastTime = currentTime;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(hideTimeout);
    };
  }, []);

  // Hide nav when in detailed venue view, matching the immersive layout
  if (selectedVenue) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ y: 80, x: '-50%', opacity: 0 }}
          animate={{ y: 0, x: '-50%', opacity: 1 }}
          exit={{ y: 80, x: '-50%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-auto"
        >
          <nav className="flex items-center gap-10 px-8 py-3.5 rounded-full bg-[#0F0D0B]/85 backdrop-blur-xl border border-white/5 shadow-[0_16px_40px_rgba(0,0,0,0.6)]">
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
              <span className="text-[9px] font-sans tracking-widest uppercase font-semibold">Explore</span>
              {activeTab === 'search' && (
                <motion.div 
                  layoutId="active-indicator"
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
              <span className="text-[9px] font-sans tracking-widest uppercase font-semibold">Atlas</span>
              {activeTab === 'saved' && (
                <motion.div 
                  layoutId="active-indicator"
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
              <span className="text-[9px] font-sans tracking-widest uppercase font-semibold">Taste</span>
              {activeTab === 'profile' && (
                <motion.div 
                  layoutId="active-indicator"
                  className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-k-gold"
                />
              )}
            </button>
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
