import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/features/auth/auth-context';
import { getSupabaseClient } from '@/features/auth/supabase-client';
import type { Venue } from '@/features/venues/api/venue-schema';

import { learnTasteVector, NEUTRAL_TASTE_VECTOR } from './circadian-ranking';

const STORAGE_KEY = 'korantis-taste-profile-v1';

type TasteProfileValue = {
  tasteVector: number[];
  recordVenueOpen: (venue: Venue) => void;
  resetTaste: () => void;
};

type StoredTaste = { identity: number[]; drift: number[] };

const TasteProfileContext = createContext<TasteProfileValue | null>(null);

export function TasteProfileProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const client = getSupabaseClient();
  const [, setIdentityVector] = useState<number[]>([...NEUTRAL_TASTE_VECTOR]);
  const [tasteVector, setTasteVector] = useState<number[]>([...NEUTRAL_TASTE_VECTOR]);

  const persist = useCallback((identity: number[], drift: number[]) => {
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ identity, drift } satisfies StoredTaste));
  }, []);

  useEffect(() => {
    void AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw) as StoredTaste | number[];
        const identity = Array.isArray(parsed) ? parsed : parsed.identity;
        const drift = Array.isArray(parsed) ? parsed : parsed.drift;
        if (isVector(identity) && isVector(drift)) { setIdentityVector(identity); setTasteVector(drift); }
      } catch {
        void AsyncStorage.removeItem(STORAGE_KEY);
      }
    });
  }, []);

  useEffect(() => {
    if (!client || !user) return;
    let cancelled = false;
    void client.from('profiles').select('identity_centroid,current_drift').eq('id', user.id).maybeSingle().then(({ data }) => {
      if (cancelled || !data) return;
      const identity = parseVector(data.identity_centroid);
      const drift = parseVector(data.current_drift);
      if (isVector(identity) && isVector(drift)) {
        setIdentityVector(identity);
        setTasteVector(drift);
        persist(identity, drift);
      }
    });
    return () => { cancelled = true; };
  }, [client, persist, user]);

  const syncRemote = useCallback((identity: number[], drift: number[]) => {
    if (!client || !user) return;
    void client.from('profiles').update({
      identity_centroid: `[${identity.join(',')}]`,
      current_drift: `[${drift.join(',')}]`,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id);
  }, [client, user]);

  const recordVenueOpen = useCallback((venue: Venue) => {
    setTasteVector((currentDrift) => {
      const nextDrift = learnTasteVector(currentDrift, venue, 0.15);
      setIdentityVector((currentIdentity) => {
        const nextIdentity = learnTasteVector(currentIdentity, venue, 0.015);
        persist(nextIdentity, nextDrift);
        syncRemote(nextIdentity, nextDrift);
        return nextIdentity;
      });
      return nextDrift;
    });
  }, [persist, syncRemote]);

  const resetTaste = useCallback(() => {
    const neutral = [...NEUTRAL_TASTE_VECTOR];
    setIdentityVector(neutral);
    setTasteVector(neutral);
    persist(neutral, neutral);
    syncRemote(neutral, neutral);
  }, [persist, syncRemote]);

  const value = useMemo(() => ({ tasteVector, recordVenueOpen, resetTaste }), [recordVenueOpen, resetTaste, tasteVector]);
  return <TasteProfileContext.Provider value={value}>{children}</TasteProfileContext.Provider>;
}

export function useTasteProfile() {
  const context = useContext(TasteProfileContext);
  if (!context) throw new Error('useTasteProfile must be used inside TasteProfileProvider');
  return context;
}

function parseVector(value: unknown): number[] {
  if (Array.isArray(value)) return value.map(Number);
  if (typeof value !== 'string') return [];
  return value.replace(/^\[|\]$/g, '').split(',').map((item) => Number(item.trim()));
}

function isVector(value: number[]): value is number[] {
  return value.length === 8 && value.every(Number.isFinite);
}
