import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { Order } from './order.model.js';
import { Carrier } from './carrier.model.js';

@Table({ tableName: 'order_carriers' })
export class OrderCarrier extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @ForeignKey(() => Order)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_order' })
  declare id_order: number;

  @ForeignKey(() => Carrier)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_carrier' })
  declare id_carrier: number;

  @Column({ type: DataType.STRING(64), allowNull: true, field: 'tracking_number' })
  declare tracking_number: string | null;

  @Column({ type: DataType.DECIMAL(10, 3), allowNull: false, defaultValue: 0 })
  declare weight: number;

  @Column({
    type: DataType.DECIMAL(20, 6),
    allowNull: false,
    defaultValue: 0,
    field: 'shipping_cost',
  })
  declare shipping_cost: number;

  @Column({
    type: DataType.DECIMAL(20, 6),
    allowNull: false,
    defaultValue: 0,
    field: 'shipping_cost_tax',
  })
  declare shipping_cost_tax: number;

  @BelongsTo(() => Order, 'id_order')
  declare order: Order;

  @BelongsTo(() => Carrier, 'id_carrier')
  declare carrier: Carrier;

  @CreatedAt
  @Column({ type: DataType.DATE, field: 'created_at' })
  declare created_at: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE, field: 'updated_at' })
  declare updated_at: Date;
}
