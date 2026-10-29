'use client';

import { ErrorState } from '@/components/common/ErrorState';

/** Last-resort boundary for unexpected render errors; expected API failures are handled inline. */
export default function RouteError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <ErrorState
      message="An unexpected error occurred while rendering this page. Please try again."
      onRetry={retry}
    />
  );
}
