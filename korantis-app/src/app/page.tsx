"use client";

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, Heart, User, Sparkles } from 'lucide-react';
import Image from 'next/image';

import { ScoredVenue, useCircadian } from './contexts/CircadianContext';
import SearchBar from './components/SearchBar';
import VenueCard from './components/VenueCard';
import GlobalNav from './components/GlobalNav';
import TasteRadar from './components/TasteRadar';
import VenueDetail from './components/VenueDetail';
import AtmosphereDebug from './components/AtmosphereDebug';
import AuthPanel from './components/AuthPanel';
import MapExplorer from './components/MapExplorer';
import { t } from './utils/i18n';

export default function Home() {
  const { 
    isAuthenticated,
    rankedVenues, 
    savedVenueIds, 
    toggleSaveVenue, 
    currentDrift,
    currentPhase,
    language
  } = useCircadian();

  const [activeTab, setActiveTab] = useState<'search' | 'saved' | 'profile'>('search');
  const [viewMode, setViewMode] = useState<'feed' | 'map'>('feed');
  const [selectedVenue, setSelectedVenue] = useState<ScoredVenue | null>(null);

  // Generate dynamic atmospheric text descriptors based on transient vectors
  const tasteDescriptor = useMemo(() => {
    // Look at vector dimensions to write a custom description
    // Dim 0: Solitude (-1) vs Sociality (+1)
    // Dim 3: Sunlight (-1) vs Amber Enclosure (+1)
    // Dim 4: Fast Ritual (-1) vs Slow Pause (+1)
    const socialVal = currentDrift[0];
    const enclosureVal = currentDrift[3];
    const paceVal = currentDrift[4];

    const socialStr = socialVal < -0.2 ? 'intimate corners' : socialVal > 0.2 ? 'buzzing social hubs' : 'balanced social hubs';
    const lightStr = enclosureVal < -0.2 ? 'airy, natural light' : enclosureVal > 0.2 ? 'dark, amber-lit shadows' : 'even lighting';
    const paceStr = paceVal < -0.2 ? 'efficient rituals' : paceVal > 0.2 ? 'slow lingering pauses' : 'leisurely pacing';

    return `You are currently drawn to ${socialStr} with ${lightStr} and ${paceStr}. Your profile adapts to your implicit scroll speed, cards expanded, and saved atmospheres.`;
  }, [currentDrift]);

  // Derived Saved Venues
  const savedVenues = useMemo(() => {
    return rankedVenues.filter((v) => savedVenueIds.includes(v.id));
  }, [rankedVenues, savedVenueIds]);

  // Dynamic count for Saved Collections
  const collectionCounts = useMemo(() => {
    const afterMidnight = savedVenues.filter(v => v.atmosphere === 'late-night' || v.atmosphere === 'night').length;
    const morningRitual = savedVenues.filter(v => v.atmosphere === 'morning').length;
    const sundayCalm = savedVenues.filter(v => v.atmosphere === 'afternoon' || v.atmosphere === 'golden-hour').length;
    return { afterMidnight, morningRitual, sundayCalm };
  }, [savedVenues]);



  // Re-link telemetry inside component event handler
  const { recordClick } = useCircadian();
  const handleVenueClick = (venue: ScoredVenue) => {
    recordClick(venue.atmosphere);
    setSelectedVenue(venue);
  };

  return (
    <div className="w-full min-h-screen text-k-text overflow-x-hidden scroll-smooth relative">
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
              onBack={() => setSelectedVenue(null)} 
            />
          </motion.div>
        ) : (
          <motion.div
            key="shell"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full pb-32 pt-0"
          >
            {/* BRANDING TOP NAV */}
            <nav className="w-full absolute top-0 left-0 z-50 flex items-center justify-between px-6 md:px-12 py-6">
              <div className="font-display text-2xl tracking-widest text-white/90">KORANTIS</div>
              <div className="hidden md:flex items-center gap-8 text-[11px] font-sans tracking-widest uppercase text-white/60">
                <button className="hover:text-white transition-colors cursor-pointer text-white/90">Explore</button>
                <button className="hover:text-white transition-colors cursor-pointer">Collections</button>
                <button className="hover:text-white transition-colors cursor-pointer">For Venues</button>
                <button className="hover:text-white transition-colors cursor-pointer">About</button>
              </div>
              <div className="flex items-center gap-4">
                <button className="hidden md:block px-5 py-2 rounded-full bg-k-gold-dim text-k-gold border border-k-gold/30 text-[10px] uppercase tracking-widest hover:bg-k-gold hover:text-k-black transition-colors font-medium">
                  Get the app
                </button>
                <button className="text-white/80 hover:text-white md:hidden">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
                </button>
              </div>
            </nav>
            {/* EXPLORE / SEARCH FEED TAB */}
            {activeTab === 'search' && (
              <div className="w-full max-w-4xl mx-auto px-6 md:px-12 flex flex-col items-center">
                <SearchBar />
                
                {/* View Toggle */}
                <div className="flex bg-k-surface-elevated/40 p-1 rounded-xl border border-k-border mt-8">
                  <button
                    onClick={() => setViewMode('feed')}
                    className={`px-6 py-2 rounded-lg text-[10px] font-sans uppercase tracking-widest transition-colors ${
                      viewMode === 'feed' ? 'bg-k-gold text-k-black font-medium' : 'text-k-text-secondary hover:text-k-text'
                    }`}
                  >
                    {t('resonanceFeed', language)}
                  </button>
                  <button
                    onClick={() => setViewMode('map')}
                    className={`px-6 py-2 rounded-lg text-[10px] font-sans uppercase tracking-widest transition-colors ${
                      viewMode === 'map' ? 'bg-k-gold text-k-black font-medium' : 'text-k-text-secondary hover:text-k-text'
                    }`}
                  >
                    {t('spatialAtlas', language)}
                  </button>
                </div>

                {viewMode === 'map' ? (
                  <MapExplorer onSelectVenue={handleVenueClick} />
                ) : (
                  <div 
                    className="w-full flex flex-col items-center mt-12"
                  >
                    {rankedVenues.map((venue) => (
                      <div
                        key={venue.id}
                        className="w-full flex justify-center"
                      >
                        <VenueCard 
                          venue={venue} 
                          onSelect={handleVenueClick} 
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SAVED ATLAS COLLECTIONS TAB */}
            {activeTab === 'saved' && (
              <div className="max-w-4xl mx-auto px-6 md:px-12 pt-12 md:pt-24 animate-fade-in">
                <header className="mb-14">
                  <h1 className="text-k-text font-display text-4xl md:text-5xl mb-2.5 tracking-wide">
                    {t('yourAtlas', language)}
                  </h1>
                  <p className="text-sm text-k-text-secondary font-sans font-light">
                    {t('atlasDesc', language)}
                  </p>
                </header>

                <main className="w-full flex flex-col gap-12">
                  {/* Collections Cards Grid */}
                  <section>
                    <h2 className="text-[10px] font-sans uppercase tracking-widest text-k-text-tertiary mb-6">
                      {t('dynamicCollections', language)}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      {/* Collection 1: After Midnight */}
                      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-k-border-light group cursor-pointer">
                        <Image 
                          src="/venue_floreria.png" 
                          alt="After Midnight" 
                          fill 
                          className="object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-k-black via-k-black/20 to-transparent"></div>
                        <div className="absolute bottom-5 left-5 right-5 flex flex-col gap-1">
                          <h3 className="font-display text-xl font-normal text-k-text leading-tight">{t('afterMidnight', language)}</h3>
                          <p className="text-[10px] font-sans text-k-gold-light uppercase tracking-wider">{collectionCounts.afterMidnight} {t('atmospheres', language)}</p>
                        </div>
                      </div>

                      {/* Collection 2: Morning Ritual */}
                      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-k-border-light group cursor-pointer">
                        <Image 
                          src="/venue_crisol.png" 
                          alt="Morning Ritual" 
                          fill 
                          className="object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-k-black via-k-black/20 to-transparent"></div>
                        <div className="absolute bottom-5 left-5 right-5 flex flex-col gap-1">
                          <h3 className="font-display text-xl font-normal text-k-text leading-tight">{t('morningRitual', language)}</h3>
                          <p className="text-[10px] font-sans text-k-gold-light uppercase tracking-wider">{collectionCounts.morningRitual} {t('atmospheres', language)}</p>
                        </div>
                      </div>

                      {/* Collection 3: Sunday Calm */}
                      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-k-border-light group cursor-pointer">
                        <Image 
                          src="/venue_invernadero.png" 
                          alt="Sunday Calm" 
                          fill 
                          className="object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-k-black via-k-black/20 to-transparent"></div>
                        <div className="absolute bottom-5 left-5 right-5 flex flex-col gap-1">
                          <h3 className="font-display text-xl font-normal text-k-text leading-tight">{t('sundayCalm', language)}</h3>
                          <p className="text-[10px] font-sans text-k-gold-light uppercase tracking-wider">{collectionCounts.sundayCalm} {t('atmospheres', language)}</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* All Saved List */}
                  <section>
                    <h2 className="text-[10px] font-sans uppercase tracking-widest text-k-text-tertiary mb-6">
                      {t('allSavedPlaces', language)}
                    </h2>
                    
                    {savedVenues.length === 0 ? (
                      <div className="py-16 text-center border border-dashed border-k-border rounded-2xl bg-k-surface/10">
                        <Bookmark className="mx-auto text-k-text-tertiary mb-4 opacity-40" size={32} />
                        <p className="text-sm text-k-text-secondary font-sans font-light">{t('atlasEmpty', language)}</p>
                        <button 
                          onClick={() => setActiveTab('search')}
                          className="mt-4 px-5 py-2 rounded-full border border-k-gold-muted/40 text-xs font-sans text-k-gold bg-k-gold-dim hover:bg-k-gold-dim/60 transition-colors cursor-pointer"
                        >
                          {t('discoverAtmospheres', language)}
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        {savedVenues.map((venue) => (
                          <div 
                            key={venue.id}
                            onClick={() => handleVenueClick(venue)}
                            className="p-4 bg-k-surface-elevated/20 border border-k-border rounded-xl flex items-center gap-4 hover:border-k-gold-muted/30 hover:bg-k-surface-elevated/40 transition-all duration-300 cursor-pointer shadow-md group"
                          >
                            <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-white/5">
                              <Image src={venue.heroImage} alt={venue.name} fill className="object-cover" />
                            </div>
                            <div className="flex-grow min-w-0">
                              <h3 className="font-display text-lg font-normal text-k-text leading-snug group-hover:text-k-gold-light transition-colors">
                                {venue.name}
                              </h3>
                              <p className="text-[11px] text-k-text-secondary font-sans truncate">
                                {venue.location} &middot; <span className="capitalize">{venue.atmosphere.replace('-', ' ')} {language === 'es' ? 'atmósfera' : 'atmosphere'}</span>
                              </p>
                            </div>
                            <div className="flex items-center gap-3.5 flex-shrink-0">
                              <span className="hidden md:inline px-3 py-1 rounded border border-k-gold-muted/10 text-[9px] font-sans tracking-wide text-k-gold-muted bg-k-gold/5 uppercase">
                                {language === 'es' && venue.category_es ? venue.category_es : venue.category}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSaveVenue(venue.id);
                                }}
                                className="p-2 text-k-gold hover:text-k-text-secondary transition-colors cursor-pointer"
                                aria-label="Remove bookmark"
                              >
                                <Heart size={15} fill="currentColor" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </main>
              </div>
            )}

            {/* TASTE PROFILE TAB */}
            {activeTab === 'profile' && (
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
                                <Image src="/venue_floreria.png" alt="Sanctuary" fill className="object-cover" />
                              </div>
                              <div className="flex-grow">
                                <h4 className="text-xs font-sans font-medium">{language === 'es' ? 'El Santuario Oculto' : 'The Hidden Sanctuary'}</h4>
                                <p className="text-[10px] text-k-text-tertiary font-sans">{language === 'es' ? '92% compatibilidad' : '92% latent match'}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3.5 p-3 rounded-xl border border-k-border bg-k-surface/20">
                              <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-white/5">
                                <Image src="/venue_crisol.png" alt="Ritual" fill className="object-cover" />
                              </div>
                              <div className="flex-grow">
                                <h4 className="text-xs font-sans font-medium">{language === 'es' ? 'El Ritual Minimalista' : 'The Minimalist Ritual'}</h4>
                                <p className="text-[10px] text-k-text-tertiary font-sans">{language === 'es' ? '87% compatibilidad' : '87% latent match'}</p>
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
                      </div>
                    </main>
                  </>
                )}
              </div>
            )}

            {/* GLOBAL FLOATING NAVIGATION */}
            <GlobalNav 
              activeTab={activeTab} 
              setActiveTab={setActiveTab} 
              selectedVenue={selectedVenue}
            />

            {/* REALTIME ATMOSPHERIC DEBUG HUD PANEL */}
            <AtmosphereDebug />

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
