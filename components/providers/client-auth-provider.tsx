'use client';

import { AuthProvider } from '@/hooks/useUnifiedAuth';
import { ReactNode } from 'react';

export function ClientAuthProvider({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
