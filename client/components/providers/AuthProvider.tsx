'use client';

import { useEffect, type ReactNode } from 'react';
import { SessionProvider, signOut, useSession } from 'next-auth/react';
import { LOGIN_PATH } from '@/lib/auth/paths';

const SESSION_REFETCH_INTERVAL_SECONDS = 5 * 60;

function SessionExpiryWatcher() {
  const { data: session } = useSession();
  const hasExpired = session?.error === 'RefreshTokenError';

  useEffect(() => {
    if (hasExpired) void signOut({ callbackUrl: `${LOGIN_PATH}?error=RefreshTokenError` });
  }, [hasExpired]);

  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider refetchInterval={SESSION_REFETCH_INTERVAL_SECONDS}>
      <SessionExpiryWatcher />
      {children}
    </SessionProvider>
  );
}
