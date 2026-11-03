const ONE_MINUTE_MS = 60_000;

/** Applied to every route (per client IP). */
export const DEFAULT_THROTTLE = { ttl: ONE_MINUTE_MS, limit: 120 };

/** `POST /projects/import` triggers many GitHub API calls per request. */
export const IMPORT_THROTTLE = { ttl: ONE_MINUTE_MS, limit: 5 };
