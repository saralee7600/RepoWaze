import { getServerSession } from 'next-auth';
import { authOptions } from './options';

/**
 * ID token of the signed-in user for server-side requests (server components, route handlers).
 * Only ever loaded through the `typeof window === 'undefined'` branch of `getAccessToken`;
 * `server-only` can't guard it because client components are also rendered on the server.
 */
export async function getServerIdToken(): Promise<string | undefined> {
  const session = await getServerSession(authOptions);
  return session?.error ? undefined : session?.idToken;
}
