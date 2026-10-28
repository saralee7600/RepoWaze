import type { IImportProjectRequest } from '@repowaze/shared';

/** Body of `POST /projects/import`. Validated in `ProjectsService`. */
export class ImportProjectDto implements IImportProjectRequest {
  repoUrl: string;
  name?: string;
}
