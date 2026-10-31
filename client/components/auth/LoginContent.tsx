import { getAuthErrorMessage } from '@/lib/auth/errors';
import { safeCallbackUrl } from '@/lib/auth/callback-url';
import { LoginCard } from './LoginCard';

interface LoginContentProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function LoginContent({ searchParams }: LoginContentProps) {
  const params = await searchParams;

  return (
    <LoginCard
      callbackUrl={safeCallbackUrl(params.callbackUrl)}
      errorMessage={getAuthErrorMessage(params.error)}
    />
  );
}
