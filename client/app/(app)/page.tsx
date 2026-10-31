import { Suspense } from 'react';
import { DashboardContent } from '@/components/dashboard/DashboardContent';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';

export default function DashboardPage() {
  // The project list is fetched per request, so the shell prerenders and the data streams in.
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
