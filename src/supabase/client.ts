import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Read from Vite environment variables or fallback
const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const getSupabaseCredentials = () => {
  const localUrl = localStorage.getItem('ffl_supabase_url');
  const localKey = localStorage.getItem('ffl_supabase_anon_key');
  return {
    url: localUrl || envUrl,
    key: localKey || envKey,
  };
};

let cachedClient: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  const { url, key } = getSupabaseCredentials();
  if (!url || !key) {
    return null;
  }
  if (!cachedClient) {
    try {
      cachedClient = createClient(url, key);
    } catch (err) {
      console.warn('Failed to initialize Supabase client:', err);
      return null;
    }
  }
  return cachedClient;
};

export const resetSupabaseClient = (newUrl?: string, newKey?: string) => {
  if (newUrl) localStorage.setItem('ffl_supabase_url', newUrl);
  if (newKey) localStorage.setItem('ffl_supabase_anon_key', newKey);
  cachedClient = null;
  return getSupabaseClient();
};

export const isSupabaseConfigured = (): boolean => {
  const { url, key } = getSupabaseCredentials();
  return Boolean(url && key && url.startsWith('http'));
};
