import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Project } from '../models/project.model';
import { ProjectMember } from '../models/project-member.model';
import { Team } from '../models/team.model';
import { TeamMember } from '../models/team-member.model';
import { ProjectTeam } from '../models/project-team.model';
import { User } from '../models/user.model';
import { CreateTeamSpecDto } from './dto/create-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project)
    private readonly projectModel: typeof Project,

    @InjectModel(ProjectMember)
    private readonly projectMemberModel: typeof ProjectMember,

    @InjectModel(User)
    private readonly userModel: typeof User,

    @InjectModel(Team)
    private readonly teamModel: typeof Team,

    @InjectModel(TeamMember)
    private readonly teamMemberModel: typeof TeamMember,

    @InjectModel(ProjectTeam)
    private readonly projectTeamModel: typeof ProjectTeam,
  ) {}

  async create(
    title: string,
    ownerId: number,
    teams: CreateTeamSpecDto[] = [],
  ) {
    // Validate every invited email, across every team, before creating anything
    const usersByEmail = new Map<string, User>();
    for (const teamSpec of teams) {
      for (const member of teamSpec.members) {
        const email = member.email.trim().toLowerCase();
        if (!usersByEmail.has(email)) {
          const user = await this.userModel.findOne({ where: { email } });
          if (!user) {
            throw new BadRequestException(`User ${email} not found`);
          }
          usersByEmail.set(email, user);
        }
      }
    }

    const project = await this.projectModel.create({ title, ownerId });

    await this.projectMemberModel.create({
      projectId: project.id,
      userId: ownerId,
      role: 'owner',
    });
    const addedProjectMemberIds = new Set<number>([ownerId]);

    for (const teamSpec of teams) {
      const team = await this.teamModel.create({
        name: teamSpec.teamName,
        ownerId,
      });

      await this.projectTeamModel.create({
        projectId: project.id,
        teamId: team.id,
      });

      const uniqueMembers = [
        ...new Map(
          teamSpec.members.map((m) => [m.email.trim().toLowerCase(), m]),
        ).values(),
      ];

      for (const member of uniqueMembers) {
        const email = member.email.trim().toLowerCase();
        const user = usersByEmail.get(email)!;

        if (user.id !== ownerId) {
          await this.teamMemberModel.create({
            teamId: team.id,
            userId: user.id,
            role: member.role,
          });
        }

        if (!addedProjectMemberIds.has(user.id)) {
          await this.projectMemberModel.create({
            projectId: project.id,
            userId: user.id,
            role: 'member',
          });
          addedProjectMemberIds.add(user.id);
        }
      }
    }

    return project;
  }

  async addTeamToProject(
    projectId: number,
    ownerId: number,
    teamName: string,
    members: CreateTeamSpecDto['members'] = [],
  ) {
    const project = await this.findProjectAndCheckOwnership(projectId, ownerId);

    const usersByEmail = new Map<string, User>();
    for (const member of members) {
      const email = member.email.trim().toLowerCase();
      const user = await this.userModel.findOne({ where: { email } });
      if (!user) {
        throw new BadRequestException(`User ${email} not found`);
      }
      usersByEmail.set(email, user);
    }

    const team = await this.teamModel.create({ name: teamName, ownerId });

    await this.projectTeamModel.create({
      projectId: project.id,
      teamId: team.id,
    });

    const uniqueMembers = [
      ...new Map(
        members.map((m) => [m.email.trim().toLowerCase(), m]),
      ).values(),
    ];

    for (const member of uniqueMembers) {
      const email = member.email.trim().toLowerCase();
      const user = usersByEmail.get(email)!;

      if (user.id !== ownerId) {
        await this.teamMemberModel.create({
          teamId: team.id,
          userId: user.id,
          role: member.role,
        });
      }

      const existingMembership = await this.projectMemberModel.findOne({
        where: { projectId: project.id, userId: user.id },
      });
      if (!existingMembership) {
        await this.projectMemberModel.create({
          projectId: project.id,
          userId: user.id,
          role: 'member',
        });
      }
    }

    return team;
  }

  async findAll(userId: number) {
    const memberships = await this.teamMemberModel.findAll({
      where: { userId },
      attributes: ['teamId'],
    });
    const teamIds = memberships.map((m) => m.teamId);

    let projectIdsViaTeams: number[] = [];
    if (teamIds.length > 0) {
      const links = await this.projectTeamModel.findAll({
        where: { teamId: { [Op.in]: teamIds } },
        attributes: ['projectId'],
      });
      projectIdsViaTeams = links.map((l) => l.projectId);
    }

    const teamsInclude = {
      model: this.teamModel,
      through: { attributes: [] },
      include: [
        {
          model: this.teamMemberModel,
          include: [
            {
              model: this.userModel,
              attributes: ['id', 'username', 'email', 'profilePhoto'],
            },
          ],
        },
      ],
    };

    if (projectIdsViaTeams.length === 0) {
      return this.projectModel.findAll({
        where: { ownerId: userId },
        include: [teamsInclude],
      });
    }

    return this.projectModel.findAll({
      where: {
        [Op.or]: [{ ownerId: userId }, { id: { [Op.in]: projectIdsViaTeams } }],
      },
      include: [teamsInclude],
    });
  }

  async findOne(id: number, userId: number) {
    const project = await this.projectModel.findByPk(id, {
      include: [
        {
          model: this.teamModel,
          through: { attributes: [] },
          include: [
            {
              model: this.teamMemberModel,
              include: [
                {
                  model: this.userModel,
                  attributes: ['id', 'username', 'email', 'profilePhoto'],
                },
              ],
            },
          ],
        },
      ],
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.ownerId === userId) {
      return project;
    }

    const teamLinks = await this.projectTeamModel.findAll({
      where: { projectId: id },
      attributes: ['teamId'],
    });
    const teamIds = teamLinks.map((l) => l.teamId);

    if (teamIds.length > 0) {
      const membership = await this.teamMemberModel.findOne({
        where: { teamId: { [Op.in]: teamIds }, userId },
      });
      if (membership) {
        return project;
      }
    }

    throw new ForbiddenException('You are not a member of this project team');
  }

  async update(id: number, title: string, ownerId: number) {
    const project = await this.findProjectAndCheckOwnership(id, ownerId);
    return project.update({ title });
  }

  async remove(id: number, ownerId: number) {
    const project = await this.findProjectAndCheckOwnership(id, ownerId);
    await project.destroy();
    return project;
  }

  async getMembers(projectId: number, requesterId: number) {
    await this.findOne(projectId, requesterId);

    return this.projectMemberModel.findAll({
      where: { projectId },
      include: [
        {
          model: this.userModel,
          attributes: ['id', 'username', 'email', 'profilePhoto'],
        },
      ],
    });
  }

  private async findProjectAndCheckOwnership(id: number, ownerId: number) {
    const project = await this.projectModel.findByPk(id);

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.ownerId !== ownerId) {
      throw new ForbiddenException(
        'Only the project owner can edit this project',
      );
    }

    return project;
  }
}
