import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createPublicKey, type JsonWebKey, type KeyObject } from 'node:crypto';

const GOOGLE_JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const DEFAULT_TTL_MS = 60 * 60 * 1000;
/** An unknown `kid` may mean Google rotated keys, but must not let callers force a fetch per request. */
const MIN_REFETCH_INTERVAL_MS = 60 * 1000;

interface JwksResponse {
  keys?: (JsonWebKey & { kid?: string })[];
}

/** Google's public signing keys, cached for as long as Google allows. */
@Injectable()
export class GoogleJwksService {
  private readonly logger = new Logger(GoogleJwksService.name);
  private keys = new Map<string, KeyObject>();
  private expiresAt = 0;
  private lastFetchAt = 0;
  private inflight: Promise<void> | null = null;

  async getKey(kid: string): Promise<KeyObject | undefined> {
    const now = Date.now();
    const cached = this.keys.get(kid);
    if (cached && now < this.expiresAt) return cached;

    const isStale = now >= this.expiresAt;
    const mayRefetch = now - this.lastFetchAt >= MIN_REFETCH_INTERVAL_MS;
    if (isStale || mayRefetch) await this.refresh();

    return this.keys.get(kid);
  }

  private refresh(): Promise<void> {
    this.inflight ??= this.fetchKeys().finally(() => {
      this.inflight = null;
    });
    return this.inflight;
  }

  private async fetchKeys(): Promise<void> {
    this.lastFetchAt = Date.now();
    try {
      const response = await fetch(GOOGLE_JWKS_URL);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const body = (await response.json()) as JwksResponse;
      const next = new Map<string, KeyObject>();
      for (const jwk of body.keys ?? []) {
        if (jwk.kid)
          next.set(jwk.kid, createPublicKey({ key: jwk, format: 'jwk' }));
      }

      this.keys = next;
      this.expiresAt =
        Date.now() + parseMaxAgeMs(response.headers.get('cache-control'));
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.error(`Could not load Google signing keys: ${reason}`);
      // Keep serving previously fetched keys; only fail when there is nothing to verify against.
      if (this.keys.size === 0) {
        throw new ServiceUnavailableException(
          'Unable to verify credentials right now',
        );
      }
    }
  }
}

function parseMaxAgeMs(cacheControl: string | null): number {
  const match = /max-age=(\d+)/.exec(cacheControl ?? '');
  return match ? Number(match[1]) * 1000 : DEFAULT_TTL_MS;
}
