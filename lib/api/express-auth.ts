/**
 * Express API Authentication Module
 * 
 * This module handles authentication with the Express.js backend.
 * It replaces the Supabase Auth functionality.
 */

import { expressClient } from './express-client';
import type { RegisterData, LoginCredentials, User } from '@/types/auth';
import { toast } from 'sonner';

export class ExpressAuthAPI {
  /**
   * Register a new user
   */
  static async register(data: RegisterData) {
    try {
      console.log('Starting Express registration for:', data.email, 'with role:', data.role);

      const response = await expressClient.post('/api/auth/register', {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        middleName: data.middleName,
        lastName: data.lastName,
        fullName: data.fullName,
        role: data.role,
        learningStyle: data.learningStyle,
        gradeLevel: data.gradeLevel,
      }, { skipAuth: true });

      console.log('📥 Register response:', response);

      if (response.error) {
        console.error('Registration error:', response.error);
        toast.error('Registration Failed', {
          description: response.error.message || 'Failed to create account. Please try again.',
        });
        return {
          success: false,
          message: response.error.message,
        };
      }

      // The response is the data itself, not wrapped in a data property
      const { user, profile, accessToken, refreshToken } = response as any;

      // Auto-login after successful registration
      if (accessToken && refreshToken) {
        expressClient.setTokens(accessToken, refreshToken);
      }

      // Merge user and profile data
      const mergedUser: User = {
        ...user,
        firstName: profile?.firstName || user.firstName,
        middleName: profile?.middleName || user.middleName,
        lastName: profile?.lastName || user.lastName,
        fullName: profile?.fullName || user.fullName,
        gradeLevel: profile?.gradeLevel || user.gradeLevel,
        learningStyle: profile?.learningStyle || user.learningStyle,
        preferredModules: profile?.preferredModules || user.preferredModules,
        onboardingCompleted: profile?.onboardingCompleted ?? user.onboardingCompleted,
      };

      toast.success('Registration Successful!', {
        description: 'Account created successfully and ready to use!',
      });

      return {
        success: true,
        message: 'Registration successful!',
        user: mergedUser,
      };
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Registration Failed', {
        description: error instanceof Error ? error.message : 'Registration failed',
      });
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Registration failed',
      };
    }
  }

  /**
   * Login user
   */
  static async login(credentials: LoginCredentials) {
    try {
      console.log('Starting Express login for:', credentials.email, 'with role:', credentials.role);

      const response = await expressClient.post('/api/auth/login', {
        email: credentials.email,
        password: credentials.password,
        role: credentials.role,
      }, { skipAuth: true });

      console.log('📥 Login response:', response);

      if (response.error) {
        console.error('Login error:', response.error);
        toast.error('Login Failed', {
          description: response.error.message || 'Invalid email or password. Please try again.',
        });
        return {
          success: false,
          message: response.error.message,
        };
      }

      // The response is the data itself, not wrapped in a data property
      // Response structure: { message, user, profile, accessToken, refreshToken }
      const { user, profile, accessToken, refreshToken } = response as any;

      // Store tokens
      if (accessToken && refreshToken) {
        expressClient.setTokens(accessToken, refreshToken);
      }

      // Merge user and profile data
      const mergedUser: User = {
        ...user,
        firstName: profile?.firstName || user.firstName,
        middleName: profile?.middleName || user.middleName,
        lastName: profile?.lastName || user.lastName,
        fullName: profile?.fullName || user.fullName,
        gradeLevel: profile?.gradeLevel || user.gradeLevel,
        learningStyle: profile?.learningStyle || user.learningStyle,
        preferredModules: profile?.preferredModules || user.preferredModules,
        onboardingCompleted: profile?.onboardingCompleted ?? user.onboardingCompleted,
      };

      console.log('✅ Login successful, merged user:', mergedUser);

      toast.success('Login Successful!', {
        description: `Welcome back, ${mergedUser?.firstName || mergedUser?.email}!`,
      });

      return {
        success: true,
        message: 'Login successful',
        user: mergedUser,
        session: { accessToken },
      };
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login Failed', {
        description: error instanceof Error ? error.message : 'Login failed',
      });
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }

  /**
   * Logout user
   */
  static async logout() {
    try {
      const response = await expressClient.post('/api/auth/logout', {
        refreshToken: expressClient.getAccessToken(),
      });

      // Clear tokens regardless of response
      expressClient.clearTokens();

      if (response.error) {
        console.error('Logout error:', response.error);
        return { success: false, message: response.error.message };
      }

      return { success: true, message: 'Logged out successfully' };
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear tokens even if request fails
      expressClient.clearTokens();
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Logout failed',
      };
    }
  }

  /**
   * Get current user
   */
  static async getCurrentUser(): Promise<{ user: User | null; session: any }> {
    try {
      const response = await expressClient.get('/api/auth/me');

      if (response.error) {
        console.error('Get current user error:', response.error);
        return { user: null, session: null };
      }

      // Response structure: { user, profile }
      const { user, profile } = response as any;

      // Merge user and profile data
      const mergedUser: User = {
        ...user,
        firstName: profile?.firstName || user.firstName,
        middleName: profile?.middleName || user.middleName,
        lastName: profile?.lastName || user.lastName,
        fullName: profile?.fullName || user.fullName,
        gradeLevel: profile?.gradeLevel || user.gradeLevel,
        learningStyle: profile?.learningStyle || user.learningStyle,
        preferredModules: profile?.preferredModules || user.preferredModules,
        onboardingCompleted: profile?.onboardingCompleted ?? user.onboardingCompleted,
      };

      const session = { accessToken: expressClient.getAccessToken() };

      return { user: mergedUser, session };
    } catch (error) {
      console.error('Get current user error:', error);
      return { user: null, session: null };
    }
  }

  /**
   * Refresh session
   */
  static async refreshSession() {
    try {
      // The expressClient handles token refresh automatically
      // This method is here for compatibility with the old API
      const response = await expressClient.get('/api/auth/me');

      if (response.error) {
        console.error('Session refresh error:', response.error);
        return { success: false, message: response.error.message };
      }

      // Response structure: { user, profile }
      const { user, profile } = response as any;

      // Merge user and profile data
      const mergedUser: User = {
        ...user,
        firstName: profile?.firstName || user.firstName,
        middleName: profile?.middleName || user.middleName,
        lastName: profile?.lastName || user.lastName,
        fullName: profile?.fullName || user.fullName,
        gradeLevel: profile?.gradeLevel || user.gradeLevel,
        learningStyle: profile?.learningStyle || user.learningStyle,
        preferredModules: profile?.preferredModules || user.preferredModules,
        onboardingCompleted: profile?.onboardingCompleted ?? user.onboardingCompleted,
      };

      const session = { accessToken: expressClient.getAccessToken() };

      return { success: true, user: mergedUser, session };
    } catch (error) {
      console.error('Session refresh error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Session refresh failed',
      };
    }
  }

  /**
   * Validate session
   */
  static async validateSession() {
    try {
      const response = await expressClient.get('/api/auth/me');

      if (response.error) {
        return { success: false, message: response.error.message };
      }

      return { success: true, session: { accessToken: expressClient.getAccessToken() } };
    } catch (error) {
      console.error('Session validation error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Session validation failed',
      };
    }
  }

  /**
   * Reset password
   */
  static async resetPassword(email: string) {
    try {
      const response = await expressClient.post('/api/auth/forgot-password', {
        email,
      }, { skipAuth: true });

      if (response.error) {
        console.error('Password reset error:', response.error);
        return { success: false, message: response.error.message };
      }

      return { success: true, message: 'Password reset email sent' };
    } catch (error) {
      console.error('Password reset error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Password reset failed',
      };
    }
  }

  /**
   * Update password with reset token
   */
  static async updatePassword(token: string, newPassword: string) {
    try {
      const response = await expressClient.post('/api/auth/reset-password', {
        token,
        newPassword,
      }, { skipAuth: true });

      if (response.error) {
        console.error('Password update error:', response.error);
        return { success: false, message: response.error.message };
      }

      return { success: true, message: 'Password updated successfully' };
    } catch (error) {
      console.error('Password update error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Password update failed',
      };
    }
  }

  /**
   * Update profile
   */
  static async updateProfile(updates: Partial<User>) {
    try {
      const response = await expressClient.put('/api/auth/profile', updates);

      if (response.error) {
        console.error('Profile update error:', response.error);
        return { success: false, message: response.error.message };
      }

      // Response structure: { user, profile }
      const { user, profile } = response as any;

      // Merge user and profile data
      const mergedUser: User = {
        ...user,
        firstName: profile?.firstName || user.firstName,
        middleName: profile?.middleName || user.middleName,
        lastName: profile?.lastName || user.lastName,
        fullName: profile?.fullName || user.fullName,
        gradeLevel: profile?.gradeLevel || user.gradeLevel,
        learningStyle: profile?.learningStyle || user.learningStyle,
        preferredModules: profile?.preferredModules || user.preferredModules,
        onboardingCompleted: profile?.onboardingCompleted ?? user.onboardingCompleted,
      };

      return {
        success: true,
        message: 'Profile updated successfully',
        user: mergedUser,
      };
    } catch (error) {
      console.error('Profile update error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Profile update failed',
      };
    }
  }
}
