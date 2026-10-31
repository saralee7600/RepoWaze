import { ErrorState } from '@/components/common/ErrorState';
import { getErrorMessage } from '@/services/api';
import { projectsService } from '@/services/projects';
import type { ProjectSummary } from '@/types/api';
import { DashboardView } from './DashboardView';

export async function DashboardContent() {
  let projects: ProjectSummary[];
  try {
    projects = await projectsService.list();
  } catch (error) {
    return <ErrorState title="Couldn't load your projects" message={getErrorMessage(error)} />;
  }

  return <DashboardView projects={projects} />;
}
