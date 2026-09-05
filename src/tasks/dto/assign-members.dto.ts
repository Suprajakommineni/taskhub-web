import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
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

export class AssignMembersDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => TaskAssigneeDto)
  assignees!: TaskAssigneeDto[];
}
