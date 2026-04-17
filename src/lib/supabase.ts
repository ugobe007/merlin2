/**
 * Supabase Client Configuration
 * Singleton instance for database access
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

// Create singleton instance
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Admin client — uses service role key, bypasses RLS.
 * ONLY use in admin-gated components. Never expose to end users.
 */
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
export const supabaseAdmin: SupabaseClient = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : supabase; // fallback to anon if key not present (dev safety)
