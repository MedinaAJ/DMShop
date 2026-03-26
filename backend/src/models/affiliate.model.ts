import { Table, Column, Model, DataType, CreatedAt, UpdatedAt, BelongsTo, ForeignKey } from 'sequelize-typescript';
import { User } from './user.model.js';

@Table({ tableName: 'dm_affiliates' })
export class Affiliate extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_user' })
  declare id_user: number;

  @BelongsTo(() => User, 'id_user')
  declare user: User;

  @Column({ type: DataType.STRING(50), unique: true, allowNull: false })
  declare code: string;

  @Column({ type: DataType.DECIMAL(5, 2), allowNull: false, defaultValue: 5.00 })
  declare commission_rate: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false, defaultValue: 0.00 })
  declare total_earned: number;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare active: boolean;

  @CreatedAt
  @Column({ type: DataType.DATE, field: 'created_at' })
  declare created_at: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE, field: 'updated_at' })
  declare updated_at: Date;
}
