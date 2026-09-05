import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
  PrimaryKey,
  AutoIncrement,
} from 'sequelize-typescript';
import { Project } from './project.model';
import { TaskAssignee } from './task-assignee.model';

@Table
export class Task extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @Column({ type: DataType.STRING, allowNull: false })
  declare title: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare description?: string;

  @Column({
    type: DataType.ENUM('todo', 'in_progress', 'review', 'completed'),
    allowNull: false,
    defaultValue: 'todo',
  })
  declare status: 'todo' | 'in_progress' | 'review' | 'completed';

  @Column({
    type: DataType.ENUM('low', 'medium', 'high'),
    allowNull: false,
    defaultValue: 'medium',
  })
  declare priority: 'low' | 'medium' | 'high';
  @ForeignKey(() => Project)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare projectId: number;

  @BelongsTo(() => Project)
  declare project: Project;

  @HasMany(() => TaskAssignee)
  declare assignees: TaskAssignee[];
}
