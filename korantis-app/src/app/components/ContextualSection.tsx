"use client";

import { memo, useMemo } from 'react';
import { useCircadian, type ScoredVenue } from '../contexts/CircadianContext';
import ThematicCarousel from './ThematicCarousel';

interface ContextualSectionProps {
  onSelectVenue: (venue: ScoredVenue) => void;
}

function ContextualSection({ onSelectVenue }: ContextualSectionProps) {
  const { currentPhase, rankedVenues } = useCircadian();

  const { title, filteredVenues } = useMemo(() => {
    let t = "Para esta noche";
    let targetAtmospheres = ['night', 'late-night'];

    if (currentPhase === 'morning' || currentPhase === 'dawn') {
      t = "Tu mañana";
      targetAtmospheres = ['morning'];
    } else if (currentPhase === 'afternoon' || currentPhase === 'golden-hour') {
      t = "Tu tarde";
      targetAtmospheres = ['afternoon', 'golden-hour'];
    }

    const venues = rankedVenues.filter(v => targetAtmospheres.includes(v.atmosphere)).slice(0, 5);
    return { title: t, filteredVenues: venues };
  }, [currentPhase, rankedVenues]);

  if (filteredVenues.length === 0) return null;

  return (
    <ThematicCarousel 
      title={title} 
      venues={filteredVenues} 
      onSelectVenue={onSelectVenue} 
    />
  );
}

export default memo(ContextualSection);
