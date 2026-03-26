import { Table, Column, Model, DataType, BelongsTo, ForeignKey } from 'sequelize-typescript';
import { User } from './user.model.js';

@Table({ tableName: 'dm_support_tickets', timestamps: true, underscored: true })
export class SupportTicket extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_user' })
  declare id_user: number;

  @BelongsTo(() => User, 'id_user')
  declare user: User;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare subject: string;

  @Column({
    type: DataType.ENUM('open', 'pending', 'closed'),
    allowNull: false,
    defaultValue: 'open',
  })
  declare status: 'open' | 'pending' | 'closed';

  @Column({ type: DataType.DATE, field: 'created_at' })
  declare createdAt: Date;

  @Column({ type: DataType.DATE, field: 'updated_at' })
  declare updatedAt: Date;
}
