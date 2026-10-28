'use client';

import { useApiStatus, type ApiStatus } from '@/hooks/useApiStatus';
import { API_BASE_URL } from '@/lib/config';
import { displayUrl } from '@/lib/format';
import { cn } from '@/lib/utils';

const STATUS_UI: Record<ApiStatus, { label: string; dot: string; pulse: boolean }> = {
  checking: { label: 'Checking API…', dot: 'bg-warning', pulse: true },
  connected: { label: 'API connected', dot: 'bg-success', pulse: false },
  disconnected: { label: 'API unreachable', dot: 'bg-destructive', pulse: false },
};

export function ApiStatusIndicator() {
  const status = useApiStatus();
  const ui = STATUS_UI[status];

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-3 rounded-lg border border-border bg-card/60 px-3 py-2.5"
    >
      <span className="relative flex size-2.5 shrink-0">
        {ui.pulse && (
          <span className={cn('absolute inline-flex size-full animate-ping rounded-full opacity-60', ui.dot)} />
        )}
        <span className={cn('relative inline-flex size-2.5 rounded-full', ui.dot)} />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-foreground">{ui.label}</p>
        <p dir="ltr" className="truncate text-start text-[11px] text-muted-foreground">
          {displayUrl(API_BASE_URL)}
        </p>
      </div>
    </div>
  );
}
