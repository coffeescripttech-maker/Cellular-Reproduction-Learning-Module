import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { config } from '@/lib/config';

const supabaseUrl = config.supabase.url;
const supabaseAnonKey = config.supabase.anonKey;
const serviceRoleKey = config.supabase.serviceRoleKey;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase credentials not found. Some features may not work.');
  console.warn('Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in environment variables.');
}

// Singleton pattern to prevent multiple client instances
// This prevents "Multiple GoTrueClient instances" warning
let _supabaseClient: SupabaseClient<Database> | null = null;
let _supabaseAdminClient: SupabaseClient<Database> | null = null;

/**
 * Get or create the main Supabase client instance (singleton)
 * Returns null if credentials are not available or if using Express API
 */
function getSupabaseClient(): SupabaseClient<Database> | null {
  // Check if we should use Express API instead
  const USE_NEW_API = process.env.NEXT_PUBLIC_USE_NEW_API === 'true';
  if (USE_NEW_API) {
    console.log('🚫 Supabase client disabled - using Express API');
    return null;
  }

  // Return null if credentials are missing
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  if (!_supabaseClient) {
    _supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'biscas-naga-auth', // Unique storage key
      },
    });
  }
  return _supabaseClient;
}

/**
 * Get or create the admin Supabase client instance (singleton)
 * Returns null if credentials are not available or if using Express API
 */
function getSupabaseAdminClient(): SupabaseClient<Database> | null {
  // Check if we should use Express API instead
  const USE_NEW_API = process.env.NEXT_PUBLIC_USE_NEW_API === 'true';
  if (USE_NEW_API) {
    console.log('🚫 Supabase admin client disabled - using Express API');
    return null;
  }

  // Return null if credentials are missing
  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  if (!_supabaseAdminClient) {
    // Validate that we have a service role key (not anon key)
    if (serviceRoleKey === supabaseAnonKey) {
      console.error('⚠️ WARNING: Admin client is using anon key instead of service role key!');
      console.error('This will cause "User not allowed" errors for admin operations.');
    }

    _supabaseAdminClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storageKey: 'biscas-naga-admin-auth', // Different storage key for admin
      },
    });
  }
  return _supabaseAdminClient;
}

// Export singleton instances (may be null if credentials missing)
export const supabase = getSupabaseClient();
export const supabaseAdmin = getSupabaseAdminClient();

// Server-side client for API routes (creates new instance each time)
export const createServerSupabaseClient = (): SupabaseClient<Database> | null => {
  // Check if we should use Express API instead
  const USE_NEW_API = process.env.NEXT_PUBLIC_USE_NEW_API === 'true';
  if (USE_NEW_API) {
    console.log('🚫 Server Supabase client disabled - using Express API');
    return null;
  }

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
};
