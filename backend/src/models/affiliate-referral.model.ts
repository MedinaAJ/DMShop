import { Table, Column, Model, DataType, CreatedAt, BelongsTo, ForeignKey } from 'sequelize-typescript';
import { Affiliate } from './affiliate.model.js';
import { Order } from './order.model.js';

@Table({ tableName: 'dm_affiliate_referrals', updatedAt: false })
export class AffiliateReferral extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @ForeignKey(() => Affiliate)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_affiliate' })
  declare id_affiliate: number;

  @BelongsTo(() => Affiliate, 'id_affiliate')
  declare affiliate: Affiliate;

  @ForeignKey(() => Order)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_order' })
  declare id_order: number;

  @BelongsTo(() => Order, 'id_order')
  declare order: Order;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false, defaultValue: 0.00 })
  declare commission: number;

  @CreatedAt
  @Column({ type: DataType.DATE, field: 'created_at' })
  declare created_at: Date;
}
