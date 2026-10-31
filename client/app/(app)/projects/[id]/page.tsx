import { Suspense } from 'react';
import { ProjectDetailsContent } from '@/components/projects/ProjectDetailsContent';
import { ProjectDetailsSkeleton } from '@/components/projects/ProjectDetailsSkeleton';

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<ProjectDetailsSkeleton />}>
      <ProjectDetailsContent params={params} />
    </Suspense>
  );
}
