import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(url && publishableKey);
export const supabase = isSupabaseConfigured ? createClient(url, publishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
}) : null;

export async function checkSupabaseConnection() {
  if (!supabase) return { connected: false, reason: 'missing configuration' };
  const { error } = await supabase.auth.getSession();
  return error ? { connected: false, reason: error.message } : { connected: true };
}
