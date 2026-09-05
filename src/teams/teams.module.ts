import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Team } from '../models/team.model';
import { TeamMember } from '../models/team-member.model';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';
import { User } from 'src/models/user.model';

@Module({
  imports: [SequelizeModule.forFeature([Team, TeamMember, User])],
  controllers: [TeamsController],
  providers: [TeamsService],
})
export class TeamsModule {}
