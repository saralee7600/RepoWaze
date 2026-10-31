const DEFAULT_MESSAGE = 'We couldn’t sign you in. Please try again.';

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  AccessDenied: 'Access was denied. Use an account that is allowed to sign in.',
  OAuthAccountNotLinked: 'This email is already linked to a different sign-in method.',
  Configuration: 'Sign-in is not configured correctly on the server.',
  SessionRequired: 'Please sign in to continue.',
  RefreshTokenError: 'Your session expired. Please sign in again.',
};

/** User-facing text for a NextAuth `?error=` code; `null` when there is no error. */
export function getAuthErrorMessage(code: string | string[] | undefined): string | null {
  const value = Array.isArray(code) ? code[0] : code;
  if (!value) return null;
  return AUTH_ERROR_MESSAGES[value] ?? DEFAULT_MESSAGE;
}
