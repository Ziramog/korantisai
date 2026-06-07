"use client";

import { memo } from 'react';
import Image from 'next/image';
import { type ScoredVenue } from '../contexts/CircadianContext';
import { trackEvent } from '@/lib/analytics';

interface CompactCardProps {
  venue: ScoredVenue;
  onSelect: () => void;
}

function CompactCard({ venue, onSelect }: CompactCardProps) {
  return (
    <article 
      onClick={() => {
        trackEvent('venue_card_clicked', { variant: 'compact' });
        onSelect();
      }}
      className="flex flex-col gap-3 w-[140px] shrink-0 cursor-pointer group"
    >
      <div className="relative w-full aspect-[4/5] rounded-xl overflow-hidden bg-white/5 border border-white/5 group-hover:border-[#C9A96E]/30 transition-colors">
        <Image 
          src={venue.heroImage || '/venue_floreria.png'} 
          alt={venue.name} 
          fill 
          sizes="140px"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-50 group-hover:opacity-30 transition-opacity" />
      </div>
      
      <div className="flex flex-col gap-0.5 px-0.5 mt-1">
        <h3 className="text-base font-display font-medium text-[#F5F0E8] truncate">
          {venue.name}
        </h3>
        <p className="text-xs font-sans text-[#8A7A5A] font-light truncate">
          {venue.location}
        </p>
        
        {/* Removed mood tags as requested for cleaner UI at this size */}
      </div>
    </article>
  );
}

export default memo(CompactCard);
