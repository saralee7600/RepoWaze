import type { DefaultSession } from 'next-auth';

export type AuthError = 'RefreshTokenError';

declare module 'next-auth' {
  interface Session {
    idToken?: string;
    error?: AuthError;
    user: DefaultSession['user'] & {
      id: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    idToken?: string;
    refreshToken?: string;
    idTokenExpiresAt?: number;
    error?: AuthError;
  }
}
