import { Skeleton } from '@/components/ui/skeleton';

export function ProjectDetailsSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-busy="true" aria-label="Loading project">
      <div className="space-y-4">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-8 w-72 max-w-full" />
        <Skeleton className="h-5 w-96 max-w-full" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-[min(640px,70dvh)] min-h-[360px] rounded-xl" />
      </div>
    </div>
  );
}
