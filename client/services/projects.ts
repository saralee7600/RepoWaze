import type { IImportProjectRequest } from '@repowaze/shared';
import type { ImportProjectResponse, ProjectDetails, ProjectSummary } from '@/types/api';
import { http } from './api';

export const projectsService = {
  list: (signal?: AbortSignal) => http.get<ProjectSummary[]>('/projects', { signal }),

  getById: (id: number, signal?: AbortSignal) =>
    http.get<ProjectDetails>(`/projects/${id}`, { signal }),

  remove: (id: number, signal?: AbortSignal) => http.delete(`/projects/${id}`, { signal }),

  importProject: (payload: IImportProjectRequest, signal?: AbortSignal) =>
    http.post<ImportProjectResponse>('/projects/import', payload, { signal }),

  sync: (id: number, signal?: AbortSignal) =>
    http.post<ProjectDetails>(`/projects/${id}/sync`, undefined, { signal }),
};
