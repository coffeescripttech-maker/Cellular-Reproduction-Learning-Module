'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/lib/supabase';
import { AuthAPI } from '@/lib/api/auth';
import type { AuthState, LoginCredentials, RegisterData, ForgotPasswordData } from '@/types/auth';

interface SupabaseAuthContextType {
  authState: AuthState;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; message: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; message: string }>;
  forgotPassword: (data: ForgotPasswordData) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const SupabaseAuthContext = createContext<SupabaseAuthContextType | null>(null);

export function useSupabaseAuth() {
  const context = useContext(SupabaseAuthContext);
  if (!context) {
    throw new Error('useSupabaseAuth must be used within SupabaseAuthProvider');
  }
  return context;
}

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const USE_NEW_API = process.env.NEXT_PUBLIC_USE_NEW_API === 'true';
  
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (USE_NEW_API) {
      console.log('🚫 Supabase auth disabled - using Express API');
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
      return;
    }

    const getInitialSession = async () => {
      const { user } = await AuthAPI.getCurrentUser();
      setAuthState({
        user,
        isAuthenticated: !!user,
        isLoading: false,
        error: null,
      });
    };

    getInitialSession();

    // Only set up auth state listener if supabase client exists
    if (!supabase) {
      console.warn('⚠️ Supabase client not available');
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const { user } = await AuthAPI.getCurrentUser();
        setAuthState({
          user,
          isAuthenticated: !!user,
          isLoading: false,
          error: null,
        });
      } else if (event === 'SIGNED_OUT') {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      }
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [USE_NEW_API]);

  const login = async (credentials: LoginCredentials) => {
    if (USE_NEW_API) {
      console.warn('🚫 Supabase login called but Express API is enabled');
      return { success: false, message: 'Use Express API for authentication' };
    }

    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));
    const result = await AuthAPI.login(credentials);

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

    return { success: result.success, message: result.message };
  };

  const register = async (data: RegisterData) => {
    if (USE_NEW_API) {
      console.warn('🚫 Supabase register called but Express API is enabled');
      return { success: false, message: 'Use Express API for authentication' };
    }

    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));
    const result = await AuthAPI.register(data);
    setAuthState((prev) => ({
      ...prev,
      isLoading: false,
      error: result.success ? null : result.message,
    }));

    return { success: result.success, message: result.message };
  };

  const forgotPassword = async (data: ForgotPasswordData) => {
    if (USE_NEW_API) {
      console.warn('🚫 Supabase forgotPassword called but Express API is enabled');
      return { success: false, message: 'Use Express API for authentication' };
    }

    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));
    const result = await AuthAPI.resetPassword(data.email);
    setAuthState((prev) => ({ ...prev, isLoading: false }));

    return { success: result.success, message: result.message };
  };

  const logout = async () => {
    if (USE_NEW_API) {
      console.warn('🚫 Supabase logout called but Express API is enabled');
      return;
    }

    setAuthState((prev) => ({ ...prev, isLoading: true }));
    await AuthAPI.logout();
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  };

  const clearError = () => {
    setAuthState((prev) => ({ ...prev, error: null }));
  };

  const contextValue = {
    authState,
    login,
    register,
    forgotPassword,
    logout,
    clearError,
  };

  return React.createElement(
    SupabaseAuthContext.Provider,
    { value: contextValue },
    children
  );
}