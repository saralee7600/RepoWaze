import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import type { IImportProjectRequest } from '@repowaze/shared';

export class ImportProjectDto implements IImportProjectRequest {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  repoUrl: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;
}
