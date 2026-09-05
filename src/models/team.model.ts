import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
  BelongsToMany,
  PrimaryKey,
  AutoIncrement,
} from 'sequelize-typescript';
import { User } from './user.model';
import { TeamMember } from './team-member.model';
import { Project } from './project.model';
import { ProjectTeam } from './project-team.model';

@Table
export class Team extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @Column({ type: DataType.STRING, allowNull: false })
  declare name: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare ownerId: number;

  @BelongsTo(() => User)
  declare owner: User;

  @HasMany(() => TeamMember)
  declare members: TeamMember[];

  @BelongsToMany(() => Project, () => ProjectTeam)
  declare projects: Project[];
}
