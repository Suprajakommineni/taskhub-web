import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { TeamMember } from 'src/models/team-member.model';
import { Team } from 'src/models/team.model';
import { User } from 'src/models/user.model';

@Injectable()
export class TeamsService {
  constructor(
    @InjectModel(Team)
    private teamModel: typeof Team,
    @InjectModel(TeamMember)
    private teamMemberModel: typeof TeamMember,
    @InjectModel(User)
    private userModel: typeof User,
  ) {}
  async create(name: string, ownerId: number) {
    return this.teamModel.create({ name, ownerId });
  }
  findAll(ownerId: number) {
    return this.teamModel.findAll({
      where: { ownerId },
      include: [{ model: this.teamMemberModel }],
    });
  }
  async findOne(id: number, ownerId: number) {
    const team = await this.teamModel.findByPk(id, {
      include: [{ model: this.teamMemberModel }],
    });
    if (!team) {
      throw new NotFoundException('Team not found');
    }
    if (team.ownerId !== ownerId) {
      throw new ForbiddenException('Not your team');
    }
    return team;
  }
  async update(id: number, name: string, ownerId: number) {
    const team = await this.findOne(id, ownerId);
    return team.update({ name });
  }
  async remove(id: number, ownerId: number) {
    const team = await this.findOne(id, ownerId);
    await team.destroy();
    return team;
  }
  async addMember(
    teamId: number,
    ownerId: number,
    data: {
      email: string;
      role: 'lead' | 'member';
    },
    photoUrl?: string,
  ) {
    await this.findOne(teamId, ownerId);
    const user = await this.userModel.findOne({
      where: { email: data.email.trim().toLowerCase() },
    });
    if (!user) {
      throw new BadRequestException(`User ${data.email} not found`);
    }

    // Only fills in a blank avatar — never overwrites a photo the member
    // already set for themselves in their own account.
    if (photoUrl && !user.profilePhoto) {
      user.profilePhoto = photoUrl;
      await user.save();
    }

    return this.teamMemberModel.create({
      teamId,
      userId: user.id,
      role: data.role,
    });
  }
  async updateMember(
    teamId: number,
    memberId: number,
    ownerId: number,
    data: { role: 'lead' | 'member' },
  ) {
    await this.findOne(teamId, ownerId);
    const member = await this.teamMemberModel.findOne({
      where: { id: memberId, teamId },
    });
    if (!member) {
      throw new NotFoundException('Team member not found');
    }
    return member.update(data);
  }

  async removeMember(teamId: number, memberId: number, ownerId: number) {
    await this.findOne(teamId, ownerId);
    const member = await this.teamMemberModel.findOne({
      where: { id: memberId, teamId },
    });
    if (!member) {
      throw new NotFoundException('Team member not found');
    }
    await member.destroy();
    return member;
  }
}
