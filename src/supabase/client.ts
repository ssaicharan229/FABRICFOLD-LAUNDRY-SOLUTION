import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Read from Vite environment variables or localStorage fallback
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
      cachedClient = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
    } catch (err) {
      console.warn('Failed to initialize Supabase client:', err);
      return null;
    }
  }
  return cachedClient;
};

export const resetSupabaseClient = (newUrl?: string, newKey?: string) => {
  if (typeof newUrl === 'string') {
    if (newUrl.trim()) localStorage.setItem('ffl_supabase_url', newUrl.trim());
    else localStorage.removeItem('ffl_supabase_url');
  }
  if (typeof newKey === 'string') {
    if (newKey.trim()) localStorage.setItem('ffl_supabase_anon_key', newKey.trim());
    else localStorage.removeItem('ffl_supabase_anon_key');
  }
  cachedClient = null;
  return getSupabaseClient();
};

export const isSupabaseConfigured = (): boolean => {
  const { url, key } = getSupabaseCredentials();
  return Boolean(url && key && url.startsWith('http'));
};

export interface SupabaseTestResult {
  success: boolean;
  connected: boolean;
  message: string;
  error?: string;
  latencyMs: number;
}

/**
 * Health check to verify that a Supabase project is reachable and credentials are valid
 */
export const testSupabaseConnection = async (
  targetUrl?: string, 
  targetKey?: string
): Promise<SupabaseTestResult> => {
  const startTime = Date.now();
  const { url, key } = targetUrl && targetKey 
    ? { url: targetUrl.trim(), key: targetKey.trim() } 
    : getSupabaseCredentials();

  if (!url || !key) {
    return { 
      success: false, 
      connected: false,
      message: 'Please provide both Supabase Project URL and Anon/Publishable Key.', 
      error: 'Missing project URL or Anon public key.',
      latencyMs: 0 
    };
  }

  if (!url.startsWith('https://') && !url.startsWith('http://')) {
    return { 
      success: false, 
      connected: false,
      message: 'Supabase URL must start with https:// (e.g. https://xyzcompany.supabase.co)', 
      error: 'Invalid URL format.',
      latencyMs: 0 
    };
  }

  try {
    const client = createClient(url, key, {
      auth: { persistSession: false },
    });

    // Check auth endpoint health
    const { error: authError } = await client.auth.getSession();
    if (authError && authError.message.includes('API key')) {
      return { 
        success: false, 
        connected: false,
        message: `Invalid API Key: ${authError.message}`, 
        error: authError.message,
        latencyMs: Date.now() - startTime 
      };
    }

    // Attempt lightweight query on public tables
    const { error: queryError } = await client.from('hostels').select('id', { head: true, count: 'exact' });
    const latencyMs = Date.now() - startTime;

    if (queryError) {
      // 42P01: relation "public.hostels" does not exist (project works, but schema.sql hasn't been executed yet)
      if (queryError.code === '42P01') {
        return { 
          success: true, 
          connected: true,
          message: 'Connected to Supabase project! (Notice: Tables not created yet — run schema.sql in Supabase SQL Editor).', 
          latencyMs 
        };
      }
      // If RLS blocked anon query or other standard code, connection is still valid
      if (queryError.code === '42501' || queryError.message.includes('permission') || queryError.message.includes('JWT')) {
        return { 
          success: true, 
          connected: true,
          message: 'Connected to Supabase project! (Tables secured with RLS).', 
          latencyMs 
        };
      }
      return { 
        success: false, 
        connected: false,
        message: queryError.message || 'Supabase query error', 
        error: queryError.message,
        latencyMs 
      };
    }

    return { 
      success: true, 
      connected: true,
      message: 'Successfully connected to your Supabase project!', 
      latencyMs 
    };
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    const msg = err?.message || 'Network error: could not connect to Supabase.';
    return { 
      success: false, 
      connected: false,
      message: msg, 
      error: msg,
      latencyMs 
    };
  }
};
