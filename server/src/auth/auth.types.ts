import type { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
  email?: string;
  name?: string;
  picture?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

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
