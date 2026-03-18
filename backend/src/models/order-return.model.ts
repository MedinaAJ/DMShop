import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { Order } from './order.model.js';
import { User } from './user.model.js';
import { OrderReturnItem } from './order-return-item.model.js';

export type OrderReturnState = 'waiting' | 'confirmed' | 'received' | 'rejected';

@Table({ tableName: 'order_returns', timestamps: true })
export class OrderReturn extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @ForeignKey(() => Order)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_order' })
  declare id_order: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_user' })
  declare id_user: number;

  @Column({
    type: DataType.ENUM('waiting', 'confirmed', 'received', 'rejected'),
    allowNull: false,
    defaultValue: 'waiting',
  })
  declare state: OrderReturnState;

  @Column({ type: DataType.STRING(255), allowNull: true })
  declare reason: string | null;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'customer_note' })
  declare customer_note: string | null;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'admin_note' })
  declare admin_note: string | null;

  @CreatedAt
  @Column({ type: DataType.DATE, field: 'created_at' })
  declare created_at: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE, field: 'updated_at' })
  declare updated_at: Date;

  @BelongsTo(() => Order)
  declare order: Order;

  @BelongsTo(() => User)
  declare user: User;

  @HasMany(() => OrderReturnItem)
  declare items: OrderReturnItem[];
}
