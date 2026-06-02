"use client";

import { useEffect, useRef, useState } from 'react';
import { useCircadian } from '../contexts/CircadianContext';
import { Search, Sparkles } from 'lucide-react';
import { t } from '../utils/i18n';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { trackEvent } from '@/lib/analytics';

export default function SearchBar() {
  const { searchQuery, setSearchQuery, language } = useCircadian();
  const { scrollY } = useScroll();
  
  const [searchState, setSearchState] = useState<'expanded' | 'compressed' | 'hidden'>('expanded');
  const lastTrackedQuery = useRef('');

  useEffect(() => {
    const cleaned = searchQuery.trim().toLowerCase();
    const timeout = window.setTimeout(() => {
      if (cleaned === lastTrackedQuery.current) return;
      lastTrackedQuery.current = cleaned;
      trackEvent('search_query_changed', {
        query_length: cleaned.length,
        has_query: cleaned.length > 0,
        has_work_intent: /\b(work|laptop|study|read|focus)\b/.test(cleaned),
        has_coffee_intent: /\b(coffee|cafe|espresso)\b/.test(cleaned),
        has_night_intent: /\b(night|bar|cocktail|wine|dinner|date)\b/.test(cleaned),
      });
    }, 900);

    return () => window.clearTimeout(timeout);
  }, [searchQuery]);

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
    { value: 'quiet', label: t('pillQuiet', language) },
    { value: 'warm', label: t('pillWarm', language) },
    { value: 'natural light', label: t('pillNaturalLight', language) },
    { value: 'hidden gem', label: t('pillHiddenGem', language) },
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
                onFocus={() => trackEvent('search_focused', { state: searchState })}
                placeholder={t('searchPlaceholder', language)}
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
                {t('searchExplanation', language, {
                  intent: t('searchIntent', language),
                  lighting: t('searchLighting', language),
                })}
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
                const isSelected = searchQuery.toLowerCase().includes(pill.value);
                
                return (
                  <button 
                    key={pill.value}
                    onClick={() => {
                      trackEvent(isSelected ? 'search_pill_removed' : 'search_pill_added', {
                        pill: pill.value,
                        query_length: searchQuery.trim().length,
                      });
                      if (isSelected) {
                        setSearchQuery(searchQuery.replace(new RegExp(pill.value, 'ig'), '').trim());
                      } else {
                        setSearchQuery((searchQuery + ' ' + pill.value).trim());
                      }
                    }}
                    className={`shrink-0 px-[18px] py-[10px] rounded-full font-sans text-[11px] font-medium tracking-[0.06em] uppercase transition-all duration-400 cursor-pointer select-none ${isSelected ? 'k-pill-active' : 'k-pill-inactive'}`}
                  >
                    {pill.label}
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
            onClick={() => {
              trackEvent('search_compressed_clicked', {
                has_query: searchQuery.trim().length > 0,
              });
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <Search size={14} className="text-[#5B4E3E] ml-1" />
            <span className="text-[13px] font-sans text-[#8A7A5A] truncate">
              {searchQuery || t('searchPlaceholder', language)}
            </span>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
