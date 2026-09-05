import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class UpdateProjectDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title!: string;
}
