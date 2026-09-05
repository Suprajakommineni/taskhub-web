import { IsNotEmpty, MaxLength, IsString } from 'class-validator';

export class CreateTeamDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;
}
