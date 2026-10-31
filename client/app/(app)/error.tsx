'use client';

import { ErrorState } from '@/components/common/ErrorState';

export default function RouteError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <ErrorState
      message="An unexpected error occurred while rendering this page. Please try again."
      onRetry={retry}
    />
  );
}
