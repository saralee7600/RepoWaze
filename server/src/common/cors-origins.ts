const DEFAULT_CORS_ORIGINS = [
  'http://localhost:3001',
  'https://repo-waze-three.vercel.app',
];

/**
 * Parses a comma-separated list of allowed origins (e.g. the `CORS_ORIGINS`
 * env var). Trailing slashes are stripped because browsers send the `Origin`
 * header without one. Falls back to local dev + the production Vercel app.
 */
export function resolveCorsOrigins(raw: string | undefined): string[] {
  const origins = (raw ?? '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter((origin) => origin !== '');

  return origins.length > 0 ? origins : DEFAULT_CORS_ORIGINS;
}
