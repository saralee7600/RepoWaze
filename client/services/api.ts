import { getAccessToken } from '@/lib/auth/token';
import { API_BASE_URL } from '@/lib/config';
import type { ApiErrorBody } from '@/types/api';

/** `status` used for failures that never produced an HTTP response. */
export const NETWORK_ERROR_STATUS = 0;

/** Error thrown for every failed backend request (HTTP error or network failure). */
export class ApiError extends Error {
  readonly status: number;
  /** Individual messages when the server reported several (e.g. validation). */
  readonly details: readonly string[];

  constructor(status: number, message: string, details: readonly string[] = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }

  get isNetworkError(): boolean {
    return this.status === NETWORK_ERROR_STATUS;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/** Message safe to show to a user for any thrown value. */
export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) return error.message;
  if (error instanceof Error && error.message !== '') return error.message;
  return 'Something went wrong. Please try again.';
}

interface RequestOptions {
  /** JSON-serialisable request body. */
  body?: unknown;
  signal?: AbortSignal;
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

function isErrorBody(value: unknown): value is ApiErrorBody {
  return typeof value === 'object' && value !== null && 'message' in value;
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (text === '') return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function toApiError(response: Response, body: unknown): ApiError {
  if (isErrorBody(body)) {
    const details = Array.isArray(body.message) ? body.message : [body.message];
    return new ApiError(response.status, details.join('. '), details);
  }
  const fallback = response.statusText || `Request failed with status ${response.status}`;
  return new ApiError(response.status, typeof body === 'string' && body !== '' ? body : fallback);
}

async function request<TResponse>(
  method: HttpMethod,
  path: string,
  { body, signal }: RequestOptions = {},
): Promise<TResponse> {
  const accessToken = await getAccessToken();

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...(accessToken !== undefined && { Authorization: `Bearer ${accessToken}` }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store',
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError(
      NETWORK_ERROR_STATUS,
      'Cannot reach the server. Check that the API is running and try again.',
    );
  }

  const data = await parseBody(response);
  if (!response.ok) throw toApiError(response, data);
  return data as TResponse;
}

/** Centralised, typed HTTP client for the NestJS backend. */
export const http = {
  get: <TResponse>(path: string, options?: Omit<RequestOptions, 'body'>) =>
    request<TResponse>('GET', path, options),
  post: <TResponse>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) =>
    request<TResponse>('POST', path, { ...options, body }),
  put: <TResponse>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) =>
    request<TResponse>('PUT', path, { ...options, body }),
  delete: <TResponse = void>(path: string, options?: Omit<RequestOptions, 'body'>) =>
    request<TResponse>('DELETE', path, options),
};
