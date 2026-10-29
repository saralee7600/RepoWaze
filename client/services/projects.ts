import type { IImportProjectRequest } from '@repowaze/shared';
import type { ImportProjectResponse, ProjectDetails, ProjectSummary } from '@/types/api';
import { http } from './api';

export const projectsService = {
  /** Every imported project, newest first, with node and edge counts. */
  list: (signal?: AbortSignal) => http.get<ProjectSummary[]>('/projects', { signal }),

  /** A single project with its nodes and edges. Rejects with a 404 `ApiError` when missing. */
  getById: (id: number, signal?: AbortSignal) =>
    http.get<ProjectDetails>(`/projects/${id}`, { signal }),

  /** Imports a GitHub repository's TypeORM entities as a project graph. */
  importProject: (payload: IImportProjectRequest, signal?: AbortSignal) =>
    http.post<ImportProjectResponse>('/projects/import', payload, { signal }),
};
