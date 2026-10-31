import type { JWT } from 'next-auth/jwt';

const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

/** Renew this long before the real expiry so in-flight requests never carry a stale token. */
const EXPIRY_SKEW_MS = 60_000;

/** Google ID tokens live for an hour; used when the response omits `expires_in`. */
const DEFAULT_LIFETIME_SECONDS = 3600;

interface GoogleRefreshResponse {
  id_token?: string;
  expires_in?: number;
  refresh_token?: string;
}

export function isIdTokenFresh(token: JWT, now = Date.now()): boolean {
  return token.idTokenExpiresAt !== undefined && now < token.idTokenExpiresAt - EXPIRY_SKEW_MS;
}

/**
 * Trades the stored refresh token for a new Google ID token.
 * Never throws: failures are reported through `token.error` so the UI can ask the user to sign in again.
 */
export async function refreshIdToken(token: JWT): Promise<JWT> {
  if (!token.refreshToken) return { ...token, error: 'RefreshTokenError' };

  try {
    const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID ?? '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken,
      }),
      cache: 'no-store',
    });
    if (!response.ok) return { ...token, error: 'RefreshTokenError' };

    const data = (await response.json()) as GoogleRefreshResponse;
    if (!data.id_token) return { ...token, error: 'RefreshTokenError' };

    return {
      ...token,
      idToken: data.id_token,
      idTokenExpiresAt: Date.now() + (data.expires_in ?? DEFAULT_LIFETIME_SECONDS) * 1000,
      // Google only rotates the refresh token occasionally; keep the old one otherwise.
      refreshToken: data.refresh_token ?? token.refreshToken,
      error: undefined,
    };
  } catch {
    return { ...token, error: 'RefreshTokenError' };
  }
}
