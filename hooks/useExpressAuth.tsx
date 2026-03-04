/**
 * Express Auth Hook
 * 
 * This hook provides authentication functionality using the Express.js backend.
 * It's designed to be a drop-in replacement for the Supabase-based useAuth hook.
 */

'use client';

import React from 'react';
import { useState, useEffect, createContext, useContext } from 'react';
import type {
  User as CustomUser,
  AuthState,
  LoginCredentials,
  RegisterData,
  ForgotPasswordData,
} from '@/types/auth';
import { ExpressAuthAPI } from '@/lib/api/express-auth';
import { expressClient } from '@/lib/api/express-client';

const ExpressAuthContext = createContext<{
  authState: AuthState;
  user: CustomUser | null;
  login: (
    email: string,
    password: string,
    role?: 'student' | 'teacher'
  ) => Promise<{ success: boolean; message: string; user?: CustomUser }>;
  register: (
    data: RegisterData
  ) => Promise<{ success: boolean; message: string }>;
  forgotPassword: (
    data: ForgotPasswordData
  ) => Promise<{ success: boolean; message: string }>;
  updateProfile: (
    updates: Partial<CustomUser>
  ) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  clearError: () => void;
} | null>(null);

export function useExpressAuth() {
  const context = useContext(ExpressAuthContext);
  if (!context) {
    throw new Error('useExpressAuth must be used within ExpressAuthProvider');
  }
  return context;
}

export function ExpressAuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    // Skip auth check during SSR/build
    if (typeof window === 'undefined') {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
      return;
    }

    // Check for current user on mount
    const checkCurrentUser = async () => {
      try {
        console.log('🔍 Starting Express auth check...');

        // Check if we have a token
        const token = expressClient.getAccessToken();
        if (!token) {
          console.log('❌ No access token found');
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
          return;
        }

        // Fetch current user
        const { user, session } = await ExpressAuthAPI.getCurrentUser();

        if (user && session) {
          console.log('✅ User authenticated:', user.id, user.email);
          setAuthState({
            user: user as CustomUser,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } else {
          console.log('❌ No authenticated user found');
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      } catch (error: any) {
        console.error('⚠️ Error checking current user:', error);
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: error.message || 'Authentication check failed',
        });
      }
    };

    checkCurrentUser();

    // Set up session refresh interval (every 5 minutes)
    const refreshInterval = setInterval(async () => {
      try {
        const { user, session } = await ExpressAuthAPI.getCurrentUser();
        if (user && session) {
          setAuthState((prev) => ({
            ...prev,
            user: user as CustomUser,
            isAuthenticated: true,
            error: null,
          }));
        } else {
          // Session expired, clear auth state
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      } catch (error) {
        console.error('Session refresh error:', error);
      }
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(refreshInterval);
    };
  }, []);

  const login = async (
    email: string,
    password: string,
    role?: 'student' | 'teacher'
  ): Promise<{ success: boolean; message: string; user?: CustomUser }> => {
    console.log('useExpressAuth login called with:', { email, role });
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const credentials: LoginCredentials = role
        ? { email, password, role }
        : { email, password };
      
      const result = await ExpressAuthAPI.login(credentials);

      if (result.success && result.user) {
        setAuthState({
          user: result.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } else {
        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          error: result.message,
        }));
      }

      return {
        success: result.success,
        message: result.message,
        user: result.user || undefined,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return { success: false, message: errorMessage };
    }
  };

  const register = async (
    data: RegisterData
  ): Promise<{ success: boolean; message: string }> => {
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await ExpressAuthAPI.register(data);

      if (result.success && result.user) {
        console.log('Registration successful, setting user in auth state:', result.user);
        // Auto-login after successful registration
        setAuthState({
          user: result.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } else {
        console.log('Registration failed:', result.message);
        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          error: result.message,
        }));
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return { success: false, message: errorMessage };
    }
  };

  const forgotPassword = async (
    data: ForgotPasswordData
  ): Promise<{ success: boolean; message: string }> => {
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await ExpressAuthAPI.resetPassword(data.email);
      setAuthState((prev) => ({ ...prev, isLoading: false }));
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password reset failed';
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return { success: false, message: errorMessage };
    }
  };

  const logout = async () => {
    // Optimistic update: Clear local state immediately for instant UX
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });

    // Sign out from server in background (don't wait)
    ExpressAuthAPI.logout().catch((error) => {
      console.error('⚠️ Background logout error (state already cleared):', error);
    });
  };

  const clearError = () => {
    setAuthState((prev) => ({ ...prev, error: null }));
  };

  const updateProfile = async (
    updates: Partial<CustomUser>
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const result = await ExpressAuthAPI.updateProfile(updates as any);

      if (result.success && result.user) {
        setAuthState((prev) => ({
          ...prev,
          user: result.user || null,
        }));
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
      return { success: false, message: errorMessage };
    }
  };

  return (
    <ExpressAuthContext.Provider
      value={{
        authState,
        user: authState.user,
        login,
        register,
        forgotPassword,
        updateProfile,
        logout,
        clearError,
      }}
    >
      {children}
    </ExpressAuthContext.Provider>
  );
}
