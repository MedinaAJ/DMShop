import { Table, Column, Model, DataType, ForeignKey, CreatedAt } from 'sequelize-typescript';
import { User } from './user.model.js';
import { Order } from './order.model.js';

/**
 * LoyaltyPoint — records of loyalty points earned or spent by a user.
 * source: 'order' | 'refund' | 'redemption' | 'manual'
 */
@Table({ tableName: 'dm_loyalty_points', timestamps: false })
export class LoyaltyPoint extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_user' })
  declare id_user: number;

  /** Points delta — positive = earned, negative = spent */
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare points: number;

  /** Source of the transaction */
  @Column({ type: DataType.STRING(32), allowNull: false })
  declare source: 'order' | 'refund' | 'redemption' | 'manual';

  @ForeignKey(() => Order)
  @Column({ type: DataType.INTEGER, allowNull: true, field: 'id_order' })
  declare id_order: number | null;

  @CreatedAt
  @Column({ type: DataType.DATE, field: 'created_at' })
  declare created_at: Date;
}
