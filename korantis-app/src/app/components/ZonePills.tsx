"use client";

import { memo } from 'react';
import { useCircadian } from '../contexts/CircadianContext';
import { trackEvent } from '@/lib/analytics';

const ZONES = [
  { value: 'palermo', label: 'Palermo' },
  { value: 'chacarita', label: 'Chacarita' },
  { value: 'villa crespo', label: 'Villa Crespo' },
  { value: 'recoleta', label: 'Recoleta' },
  { value: 'belgrano', label: 'Belgrano' },
  { value: 'microcentro', label: 'Microcentro' },
];

function ZonePills() {
  const { selectedPills = [], togglePill, clearPills } = useCircadian();

  return (
    <div className="w-full max-w-4xl mx-auto px-4 mb-12">
      <h2 className="text-[11px] font-sans font-medium uppercase tracking-[0.2em] text-[#8A7A5A] mb-4 pl-2">
        Explorá por barrio
      </h2>
      <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide">
        <style>{`
          .scrollbar-hide::-webkit-scrollbar { display: none; }
          .k-zone-pill {
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.05);
            color: rgba(176, 168, 152, 0.8);
          }
          .k-zone-pill:hover {
            background: rgba(201, 169, 110, 0.08);
            border-color: rgba(201, 169, 110, 0.2);
            color: #E8D4A6;
          }
          .k-zone-pill.is-active {
            background: rgba(201, 169, 110, 0.15);
            border-color: rgba(201, 169, 110, 0.3);
            color: #C9A96E;
          }
        `}</style>
        
        {ZONES.map((zone) => {
          const isActive = selectedPills.includes(zone.value);
          return (
            <button
              key={zone.value}
              type="button"
              onClick={() => {
                togglePill(zone.value);
                trackEvent('zone_pill_toggled', { zone: zone.value });
              }}
              className={`shrink-0 px-5 py-2.5 rounded-full font-sans text-xs font-medium tracking-wide transition-all ${isActive ? 'is-active' : 'k-zone-pill'}`}
            >
              {zone.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default memo(ZonePills);
