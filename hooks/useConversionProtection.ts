import { useEffect, useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ConversionProtectionOptions {
  isActive: boolean;
  message?: string;
  onAttemptedNavigation?: () => void;
}

/**
 * Hook to protect against accidental page navigation during long-running conversions
 * 
 * Features:
 * - Prevents browser back/forward navigation
 * - Shows warning on page refresh/close
 * - Blocks Next.js router navigation
 * - Customizable warning messages
 */
export const useConversionProtection = ({
  isActive,
  message = 'Base64 to R2 conversion is in progress. Leaving now will stop the conversion. Are you sure?',
  onAttemptedNavigation
}: ConversionProtectionOptions) => {
  const router = useRouter();
  const originalPushRef = useRef<typeof router.push | null>(null);
  const originalReplaceRef = useRef<typeof router.replace | null>(null);
  const originalBackRef = useRef<typeof router.back | null>(null);

  // Handle beforeunload event (page refresh/close)
  const handleBeforeUnload = useCallback((e: BeforeUnloadEvent) => {
    if (isActive) {
      e.preventDefault();
      e.returnValue = message;
      onAttemptedNavigation?.();
      return message;
    }
  }, [isActive, message, onAttemptedNavigation]);

  // Handle popstate event (browser back/forward)
  const handlePopState = useCallback((e: PopStateEvent) => {
    if (isActive) {
      e.preventDefault();
      
      // Push current state back to prevent navigation
      window.history.pushState(null, '', window.location.href);
      
      // Show confirmation dialog
      const shouldLeave = window.confirm(message);
      if (!shouldLeave) {
        onAttemptedNavigation?.();
        return;
      }
      
      // If user confirms, temporarily disable protection and navigate
      window.removeEventListener('popstate', handlePopState);
      window.history.back();
    }
  }, [isActive, message, onAttemptedNavigation]);

  // Intercept Next.js router methods
  const interceptRouterNavigation = useCallback(() => {
    if (!originalPushRef.current) {
      originalPushRef.current = router.push;
      originalReplaceRef.current = router.replace;
      originalBackRef.current = router.back;
    }

    // Override router.push
    router.push = ((...args: any[]) => {
      if (isActive) {
        const shouldLeave = window.confirm(message);
        if (!shouldLeave) {
          onAttemptedNavigation?.();
          return Promise.resolve(false);
        }
      }
      return originalPushRef.current!.apply(router, args);
    }) as typeof router.push;

    // Override router.replace
    router.replace = ((...args: any[]) => {
      if (isActive) {
        const shouldLeave = window.confirm(message);
        if (!shouldLeave) {
          onAttemptedNavigation?.();
          return Promise.resolve(false);
        }
      }
      return originalReplaceRef.current!.apply(router, args);
    }) as typeof router.replace;

    // Override router.back
    router.back = (() => {
      if (isActive) {
        const shouldLeave = window.confirm(message);
        if (!shouldLeave) {
          onAttemptedNavigation?.();
          return;
        }
      }
      return originalBackRef.current!.call(router);
    }) as typeof router.back;
  }, [isActive, message, onAttemptedNavigation, router]);

  // Restore original router methods
  const restoreRouterNavigation = useCallback(() => {
    if (originalPushRef.current) {
      router.push = originalPushRef.current;
      router.replace = originalReplaceRef.current!;
      router.back = originalBackRef.current!;
    }
  }, [router]);

  // Setup protection when active
  useEffect(() => {
    if (isActive) {
      console.log('🔒 [CONVERSION PROTECTION] Activating navigation protection');
      
      // Add beforeunload listener
      window.addEventListener('beforeunload', handleBeforeUnload);
      
      // Add popstate listener and push initial state
      window.addEventListener('popstate', handlePopState);
      window.history.pushState(null, '', window.location.href);
      
      // Intercept router navigation
      interceptRouterNavigation();
      
      return () => {
        console.log('🔓 [CONVERSION PROTECTION] Deactivating navigation protection');
        
        // Remove event listeners
        window.removeEventListener('beforeunload', handleBeforeUnload);
        window.removeEventListener('popstate', handlePopState);
        
        // Restore router methods
        restoreRouterNavigation();
      };
    }
  }, [isActive, handleBeforeUnload, handlePopState, interceptRouterNavigation, restoreRouterNavigation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
      restoreRouterNavigation();
    };
  }, [handleBeforeUnload, handlePopState, restoreRouterNavigation]);

  return {
    isProtected: isActive,
    message
  };
};

/**
 * Hook for progress persistence during conversions
 */
export const useConversionPersistence = (key: string) => {
  const saveProgress = useCallback((data: any) => {
    try {
      const persistData = {
        ...data,
        timestamp: Date.now()
      };
      localStorage.setItem(key, JSON.stringify(persistData));
      console.log('💾 [CONVERSION PERSISTENCE] Progress saved:', key);
    } catch (error) {
      console.warn('⚠️ [CONVERSION PERSISTENCE] Failed to save progress:', error);
    }
  }, [key]);

  const loadProgress = useCallback(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Only return if saved within last hour
        if (Date.now() - parsed.timestamp < 3600000) {
          console.log('📥 [CONVERSION PERSISTENCE] Progress loaded:', key);
          return parsed;
        } else {
          console.log('⏰ [CONVERSION PERSISTENCE] Saved progress expired, clearing:', key);
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.warn('⚠️ [CONVERSION PERSISTENCE] Failed to load progress:', error);
    }
    return null;
  }, [key]);

  const clearProgress = useCallback(() => {
    try {
      localStorage.removeItem(key);
      console.log('🗑️ [CONVERSION PERSISTENCE] Progress cleared:', key);
    } catch (error) {
      console.warn('⚠️ [CONVERSION PERSISTENCE] Failed to clear progress:', error);
    }
  }, [key]);

  return {
    saveProgress,
    loadProgress,
    clearProgress
  };
};

/**
 * Hook for conversion state management with automatic persistence
 */
export const useConversionState = <T>(key: string, initialState: T) => {
  const { saveProgress, loadProgress, clearProgress } = useConversionPersistence(key);
  
  // Load initial state from persistence
  const getInitialState = useCallback(() => {
    const saved = loadProgress();
    return saved ? { ...initialState, ...saved } : initialState;
  }, [initialState, loadProgress]);

  const [state, setState] = useState<T>(getInitialState);

  // Auto-save state changes
  const updateState = useCallback((updates: Partial<T> | ((prev: T) => T)) => {
    setState(prev => {
      const newState = typeof updates === 'function' ? updates(prev) : { ...prev, ...updates };
      
      // Save to persistence
      saveProgress(newState);
      
      return newState;
    });
  }, [saveProgress]);

  // Clear state and persistence
  const resetState = useCallback(() => {
    setState(initialState);
    clearProgress();
  }, [initialState, clearProgress]);

  return {
    state,
    updateState,
    resetState,
    clearProgress
  };
};