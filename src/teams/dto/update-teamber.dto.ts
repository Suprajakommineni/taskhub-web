import { IsIn } from 'class-validator';

export class UpdateTeamMemberDto {
  @IsIn(['lead', 'member'])
  role!: 'lead' | 'member';
}
