import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTeamMemberDto {
  @IsEmail()
  email!: string;

  @IsIn(['lead', 'member'])
  role!: 'lead' | 'member';
}

export class CreateTeamSpecDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  teamName!: string;

  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => CreateTeamMemberDto)
  members!: CreateTeamMemberDto[];
}

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => CreateTeamSpecDto)
  teams?: CreateTeamSpecDto[];
}
