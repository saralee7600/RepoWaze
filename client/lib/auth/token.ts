import { getSession } from 'next-auth/react';

export async function getAccessToken(): Promise<string | undefined> {
  try {
    if (typeof window === 'undefined') {
      const { getServerIdToken } = await import('./token.server');
      return await getServerIdToken();
    }
    const session = await getSession();
    return session?.error ? undefined : session?.idToken;
  } catch {
    return undefined;
  }
}
