import Image from 'next/image';
import { Compass } from 'lucide-react';
import type { ScoredVenue } from '../../contexts/CircadianContext';
import { useCircadian } from '../../contexts/CircadianContext';

interface AtlasVenuePreviewProps {
  venue: ScoredVenue;
  onOpenDetail: () => void;
}

export default function AtlasVenuePreview({ venue, onOpenDetail }: AtlasVenuePreviewProps) {
  const { language } = useCircadian();
  const placeCue = venue.location || venue.atmosphere.replace('-', ' ');
  const tagline = language === 'es' && venue.tagline_es ? venue.tagline_es : venue.tagline;

  return (
    <div 
      className="absolute bottom-28 left-6 right-6 md:left-auto md:right-8 md:bottom-8 md:w-80 bg-[#0A0806]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl cursor-pointer group hover:border-k-gold/30 transition-all z-20"
      onClick={onOpenDetail}
    >
      <div className="flex gap-4 h-20">
        <div className="relative w-20 h-full rounded-xl overflow-hidden flex-shrink-0 border border-white/5">
          <Image src={venue.heroImage} alt={venue.name} fill className="object-cover" />
        </div>
        <div className="flex flex-col justify-center min-w-0">
          <h3 className="font-display text-lg text-k-text leading-tight truncate group-hover:text-k-gold-light transition-colors">
            {venue.name}
          </h3>
          <p className="text-[11px] text-k-text-secondary font-sans truncate mb-1">
            {tagline}
          </p>
          <p className="text-[10px] text-k-gold-muted font-sans flex items-center gap-1">
            <Compass size={10} /> {placeCue}
          </p>
        </div>
      </div>
    </div>
  );
}
