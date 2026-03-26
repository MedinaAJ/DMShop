import { Table, Column, Model, DataType, BelongsTo, ForeignKey } from 'sequelize-typescript';
import { User } from './user.model.js';

@Table({ tableName: 'dm_quotes', timestamps: true, underscored: true })
export class Quote extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_user' })
  declare id_user: number;

  @BelongsTo(() => User, 'id_user')
  declare user: User;

  @Column({
    type: DataType.ENUM('pending', 'sent', 'accepted', 'rejected', 'expired'),
    allowNull: false,
    defaultValue: 'pending',
  })
  declare status: 'pending' | 'sent' | 'accepted' | 'rejected' | 'expired';

  @Column({ type: DataType.DATE, allowNull: true, field: 'expires_at' })
  declare expires_at: Date | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare notes: string | null;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false, defaultValue: 0 })
  declare total: number;

  @Column({ type: DataType.DATE, field: 'created_at' })
  declare createdAt: Date;

  @Column({ type: DataType.DATE, field: 'updated_at' })
  declare updatedAt: Date;
}
