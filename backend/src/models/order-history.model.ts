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
import { OrderState } from './order-state.model.js';
import { User } from './user.model.js';

@Table({ tableName: 'order_history', updatedAt: false })
export class OrderHistory extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @ForeignKey(() => Order)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_order' })
  declare id_order: number;

  @ForeignKey(() => OrderState)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_order_state' })
  declare id_order_state: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: true, field: 'id_user' })
  declare id_user: number | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare comment: string | null;

  @BelongsTo(() => Order, 'id_order')
  declare order: Order;

  @BelongsTo(() => OrderState, 'id_order_state')
  declare orderState: OrderState;

  @BelongsTo(() => User, 'id_user')
  declare user: User | null;

  @CreatedAt
  @Column({ type: DataType.DATE, field: 'created_at' })
  declare created_at: Date;
}
