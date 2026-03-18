import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { OrderReturn } from './order-return.model.js';
import { OrderItem } from './order-item.model.js';

@Table({ tableName: 'order_return_items', timestamps: false })
export class OrderReturnItem extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @ForeignKey(() => OrderReturn)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_return' })
  declare id_return: number;

  @ForeignKey(() => OrderItem)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_order_item' })
  declare id_order_item: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 1 })
  declare quantity: number;

  @Column({ type: DataType.STRING(255), allowNull: true })
  declare reason: string | null;

  @BelongsTo(() => OrderReturn)
  declare orderReturn: OrderReturn;

  @BelongsTo(() => OrderItem)
  declare orderItem: OrderItem;
}
