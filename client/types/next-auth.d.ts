import type { DefaultSession } from 'next-auth';

/** Set on the token/session when the Google credentials can no longer be renewed. */
export type AuthError = 'RefreshTokenError';

declare module 'next-auth' {
  interface Session {
    /** Google ID token (JWT) sent to the API as `Authorization: Bearer <token>`. */
    idToken?: string;
    error?: AuthError;
    user: DefaultSession['user'] & {
      /** Stable Google account id (`sub`). */
      id: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    idToken?: string;
    refreshToken?: string;
    /** Epoch milliseconds at which `idToken` stops being valid. */
    idTokenExpiresAt?: number;
    error?: AuthError;
  }
}
