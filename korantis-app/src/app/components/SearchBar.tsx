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
    language
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
    <div className="w-full max-w-xl mx-auto mb-6 pt-10 md:pt-20 px-6 flex flex-col items-center relative z-20">
      <h1 className="text-k-text font-display text-3xl md:text-5xl mb-5 tracking-wide text-center drop-shadow-md leading-tight">
        {t('searchTitle', language)}
      </h1>
      
      {/* Search Input Bar */}
      <div className="relative w-full">
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('searchPlaceholder', language)}
          className="w-full bg-k-surface-elevated/40 backdrop-blur-md border border-k-border-light rounded-full py-4 pl-6 pr-14 text-k-text placeholder:text-k-text-tertiary focus:outline-none focus:border-k-gold-muted focus:ring-1 focus:ring-k-gold-muted/20 transition-all font-sans text-xs md:text-sm shadow-xl"
        />
        <div className="absolute right-5 top-1/2 -translate-y-1/2 text-k-gold-muted hover:text-k-gold transition-colors cursor-pointer">
          <Search size={18} />
        </div>
      </div>
      
      {/* Responsive Filter Row: Swipeable scroll rail on Mobile, wrapped flex row on Desktop */}
      <div 
        className="flex items-center gap-2.5 overflow-x-auto w-[calc(100%+3rem)] -mx-6 px-6 md:w-full md:mx-0 md:px-0 md:justify-center md:flex-wrap pb-2.5 mt-5 scroll-smooth snap-x snap-mandatory mask-image-scroll"
        style={{ 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {PILLS.map(({ key, label }) => {
          const isActive = selectedPills.includes(key);
          return (
            <button
              key={key}
              onClick={() => togglePill(key)}
              className={`px-4 py-1.5 rounded-full border text-[11px] font-sans tracking-wide transition-all duration-300 cursor-pointer snap-start flex-shrink-0 ${
                isActive 
                  ? 'border-k-gold bg-k-gold-dim text-k-gold shadow-[0_0_12px_rgba(201,169,110,0.15)]' 
                  : 'border-k-border bg-k-surface/30 text-k-text-secondary hover:border-k-border-light hover:text-k-text'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* AI Sparkle Ambient Explanation Badge */}
      {activeIntentVector && (
        <div className="mt-5 py-3 px-5 rounded-xl border border-k-frost-border bg-k-frost/50 backdrop-blur-lg flex items-center gap-3 w-full max-w-lg animate-fade-in shadow-lg">
          <Sparkles className="text-k-gold animate-pulse flex-shrink-0" size={14} />
          <p className="text-[11px] text-k-text-secondary font-sans leading-relaxed">
            {t('intentExplanation', language)}
          </p>
        </div>
      )}
    </div>
  );
}
