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
import { Task } from './task.model';
import { TeamMember } from './team-member.model';

@Table
export class TaskAssignee extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @ForeignKey(() => Task)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare taskId: number;

  @BelongsTo(() => Task)
  declare task: Task;

  @ForeignKey(() => TeamMember)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare teamMemberId: number;

  @BelongsTo(() => TeamMember)
  declare teamMember: TeamMember;

  @Column({
    type: DataType.JSON,
  })
  declare roleInTask: string[];
}
