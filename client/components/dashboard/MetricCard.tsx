import type { LucideIcon } from 'lucide-react';
import { formatNumber } from '@/lib/format';

interface MetricCardProps {
  label: string;
  value: number;
  hint: string;
  icon: LucideIcon;
}

export function MetricCard({ label, value, hint, icon: Icon }: MetricCardProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="min-w-0">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums text-foreground">
          {formatNumber(value)}
        </p>
        <p className="mt-1 truncate text-xs text-muted-foreground">{hint}</p>
      </div>
      <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
        <Icon className="size-5" aria-hidden="true" />
      </span>
    </div>
  );
}
