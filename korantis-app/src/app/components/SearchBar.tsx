"use client";

import { useCircadian } from '../contexts/CircadianContext';
import { Sparkles, Search } from 'lucide-react';
import { t } from '../utils/i18n';

export default function SearchBar() {
  const { 
    searchQuery, 
    setSearchQuery, 
    selectedPills, 
    togglePill, 
    activeIntentVector,
    language,
    setLanguage,
    city,
    setCity
  } = useCircadian();

  const PILLS = [
    { key: 'Quiet', label: t('pillQuiet', language) },
    { key: 'Warm', label: t('pillWarm', language) },
    { key: 'Natural Light', label: t('pillNaturalLight', language) },
    { key: 'Hidden Gem', label: t('pillHiddenGem', language) },
    { key: 'Creative', label: t('pillCreative', language) },
    { key: 'Slow Mornings', label: t('pillSlowMornings', language) },
    { key: 'Late Night', label: t('pillLateNight', language) }
  ];

  return (
    <div className="w-full max-w-xl mx-auto mb-6 pt-12 md:pt-24 flex flex-col items-center relative z-20">
      <h1 className="text-k-text font-display text-4xl md:text-5xl mb-12 tracking-wide text-center drop-shadow-md leading-tight">
        {t('searchTitle', language)}
      </h1>
      
      {/* Search Input Bar (Matches Branding) */}
      <div className="relative w-full max-w-lg">
        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-k-text-tertiary">
          <Search size={18} />
        </div>
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('searchPlaceholder', language)}
          className="w-full bg-[#0F0D0B]/70 backdrop-blur-md border border-white/10 rounded-full py-4 pl-12 pr-14 text-k-text placeholder:text-k-text-tertiary focus:outline-none focus:border-k-gold/40 focus:ring-1 focus:ring-k-gold/20 transition-all font-sans text-sm md:text-base shadow-2xl"
        />
        <button className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-k-gold hover:bg-k-gold-light text-k-black flex items-center justify-center transition-colors cursor-pointer shadow-md">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
        </button>
      </div>
      
      {/* Tags and Location Row */}
      <div className="w-full max-w-lg mt-6 flex flex-col gap-4">
        <div className="flex items-center gap-3 w-full">
          <span className="text-[10px] text-k-text-secondary font-sans mr-2 flex-shrink-0">Popular searches:</span>
          <div 
            className="flex items-center gap-2 overflow-x-auto scroll-smooth snap-x snap-mandatory mask-image-scroll flex-1 pb-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {PILLS.map(({ key, label }) => {
              const isActive = selectedPills.includes(key);
              return (
                <button
                  key={key}
                  onClick={() => togglePill(key)}
                  className={`px-3 py-1.5 rounded-full border text-[10px] font-sans transition-all duration-300 cursor-pointer snap-start flex-shrink-0 ${
                    isActive 
                      ? 'border-k-gold bg-k-gold-dim text-k-gold shadow-[0_0_10px_rgba(201,169,110,0.15)]' 
                      : 'border-white/5 bg-white/5 text-k-text-tertiary hover:border-white/20 hover:text-k-text-secondary'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Location & Lang Selectors Right Aligned */}
        <div className="flex justify-between items-center w-full mt-2">
          {/* Subtle Lang Switch */}
          <div className="flex gap-2 items-center">
             <button
              onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
              className="text-[10px] font-sans tracking-widest text-k-text-tertiary hover:text-k-gold transition-colors uppercase flex items-center gap-1"
            >
              {language === 'en' ? 'ESP' : 'ENG'}
            </button>
          </div>
          
          {/* Subtle City Switch (Matches Branding) */}
          <button 
            onClick={() => setCity(city === 'BUE' ? 'NYC' : 'BUE')}
            className="flex items-center gap-2 text-k-text-secondary hover:text-k-gold transition-colors cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            <span className="text-[11px] font-sans">{city === 'BUE' ? 'Buenos Aires' : 'New York'}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </button>
        </div>
      </div>

      {/* AI Sparkle Ambient Explanation Badge */}
      {activeIntentVector && (
        <div className="mt-8 py-3 px-5 rounded-xl border border-k-gold/20 bg-k-surface-elevated/40 backdrop-blur-lg flex items-center gap-3 w-full max-w-lg animate-fade-in shadow-lg">
          <Sparkles className="text-k-gold animate-pulse flex-shrink-0" size={14} />
          <p className="text-[11px] text-k-text-secondary font-sans leading-relaxed">
            {t('intentExplanation', language)}
          </p>
        </div>
      )}
    </div>
  );
}
