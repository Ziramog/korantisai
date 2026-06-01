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
      className="absolute bottom-28 left-4 right-4 md:left-auto md:right-8 md:bottom-8 md:w-[320px] bg-white/[0.08] backdrop-blur-[24px] border border-white/15 rounded-3xl p-3 shadow-[0_8px_32px_rgba(0,0,0,0.4)] cursor-pointer group hover:bg-white/[0.12] transition-all z-20"
      onClick={onOpenDetail}
    >
      <div className="flex gap-3 h-14 items-center">
        <div className="relative w-14 h-full rounded-2xl overflow-hidden flex-shrink-0 shadow-inner">
          <Image src={venue.heroImage} alt={venue.name} fill className="object-cover" />
        </div>
        <div className="flex flex-col justify-center min-w-0 flex-1 pl-1">
          <h3 className="font-display text-base text-white leading-tight truncate drop-shadow-md">
            {venue.name}
          </h3>
          <p className="text-[11px] text-white/70 font-sans truncate mt-0.5 flex items-center gap-1 drop-shadow-sm">
            <Compass size={10} className="text-white/50" /> {placeCue}
          </p>
        </div>
        
        {/* Navigation Action */}
        <button 
          onClick={handleNavClick}
          className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all flex-shrink-0 backdrop-blur-md shadow-sm"
        >
          {showNavMenu ? <X size={14} /> : <Navigation size={14} className="ml-[-1px] mb-[-1px]" />}
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
            <div className="pt-3 mt-3 border-t border-white/10 flex gap-2">
              <a 
                href={getUberLink()} 
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-sans font-medium tracking-wide transition-all border border-white/10 shadow-sm"
              >
                <Car size={14} /> Uber
              </a>
              <a 
                href={getMapsLink()} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-sans font-medium tracking-wide transition-all border border-white/10 shadow-sm"
              >
                <MapIcon2 size={14} /> Maps
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
