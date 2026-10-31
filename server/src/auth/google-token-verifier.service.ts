import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { verify } from 'node:crypto';
import { GOOGLE_AUDIENCE } from './auth.constants';
import type {
  AuthenticatedUser,
  GoogleIdTokenClaims,
  JwtHeader,
} from './auth.types';
import { GoogleJwksService } from './google-jwks.service';

const GOOGLE_ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];
/** Tolerated difference between this server's clock and Google's. */
const CLOCK_SKEW_SECONDS = 30;

/** Validates Google-issued ID tokens (RS256 JWTs) without any third-party dependency. */
@Injectable()
export class GoogleTokenVerifierService {
  constructor(
    @Inject(GOOGLE_AUDIENCE) private readonly audience: string,
    private readonly jwks: GoogleJwksService,
  ) {}

  async verify(token: string): Promise<AuthenticatedUser> {
    const [encodedHeader, encodedClaims, encodedSignature, ...rest] =
      token.split('.');
    if (!encodedHeader || !encodedClaims || !encodedSignature || rest.length) {
      throw invalidToken();
    }

    const header = decodeSegment<JwtHeader>(encodedHeader);
    if (header.alg !== 'RS256' || typeof header.kid !== 'string') {
      throw invalidToken();
    }

    const key = await this.jwks.getKey(header.kid);
    if (!key) throw invalidToken();

    const isSignatureValid = verify(
      'RSA-SHA256',
      Buffer.from(`${encodedHeader}.${encodedClaims}`),
      key,
      Buffer.from(encodedSignature, 'base64url'),
    );
    if (!isSignatureValid) throw invalidToken();

    return this.toUser(decodeSegment<GoogleIdTokenClaims>(encodedClaims));
  }

  private toUser(claims: GoogleIdTokenClaims): AuthenticatedUser {
    const nowSeconds = Date.now() / 1000;
    const isExpired =
      typeof claims.exp !== 'number' ||
      claims.exp + CLOCK_SKEW_SECONDS < nowSeconds;

    if (
      isExpired ||
      claims.aud !== this.audience ||
      typeof claims.iss !== 'string' ||
      !GOOGLE_ISSUERS.includes(claims.iss) ||
      typeof claims.sub !== 'string' ||
      claims.sub === ''
    ) {
      throw invalidToken();
    }

    return {
      id: claims.sub,
      email: asOptionalString(claims.email),
      name: asOptionalString(claims.name),
      picture: asOptionalString(claims.picture),
    };
  }
}

function decodeSegment<T extends object>(segment: string): T {
  try {
    const value: unknown = JSON.parse(
      Buffer.from(segment, 'base64url').toString('utf8'),
    );
    if (typeof value === 'object' && value !== null) return value as T;
  } catch {
    // fall through to the rejection below
  }
  throw invalidToken();
}

function asOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

/** One generic message for every failure, so callers learn nothing about why a token was refused. */
function invalidToken(): UnauthorizedException {
  return new UnauthorizedException('Invalid or expired token');
}
