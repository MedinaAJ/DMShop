import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  CreatedAt,
} from 'sequelize-typescript';
import { Order } from './order.model.js';
import { Currency } from './currency.model.js';

@Table({ tableName: 'order_payments', updatedAt: false })
export class OrderPayment extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @ForeignKey(() => Order)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_order' })
  declare id_order: number;

  @Column({ type: DataType.STRING(64), allowNull: false, field: 'payment_method' })
  declare payment_method: string;

  @Column({ type: DataType.STRING(255), allowNull: true, field: 'transaction_id' })
  declare transaction_id: string | null;

  @Column({ type: DataType.DECIMAL(20, 6), allowNull: false })
  declare amount: number;

  @ForeignKey(() => Currency)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_currency' })
  declare id_currency: number;

  @BelongsTo(() => Order, 'id_order')
  declare order: Order;

  @BelongsTo(() => Currency, 'id_currency')
  declare currency: Currency;

  @CreatedAt
  @Column({ type: DataType.DATE, field: 'created_at' })
  declare created_at: Date;
}
