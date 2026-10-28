'use client';

import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/config';

export type ApiStatus = 'checking' | 'connected' | 'disconnected';

const POLL_INTERVAL_MS = 15_000;
const REQUEST_TIMEOUT_MS = 4_000;

/**
 * Polls the API and reports whether it is reachable.
 *
 * `no-cors` is used on purpose: the server does not enable CORS, and we only
 * care whether a response arrives at all (an opaque response still resolves,
 * a network failure or timeout rejects).
 */
export function useApiStatus(): ApiStatus {
  const [status, setStatus] = useState<ApiStatus>('checking');

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      try {
        await fetch(`${API_BASE_URL}/projects`, {
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!cancelled) setStatus('connected');
      } catch {
        if (!cancelled) setStatus('disconnected');
      } finally {
        clearTimeout(timeout);
      }
    };

    void check();
    const interval = setInterval(() => void check(), POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return status;
}
