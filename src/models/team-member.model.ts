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
import { Team } from './team.model';
import { User } from './user.model';

@Table
export class TeamMember extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @ForeignKey(() => Team)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare teamId: number;

  @BelongsTo(() => Team)
  declare team: Team;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare userId: number;

  @BelongsTo(() => User)
  declare user: User;

  @Column({
    type: DataType.ENUM('lead', 'member'),
    allowNull: false,
    defaultValue: 'member',
  })
  declare role: 'lead' | 'member';
}
