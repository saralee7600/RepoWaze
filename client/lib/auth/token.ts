import { getSession } from 'next-auth/react';

/**
 * Bearer token for API requests, resolved wherever the request originates:
 * the session cookie on the server, `/api/auth/session` in the browser.
 * Resolves to `undefined` when signed out; the API then answers 401.
 */
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
