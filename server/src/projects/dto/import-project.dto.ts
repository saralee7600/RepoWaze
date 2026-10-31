import type { IImportProjectRequest } from '@repowaze/shared';

export class ImportProjectDto implements IImportProjectRequest {
  repoUrl: string;
  name?: string;
}
