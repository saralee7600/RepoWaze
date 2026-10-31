import { getAuthErrorMessage } from '@/lib/auth/errors';
import { safeCallbackUrl } from '@/lib/auth/callback-url';
import { LoginCard } from './LoginCard';

interface LoginContentProps {
  /** The route's `searchParams` promise, resolved here so the page shell can prerender. */
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** Server component: turns the `callbackUrl` / `error` query params into props for the card. */
export async function LoginContent({ searchParams }: LoginContentProps) {
  const params = await searchParams;

  return (
    <LoginCard
      callbackUrl={safeCallbackUrl(params.callbackUrl)}
      errorMessage={getAuthErrorMessage(params.error)}
    />
  );
}
