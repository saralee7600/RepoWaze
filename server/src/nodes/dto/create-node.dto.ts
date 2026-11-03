import {
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateNodeDto {
  @IsInt()
  @Min(1)
  projectId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  label: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  type: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown> | null;
}
