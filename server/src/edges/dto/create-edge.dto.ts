import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { RELATION_KINDS } from './relation-kinds';

export class CreateEdgeDto {
  @IsInt()
  @Min(1)
  projectId: number;

  @IsInt()
  @Min(1)
  sourceNodeId: number;

  @IsInt()
  @Min(1)
  targetNodeId: number;

  @IsIn(RELATION_KINDS)
  relationType: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  label?: string | null;
}
