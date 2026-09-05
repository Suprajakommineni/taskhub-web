import { SequelizeModule } from '@nestjs/sequelize';
import { Project } from '../models/project.model';
import { ProjectMember } from '../models/project-member.model';
import { User } from '../models/user.model';
import { Team } from '../models/team.model';
import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { TeamMember } from 'src/models/team-member.model';
import { ProjectTeam } from 'src/models/project-team.model';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Project,
      ProjectMember,
      User,
      Team,
      TeamMember,
      ProjectTeam,
    ]),
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
})
export class ProjectsModule {}
