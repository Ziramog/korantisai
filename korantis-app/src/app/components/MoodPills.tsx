"use client";

import { memo } from 'react';
import { useCircadian } from '../contexts/CircadianContext';
import { trackEvent } from '@/lib/analytics';

const MOODS = [
  { value: 'calm', label: 'Calmo' },
  { value: 'intimate', label: 'Íntimo' },
  { value: 'social', label: 'Social' },
  { value: 'energetic', label: 'Energético' },
  { value: 'hidden', label: 'Refugio' },
  { value: 'work-friendly', label: 'Productivo' },
];

function MoodPills() {
  // In Sprint 2, we will connect this to actual filtering state.
  // For now we just render the UI.
  const { selectedPills = [], togglePill, clearPills } = useCircadian();

  return (
    <div className="w-full max-w-4xl mx-auto px-4 mb-6">
      <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide">
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
              className={`shrink-0 px-5 py-2.5 rounded-full font-sans text-xs font-medium tracking-wide transition-all ${isActive ? 'is-active' : 'k-mood-pill'}`}
            >
              {mood.label}
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
            className="shrink-0 px-5 py-2.5 rounded-full font-sans text-xs font-medium tracking-wide transition-all k-mood-pill ml-2"
          >
            Todos
          </button>
        )}
      </div>
    </div>
  );
}

export default memo(MoodPills);
