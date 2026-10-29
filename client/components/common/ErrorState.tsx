'use client';

import { useTransition, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, RotateCw, TriangleAlert } from 'lucide-react';
import { buttonStyles } from '@/components/ui/buttonStyles';

interface ErrorStateProps {
  title?: string;
  message: string;
  /**
   * Custom retry handler (e.g. the `retry` prop of an `error.tsx` boundary).
   * Defaults to re-running the current route's server data fetching.
   */
  onRetry?: () => void;
  /** Optional secondary link, e.g. back to the dashboard. */
  action?: { href: string; label: string; icon?: ReactNode };
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  action,
}: ErrorStateProps) {
  const router = useRouter();
  const [isRetrying, startTransition] = useTransition();

  const handleRetry = () => {
    if (onRetry) onRetry();
    else startTransition(() => router.refresh());
  };

  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center rounded-xl border border-dashed border-destructive/40 bg-card/40 px-6 py-16 text-center"
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <TriangleAlert className="size-6" aria-hidden="true" />
      </span>

      <h2 className="mt-4 text-base font-semibold text-foreground">{title}</h2>
      <p className="mt-1.5 max-w-md text-sm text-muted-foreground">{message}</p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={handleRetry}
          disabled={isRetrying}
          className={buttonStyles({ variant: 'outline' })}
        >
          {isRetrying ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <RotateCw className="size-4" aria-hidden="true" />
          )}
          Try again
        </button>
        {action && (
          <Link href={action.href} className={buttonStyles()}>
            {action.icon}
            {action.label}
          </Link>
        )}
      </div>
    </div>
  );
}
