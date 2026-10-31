import { getServerSession } from 'next-auth';
import { authOptions } from './options';

export async function getServerIdToken(): Promise<string | undefined> {
  const session = await getServerSession(authOptions);
  return session?.error ? undefined : session?.idToken;
}
