import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { ErrorState } from '@/components/common/ErrorState';
import { getErrorMessage, isApiError } from '@/services/api';
import { projectsService } from '@/services/projects';
import type { ProjectDetails } from '@/types/api';
import { ProjectHeader } from './ProjectHeader';
import { ProjectTabs } from './ProjectTabs';

interface ProjectDetailsContentProps {
  /** The route's `params` promise, resolved here so the page shell can prerender. */
  params: Promise<{ id: string }>;
}

/** Route ids are positive integers; anything else can't match a project. */
function parseProjectId(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const id = Number(raw);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

/** Server component: loads one project with its graph on every request. */
export async function ProjectDetailsContent({ params }: ProjectDetailsContentProps) {
  const id = parseProjectId((await params).id);
  if (id === null) notFound();

  let project: ProjectDetails;
  try {
    project = await projectsService.getById(id);
  } catch (error) {
    if (isApiError(error) && error.status === 404) notFound();
    return (
      <ErrorState
        title="Couldn't load this project"
        message={getErrorMessage(error)}
        action={{
          href: '/',
          label: 'Back to projects',
          icon: <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />,
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <ProjectHeader
        repoName={project.repoName}
        repoUrl={project.repoUrl}
        createdAt={project.createdAt}
        nodeCount={project.nodes.length}
        edgeCount={project.edges.length}
      />
      <ProjectTabs project={project} />
    </div>
  );
}
