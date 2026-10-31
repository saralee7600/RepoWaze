'use client';

import { useEffect, type ReactNode } from 'react';
import { SessionProvider, signOut, useSession } from 'next-auth/react';
import { LOGIN_PATH } from '@/lib/auth/paths';

/** Re-checking keeps the session cookie (and its Google ID token) renewed while the tab stays open. */
const SESSION_REFETCH_INTERVAL_SECONDS = 5 * 60;

/** Sends the user back to the login page once Google credentials can no longer be renewed. */
function SessionExpiryWatcher() {
  const { data: session } = useSession();
  const hasExpired = session?.error === 'RefreshTokenError';

  useEffect(() => {
    if (hasExpired) void signOut({ callbackUrl: `${LOGIN_PATH}?error=RefreshTokenError` });
  }, [hasExpired]);

  return null;
}

/** Makes the NextAuth session available to every client component via `useSession`. */
export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider refetchInterval={SESSION_REFETCH_INTERVAL_SECONDS}>
      <SessionExpiryWatcher />
      {children}
    </SessionProvider>
  );
}
