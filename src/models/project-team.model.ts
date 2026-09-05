import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  PrimaryKey,
  AutoIncrement,
} from 'sequelize-typescript';
import { Project } from './project.model';
import { Team } from './team.model';

@Table
export class ProjectTeam extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @ForeignKey(() => Project)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare projectId: number;

  @BelongsTo(() => Project)
  declare project: Project;

  @ForeignKey(() => Team)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare teamId: number;

  @BelongsTo(() => Team)
  declare team: Team;
}
