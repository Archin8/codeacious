import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

// Strip trailing '/rest/v1' if present so auth & database endpoints work correctly
const baseUrl = env.SUPABASE_URL.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');

export const supabaseAdmin = createClient(
  baseUrl,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false, autoRefreshToken: false },
  }
);
