"use client";

import { memo } from 'react';
import { type ScoredVenue } from '../contexts/CircadianContext';
import CompactCard from './CompactCard';

interface ThematicCarouselProps {
  title: string;
  venues: ScoredVenue[];
  onSelectVenue: (venue: ScoredVenue) => void;
}

function ThematicCarousel({ title, venues, onSelectVenue }: ThematicCarouselProps) {
  if (!venues || venues.length === 0) return null;

  return (
    <section className="w-full max-w-4xl mx-auto mb-12">
      <div className="px-6 mb-4 flex items-center justify-between">
        <h2 className="font-display text-xl text-[#C9A96E]/90 tracking-wide italic">
          {title}
        </h2>
      </div>
      
      <div className="flex gap-4 overflow-x-auto pb-4 px-6 snap-x snap-mandatory scrollbar-hide"
           style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {venues.map(venue => (
          <div key={venue.id} className="snap-start">
            <CompactCard venue={venue} onSelect={() => onSelectVenue(venue)} />
          </div>
        ))}
      </div>
    </section>
  );
}

export default memo(ThematicCarousel);
