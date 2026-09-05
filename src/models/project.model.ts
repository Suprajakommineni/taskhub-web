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
import { Task } from './task.model';
import { ProjectMember } from './project-member.model';
import { Team } from './team.model';
import { ProjectTeam } from './project-team.model';

@Table
export class Project extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @Column({ type: DataType.STRING, allowNull: false })
  declare title: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare ownerId: number;

  @BelongsTo(() => User)
  declare owner: User;

  @BelongsToMany(() => Team, () => ProjectTeam)
  declare teams: Team[];

  @HasMany(() => Task)
  declare tasks: Task[];

  @HasMany(() => ProjectMember)
  declare members: ProjectMember[];
}
