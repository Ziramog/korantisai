"use client";

import { useState } from 'react';
import { useCircadian } from '../contexts/CircadianContext';
import { Search, Circle, Sparkles } from 'lucide-react';
import { t } from '../utils/i18n';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';

export default function SearchBar() {
  const { searchQuery, setSearchQuery, language } = useCircadian();
  const { scrollY } = useScroll();
  
  const [searchState, setSearchState] = useState<'expanded' | 'compressed' | 'hidden'>('expanded');

  useMotionValueEvent(scrollY, "change", (latest) => {
    const velocity = scrollY.getVelocity();

    if (latest < 60) {
      setSearchState('expanded');
    } else {
      if (velocity > 30) {
        setSearchState('hidden');
      } else if (velocity < -30) {
        setSearchState('compressed');
      }
    }
  });

  const PILLS = [
    t('pillQuiet', language),
    t('pillWarm', language),
    t('pillNaturalLight', language),
    t('pillHiddenGem', language)
  ];

  return (
    <div className="fixed top-28 left-0 right-0 z-40 flex flex-col items-center pointer-events-none px-6">
      <motion.div
        className="relative pointer-events-auto w-full max-w-xl mx-auto"
        initial="expanded"
        animate={searchState}
        variants={{
          expanded: { 
            y: 0, 
            opacity: 1,
            scale: 1 
          },
          compressed: { 
            y: -20, 
            opacity: 1,
            scale: 0.95 
          },
          hidden: { 
            y: -100, 
            opacity: 0,
            scale: 0.9 
          }
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        {searchState === 'expanded' ? (
          <motion.div 
            key="expanded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col w-full"
          >
            {/* Dark Solid Input */}
            <div className="relative w-full">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-[#100D0B] bg-[#000000] rounded-full flex items-center justify-center h-2 w-2 shadow-[0_0_8px_rgba(0,0,0,0.8)] border border-[#C9A96E] opacity-50">
              </div>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="quiet café to work tonight..."
                className="w-full rounded-[2rem] py-4 pl-12 pr-6 text-[#8A7A5A] placeholder:text-[#5B4E3E] focus:outline-none font-sans text-[15px] shadow-2xl pointer-events-auto transition-colors"
                style={{ 
                  background: 'rgba(15, 13, 11, 0.75)',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  border: '1px solid rgba(201, 169, 110, 0.45)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.8), inset 0 0 20px rgba(0,0,0,0.3)'
                }}
              />
            </div>
            
            {/* Explanation text */}
            <div className="mt-5 mb-6 px-2 flex items-start gap-2">
              <Sparkles size={14} className="text-[#C9A96E] mt-1 shrink-0 opacity-80" />
              <p className="text-[13px] leading-relaxed text-[#B0A898] font-display italic">
                Showing <span className="font-sans font-medium text-[#F5F0E8] not-italic">calm, work-friendly</span> spaces with <span className="font-sans font-medium text-[#F5F0E8] not-italic">warm lighting</span> open now in Palermo.
              </p>
            </div>

            {/* Pills */}
            <div 
              className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide px-2"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
            >
              <style>{`
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .k-pill-inactive {
                  background: rgba(255, 255, 255, 0.02);
                  border: 1px solid rgba(255, 255, 255, 0.04);
                  color: rgba(176, 168, 152, 0.7);
                }
                .k-pill-inactive:hover {
                  background: rgba(201, 169, 110, 0.06);
                  border-color: rgba(201, 169, 110, 0.15);
                  color: #E8D4A6;
                  transform: translateY(-1px);
                }
                .k-pill-active {
                  background: rgba(201, 169, 110, 0.12);
                  border: 1px solid rgba(201, 169, 110, 0.25);
                  color: #C9A96E;
                }
              `}</style>
              {PILLS.map((pill) => {
                // Determine if this pill's keyword is in the search query
                const isSelected = searchQuery.toLowerCase().includes(pill.toLowerCase());
                
                return (
                  <button 
                    key={pill}
                    onClick={() => {
                      if (isSelected) {
                        setSearchQuery(searchQuery.replace(new RegExp(pill, 'ig'), '').trim());
                      } else {
                        setSearchQuery((searchQuery + ' ' + pill).trim());
                      }
                    }}
                    className={`shrink-0 px-[18px] py-[10px] rounded-full font-sans text-[11px] font-medium tracking-[0.06em] uppercase transition-all duration-400 cursor-pointer select-none ${isSelected ? 'k-pill-active' : 'k-pill-inactive'}`}
                  >
                    {pill}
                  </button>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="compressed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mx-auto w-[260px] rounded-full py-2.5 px-4 flex items-center gap-3 shadow-2xl cursor-pointer pointer-events-auto transition-colors"
            style={{ 
              background: 'rgba(15, 13, 11, 0.75)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(201, 169, 110, 0.45)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.8)'
            }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <Search size={14} className="text-[#5B4E3E] ml-1" />
            <span className="text-[13px] font-sans text-[#8A7A5A] truncate">
              {searchQuery || "quiet café to work tonight..."}
            </span>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
