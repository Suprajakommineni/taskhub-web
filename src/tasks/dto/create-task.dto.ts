import {
  IsInt,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsIn,
  MaxLength,
  IsArray,
  ArrayMaxSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class TaskAssigneeDto {
  @IsInt()
  teamMemberId!: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roleInTask?: string[];
}

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description!: string;

  @IsInt()
  projectId!: number;

  @IsOptional()
  @IsIn(['todo', 'in_progress', 'review', 'completed'])
  status?: 'todo' | 'in_progress' | 'review' | 'completed';

  @IsOptional()
  @IsIn(['low', 'medium', 'high'])
  priority?: 'low' | 'medium' | 'high';

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => TaskAssigneeDto)
  assignees?: TaskAssigneeDto[];
}
