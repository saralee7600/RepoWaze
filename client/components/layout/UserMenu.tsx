'use client';

import { LogOut } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { LOGIN_PATH } from '@/lib/auth/paths';

function getInitials(name: string): string {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '');
  return letters.join('') || '?';
}

/** Signed-in user's identity plus a sign-out action, driven by the NextAuth session. */
export function UserMenu() {
  const { data: session, status } = useSession();

  if (status === 'loading') return <Skeleton className="size-8 rounded-full" />;
  if (!session) return null;

  const label = session.user.name ?? session.user.email ?? 'Account';

  return (
    <div className="flex items-center gap-1.5">
      <span
        title={session.user.email ?? label}
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary ring-1 ring-primary/30"
      >
        {getInitials(label)}
      </span>
      <span className="hidden max-w-32 truncate text-sm text-muted-foreground xl:block">
        {label}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Sign out"
        title="Sign out"
        onClick={() => void signOut({ callbackUrl: LOGIN_PATH })}
      >
        <LogOut aria-hidden="true" />
      </Button>
    </div>
  );
}
