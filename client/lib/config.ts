/**
 * Base URL of the NestJS API. The server listens on :3000, so the client's
 * `dev` and `start` scripts are pinned to :3001 to avoid a port clash.
 */
export const API_BASE_URL: string =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
