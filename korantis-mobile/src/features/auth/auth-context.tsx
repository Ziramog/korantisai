import type { User } from '@supabase/supabase-js';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { getSupabaseClient, isSupabaseConfigured } from './supabase-client';

void WebBrowser.maybeCompleteAuthSession();

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  working: boolean;
  configured: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const configured = isSupabaseConfigured();
  const client = getSupabaseClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(configured);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!client) return;
    void client.auth.getSession().then(({ data }) => { setUser(data.session?.user ?? null); setLoading(false); });
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, [client]);

  const signInWithGoogle = useCallback(async () => {
    if (!client) { setError('Falta configurar Supabase para habilitar Google.'); return; }
    setWorking(true);
    setError(null);
    try {
      const redirectTo = makeRedirectUri({ scheme: 'korantis', path: 'auth/callback' });
      const { data, error: oauthError } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (oauthError) throw oauthError;
      if (!data.url) throw new Error('No se pudo iniciar Google OAuth.');
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type !== 'success') return;
      const callback = new URL(result.url);
      const code = callback.searchParams.get('code');
      if (!code) throw new Error('Google no devolvió un código válido.');
      const { error: exchangeError } = await client.auth.exchangeCodeForSession(code);
      if (exchangeError) throw exchangeError;
    } catch {
      setError('No pudimos iniciar sesión con Google. Revisá el callback autorizado e intentá de nuevo.');
    } finally {
      setWorking(false);
    }
  }, [client]);

  const signOut = useCallback(async () => {
    if (!client) return;
    setWorking(true);
    setError(null);
    const { error: signOutError } = await client.auth.signOut();
    if (signOutError) setError('No pudimos cerrar la sesión.');
    setWorking(false);
  }, [client]);

  const value = useMemo(() => ({ user, loading, working, configured, error, signInWithGoogle, signOut }), [configured, error, loading, signInWithGoogle, signOut, user, working]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
