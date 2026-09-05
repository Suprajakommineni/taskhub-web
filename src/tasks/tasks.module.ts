import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Task } from '../models/task.model';
import { Project } from '../models/project.model';
import { TaskAssignee } from '../models/task-assignee.model';
import { TeamMember } from '../models/team-member.model';
import { ProjectTeam } from '../models/project-team.model';
import { User } from '../models/user.model';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Task,
      Project,
      TaskAssignee,
      TeamMember,
      ProjectTeam,
      User,
    ]),
  ],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
