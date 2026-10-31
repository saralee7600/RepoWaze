/**
 * Copies only the listed keys, and only the ones actually present, from an untrusted request body.
 * Keeps clients from writing columns they shouldn't (`id`, `ownerId`, ...).
 */
export function pickDefined<T extends object, K extends keyof T>(
  source: Partial<T>,
  keys: readonly K[],
): Partial<Pick<T, K>> {
  const picked: Partial<Pick<T, K>> = {};
  for (const key of keys) {
    if (source[key] !== undefined) picked[key] = source[key];
  }
  return picked;
}
