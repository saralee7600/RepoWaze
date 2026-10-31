/** Only same-site paths are honoured, so a crafted link can't bounce a user to another origin. */
export function safeCallbackUrl(value: string | string[] | null | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return '/';
  return raw;
}
