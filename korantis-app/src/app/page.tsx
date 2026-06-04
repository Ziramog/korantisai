"use client";

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Sparkles } from 'lucide-react';
import Image from 'next/image';

import { ScoredVenue, useCircadian } from './contexts/CircadianContext';
import SearchBar from './components/SearchBar';
import VenueCard from './components/VenueCard';
import GlobalNav from './components/GlobalNav';
import TasteRadar from './components/TasteRadar';
import TheOracle from './components/taste/TheOracle';
import HeroIntro from './components/taste/HeroIntro';
import VenueDetail from './components/VenueDetail';
import AtmosphereDebug from './components/AtmosphereDebug';
import AuthPanel from './components/AuthPanel';
import HeaderControls from './components/HeaderControls';
import SpatialAtlas from './components/map/SpatialAtlas';
import { t } from './utils/i18n';
import { trackEvent, trackVenueEvent } from '@/lib/analytics';

type EditorialFeedSlot = Pick<ScoredVenue, 'cardSize' | 'spacing'>;

const EDITORIAL_FEED_PATTERN: EditorialFeedSlot[] = [
  { cardSize: 'layered', spacing: 'breathe' },
  { cardSize: 'compact', spacing: 'tight' },
  { cardSize: 'immersive', spacing: 'breathe' },
  { cardSize: 'cinematic', spacing: 'isolated' },
  { cardSize: 'layered', spacing: 'breathe' },
  { cardSize: 'compact', spacing: 'tight' },
  { cardSize: 'immersive', spacing: 'isolated' },
  { cardSize: 'cinematic', spacing: 'breathe' },
];

export default function Home() {
  const { 
    isAuthenticated,
    rankedVenues, 
    savedVenueIds, 
    currentDrift,
    currentPhase,
    language,
    setLanguage
  } = useCircadian();

  const [activeTab, setActiveTab] = useState<'explore' | 'atlas' | 'taste'>('explore');
  const [selectedVenue, setSelectedVenue] = useState<ScoredVenue | null>(null);
  const [atlasPreSelectedVenueId, setAtlasPreSelectedVenueId] = useState<string | null>(null);

  const editorialVenues = useMemo(() => {
    return rankedVenues.map((venue, index) => {
      const slot = EDITORIAL_FEED_PATTERN[index % EDITORIAL_FEED_PATTERN.length];
      return {
        source: venue,
        presentation: {
          ...venue,
          cardSize: slot.cardSize,
          spacing: slot.spacing,
        },
      };
    });
  }, [rankedVenues]);

  // Generate dynamic atmospheric text descriptors based on transient vectors
  const tasteDescriptor = useMemo(() => {
    // Look at vector dimensions to write a custom description
    // Dim 0: Solitude (-1) vs Sociality (+1)
    // Dim 3: Sunlight (-1) vs Amber Enclosure (+1)
    // Dim 4: Fast Ritual (-1) vs Slow Pause (+1)
    const socialVal = currentDrift[0];
    const enclosureVal = currentDrift[3];
    const paceVal = currentDrift[4];

    const socialStr = socialVal < -0.2 ? t('socialIntimate', language) : socialVal > 0.2 ? t('socialBuzzing', language) : t('socialBalanced', language);
    const lightStr = enclosureVal < -0.2 ? t('lightAiry', language) : enclosureVal > 0.2 ? t('lightAmber', language) : t('lightEven', language);
    const paceStr = paceVal < -0.2 ? t('paceEfficient', language) : paceVal > 0.2 ? t('paceSlow', language) : t('paceLeisurely', language);

    return t('tasteDynamic', language, {
      social: socialStr,
      light: lightStr,
      pace: paceStr,
    });
  }, [currentDrift, language]);




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
            className="w-full pb-40 pt-6"
          >
            {/* EXPLORE / SEARCH FEED TAB */}
            {activeTab === 'explore' && (
              <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
                
                <HeroIntro />
                <SearchBar />

                <motion.div 
                  layout
                  className="w-full px-6 md:px-12 flex flex-col items-center pt-4"
                >
                  {editorialVenues.map(({ source, presentation }) => (
                    <motion.div
                      key={source.id}
                      layout
                      transition={{
                        type: 'spring',
                        stiffness: 180,
                        damping: 26,
                        mass: 1.1
                      }}
                      className="w-full flex justify-center"
                    >
                      <VenueCard 
                        venue={presentation}
                        onSelect={() => handleVenueClick(source)}
                        onSpatialTap={() => {
                          trackVenueEvent('venue_card_atlas_opened', source);
                          setActiveTab('atlas');
                        }}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            )}

            {/* SAVED ATLAS COLLECTIONS TAB */}
            {activeTab === 'atlas' && (
              <SpatialAtlas 
                onVenueClick={handleVenueClick} 
                onExploreClick={() => {
                  trackEvent('atlas_empty_explore_clicked');
                  setActiveTab('explore');
                }} 
                initialSelectedVenueId={atlasPreSelectedVenueId}
              />
            )}

            {/* TASTE PROFILE TAB */}
            {activeTab === 'taste' && (
              <div className="max-w-4xl mx-auto px-6 md:px-12 pt-12 md:pt-24 animate-fade-in">
                {!isAuthenticated ? (
                  <div className="flex flex-col items-center justify-center min-h-[50vh]">
                    <AuthPanel />
                  </div>
                ) : (
                  <>
                    <header className="mb-10 text-center md:text-left md:flex md:items-center md:gap-6">
                      <div className="w-16 h-16 rounded-full bg-k-gold-dim border border-k-gold/20 flex items-center justify-center text-k-gold mx-auto md:mx-0 shadow-lg flex-shrink-0">
                        <User size={28} />
                      </div>
                      <div className="mt-4 md:mt-0">
                        <h1 className="text-k-text font-display text-4xl md:text-5xl mb-2.5 tracking-wide">
                          {t('tasteCoordinates', language)}
                        </h1>
                        <p className="text-sm text-k-text-secondary font-sans font-light">
                          {t('tasteDesc', language)}
                        </p>
                      </div>
                    </header>

                    <div className="mb-20">
                      <TheOracle />
                    </div>

                    <div className="w-full h-px bg-k-border mb-16" />

                    <main className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                      {/* Radar Diagram */}
                      <div className="flex flex-col items-center">
                        <TasteRadar />
                      </div>

                      {/* Latent Vector Details */}
                      <div className="flex flex-col gap-6">
                        <section className="p-6 bg-k-surface-elevated/10 border border-k-border/50 rounded-2xl shadow-xl relative">
                          <div className="absolute top-6 right-6 text-k-gold">
                            <Sparkles size={16} className="animate-pulse" />
                          </div>
                          <h3 className="text-xs font-sans uppercase tracking-widest text-k-gold mb-3.5 font-medium">
                            {t('atmosphericInsights', language)}
                          </h3>
                          <p className="text-xs text-k-text-secondary font-sans font-light leading-loose text-justify">
                            {tasteDescriptor}
                          </p>
                        </section>

                        {/* Matched Archetypes */}
                        <section>
                          <h3 className="text-[10px] font-sans uppercase tracking-widest text-k-text-tertiary mb-4">
                            {t('strongestAffinities', language)}
                          </h3>
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-3.5 p-3 rounded-xl border border-k-border bg-k-surface/20">
                              <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-white/5">
                                <Image src="/venue_floreria.png" alt={t('sanctuaryImageAlt', language)} fill className="object-cover" />
                              </div>
                              <div className="flex-grow">
                                <h4 className="text-xs font-sans font-medium">{t('hiddenSanctuary', language)}</h4>
                                <p className="text-[10px] text-k-text-tertiary font-sans">{t('latentMatch', language, { score: 92 })}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3.5 p-3 rounded-xl border border-k-border bg-k-surface/20">
                              <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-white/5">
                                <Image src="/venue_crisol.png" alt={t('ritualImageAlt', language)} fill className="object-cover" />
                              </div>
                              <div className="flex-grow">
                                <h4 className="text-xs font-sans font-medium">{t('minimalistRitual', language)}</h4>
                                <p className="text-[10px] text-k-text-tertiary font-sans">{t('latentMatch', language, { score: 87 })}</p>
                              </div>
                            </div>
                          </div>
                        </section>

                        {/* Meta Preferences */}
                        <section className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-k-surface-elevated/20 border border-k-border rounded-xl">
                            <span className="text-[9px] font-sans uppercase tracking-wider text-k-text-tertiary block mb-1">{t('metaPreferences', language)}</span>
                            <span className="text-xs text-k-gold font-sans capitalize">{currentPhase.replace('-', ' ')}</span>
                          </div>
                          <div className="p-4 bg-k-surface-elevated/20 border border-k-border rounded-xl">
                            <span className="text-[9px] font-sans uppercase tracking-wider text-k-text-tertiary block mb-1">{t('atlasIndex', language)}</span>
                            <span className="text-xs text-k-gold font-sans">{savedVenueIds.length} {t('bookmarks', language)}</span>
                          </div>
                        </section>
                        
                        {/* Language Preferences */}
                        <section className="mt-4">
                          <h3 className="text-[10px] font-sans uppercase tracking-widest text-k-text-tertiary mb-4">
                            {t('language', language)}
                          </h3>
                          <div className="flex p-1 rounded-xl bg-k-surface-elevated/20 border border-k-border w-max">
                            <button
                              onClick={() => setLanguage('es')}
                              className={`px-6 py-2 rounded-lg text-xs font-sans tracking-wide transition-all duration-300 ${
                                language === 'es' 
                                  ? 'bg-k-gold-dim text-k-gold shadow-sm' 
                                  : 'text-k-text-secondary hover:text-white'
                              }`}
                            >
                              {t('spanish', language)}
                            </button>
                            <button
                              onClick={() => setLanguage('en')}
                              className={`px-6 py-2 rounded-lg text-xs font-sans tracking-wide transition-all duration-300 ${
                                language === 'en' 
                                  ? 'bg-k-gold-dim text-k-gold shadow-sm' 
                                  : 'text-k-text-secondary hover:text-white'
                              }`}
                            >
                              {t('english', language)}
                            </button>
                          </div>
                        </section>
                      </div>
                    </main>
                  </>
                )}
              </div>
            )}

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
