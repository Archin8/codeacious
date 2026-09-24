import { createClient } from '@supabase/supabase-js';

// Read config exclusively from import.meta.env (public anon key only)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables (VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY).');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
