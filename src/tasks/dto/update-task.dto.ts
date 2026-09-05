import { IsString, IsOptional, MaxLength, IsIn, IsEnum } from 'class-validator';

export class UpdateTaskDto {
  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsIn(['todo', 'in_progress', 'review', 'completed'])
  status?: 'todo' | 'in_progress' | 'review' | 'completed';

  @IsOptional()
  @IsEnum(['low', 'medium', 'high'])
  priority?: 'low' | 'medium' | 'high';
}
