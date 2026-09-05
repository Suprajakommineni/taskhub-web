import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Task } from '../models/task.model';
import { Project } from '../models/project.model';
import { TaskAssignee } from '../models/task-assignee.model';
import { TeamMember } from '../models/team-member.model';
import { ProjectTeam } from '../models/project-team.model';
import { UpdateTaskDto } from './dto/update-task.dto';
import { User } from '../models/user.model';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task)
    private taskModel: typeof Task,
    @InjectModel(Project)
    private projectModel: typeof Project,
    @InjectModel(TaskAssignee)
    private taskAssigneeModel: typeof TaskAssignee,
    @InjectModel(TeamMember)
    private teamMemberModel: typeof TeamMember,
    @InjectModel(ProjectTeam)
    private projectTeamModel: typeof ProjectTeam,
    @InjectModel(User)
    private userModel: typeof User,
  ) {}

  async create(
    title: string,
    description: string,
    projectId: number,
    ownerId: number,
    status?: string,
    assignees: { teamMemberId: number; roleInTask?: string[] }[] = [],
    priority?: 'low' | 'medium' | 'high',
  ) {
    const project = await this.checkProjectOwnership(projectId, ownerId);
    const task = await this.taskModel.create({
      title,
      description,
      projectId,
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
    });

    if (assignees.length > 0) {
      await this.assignMembers(task.id, ownerId, assignees, project);
    }

    return task;
  }

  async findAllForProject(projectId: number, ownerId: number) {
    await this.checkProjectOwnership(projectId, ownerId);
    return this.taskModel.findAll({
      where: { projectId },
      include: [
        {
          model: this.taskAssigneeModel,
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
  }

  async update(id: number, ownerId: number, data: UpdateTaskDto) {
    const task = await this.findTaskAndCheckOwnership(id, ownerId);
    return task.update(data);
  }

  async remove(id: number, ownerId: number) {
    const task = await this.findTaskAndCheckOwnership(id, ownerId);
    await task.destroy();
    return task;
  }

  async assignMembers(
    taskId: number,
    ownerId: number,
    assignees: { teamMemberId: number; roleInTask?: string[] }[],
    projectOverride?: Project,
  ) {
    const task = await this.findTaskAndCheckOwnership(taskId, ownerId);
    const project =
      projectOverride ?? (await this.projectModel.findByPk(task.projectId))!;

    const projectTeamLinks = await this.projectTeamModel.findAll({
      where: { projectId: project.id },
      attributes: ['teamId'],
    });
    const projectTeamIds = projectTeamLinks.map((l) => l.teamId);

    if (projectTeamIds.length === 0) {
      throw new BadRequestException('This project has no teams assigned');
    }

    const uniqueAssignees = [
      ...new Map(assignees.map((a) => [a.teamMemberId, a])).values(),
    ];
    const requestedIds = uniqueAssignees.map((a) => a.teamMemberId);

    // Two queries total, regardless of how many people are being assigned —
    // previously this was two queries PER assignee (a findByPk + a findOne
    // inside the loop), which is invisible on a local DB but adds real
    // round-trip latency per assignee once the database isn't on localhost.
    const members = await this.teamMemberModel.findAll({
      where: { id: { [Op.in]: requestedIds } },
    });
    const memberById = new Map(members.map((m) => [m.id, m]));

    const existingAssignees = await this.taskAssigneeModel.findAll({
      where: { taskId, teamMemberId: { [Op.in]: requestedIds } },
      attributes: ['teamMemberId'],
    });
    const alreadyAssignedIds = new Set(existingAssignees.map((a) => a.teamMemberId));

    const toCreate: { taskId: number; teamMemberId: number; roleInTask?: string[] }[] = [];
    for (const { teamMemberId, roleInTask } of uniqueAssignees) {
      const member = memberById.get(teamMemberId);
      if (!member) {
        throw new NotFoundException(`Team member ${teamMemberId} not found`);
      }
      if (!projectTeamIds.includes(member.teamId)) {
        throw new ForbiddenException(
          `Team member ${teamMemberId} does not belong to one of this project's teams`,
        );
      }
      if (!alreadyAssignedIds.has(teamMemberId)) {
        toCreate.push({ taskId, teamMemberId, roleInTask });
      }
    }

    if (toCreate.length > 0) {
      await this.taskAssigneeModel.bulkCreate(toCreate);
    }

    return this.taskAssigneeModel.findAll({
      where: { taskId },
      include: [this.teamMemberModel],
    });
  }

  async unassignMember(taskId: number, teamMemberId: number, ownerId: number) {
    await this.findTaskAndCheckOwnership(taskId, ownerId);
    const assignee = await this.taskAssigneeModel.findOne({
      where: { taskId, teamMemberId },
    });
    if (!assignee) {
      throw new NotFoundException('This member is not assigned to the task');
    }
    await assignee.destroy();
    return assignee;
  }

  private async checkProjectOwnership(projectId: number, ownerId: number) {
    const project = await this.projectModel.findByPk(projectId);
    if (!project) throw new NotFoundException('Project not found');
    if (project.ownerId !== ownerId)
      throw new ForbiddenException('Not your project');
    return project;
  }

  private async findTaskAndCheckOwnership(id: number, ownerId: number) {
    const task = await this.taskModel.findByPk(id);
    if (!task) throw new NotFoundException('Task not found');
    await this.checkProjectOwnership(task.projectId, ownerId);
    return task;
  }
}
