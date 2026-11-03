import { IsNotEmpty, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateProjectDto {
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(255)
  repoUrl: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  repoName: string;
}
