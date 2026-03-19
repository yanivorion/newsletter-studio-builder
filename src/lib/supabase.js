import { createClient } from '@supabase/supabase-js';

// These will be set from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug: Log configuration status (safe - doesn't expose actual keys)
console.log('Supabase config:', {
  urlConfigured: !!supabaseUrl,
  keyConfigured: !!supabaseAnonKey,
  urlPrefix: supabaseUrl?.substring(0, 20) + '...'
});

// Check if there's a stored session in localStorage
const storedSession = localStorage.getItem('sb-' + supabaseUrl?.split('//')[1]?.split('.')[0] + '-auth-token');
console.log('Stored auth token exists:', !!storedSession);

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);

// Helper to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return !!supabaseUrl && !!supabaseAnonKey;
};


