"use client";

import { FormEvent, KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useCircadian } from '../contexts/CircadianContext';
import { Mic, Search, Sparkles } from 'lucide-react';
import { t } from '../utils/i18n';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { trackEvent } from '@/lib/analytics';

type VoiceStatus = 'idle' | 'listening' | 'transcribed' | 'permission-denied' | 'unsupported' | 'error';

type SpeechRecognitionAlternativeLike = {
  transcript: string;
};

type SpeechRecognitionResultLike = {
  0?: SpeechRecognitionAlternativeLike;
  isFinal?: boolean;
};

type SpeechRecognitionEventLike = {
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
};

type SpeechRecognitionErrorEventLike = {
  error?: string;
};

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type SpeechRecognitionWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

export default function SearchBar() {
  const { searchQuery, setSearchQuery, language } = useCircadian();
  const { scrollY } = useScroll();
  
  const [searchState, setSearchState] = useState<'expanded' | 'compressed' | 'hidden'>('expanded');
  const [draftQuery, setDraftQuery] = useState(searchQuery);
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>('idle');
  const lastTrackedQuery = useRef('');
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setVoiceStatus('idle');
  }, []);

  const confirmSearch = useCallback(() => {
    const cleaned = draftQuery.trim();
    const source = voiceStatus === 'transcribed' ? 'voice_transcript' : 'typed';
    if (voiceStatus === 'listening') {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
    }
    setSearchQuery(cleaned);
    setVoiceStatus('idle');
    trackEvent('search_confirmed', {
      query_length: cleaned.length,
      has_query: cleaned.length > 0,
      source,
    });
  }, [draftQuery, setSearchQuery, voiceStatus]);

  const handleSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    confirmSearch();
  }, [confirmSearch]);

  const handleInputKeyDown = useCallback((event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape' && voiceStatus === 'listening') {
      event.preventDefault();
      stopListening();
    }
  }, [stopListening, voiceStatus]);

  const startListening = useCallback(() => {
    if (voiceStatus === 'listening') {
      stopListening();
      return;
    }

    const speechWindow = window as SpeechRecognitionWindow;
    const Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;

    if (!Recognition) {
      setVoiceStatus('unsupported');
      return;
    }

    const recognition = new Recognition();
    recognitionRef.current = recognition;
    recognition.lang = language === 'es' ? 'es-AR' : 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const latestResult = event.results[event.results.length - 1];
      const transcript = latestResult?.[0]?.transcript?.trim();
      if (!transcript) return;

      setDraftQuery(transcript);
      setVoiceStatus('transcribed');
      trackEvent('search_voice_transcribed', {
        transcript_length: transcript.length,
      });
    };

    recognition.onerror = (event) => {
      recognitionRef.current = null;
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setVoiceStatus('permission-denied');
        return;
      }
      setVoiceStatus('error');
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setVoiceStatus((current) => current === 'listening' ? 'idle' : current);
    };

    try {
      setVoiceStatus('listening');
      recognition.start();
      trackEvent('search_voice_started');
    } catch {
      recognitionRef.current = null;
      setVoiceStatus('error');
    }
  }, [language, stopListening, voiceStatus]);

  const voiceMessage = (() => {
    if (voiceStatus === 'listening') return t('voiceSearchListening', language);
    if (voiceStatus === 'unsupported') return t('voiceSearchUnsupported', language);
    if (voiceStatus === 'permission-denied') return t('voiceSearchPermissionDenied', language);
    if (voiceStatus === 'error') return t('voiceSearchError', language);
    return '';
  })();

  useEffect(() => {
    const cleaned = searchQuery.trim().toLowerCase();
    const timeout = window.setTimeout(() => {
      if (cleaned === lastTrackedQuery.current) return;
      lastTrackedQuery.current = cleaned;
      trackEvent('search_query_changed', {
        query_length: cleaned.length,
        has_query: cleaned.length > 0,
        has_work_intent: /\b(work|laptop|study|read|focus)\b/.test(cleaned),
        has_coffee_intent: /\b(coffee|cafe|espresso)\b/.test(cleaned),
        has_night_intent: /\b(night|bar|cocktail|wine|dinner|date)\b/.test(cleaned),
      });
    }, 900);

    return () => window.clearTimeout(timeout);
  }, [searchQuery]);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const velocity = scrollY.getVelocity();

    if (latest < 60) {
      setSearchState('expanded');
    } else {
      if (velocity > 30) {
        setSearchState('hidden');
      } else if (velocity < -30) {
        setSearchState('compressed');
      }
    }
  });

  const PILLS = [
    { value: 'quiet', label: t('pillQuiet', language) },
    { value: 'warm', label: t('pillWarm', language) },
    { value: 'natural light', label: t('pillNaturalLight', language) },
    { value: 'hidden gem', label: t('pillHiddenGem', language) },
  ];

  return (
    <div className="fixed top-28 left-0 right-0 z-40 flex flex-col items-center pointer-events-none px-6">
      <motion.div
        className="relative pointer-events-auto w-full max-w-xl mx-auto"
        initial="expanded"
        animate={searchState}
        variants={{
          expanded: { 
            y: 0, 
            opacity: 1,
            scale: 1 
          },
          compressed: { 
            y: -20, 
            opacity: 1,
            scale: 0.95 
          },
          hidden: { 
            y: -100, 
            opacity: 0,
            scale: 0.9 
          }
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        {searchState === 'expanded' ? (
          <motion.div 
            key="expanded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col w-full"
          >
            {/* Dark Solid Input */}
            <form onSubmit={handleSubmit} className="relative w-full">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-[#100D0B] bg-[#000000] rounded-full flex items-center justify-center h-2 w-2 shadow-[0_0_8px_rgba(0,0,0,0.8)] border border-[#C9A96E] opacity-50">
              </div>
              <input 
                type="text" 
                value={draftQuery}
                onChange={(e) => {
                  setDraftQuery(e.target.value);
                  if (voiceStatus !== 'listening') setVoiceStatus('idle');
                }}
                onKeyDown={handleInputKeyDown}
                onFocus={() => trackEvent('search_focused', { state: searchState })}
                placeholder={voiceStatus === 'listening' ? t('voiceSearchListening', language) : t('searchPlaceholder', language)}
                className="w-full rounded-[2rem] py-4 pl-12 pr-24 text-[#8A7A5A] placeholder:text-[#5B4E3E] focus:outline-none font-sans text-[15px] shadow-2xl pointer-events-auto transition-colors"
                style={{ 
                  background: 'rgba(15, 13, 11, 0.75)',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  border: voiceStatus === 'listening' ? '1px solid rgba(201, 169, 110, 0.72)' : '1px solid rgba(201, 169, 110, 0.45)',
                  boxShadow: voiceStatus === 'listening'
                    ? '0 10px 30px rgba(0,0,0,0.8), inset 0 0 22px rgba(201,169,110,0.08), 0 0 24px rgba(201,169,110,0.08)'
                    : '0 10px 30px rgba(0,0,0,0.8), inset 0 0 20px rgba(0,0,0,0.3)'
                }}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={startListening}
                  aria-pressed={voiceStatus === 'listening'}
                  aria-label={voiceStatus === 'listening' ? t('voiceSearchStopLabel', language) : t('voiceSearchMicLabel', language)}
                  className={`h-9 w-9 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                    voiceStatus === 'listening'
                      ? 'border-[#C9A96E]/35 bg-[#C9A96E]/10 text-[#C9A96E] shadow-[0_0_16px_rgba(201,169,110,0.16)]'
                      : 'border-white/5 bg-white/[0.02] text-[#8A7A5A] hover:text-[#C9A96E] hover:border-[#C9A96E]/18'
                  }`}
                >
                  <Mic size={14} />
                </button>
                <button
                  type="submit"
                  aria-label={t('searchConfirmLabel', language)}
                  className="h-9 w-9 rounded-full border border-[#C9A96E]/18 bg-[#C9A96E]/6 flex items-center justify-center text-[#C9A96E]/80 hover:text-[#D4B87A] hover:border-[#C9A96E]/30 hover:bg-[#C9A96E]/10 transition-all cursor-pointer"
                >
                  <Search size={14} />
                </button>
              </div>
            </form>
            <div aria-live="polite" className="min-h-[18px] mt-2 px-5">
              {voiceMessage && (
                <p className={`text-[11px] leading-relaxed font-sans ${
                  voiceStatus === 'listening' ? 'text-[#C9A96E]/75' : 'text-[#B0A898]/65'
                }`}>
                  {voiceMessage}
                </p>
              )}
            </div>
            
            {/* Explanation text */}
            <div className="mt-3 mb-6 px-2 flex items-start gap-2">
              <Sparkles size={14} className="text-[#C9A96E] mt-1 shrink-0 opacity-80" />
              <p className="text-[13px] leading-relaxed text-[#B0A898] font-display italic">
                {t('searchExplanation', language, {
                  intent: t('searchIntent', language),
                  lighting: t('searchLighting', language),
                })}
              </p>
            </div>

            {/* Pills */}
            <div 
              className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide px-2"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
            >
              <style>{`
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .k-pill-inactive {
                  background: rgba(255, 255, 255, 0.02);
                  border: 1px solid rgba(255, 255, 255, 0.04);
                  color: rgba(176, 168, 152, 0.7);
                }
                .k-pill-inactive:hover {
                  background: rgba(201, 169, 110, 0.06);
                  border-color: rgba(201, 169, 110, 0.15);
                  color: #E8D4A6;
                  transform: translateY(-1px);
                }
                .k-pill-active {
                  background: rgba(201, 169, 110, 0.12);
                  border: 1px solid rgba(201, 169, 110, 0.25);
                  color: #C9A96E;
                }
              `}</style>
              {PILLS.map((pill) => {
                // Determine if this pill's keyword is in the search query
                const isSelected = draftQuery.toLowerCase().includes(pill.value);
                
                return (
                  <button 
                    key={pill.value}
                    type="button"
                    onClick={() => {
                      trackEvent(isSelected ? 'search_pill_removed' : 'search_pill_added', {
                        pill: pill.value,
                        query_length: draftQuery.trim().length,
                      });
                      if (isSelected) {
                        setDraftQuery(draftQuery.replace(new RegExp(pill.value, 'ig'), '').trim());
                      } else {
                        setDraftQuery((draftQuery + ' ' + pill.value).trim());
                      }
                      if (voiceStatus !== 'listening') setVoiceStatus('idle');
                    }}
                    className={`shrink-0 px-[18px] py-[10px] rounded-full font-sans text-[11px] font-medium tracking-[0.06em] uppercase transition-all duration-400 cursor-pointer select-none ${isSelected ? 'k-pill-active' : 'k-pill-inactive'}`}
                  >
                    {pill.label}
                  </button>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="compressed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mx-auto w-[260px] rounded-full py-2.5 px-4 flex items-center gap-3 shadow-2xl cursor-pointer pointer-events-auto transition-colors"
            style={{ 
              background: 'rgba(15, 13, 11, 0.75)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(201, 169, 110, 0.45)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.8)'
            }}
            onClick={() => {
              trackEvent('search_compressed_clicked', {
                has_query: draftQuery.trim().length > 0,
              });
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <Search size={14} className="text-[#5B4E3E] ml-1" />
            <span className="text-[13px] font-sans text-[#8A7A5A] truncate">
              {draftQuery || searchQuery || t('searchPlaceholder', language)}
            </span>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
