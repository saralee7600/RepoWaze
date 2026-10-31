import type { Request } from 'express';

/** The signed-in user, derived from a verified Google ID token. */
export interface AuthenticatedUser {
  /** Stable Google account id (`sub`). */
  id: string;
  email?: string;
  name?: string;
  picture?: string;
}

/** Request after `AuthGuard` has accepted it. */
export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

/** The subset of Google ID token claims the API reads. */
export interface GoogleIdTokenClaims {
  iss?: unknown;
  aud?: unknown;
  sub?: unknown;
  exp?: unknown;
  email?: unknown;
  name?: unknown;
  picture?: unknown;
}

export interface JwtHeader {
  alg?: unknown;
  kid?: unknown;
}
