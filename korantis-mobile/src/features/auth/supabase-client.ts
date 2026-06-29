import 'react-native-url-polyfill/auto';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { env } from '@/shared/config/env';

import { sessionStorage } from './session-storage';

let client: SupabaseClient | null = null;

export function isSupabaseConfigured() {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}

export function getSupabaseClient(): SupabaseClient | null {
  if (!env.supabaseUrl || !env.supabaseAnonKey) return null;
  client ??= createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      storage: sessionStorage,
      flowType: 'pkce',
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
  return client;
}
