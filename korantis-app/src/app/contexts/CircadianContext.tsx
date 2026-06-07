"use client";

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useSyncExternalStore } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { Venue } from '../data/venues';
import { createClient } from '@/utils/supabase/client';
import { getLocale, setLocale as persistLocale, subscribeLocale, type Locale } from '@/lib/i18n';
import { trackEvent } from '@/lib/analytics';
import {
  applyCircadianMixGuardrail,
  getCircadianCategoryBias,
  getCircadianDaypart,
  getVenueCategoryKind,
  hasExplicitCategoryIntent,
  type CircadianRankingDebug,
} from '@/lib/ranking/circadianRanking';
import { getLaunchFreshnessBias } from '@/lib/ranking/freshnessRanking';

// Types
export type TimePhase = 'morning' | 'afternoon' | 'golden-hour' | 'night' | 'late-night' | 'dawn';

export interface ScoreBreakdown {
  circadian: number;
  taste: number;
  intent: number;
  context: number;
}

export type ScoredVenue = Venue & {
  scoreFinal: string;
  breakdown: ScoreBreakdown;
  rankingDebug?: CircadianRankingDebug;
};

interface CircadianState {
  isAuthenticated: boolean;
  userId: string | null;
  currentPhase: TimePhase;
  currentHour: number;
  scrubTime: number | null;
  setScrubTime: (h: number | null) => void;
  isFrozen: boolean;
  setIsFrozen: (f: boolean) => void;
  identityCentroid: number[];
  currentDrift: number[];
  resetTaste: () => void;
  recordClick: (atmosphere: string) => void;
  recordDwell: (atmosphere: string, durationMs: number) => void;
  recordPassThrough: (atmosphere: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedPills: string[];
  togglePill: (pill: string) => void;
  clearPills: () => void;
  activeIntentVector: number[] | null;
  rankedVenues: ScoredVenue[];
  savedVenueIds: string[];
  toggleSaveVenue: (id: string) => void;
  dismissedVenueIds: string[];
  dismissVenue: (id: string) => void;
  resetDismissedVenues: () => void;
  dimensionLabels: { [key: number]: string };
  language: Locale;
  setLanguage: (lang: Locale) => void;
  city: 'BUE' | 'NYC';
  setCity: (city: 'BUE' | 'NYC') => void;
  setIsAuthenticated: (val: boolean) => void;
  setUserId: (id: string | null) => void;
}

const DIMENSION_LABELS: { [key: number]: string } = {
  0: 'Solitude vs. Sociality',
  1: 'Restraint vs. Raw Authenticity',
  2: 'Intellect vs. Warm Sensuality',
  3: 'Sunlight vs. Amber Enclosure',
  4: 'Fast Ritual vs. Slow Pause',
  5: 'Urban Edge vs. Nature Infusion',
  6: 'Minimal Clarity vs. Layering',
  7: 'Nostalgia vs. Avant-Garde'
};

const ATMOSPHERE_VECTORS: { [key: string]: number[] } = {
  'morning':     [ 0.8, -0.3, -0.4,  0.8,  0.6, -0.2, -0.7, -0.4 ],
  'afternoon':   [ 0.2,  0.1,  0.1,  0.5,  0.2,  0.4,  0.1,  0.1 ],
  'golden-hour': [ 0.0,  0.6,  0.5,  0.2, -0.3,  0.6,  0.3,  0.3 ],
  'night':       [-0.7,  0.8,  0.8, -0.7, -0.6, -0.4,  0.5,  0.6 ],
  'late-night':  [-0.9,  0.5,  0.9, -0.9, -0.8, -0.6,  0.4,  0.7 ],
  'dawn':        [-0.4, -0.5, -0.2,  0.3,  0.8,  0.2, -0.5, -0.5 ]
};

const ANCHORS = [
  { id: 'late-night',  hour: 2.5,  ambient: [6, 5, 4],     opacity: 0.85, contrast: 0.8,  grain: 0.04, motion: 1.2, bias: 0.8 },
  { id: 'dawn',        hour: 6.5,  ambient: [25, 28, 30],  opacity: 0.5,  contrast: 0.85, grain: 0.02, motion: 1.0, bias: 0.5 },
  { id: 'morning',     hour: 9.5,  ambient: [240, 235, 225],opacity: 0.05, contrast: 1.0,  grain: 0.01, motion: 0.9, bias: 0.7 },
  { id: 'afternoon',   hour: 14.5, ambient: [201, 169, 110],opacity: 0.1,  contrast: 1.0,  grain: 0.01, motion: 1.0, bias: 0.4 },
  { id: 'golden-hour', hour: 18.0, ambient: [180, 80, 30], opacity: 0.25, contrast: 0.95, grain: 0.03, motion: 1.0, bias: 0.9 },
  { id: 'night',       hour: 21.5, ambient: [10, 8, 7],    opacity: 0.8,  contrast: 0.9,  grain: 0.05, motion: 1.1, bias: 0.9 }
];

const ATMOSPHERE_PEAKS: { [key: string]: number } = {
  'late-night': 2.5,
  'dawn': 6.5,
  'morning': 9.5,
  'afternoon': 14.5,
  'golden-hour': 18.0,
  'night': 21.5
};

const PILL_VECTORS: { [key: string]: number[] } = {
  'quiet':         [ 0.9, -0.2, -0.4,  0.4,  0.5, -0.2, -0.6, -0.3 ],
  'calm':          [ 0.9, -0.2, -0.4,  0.4,  0.5, -0.2, -0.6, -0.3 ],
  'warm':          [ 0.1,  0.4,  0.8, -0.2, -0.4,  0.2,  0.4,  0.2 ],
  'intimate':      [-0.8,  0.5,  0.9, -0.8, -0.5, -0.3,  0.3,  0.5 ],
  'natural light': [ 0.7, -0.3, -0.5,  0.9,  0.5,  0.2, -0.8, -0.4 ],
  'hidden':        [-0.6,  0.2,  0.5, -0.5, -0.4,  0.3,  0.4,  0.5 ],
  'hidden gem':    [-0.6,  0.2,  0.5, -0.5, -0.4,  0.3,  0.4,  0.5 ],
  'creative':      [ 0.0,  0.5,  0.3,  0.1, -0.2,  0.4,  0.6,  0.7 ],
  'work-friendly': [ 0.8, -0.2, -0.3,  0.5,  0.6, -0.1, -0.5, -0.3 ],
  'social':        [ 0.8,  0.3,  0.4,  0.0, -0.6,  0.5,  0.5,  0.3 ],
  'energetic':     [-0.7,  0.5,  0.8, -0.6, -0.8, -0.5,  0.6,  0.8 ],
  'slow mornings': [ 0.8, -0.4, -0.3,  0.8,  0.8,  0.1, -0.5, -0.4 ],
  'late night':    [-0.9,  0.5,  0.9, -0.9, -0.8, -0.6,  0.4,  0.7 ]
};

const KEYWORD_VECTORS = [
  { keys: ['read', 'work', 'laptop', 'focus', 'study', 'work-friendly'], vector: [ 0.8, -0.2, -0.3,  0.5,  0.6, -0.1, -0.5, -0.3 ] },
  { keys: ['date', 'intimate', 'candlelit', 'romantic', 'night out'], vector: [-0.8,  0.5,  0.9, -0.8, -0.5, -0.3,  0.3,  0.5 ] },
  { keys: ['coffee', 'cafe', 'espresso', 'morning'], vector: [ 0.7, -0.2, -0.4,  0.8,  0.7, -0.2, -0.6, -0.4 ] },
  { keys: ['social', 'friends', 'meet', 'group', 'buzzing', 'energetic'], vector: [ 0.8,  0.3,  0.4,  0.0, -0.6,  0.5,  0.5,  0.3 ] }
];

const SCORING_WEIGHTS = {
  passive: { circadian: 0.40, taste: 0.40, intent: 0.00, context: 0.20 },
  activeSearch: { circadian: 0.10, taste: 0.20, intent: 0.60, context: 0.10 }
};

const DRIFT_HALF_LIFE_MS = 2 * 60 * 60 * 1000; // 2 hours for current_drift to decay to identity_centroid
const DECAY_RATE = Math.log(2) / DRIFT_HALF_LIFE_MS;

const LEARNING_RATES = {
  click: 0.15,
  dwell: 0.05,
  pass:  0.02
};

// Math helpers
function lerp(start: number, end: number, t: number) {
  return start * (1 - t) + end * t;
}

function circularTimeDistance(h1: number, h2: number) {
  const diff = Math.abs(h1 - h2);
  return Math.min(diff, 24 - diff);
}

function cosineSimilarity(vecA: number[], vecB: number[]) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0.0;
  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0.0 || normB === 0.0) return 0.0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

function driftVector(source: number[], target: number[], learningRate: number, positive = true) {
  return source.map((val, idx) => {
    const diff = target[idx] - val;
    const step = learningRate * diff;
    const nextVal = positive ? val + step : val - (step * 0.5);
    return Math.max(-1.0, Math.min(1.0, nextVal));
  });
}

function parseVector(data: unknown): number[] {
  if (typeof data === 'string') {
    // pgvector returns strings like "[0.1,-0.2,...]"
    try {
      return JSON.parse(data) as number[];
    } catch {
      return [0, 0, 0, 0, 0, 0, 0, 0];
    }
  }
  if (Array.isArray(data)) return data;
  return [0, 0, 0, 0, 0, 0, 0, 0];
}

const CircadianContext = createContext<CircadianState>({
  isAuthenticated: false,
  userId: null,
  currentPhase: 'night',
  currentHour: 18.0,
  scrubTime: null,
  setScrubTime: () => {},
  isFrozen: false,
  setIsFrozen: () => {},
  identityCentroid: [0, 0, 0, 0, 0, 0, 0, 0],
  currentDrift: [0, 0, 0, 0, 0, 0, 0, 0],
  resetTaste: () => {},
  recordClick: () => {},
  recordDwell: () => {},
  recordPassThrough: () => {},
  searchQuery: '',
  setSearchQuery: () => {},
  selectedPills: [],
  togglePill: () => {},
  clearPills: () => {},
  activeIntentVector: null,
  rankedVenues: [],
  savedVenueIds: [],
  toggleSaveVenue: () => {},
  dismissedVenueIds: [],
  dismissVenue: () => {},
  resetDismissedVenues: () => {},
  dimensionLabels: DIMENSION_LABELS,
  language: 'en',
  setLanguage: () => {},
  city: 'BUE',
  setCity: () => {},
  setIsAuthenticated: () => {},
  setUserId: () => {}
});

export const useCircadian = () => useContext(CircadianContext);

export function CircadianProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [currentHour, setCurrentHour] = useState<number>(18.0);
  const [scrubTime, setScrubTime] = useState<number | null>(null);
  const [isFrozen, setIsFrozen] = useState<boolean>(false);

  const [dbVenues, setDbVenues] = useState<Venue[]>([]);

  // Vector Identity State
  const [identityCentroid, setIdentityCentroid] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0]);
  const [currentDrift, setCurrentDrift] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0]);
  const [identityPlasticity, setIdentityPlasticity] = useState<number>(0.1);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(() => Date.now());

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPills, setSelectedPills] = useState<string[]>([]);
  const [savedVenueIds, setSavedVenueIds] = useState<string[]>([]);
  const [dismissedVenueIds, setDismissedVenueIds] = useState<string[]>([]);
  const language = useSyncExternalStore<Locale>(subscribeLocale, getLocale, () => 'en');

  const dismissVenue = useCallback((id: string) => {
    setDismissedVenueIds((prev) => (
      prev.includes(id) ? prev : [...prev, id]
    ));
  }, []);

  const resetDismissedVenues = useCallback(() => {
    setDismissedVenueIds([]);
  }, []);
  const setLanguage = useCallback((lang: Locale) => {
    trackEvent('language_changed', {
      previous_language: getLocale(),
      next_language: lang,
    });
    persistLocale(lang);
  }, []);
  const [city, setCity] = useState<'BUE' | 'NYC'>('BUE');
  const setTrackedCity = useCallback((nextCity: 'BUE' | 'NYC') => {
    setCity((previousCity) => {
      if (previousCity !== nextCity) {
        trackEvent('city_changed', {
          previous_city: previousCity,
          next_city: nextCity,
        });
      }
      return nextCity;
    });
  }, []);

  const fetchProfile = useCallback(async (uid: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .single();
      
    if (data && !error) {
      setIdentityCentroid(parseVector(data.identity_centroid));
      setCurrentDrift(parseVector(data.current_drift));
      setIdentityPlasticity(data.identity_plasticity || 0.1);
    }
  }, [supabase]);

  const fetchSavedVenues = useCallback(async (uid: string) => {
    const { data, error } = await supabase
      .from('venue_interactions')
      .select('venue_id')
      .eq('user_id', uid)
      .eq('status', 'saved');
      
    if (data && !error) {
      setSavedVenueIds((data as Array<{ venue_id: string }>).map((row) => row.venue_id));
    }
  }, [supabase]);

  const handleSession = useCallback(async (session: Session | null) => {
    if (session?.user) {
      setIsAuthenticated(true);
      setUserId(session.user.id);
      await fetchProfile(session.user.id);
      await fetchSavedVenues(session.user.id);
    } else {
      setIsAuthenticated(false);
      setUserId(null);
      // Neutral Cold Start Behavior
      setIdentityCentroid([0, 0, 0, 0, 0, 0, 0, 0]);
      setCurrentDrift([0, 0, 0, 0, 0, 0, 0, 0]);
      setSavedVenueIds([]);
    }
  }, [fetchProfile, fetchSavedVenues]);

  // Auth & Profile Hydration
  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      await handleSession(session);
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    return () => subscription.unsubscribe();
  }, [handleSession, supabase]);

  // Fetch live venues from Supabase on mount
  useEffect(() => {
    async function fetchVenues() {
      try {
        const res = await fetch('/api/venues');
        const data = await res.json();
        if (data.venues) {
          setDbVenues(data.venues);
        }
      } catch (err) {
        console.error('Error fetching from Supabase', err);
      }
    }
    fetchVenues();
  }, []);

  // Time Evaluator
  useEffect(() => {
    if (isFrozen) return;

    const evaluateTime = () => {
      if (scrubTime !== null) {
        setCurrentHour(scrubTime);
      } else {
        const date = new Date();
        setCurrentHour(date.getHours() + (date.getMinutes() / 60));
      }
    };

    evaluateTime();
    const interval = setInterval(evaluateTime, 10000);
    return () => clearInterval(interval);
  }, [scrubTime, isFrozen]);

  const currentPhase = useMemo<TimePhase>(() => {
    const hour = currentHour;
    if (hour >= 23 || hour < 5) return 'late-night';
    if (hour >= 5 && hour < 8) return 'dawn';
    if (hour >= 8 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 19.5) return 'golden-hour';
    return 'night';
  }, [currentHour]);

  const interpolatedCircadianState = useMemo(() => {
    const sorted = [...ANCHORS].sort((a, b) => a.hour - b.hour);
    let prev = sorted[sorted.length - 1];
    let next = sorted[0];

    for (let i = 0; i < sorted.length; i++) {
      if (currentHour < sorted[i].hour) {
        next = sorted[i];
        prev = i === 0 ? sorted[sorted.length - 1] : sorted[i - 1];
        break;
      }
      if (i === sorted.length - 1) {
        prev = sorted[i];
        next = sorted[0];
      }
    }

    let t = 0;
    if (prev.hour < next.hour) {
      t = (currentHour - prev.hour) / (next.hour - prev.hour);
    } else {
      const hoursFromPrev = currentHour >= prev.hour ? currentHour - prev.hour : (24 - prev.hour) + currentHour;
      const totalDiff = (24 - prev.hour) + next.hour;
      t = hoursFromPrev / totalDiff;
    }

    return {
      ambient: [
        lerp(prev.ambient[0], next.ambient[0], t),
        lerp(prev.ambient[1], next.ambient[1], t),
        lerp(prev.ambient[2], next.ambient[2], t)
      ],
      opacity: lerp(prev.opacity, next.opacity, t),
      contrast: lerp(prev.contrast, next.contrast, t),
      grain: lerp(prev.grain, next.grain, t),
      motion: lerp(prev.motion, next.motion, t),
      bias: lerp(prev.bias, next.bias, t)
    };
  }, [currentHour]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      const state = interpolatedCircadianState;
      root.style.setProperty('--k-ambient-r', Math.round(state.ambient[0]).toString());
      root.style.setProperty('--k-ambient-g', Math.round(state.ambient[1]).toString());
      root.style.setProperty('--k-ambient-b', Math.round(state.ambient[2]).toString());
      root.style.setProperty('--k-ambient-opacity', state.opacity.toFixed(3));
      root.style.setProperty('--k-text-contrast', state.contrast.toFixed(3));
      root.style.setProperty('--k-grain-intensity', state.grain.toFixed(3));
      root.style.setProperty('--k-motion-scale', state.motion.toFixed(3));
      root.style.setProperty('--k-feed-bias-strength', state.bias.toFixed(3));

      document.body.className = document.body.className.replace(/k-theme--\w+/g, '');
      let mappedClass = 'evening';
      if (currentPhase === 'late-night') mappedClass = 'late_night';
      else if (currentPhase === 'dawn') mappedClass = 'dawn';
      else if (currentPhase === 'morning') mappedClass = 'morning';
      else if (currentPhase === 'afternoon') mappedClass = 'afternoon';
      else if (currentPhase === 'golden-hour') mappedClass = 'afternoon';
      else mappedClass = 'evening';
      
      document.body.classList.add(`k-theme--${mappedClass}`);
    }
  }, [interpolatedCircadianState, currentPhase]);

  // Sync Vectors to Supabase
  const syncProfileVectors = useCallback(async (newCentroid: number[], newDrift: number[]) => {
    if (!isAuthenticated || !userId) return;
    await supabase.from('profiles').update({
      identity_centroid: `[${newCentroid.join(',')}]`,
      current_drift: `[${newDrift.join(',')}]`,
      updated_at: new Date().toISOString()
    }).eq('id', userId);
  }, [isAuthenticated, userId, supabase]);

  // Emotional Stability Constraint: Gradual Decay to Centroid
  const applyDecay = useCallback(() => {
    const now = Date.now();
    const timeDelta = now - lastUpdateTime;
    if (timeDelta <= 0) return;
    const decayFactor = Math.exp(-DECAY_RATE * timeDelta);

    setCurrentDrift((prevDrift) => {
      const nextDrift = prevDrift.map((driftVal, idx) => {
        const centroidVal = identityCentroid[idx];
        return centroidVal + decayFactor * (driftVal - centroidVal);
      });
      return nextDrift;
    });
    setLastUpdateTime(now);
  }, [identityCentroid, lastUpdateTime]);

  // Telemetry updates
  const recordClick = (atmosphere: string) => {
    trackEvent('taste_signal_recorded', {
      signal_type: 'click',
      atmosphere,
    });
    applyDecay();
    const target = ATMOSPHERE_VECTORS[atmosphere];
    if (!target) return;

    let nextCentroid = identityCentroid;
    let nextDrift = currentDrift;

    setCurrentDrift((drift) => {
      nextDrift = driftVector(drift, target, LEARNING_RATES.click, true);
      setIdentityCentroid((centroid) => {
        nextCentroid = driftVector(centroid, target, LEARNING_RATES.click * identityPlasticity, true);
        return nextCentroid;
      });
      return nextDrift;
    });
    
    syncProfileVectors(nextCentroid, nextDrift);
  };

  const recordDwell = (atmosphere: string, durationMs: number) => {
    applyDecay();
    const target = ATMOSPHERE_VECTORS[atmosphere];
    if (!target || durationMs < 2000) return;
    trackEvent('venue_card_dwelled', {
      atmosphere,
      dwell_seconds: Number((durationMs / 1000).toFixed(1)),
    });

    const deltaSeconds = (durationMs - 2000) / 1000;
    const dwellReward = Math.log(1 + deltaSeconds);
    const dynamicRate = Math.min(0.12, LEARNING_RATES.dwell * dwellReward);

    let nextCentroid = identityCentroid;
    let nextDrift = currentDrift;

    setCurrentDrift((drift) => {
      nextDrift = driftVector(drift, target, dynamicRate, true);
      if (durationMs > 8000) {
        setIdentityCentroid((centroid) => {
          nextCentroid = driftVector(centroid, target, 0.005 * identityPlasticity, true);
          return nextCentroid;
        });
      }
      return nextDrift;
    });

    syncProfileVectors(nextCentroid, nextDrift);
  };

  const recordPassThrough = (atmosphere: string) => {
    trackEvent('venue_card_passed', {
      atmosphere,
    });
    applyDecay();
    const target = ATMOSPHERE_VECTORS[atmosphere];
    if (!target) return;

    let nextDrift = currentDrift;
    setCurrentDrift((drift) => {
      nextDrift = driftVector(drift, target, LEARNING_RATES.pass, false);
      return nextDrift;
    });

    syncProfileVectors(identityCentroid, nextDrift);
  };

  const resetTaste = () => {
    trackEvent('taste_profile_reset');
    const neutral = [0, 0, 0, 0, 0, 0, 0, 0];
    setIdentityCentroid(neutral);
    setCurrentDrift(neutral);
    setLastUpdateTime(Date.now());
    syncProfileVectors(neutral, neutral);
  };

  // Saved / Bookmark Atlas
  const toggleSaveVenue = async (id: string) => {
    const isSaved = savedVenueIds.includes(id);
    const venue = dbVenues.find((item) => item.id === id);
    trackEvent(isSaved ? 'venue_unsaved' : 'venue_saved', {
      venue_id: id,
      venue_name: venue?.name,
      venue_category: venue?.category,
      venue_location: venue?.location,
      authenticated: isAuthenticated,
    });
    const nextSaved = isSaved ? savedVenueIds.filter(v => v !== id) : [...savedVenueIds, id];
    setSavedVenueIds(nextSaved);

    if (isAuthenticated && userId) {
      if (isSaved) {
        await supabase
          .from('venue_interactions')
          .delete()
          .eq('user_id', userId)
          .eq('venue_id', id)
          .eq('status', 'saved');
      } else {
        await supabase
          .from('venue_interactions')
          .insert({
            user_id: userId,
            venue_id: id,
            status: 'saved'
          });
      }
    }
  };

  // Search Intent query & pills synthesis
  const activeIntentVector = useMemo<number[] | null>(() => {
    let queryVector: number[] | null = null;
    const cleaned = searchQuery.toLowerCase().trim();

    if (cleaned.length >= 3) {
      const foundVector = [0, 0, 0, 0, 0, 0, 0, 0];
      let matches = 0;
      KEYWORD_VECTORS.forEach(kv => {
        const isMatch = kv.keys.some(key => cleaned.includes(key));
        if (isMatch) {
          for (let i = 0; i < 8; i++) {
            foundVector[i] += kv.vector[i];
          }
          matches++;
        }
      });
      if (matches > 0) {
        queryVector = foundVector.map(val => val / matches);
      } else {
        queryVector = [0, 0, 0, 0, 0.1, 0, 0, 0];
      }
    }

    const pillVectors: number[][] = [];
    selectedPills.forEach(pill => {
      const text = pill.toLowerCase();
      if (PILL_VECTORS[text]) {
        pillVectors.push(PILL_VECTORS[text]);
      }
    });

    if (!queryVector && pillVectors.length === 0) return null;

    const vectors: number[][] = [];
    if (queryVector) vectors.push(queryVector);
    pillVectors.forEach(v => vectors.push(v));

    const combined = [0, 0, 0, 0, 0, 0, 0, 0];
    vectors.forEach(v => {
      for (let i = 0; i < 8; i++) {
        combined[i] += v[i];
      }
    });

    return combined.map(val => Math.max(-1.0, Math.min(1.0, val / vectors.length)));
  }, [searchQuery, selectedPills]);

  const togglePill = (pill: string) => {
    setSelectedPills((prev) =>
      prev.includes(pill) ? prev.filter((p) => p !== pill) : [...prev, pill]
    );
  };

  const clearPills = useCallback(() => {
    setSelectedPills([]);
  }, []);

  // Unified Ranking & Score Calculator
  const rankedVenues = useMemo<ScoredVenue[]>(() => {
    const activeWeights = activeIntentVector ? SCORING_WEIGHTS.activeSearch : SCORING_WEIGHTS.passive;
    const daypart = getCircadianDaypart(currentHour);
    const explicitCategoryIntent = hasExplicitCategoryIntent(searchQuery, selectedPills);

    const cityFilteredVenues = dbVenues.filter(v => {
      if (city === 'BUE') return v.lat < 0; // Southern hemisphere
      if (city === 'NYC') return v.lat > 0; // Northern hemisphere
      return true;
    });

    const scored = cityFilteredVenues.map((venue, originalIndex) => {
      const peakHour = ATMOSPHERE_PEAKS[venue.atmosphere];
      const dist = peakHour !== undefined ? circularTimeDistance(currentHour, peakHour) : 6.0;
      const cScore = 1.0 - (dist / 12.0);

      // Taste Score Uses currentDrift which decays back toward identityCentroid
      const venueVector = venue.tasteVector || ATMOSPHERE_VECTORS[venue.atmosphere] || [0, 0, 0, 0, 0, 0, 0, 0];
      
      // Cold Start Behavior: If centroid is perfectly neutral, we don't punish, but we let other weights dominate
      const isColdStart = identityCentroid.every(v => v === 0) && currentDrift.every(v => v === 0);
      const similarityT = isColdStart ? 0 : cosineSimilarity(currentDrift, venueVector);
      const tScore = (similarityT + 1.0) / 2.0;

      let iScore = 0.0;
      if (activeIntentVector) {
        const similarityI = cosineSimilarity(activeIntentVector, venueVector);
        iScore = (similarityI + 1.0) / 2.0;
      }

      // Memory Resonance (M)
      const mScore = savedVenueIds.includes(venue.id) ? 1.0 : 0.0;
      
      // Novelty Factor (N) - simplified for now
      const nScore = isColdStart ? 0.3 : 0.0; // Mild boost for cold start

      const xScore = venue.quality;

      // Temporary override while testing Phase 4 equation
      // S = wcC + wtT + wsSp + wiI + wnN + wmM
      const baseScore = (
        activeWeights.circadian * cScore +
        (isColdStart ? 0 : activeWeights.taste * tScore) +
        activeWeights.intent * iScore +
        activeWeights.context * xScore + 
        (nScore * 0.1) + // Novelty weight
        (mScore * 0.1)   // Memory weight
      );
      const circadianBias = explicitCategoryIntent ? 0 : getCircadianCategoryBias(daypart, venue);
      const launchFreshnessBias = explicitCategoryIntent ? 0 : getLaunchFreshnessBias(venue);
      const finalDisplayScore = Math.max(0, Math.min(1.2, baseScore + circadianBias + launchFreshnessBias));

      return {
        ...venue,
        scoreFinal: finalDisplayScore.toFixed(3),
        breakdown: {
          circadian: cScore,
          taste: tScore,
          intent: iScore,
          context: xScore
        },
        rankingDebug: process.env.NODE_ENV === 'development'
          ? {
            baseScore,
            circadianBias,
            launchFreshnessBias,
            finalDisplayScore,
            daypart,
            categoryKind: getVenueCategoryKind(venue),
          }
          : undefined,
        originalIndex
      };
    });

    const ranked = scored
      .sort((a, b) => {
        const scoreA = parseFloat(a.scoreFinal);
        const scoreB = parseFloat(b.scoreFinal);
        if (Math.abs(scoreA - scoreB) < 0.0001) {
          return a.originalIndex - b.originalIndex;
        }
        return scoreB - scoreA;
      });
    const guarded = applyCircadianMixGuardrail(ranked, daypart, explicitCategoryIntent);

    return guarded
      .map(({ originalIndex: _originalIndex, ...rest }) => {
        void _originalIndex;
        return rest as ScoredVenue;
      });
  }, [currentHour, currentDrift, activeIntentVector, dbVenues, savedVenueIds, identityCentroid, city, searchQuery, selectedPills]);

  return (
    <CircadianContext.Provider
      value={{
        isAuthenticated,
        userId,
        currentPhase,
        currentHour,
        scrubTime,
        setScrubTime,
        isFrozen,
        setIsFrozen,
        identityCentroid,
        currentDrift,
        resetTaste,
        recordClick,
        recordDwell,
        recordPassThrough,
        searchQuery,
        setSearchQuery,
        selectedPills,
        togglePill,
        clearPills,
        activeIntentVector,
        rankedVenues,
        savedVenueIds,
        toggleSaveVenue,
        dismissedVenueIds,
        dismissVenue,
        resetDismissedVenues,
        dimensionLabels: DIMENSION_LABELS,
        language,
        setLanguage,
        city,
        setCity: setTrackedCity,
        setIsAuthenticated,
        setUserId
      }}
    >
      {children}
    </CircadianContext.Provider>
  );
}
