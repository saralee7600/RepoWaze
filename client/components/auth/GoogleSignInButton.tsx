'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { GoogleIcon } from './GoogleIcon';

interface GoogleSignInButtonProps {
  callbackUrl: string;
  disabled?: boolean;
}

export function GoogleSignInButton({ callbackUrl, disabled = false }: GoogleSignInButtonProps) {
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleClick = () => {
    setIsRedirecting(true);
    // Leaves the app for Google's consent screen; the page unloads, so there is no state to reset.
    void signIn('google', { callbackUrl });
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className="h-10 w-full"
      onClick={handleClick}
      disabled={disabled || isRedirecting}
    >
      {isRedirecting ? (
        <Loader2 className="animate-spin" aria-hidden="true" />
      ) : (
        <GoogleIcon className="size-4" />
      )}
      {isRedirecting ? 'Redirecting to Google…' : 'Sign in with Google'}
    </Button>
  );
}
