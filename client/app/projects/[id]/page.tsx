import { Suspense } from 'react';
import { ProjectDetailsContent } from '@/components/projects/ProjectDetailsContent';
import { ProjectDetailsSkeleton } from '@/components/projects/ProjectDetailsSkeleton';

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  // `params` is passed down unresolved so the skeleton prerenders and the data streams in.
  return (
    <Suspense fallback={<ProjectDetailsSkeleton />}>
      <ProjectDetailsContent params={params} />
    </Suspense>
  );
}
