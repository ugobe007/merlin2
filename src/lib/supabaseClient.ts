/**
 * SUPABASE CLIENT SINGLETON
 * 
 * ✅ FIX #2: Single instance of Supabase client across the application
 * 
 * Problem: Multiple components creating their own clients caused:
 * - "Multiple GoTrueClient instances detected" warnings
 * - Auth state inconsistencies
 * - Unnecessary connection overhead
 * 
 * Solution: Singleton pattern ensures one client for entire app
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

// Singleton instance
let supabaseInstance: SupabaseClient<Database> | null = null;

/**
 * Get the Supabase client instance (creates on first call)
 * @returns Singleton Supabase client
 */
export function getSupabaseClient(): SupabaseClient<Database> {
  // Return existing instance if already created
  if (supabaseInstance) {
    return supabaseInstance;
  }

  // Validate environment variables
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables!');
    console.error('Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    throw new Error('Supabase configuration is missing. Check your .env file.');
  }

  // Create new instance with best practices configuration
  supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage, // Explicit localStorage for session persistence
    },
    // Optional: Add realtime configuration if needed
    // realtime: {
    //   params: {
    //     eventsPerSecond: 10,
    //   },
    // },
  });

  if (import.meta.env.DEV) {
    console.log('✅ [Supabase] Singleton client created');
    console.log(`   URL: ${supabaseUrl}`);
  }

  return supabaseInstance;
}

/**
 * Reset the singleton (useful for testing or auth logout)
 * ⚠️ Use with caution - only needed in specific scenarios
 */
export function resetSupabaseClient(): void {
  if (supabaseInstance) {
    if (import.meta.env.DEV) {
      console.log('🔄 [Supabase] Resetting singleton client');
    }
    supabaseInstance = null;
  }
}

/**
 * Check if Supabase client is initialized
 * @returns True if client exists
 */
export function isSupabaseInitialized(): boolean {
  return supabaseInstance !== null;
}

// Export a default client instance for convenience
// This will be created lazily on first import
export const supabase = getSupabaseClient();

// Also export the getter function as default
export default getSupabaseClient;
