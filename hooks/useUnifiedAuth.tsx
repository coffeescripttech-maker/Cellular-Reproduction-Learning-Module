/**
 * Unified Auth Hook
 * 
 * This hook provides a unified interface for authentication that switches
 * between Supabase and Express backends based on the NEXT_PUBLIC_USE_NEW_API flag.
 */

'use client';

import { useAuth as useSupabaseAuth, AuthProvider as SupabaseAuthProvider } from './useAuth';
import { useExpressAuth, ExpressAuthProvider } from './useExpressAuth';

// Check feature flag
const USE_NEW_API = process.env.NEXT_PUBLIC_USE_NEW_API === 'true';

/**
 * Unified auth hook that switches between Supabase and Express
 */
export function useUnifiedAuth() {
  if (USE_NEW_API) {
    return useExpressAuth();
  }
  return useSupabaseAuth();
}

/**
 * Unified auth provider that switches between Supabase and Express
 */
export function UnifiedAuthProvider({ children }: { children: React.ReactNode }) {
  if (USE_NEW_API) {
    return <ExpressAuthProvider>{children}</ExpressAuthProvider>;
  }
  return <SupabaseAuthProvider>{children}</SupabaseAuthProvider>;
}

// Export for backward compatibility
export { useUnifiedAuth as useAuth, UnifiedAuthProvider as AuthProvider };
