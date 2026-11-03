import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { RELATION_KINDS } from './relation-kinds';

export class UpdateEdgeDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  projectId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  sourceNodeId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  targetNodeId?: number;

  @IsOptional()
  @IsIn(RELATION_KINDS)
  relationType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  label?: string | null;
}
