/**
 * Legacy Auth Hook - Re-exports from Unified Auth
 * 
 * This file maintains backward compatibility by re-exporting from useUnifiedAuth.
 * All imports of useAuth will automatically use the unified implementation.
 */

export { useUnifiedAuth as useAuth, UnifiedAuthProvider as AuthProvider } from './useUnifiedAuth';
