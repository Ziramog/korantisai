import '../images/script_env';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type PublicVenueLookup = {
  id: string;
  name: string;
};

export function validateSupabaseServiceEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const missing = [
    !url ? 'NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL' : '',
    !serviceRoleKey ? 'SUPABASE_SERVICE_ROLE_KEY' : '',
  ].filter(Boolean);

  return {
    ok: missing.length === 0,
    missing,
    url,
    serviceRoleKey,
  };
}

export function createServiceSupabaseClient(): SupabaseClient {
  const validation = validateSupabaseServiceEnv();
  if (!validation.ok || !validation.url || !validation.serviceRoleKey) {
    throw new Error(`Missing Supabase service env vars: ${validation.missing.join(', ')}`);
  }

  return createClient(validation.url, validation.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function tableExists(supabase: SupabaseClient, table: string) {
  const { error } = await supabase.from(table).select('*').limit(1);
  if (!error) return true;
  const message = `${error.message || ''} ${error.details || ''}`.toLowerCase();
  if (message.includes('does not exist') || message.includes('could not find') || error.code === '42P01') return false;
  return true;
}

export async function loadPublicVenueLookup(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('venues')
    .select('id,name');

  if (error) throw error;
  return (data || []) as PublicVenueLookup[];
}

