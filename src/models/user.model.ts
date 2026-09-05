import {
  Table,
  Column,
  Model,
  DataType,
  HasMany,
  PrimaryKey,
  AutoIncrement,
} from 'sequelize-typescript';
import { Project } from './project.model';
import { Team } from './team.model';
import { TeamMember } from './team-member.model';

@Table
export class User extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @Column({ type: DataType.STRING, allowNull: false })
  declare username: string;

  @Column({ type: DataType.STRING, unique: true, allowNull: false })
  declare email: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare passwordHash?: string;

  @Column({ type: DataType.STRING, unique: true, allowNull: true })
  declare googleId?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare profilePhoto?: string;

  @HasMany(() => Project)
  declare projects: Project[];

  @HasMany(() => Team)
  declare teams: Team[];

  @HasMany(() => TeamMember)
  declare teamMembers: TeamMember[];
}
