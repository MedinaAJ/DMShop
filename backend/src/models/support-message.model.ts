import { Table, Column, Model, DataType, BelongsTo, ForeignKey } from 'sequelize-typescript';
import { User } from './user.model.js';
import { SupportTicket } from './support-ticket.model.js';

@Table({ tableName: 'dm_support_messages', timestamps: true, underscored: true, updatedAt: false })
export class SupportMessage extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @ForeignKey(() => SupportTicket)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_ticket' })
  declare id_ticket: number;

  @BelongsTo(() => SupportTicket, 'id_ticket')
  declare ticket: SupportTicket;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_user' })
  declare id_user: number;

  @BelongsTo(() => User, 'id_user')
  declare user: User;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare message: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false, field: 'is_admin' })
  declare is_admin: boolean;

  @Column({ type: DataType.DATE, field: 'created_at' })
  declare createdAt: Date;
}
