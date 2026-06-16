"use client";

import { useState, useEffect } from 'react';
import { User, Globe, MapPin, ChevronDown, ChevronRight, Info } from 'lucide-react';
import { useCircadian } from '../contexts/CircadianContext';
import AuthPanel from './AuthPanel';
import { t } from '../utils/i18n';
import { trackEvent } from '@/lib/analytics';
import { createClient } from '@/utils/supabase/client';

const COPY = {
  es: {
    title: 'Tu Perfil',
    discovered: 'Descubiertos',
    collections: 'Colecciones',
    moods: 'Tus Moods',
    settings: 'Configuración',
    language: 'Idioma',
    city: 'Ciudad',
    privacy: 'Privacidad y Datos',
    comingSoon: 'Próximamente - En desarrollo',
    moodLabels: ['Íntimo', 'Social', 'Refugio', 'Calmo'],
  },
  en: {
    title: 'Your Profile',
    discovered: 'Discovered',
    collections: 'Collections',
    moods: 'Your Moods',
    settings: 'Settings',
    language: 'Language',
    city: 'City',
    privacy: 'Privacy & Data',
    comingSoon: 'Coming soon - In development',
    moodLabels: ['Intimate', 'Social', 'Hidden', 'Calm'],
  },
};

export default function VosTab() {
  const {
    savedVenueIds,
    city,
    setCity,
    language,
    setLanguage,
    isAuthenticated,
    userId,
    setIsAuthenticated,
    setUserId,
  } = useCircadian();
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const locale = language === 'es' ? 'es' : 'en';
  const copy = COPY[locale];
  const supabase = createClient();

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const discoveredCount = 12 + savedVenueIds.length;
  const collectionsCount = 4;
  const moods = [
    { label: copy.moodLabels[0], percentage: 40 },
    { label: copy.moodLabels[1], percentage: 30 },
    { label: copy.moodLabels[2], percentage: 20 },
    { label: copy.moodLabels[3], percentage: 10 },
  ];

  const handleSignOut = async () => {
    trackEvent('auth_sign_out_requested');
    const { error } = await supabase.auth.signOut();

    if (error) {
      trackEvent('auth_sign_out_failed');
      setToastMessage(t('signOutError', language));
      return;
    }

    trackEvent('auth_signed_out');
    setUserId(null);
    setIsAuthenticated(false);
  };

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-4xl flex-col items-center px-6 py-12">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-[#C9A96E]/30 bg-[#C9A96E]/10">
        <User size={40} className="text-[#C9A96E]" />
      </div>
      
      <h2 className="mb-8 font-display text-3xl text-[#F5F0E8]">{copy.title}</h2>

      <div className="mb-8 w-full max-w-md">
        {isAuthenticated ? (
          <div className="w-full rounded-2xl border border-[#C9A96E]/15 bg-[#0A0806] p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-sans text-[10px] uppercase tracking-widest text-[#C9A96E]/80">
                  {t('signedIn', language)}
                </p>
                <p className="mt-2 break-all font-sans text-xs text-white/55">
                  {userId}
                </p>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="shrink-0 rounded-full border border-white/10 px-4 py-2 font-sans text-[10px] uppercase tracking-widest text-white/70 transition hover:border-[#C9A96E]/40 hover:text-[#C9A96E]"
              >
                {t('signOut', language)}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="font-sans text-[10px] uppercase tracking-widest text-[#8A7A5A]">
                {t('guestMode', language)}
              </p>
              <p className="mt-2 font-sans text-sm leading-relaxed text-white/65">
                {t('authSyncHint', language)}
              </p>
            </div>
            <AuthPanel />
          </div>
        )}
      </div>

      <div className="mb-8 grid w-full max-w-md grid-cols-2 gap-4">
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-4">
          <span className="font-display text-2xl text-[#C9A96E]">{discoveredCount}</span>
          <span className="mt-1 font-sans text-[10px] uppercase tracking-wider text-white/50">{copy.discovered}</span>
        </div>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-4">
          <span className="font-display text-2xl text-[#C9A96E]">{collectionsCount}</span>
          <span className="mt-1 font-sans text-[10px] uppercase tracking-wider text-white/50">{copy.collections}</span>
        </div>
      </div>

      <div className="mb-8 w-full max-w-md rounded-2xl border border-white/5 bg-[#0A0806] p-6 shadow-xl">
        <h3 className="mb-4 font-sans text-xs uppercase tracking-widest text-[#8A7A5A]">{copy.moods}</h3>
        <div className="flex flex-col gap-3">
          {moods.map(mood => (
            <div key={mood.label} className="w-full">
              <div className="mb-1 flex justify-between font-sans text-xs text-white/70">
                <span>{mood.label}</span>
                <span>{mood.percentage}%</span>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-white/5">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-[#C9A96E]/50 to-[#C9A96E]"
                  style={{ width: `${mood.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative flex w-full max-w-md flex-col gap-2">
        <button 
          type="button"
          onClick={() => setIsConfigOpen(!isConfigOpen)}
          className="flex w-full items-center justify-between rounded-xl border border-white/5 bg-white/5 p-4 transition-colors hover:bg-white/10"
        >
          <span className="font-sans text-sm text-white/80">{copy.settings}</span>
          <span className="text-xs text-white/30">{isConfigOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</span>
        </button>

        {isConfigOpen && (
          <div className="mb-2 flex w-full animate-fade-in flex-col gap-4 rounded-xl border border-white/5 bg-black/40 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white/70">
                <Globe size={16} />
                <span className="font-sans text-sm">{copy.language}</span>
              </div>
              <div className="flex rounded-lg bg-white/5 p-1">
                <button 
                  type="button"
                  onClick={() => setLanguage('es')}
                  className={`rounded-md px-3 py-1 font-sans text-xs transition-colors ${language === 'es' ? 'bg-[#C9A96E] text-black font-medium' : 'text-white/60 hover:text-white'}`}
                >
                  ES
                </button>
                <button 
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`rounded-md px-3 py-1 font-sans text-xs transition-colors ${language === 'en' ? 'bg-[#C9A96E] text-black font-medium' : 'text-white/60 hover:text-white'}`}
                >
                  EN
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white/70">
                <MapPin size={16} />
                <span className="font-sans text-sm">{copy.city}</span>
              </div>
              <div className="flex rounded-lg bg-white/5 p-1">
                {(['BUE', 'NYC', 'DXB'] as const).map((nextCity) => (
                  <button
                    key={nextCity}
                    type="button"
                    onClick={() => setCity(nextCity)}
                    className={`rounded-md px-3 py-1 font-sans text-xs transition-colors ${city === nextCity ? 'bg-[#C9A96E] text-black font-medium' : 'text-white/60 hover:text-white'}`}
                  >
                    {nextCity}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <button 
          type="button"
          onClick={() => setToastMessage(copy.comingSoon)}
          className="flex w-full items-center justify-between rounded-xl border border-white/5 bg-white/5 p-4 transition-colors hover:bg-white/10"
        >
          <span className="font-sans text-sm text-white/80">{copy.privacy}</span>
          <span className="text-xs text-white/30"><ChevronRight size={16} /></span>
        </button>

        {toastMessage && (
          <div className="fixed bottom-24 left-1/2 z-50 flex -translate-x-1/2 animate-fade-in items-center gap-3 rounded-xl border border-[#C9A96E]/30 bg-black/90 px-4 py-3 text-white/90 shadow-2xl">
            <Info size={16} className="text-[#C9A96E]" />
            <span className="font-sans text-xs tracking-wide">{toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}
