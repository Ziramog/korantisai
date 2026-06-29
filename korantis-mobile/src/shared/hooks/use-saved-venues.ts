import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, createElement, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/features/auth/auth-context';
import { getSupabaseClient } from '@/features/auth/supabase-client';

const STORAGE_KEY = 'korantis-saved-venues-v1';

type SavedVenuesContextValue = {
  savedIds: Set<string>;
  toggleSaved: (venueId: string) => void;
  clearSaved: () => void;
  syncError: string | null;
};

const SavedVenuesContext = createContext<SavedVenuesContextValue | null>(null);

export function SavedVenuesProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const client = getSupabaseClient();
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    void AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      return parseSavedIds(raw);
    }).then((local) => { setSavedIds(local); setHydrated(true); });
  }, []);

  useEffect(() => {
    if (!hydrated || !user || !client) return;
    let cancelled = false;
    void (async () => {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const localIds = parseSavedIds(raw);
      const { data, error } = await client.from('venue_interactions').select('venue_id').eq('user_id', user.id).eq('status', 'saved');
      if (cancelled) return;
      if (error) { setSyncError('No pudimos sincronizar Guardados. Tus cambios siguen disponibles en este dispositivo.'); return; }
      const remoteIds = new Set((data as { venue_id: string }[]).map((row) => row.venue_id));
      const merged = new Set([...localIds, ...remoteIds]);
      const pending = [...localIds].filter((id) => !remoteIds.has(id));
      if (pending.length > 0) {
        const { error: uploadError } = await client.from('venue_interactions').upsert(
          pending.map((venueId) => ({ user_id: user.id, venue_id: venueId, status: 'saved' })),
          { onConflict: 'user_id,venue_id,status' },
        );
        if (uploadError) setSyncError('La colección se cargó, pero algunos guardados locales todavía no subieron.');
      }
      if (!cancelled) {
        setSavedIds(merged);
        void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...merged]));
      }
    })();
    return () => { cancelled = true; };
  }, [client, hydrated, user]);

  const persist = useCallback((next: Set<string>) => {
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
  }, []);

  const syncOne = useCallback(async (venueId: string, shouldSave: boolean) => {
    if (!client || !user) return;
    const result = shouldSave
      ? await client.from('venue_interactions').upsert({ user_id: user.id, venue_id: venueId, status: 'saved' }, { onConflict: 'user_id,venue_id,status' })
      : await client.from('venue_interactions').delete().eq('user_id', user.id).eq('venue_id', venueId).eq('status', 'saved');
    setSyncError(result.error ? 'El cambio quedó guardado localmente y se reintentará en tu próxima sesión.' : null);
  }, [client, user]);

  const toggleSaved = useCallback((venueId: string) => {
    setSavedIds((current) => {
      const next = new Set(current);
      const shouldSave = !next.has(venueId);
      if (shouldSave) next.add(venueId);
      else next.delete(venueId);
      persist(next);
      void syncOne(venueId, shouldSave);
      return next;
    });
  }, [persist, syncOne]);

  const clearSaved = useCallback(() => {
    const next = new Set<string>();
    setSavedIds(next);
    persist(next);
    if (client && user) {
      void client.from('venue_interactions').delete().eq('user_id', user.id).eq('status', 'saved').then(({ error }) => {
        if (error) setSyncError('Se limpió el dispositivo, pero no pudimos actualizar la nube.');
      });
    }
  }, [client, persist, user]);

  const value = useMemo(() => ({ savedIds, toggleSaved, clearSaved, syncError }), [clearSaved, savedIds, syncError, toggleSaved]);
  return createElement(SavedVenuesContext.Provider, { value }, children);
}

export function useSavedVenues() {
  const context = useContext(SavedVenuesContext);
  if (!context) throw new Error('useSavedVenues must be used inside SavedVenuesProvider');
  return context;
}

function parseSavedIds(raw: string | null) {
  if (!raw) return new Set<string>();
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) && parsed.every((value) => typeof value === 'string') ? new Set(parsed) : new Set<string>();
  } catch {
    return new Set<string>();
  }
}
