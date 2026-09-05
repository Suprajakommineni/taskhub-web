import { IsEmail, IsIn } from 'class-validator';

export class AddTeamMemberdto {
  @IsEmail()
  email!: string;

  @IsIn(['lead', 'member'])
  role!: 'lead' | 'member';
}
