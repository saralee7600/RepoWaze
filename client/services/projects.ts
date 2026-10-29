import type { IImportProjectRequest } from '@repowaze/shared';
import type { ImportProjectResponse } from '@/types/api';
import { http } from './api';

export const projectsService = {
  /** Imports a GitHub repository's TypeORM entities as a project graph. */
  importProject: (payload: IImportProjectRequest, signal?: AbortSignal) =>
    http.post<ImportProjectResponse>('/projects/import', payload, { signal }),
};
