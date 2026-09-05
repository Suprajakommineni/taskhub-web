import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from './models/user.model';
import { Project } from './models/project.model';
import { Task } from './models/task.model';
import { AuthModule } from './auth/auth.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProjectMember } from './models/project-member.model';
import { Team } from './models/team.model';
import { TeamMember } from './models/team-member.model';
import { TaskAssignee } from './models/task-assignee.model';
import { TeamsModule } from './teams/teams.module';
import { ProjectTeam } from './models/project-team.model';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    // DATABASE_URL was already used by sequelize-cli for migrations (config/config.json)
    // but the running app itself ignored it and always connected to a hardcoded local
    // DB — meaning it could never actually reach a deployed database. Fixed here.
    SequelizeModule.forRoot(
      process.env.DATABASE_URL
        ? {
            dialect: 'mysql',
            uri: process.env.DATABASE_URL,
            dialectOptions:
              process.env.DB_SSL === 'true'
                ? { ssl: { require: true, rejectUnauthorized: false } }
                : undefined,
            models: [
              User,
              Project,
              Task,
              ProjectMember,
              Team,
              TeamMember,
              TaskAssignee,
              ProjectTeam,
            ],
            autoLoadModels: true,
          }
        : {
            dialect: 'mysql',
            host: 'localhost',
            port: 3306,
            username: 'root',
            password: 'root',
            database: 'taskhub',
            models: [
              User,
              Project,
              Task,
              ProjectMember,
              Team,
              TeamMember,
              TaskAssignee,
              ProjectTeam,
            ],
            autoLoadModels: true,
          },
    ),
    AuthModule,
    ProjectsModule,
    TasksModule,
    TeamsModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
