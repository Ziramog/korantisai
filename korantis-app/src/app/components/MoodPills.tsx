"use client";

import { memo } from 'react';
import { useCircadian } from '../contexts/CircadianContext';
import { trackEvent } from '@/lib/analytics';

const MOODS = [
  { value: 'calm', label: { es: 'Calmo', en: 'Calm' } },
  { value: 'intimate', label: { es: 'Íntimo', en: 'Intimate' } },
  { value: 'social', label: { es: 'Social', en: 'Social' } },
  { value: 'energetic', label: { es: 'Energético', en: 'Energetic' } },
  { value: 'hidden', label: { es: 'Refugio', en: 'Hidden' } },
  { value: 'work-friendly', label: { es: 'Productivo', en: 'Productive' } },
];

function MoodPills() {
  const { selectedPills = [], togglePill, clearPills, language } = useCircadian();
  const locale = language === 'es' ? 'es' : 'en';

  return (
    <div className="mx-auto mb-6 w-full max-w-4xl px-4">
      <div className="scrollbar-hide flex items-center gap-3 overflow-x-auto pb-4">
        <style>{`
          .scrollbar-hide::-webkit-scrollbar { display: none; }
          .k-mood-pill {
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.05);
            color: rgba(176, 168, 152, 0.8);
          }
          .k-mood-pill:hover {
            background: rgba(201, 169, 110, 0.08);
            border-color: rgba(201, 169, 110, 0.2);
            color: #E8D4A6;
          }
          .k-mood-pill.is-active {
            background: rgba(201, 169, 110, 0.15);
            border-color: rgba(201, 169, 110, 0.3);
            color: #C9A96E;
          }
        `}</style>
        
        {MOODS.map((mood) => {
          const isActive = selectedPills.includes(mood.value);
          return (
            <button
              key={mood.value}
              type="button"
              onClick={() => {
                togglePill(mood.value);
                trackEvent('mood_pill_toggled', { mood: mood.value });
              }}
              className={`shrink-0 rounded-full px-5 py-2.5 font-sans text-xs font-medium tracking-wide transition-all ${isActive ? 'is-active' : 'k-mood-pill'}`}
            >
              {mood.label[locale]}
            </button>
          );
        })}
        {selectedPills.length > 0 && (
          <button
            type="button"
            onClick={() => {
              clearPills();
              trackEvent('mood_pills_cleared');
            }}
            className="k-mood-pill ml-2 shrink-0 rounded-full px-5 py-2.5 font-sans text-xs font-medium tracking-wide transition-all"
          >
            {language === 'es' ? 'Todos' : 'All'}
          </button>
        )}
      </div>
    </div>
  );
}

export default memo(MoodPills);
