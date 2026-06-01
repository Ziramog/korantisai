import { useState } from 'react';
import Image from 'next/image';
import { Compass, Navigation, Car, Map as MapIcon2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import type { ScoredVenue } from '../../contexts/CircadianContext';
import { useCircadian } from '../../contexts/CircadianContext';

interface AtlasVenuePreviewProps {
  venue: ScoredVenue;
  onOpenDetail: () => void;
}

export default function AtlasVenuePreview({ venue, onOpenDetail }: AtlasVenuePreviewProps) {
  const { language } = useCircadian();
  const [showNavMenu, setShowNavMenu] = useState(false);

  const placeCue = venue.location || venue.atmosphere.replace('-', ' ');
  const tagline = language === 'es' && venue.tagline_es ? venue.tagline_es : venue.tagline;

  const handleNavClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowNavMenu(!showNavMenu);
  };

  const getUberLink = () => {
    return `uber://?action=setPickup&dropoff[latitude]=${venue.lat}&dropoff[longitude]=${venue.lng}&dropoff[nickname]=${encodeURIComponent(venue.name)}`;
  };

  const getMapsLink = () => {
    return `https://www.google.com/maps/dir/?api=1&destination=${venue.lat},${venue.lng}`;
  };

  return (
    <div 
      className="absolute bottom-28 left-6 right-6 md:left-auto md:right-8 md:bottom-8 md:w-80 bg-[#0A0806]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl cursor-pointer group hover:border-k-gold/30 transition-colors z-20"
      onClick={onOpenDetail}
    >
      <div className="flex gap-4 h-20 items-center">
        <div className="relative w-20 h-full rounded-xl overflow-hidden flex-shrink-0 border border-white/5">
          <Image src={venue.heroImage} alt={venue.name} fill className="object-cover" />
        </div>
        <div className="flex flex-col justify-center min-w-0 flex-1">
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
        
        {/* Navigation Action */}
        <button 
          onClick={handleNavClick}
          className="w-10 h-10 rounded-full border border-k-gold/20 flex items-center justify-center text-k-gold hover:bg-k-gold/10 transition-colors flex-shrink-0"
        >
          {showNavMenu ? <X size={16} /> : <Navigation size={16} className="ml-[-2px] mb-[-2px]" />}
        </button>
      </div>

      {/* Navigation Popover */}
      <AnimatePresence>
        {showNavMenu && (
          <motion.div 
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: 10, height: 0 }}
            className="overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pt-4 mt-4 border-t border-white/5 flex gap-2">
              <a 
                href={getUberLink()} 
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-[11px] font-sans tracking-wide transition-colors border border-white/5"
              >
                <Car size={14} /> Get a Ride
              </a>
              <a 
                href={getMapsLink()} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-k-gold/10 hover:bg-k-gold/20 text-k-gold text-[11px] font-sans tracking-wide transition-colors border border-k-gold/20"
              >
                <MapIcon2 size={14} /> Directions
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
