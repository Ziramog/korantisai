"use client";

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Sparkles } from 'lucide-react';
import Image from 'next/image';

import { ScoredVenue, useCircadian } from './contexts/CircadianContext';
import SearchBar from './components/SearchBar';
import VenueCard from './components/VenueCard';
import GlobalNav from './components/GlobalNav';
import VenueDetail from './components/VenueDetail';
import AtmosphereDebug from './components/AtmosphereDebug';
import AuthPanel from './components/AuthPanel';
import HeaderControls from './components/HeaderControls';
import SpatialAtlas from './components/map/SpatialAtlas';
import MoodPills from './components/MoodPills';
import ZonePills from './components/ZonePills';
import ContextualSection from './components/ContextualSection';
import ThematicCarousel from './components/ThematicCarousel';
import SearchModal from './components/SearchModal';
import GuardadosTab from './components/GuardadosTab';
import VosTab from './components/VosTab';
import { t } from './utils/i18n';
import { trackEvent, trackVenueEvent } from '@/lib/analytics';

export default function Home() {
  const { 
    isAuthenticated,
    rankedVenues, 
    savedVenueIds, 
    currentPhase,
    language,
    setLanguage
  } = useCircadian();

  const [activeTabState, setActiveTabState] = useState<'explore' | 'atlas' | 'guardados' | 'vos'>('explore');
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [atlasPreSelectedVenueId, setAtlasPreSelectedVenueId] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (['explore', 'atlas', 'guardados', 'vos'].includes(tab as any)) {
        setActiveTabState(tab as any);
      } else {
        setActiveTabState('explore');
      }

      const venue = params.get('venue');
      setSelectedVenueId(venue);
    };

    // Initial sync
    handlePopState();

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const activeTab = activeTabState;

  const setActiveTab = (tab: 'explore' | 'atlas' | 'guardados' | 'vos') => {
    setActiveTabState(tab);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.pushState({}, '', url.toString());
  };

  const selectedVenue = useMemo(() => {
    return rankedVenues.find(v => v.id === selectedVenueId) || null;
  }, [rankedVenues, selectedVenueId]);

  const setSelectedVenue = (venue: ScoredVenue | null) => {
    setSelectedVenueId(venue?.id || null);
    const url = new URL(window.location.href);
    if (venue) {
      url.searchParams.set('venue', venue.id);
    } else {
      url.searchParams.delete('venue');
    }
    window.history.pushState({}, '', url.toString());
  };

  const aloneVenues = useMemo(() => {
    return rankedVenues.filter(v => (v.tags || []).includes('QUIET') || (v.tags || []).includes('WORK_FRIENDLY')).slice(0, 5);
  }, [rankedVenues]);

  const dateVenues = useMemo(() => {
    return rankedVenues.filter(v => (v.tags || []).includes('DATE_NIGHT') || (v.tags || []).includes('INTIMATE')).slice(0, 5);
  }, [rankedVenues]);

  // Re-link telemetry inside component event handler
  const { recordClick } = useCircadian();
  const handleVenueClick = (venue: ScoredVenue) => {
    trackVenueEvent('venue_card_clicked', venue, {
      active_tab: activeTab,
      saved: savedVenueIds.includes(venue.id),
    });
    trackVenueEvent('venue_detail_opened', venue, {
      source: activeTab,
    });
    recordClick(venue.atmosphere);
    setSelectedVenue(venue);
  };

  return (
    <div className="w-full min-h-screen text-k-text overflow-x-clip scroll-smooth relative">
      {/* FIXED ELEMENTS OUTSIDE TRANSFORM CONTAINERS */}
      
      <GlobalNav 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        selectedVenue={selectedVenue}
      />
      
      {!selectedVenue && <HeaderControls />}
      
      <AtmosphereDebug />

      <SearchModal 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
        onSelectVenue={handleVenueClick}
      />

      <AnimatePresence mode="wait">
        {selectedVenue ? (
          <motion.div
            key="detail"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <VenueDetail 
              venue={selectedVenue} 
              onBack={() => {
                trackVenueEvent('venue_detail_back_clicked', selectedVenue);
                setSelectedVenue(null);
              }} 
              onOpenInAtlas={() => {
                trackVenueEvent('venue_detail_atlas_opened', selectedVenue);
                setAtlasPreSelectedVenueId(selectedVenue.id);
                setSelectedVenue(null);
                setActiveTab('atlas');
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="shell"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className={`w-full pb-24 ${activeTab === 'atlas' ? '' : 'pt-24'}`}
          >
            {/* EXPLORE / SEARCH FEED TAB */}
            <div className={activeTab === 'explore' ? 'block' : 'hidden'}>
              <div className="w-full flex flex-col items-center">
                
                <SearchBar onOpenSearch={() => setIsSearchOpen(true)} />
                <MoodPills />
                <ContextualSection onSelectVenue={handleVenueClick} />

                <div className="w-full max-w-4xl mx-auto px-6 mb-4 mt-6">
                  <h2 className="font-display text-xl text-[#C9A96E]/90 tracking-wide italic">
                    Lo nuevo
                  </h2>
                </div>

                {rankedVenues.length === 0 && (
                  <div className="w-full max-w-4xl px-4 md:px-12 flex flex-col gap-12 pb-12 animate-pulse mt-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-full flex flex-col gap-4">
                        <div className="w-full aspect-[3/2] bg-white/5 rounded-2xl" />
                        <div className="flex flex-col gap-2 px-1">
                          <div className="w-1/3 h-8 bg-white/5 rounded" />
                          <div className="w-2/3 h-4 bg-white/5 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <motion.div 
                  layout
                  initial="hidden"
                  animate="visible"
                  variants={{
                    visible: { transition: { staggerChildren: 0.15 } },
                    hidden: {}
                  }}
                  className="w-full max-w-4xl px-4 md:px-12 flex flex-col items-center gap-12 pb-12"
                >
                  {rankedVenues.map((venue, index) => {
                    // Inject Carousels
                    const showAloneCarousel = index === 2 && aloneVenues.length > 0;
                    const showDateCarousel = index === 5 && dateVenues.length > 0;

                    // Alternating Hero and Standard cards
                    // 0: hero, 1: standard, 2: standard, 3: hero, 4: standard, 5: standard
                    const isHero = index % 3 === 0;

                    return (
                      <div key={venue.id} className="w-full">
                        {showAloneCarousel && (
                          <div className="w-[100vw] relative left-1/2 -translate-x-1/2 mb-12">
                            <ThematicCarousel 
                              title="Para estar solo" 
                              venues={aloneVenues} 
                              onSelectVenue={handleVenueClick} 
                            />
                            <ZonePills />
                          </div>
                        )}
                        {showDateCarousel && (
                          <div className="w-[100vw] relative left-1/2 -translate-x-1/2 mb-12">
                            <ThematicCarousel 
                              title="Citas sin ruido" 
                              venues={dateVenues} 
                              onSelectVenue={handleVenueClick} 
                            />
                          </div>
                        )}

                        <motion.div
                          layout
                          variants={{
                            hidden: { opacity: 0, y: 40 },
                            visible: { opacity: 1, y: 0 }
                          }}
                          transition={{
                            type: 'spring',
                            stiffness: 180,
                            damping: 26,
                            mass: 1.1
                          }}
                          className="w-full flex justify-center"
                        >
                          <VenueCard 
                            venue={venue}
                            variant={isHero ? 'hero' : 'standard'}
                            onSelect={() => handleVenueClick(venue)}
                            onSpatialTap={() => {
                              trackVenueEvent('venue_card_atlas_opened', venue);
                              setActiveTab('atlas');
                            }}
                          />
                        </motion.div>
                      </div>
                    );
                  })}
                </motion.div>
              </div>
            </div>

            {/* SAVED ATLAS COLLECTIONS TAB */}
            {/* Atlas remains mounted in background to avoid re-initializing mapbox (Anti-jank) */}
            <div className={activeTab === 'atlas' ? 'block' : 'hidden opacity-0 pointer-events-none'}>
              <SpatialAtlas 
                onVenueClick={handleVenueClick} 
                onExploreClick={() => {
                  trackEvent('atlas_empty_explore_clicked');
                  setActiveTab('explore');
                }} 
                initialSelectedVenueId={atlasPreSelectedVenueId}
              />
            </div>

            {/* GUARDADOS TAB */}
            <div className={activeTab === 'guardados' ? 'block' : 'hidden'}>
              <GuardadosTab 
                onVenueClick={handleVenueClick}
                onExploreClick={() => {
                  trackEvent('guardados_empty_explore_clicked');
                  setActiveTab('explore');
                }}
              />
            </div>

            {/* VOS TAB */}
            <div className={activeTab === 'vos' ? 'block' : 'hidden'}>
              <VosTab />
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
