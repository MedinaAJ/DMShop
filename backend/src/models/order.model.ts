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
import { User } from './user.model.js';
import { Cart } from './cart.model.js';
import { Currency } from './currency.model.js';
import { Lang } from './lang.model.js';
import { Address } from './address.model.js';
import { Carrier } from './carrier.model.js';
import { OrderState } from './order-state.model.js';
import { OrderItem } from './order-item.model.js';
import { OrderHistory } from './order-history.model.js';
import { OrderPayment } from './order-payment.model.js';

@Table({ tableName: 'orders' })
export class Order extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @Column({ type: DataType.STRING(16), unique: true, allowNull: false })
  declare reference: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_user' })
  declare id_user: number;

  @ForeignKey(() => Cart)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_cart' })
  declare id_cart: number;

  @ForeignKey(() => Currency)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_currency' })
  declare id_currency: number;

  @ForeignKey(() => Lang)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_lang' })
  declare id_lang: number;

  @ForeignKey(() => Address)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_address_delivery' })
  declare id_address_delivery: number;

  @ForeignKey(() => Address)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_address_invoice' })
  declare id_address_invoice: number;

  @ForeignKey(() => Carrier)
  @Column({ type: DataType.INTEGER, allowNull: true, field: 'id_carrier' })
  declare id_carrier: number | null;

  @ForeignKey(() => OrderState)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_order_state' })
  declare id_order_state: number;

  @Column({ type: DataType.STRING(64), allowNull: false, field: 'payment_method' })
  declare payment_method: string;

  @Column({
    type: DataType.DECIMAL(20, 6),
    allowNull: false,
    defaultValue: 0,
    field: 'total_products',
  })
  declare total_products: number;

  @Column({
    type: DataType.DECIMAL(20, 6),
    allowNull: false,
    defaultValue: 0,
    field: 'total_products_tax',
  })
  declare total_products_tax: number;

  @Column({
    type: DataType.DECIMAL(20, 6),
    allowNull: false,
    defaultValue: 0,
    field: 'total_shipping',
  })
  declare total_shipping: number;

  @Column({
    type: DataType.DECIMAL(20, 6),
    allowNull: false,
    defaultValue: 0,
    field: 'total_shipping_tax',
  })
  declare total_shipping_tax: number;

  @Column({
    type: DataType.DECIMAL(20, 6),
    allowNull: false,
    defaultValue: 0,
    field: 'total_discounts',
  })
  declare total_discounts: number;

  @Column({
    type: DataType.DECIMAL(20, 6),
    allowNull: false,
    defaultValue: 0,
    field: 'total_discounts_tax',
  })
  declare total_discounts_tax: number;

  @Column({ type: DataType.DECIMAL(20, 6), allowNull: false, defaultValue: 0, field: 'total_paid' })
  declare total_paid: number;

  @Column({
    type: DataType.DECIMAL(13, 6),
    allowNull: false,
    defaultValue: 1,
    field: 'conversion_rate',
  })
  declare conversion_rate: number;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare note: string | null;

  @BelongsTo(() => User, 'id_user')
  declare user: User;

  @BelongsTo(() => Cart, 'id_cart')
  declare cart: Cart;

  @BelongsTo(() => Currency, 'id_currency')
  declare currency: Currency;

  @BelongsTo(() => Lang, 'id_lang')
  declare lang: Lang;

  @BelongsTo(() => Address, 'id_address_delivery')
  declare deliveryAddress: Address;

  @BelongsTo(() => Address, 'id_address_invoice')
  declare invoiceAddress: Address;

  @BelongsTo(() => Carrier, 'id_carrier')
  declare carrier: Carrier | null;

  @BelongsTo(() => OrderState, 'id_order_state')
  declare orderState: OrderState;

  @HasMany(() => OrderItem)
  declare items: OrderItem[];

  @HasMany(() => OrderHistory)
  declare history: OrderHistory[];

  @HasMany(() => OrderPayment)
  declare payments: OrderPayment[];

  @CreatedAt
  @Column({ type: DataType.DATE, field: 'created_at' })
  declare created_at: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE, field: 'updated_at' })
  declare updated_at: Date;
}
