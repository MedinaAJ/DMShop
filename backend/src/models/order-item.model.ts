import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Order } from './order.model.js';
import { Product } from './product.model.js';

@Table({ tableName: 'order_items', timestamps: false })
export class OrderItem extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @ForeignKey(() => Order)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_order' })
  declare id_order: number;

  @ForeignKey(() => Product)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_product' })
  declare id_product: number;

  @Column({ type: DataType.INTEGER, allowNull: true, field: 'id_combination' })
  declare id_combination: number | null;

  @Column({ type: DataType.STRING(128), allowNull: false, field: 'product_name' })
  declare product_name: string;

  @Column({ type: DataType.STRING(64), allowNull: true, field: 'product_reference' })
  declare product_reference: string | null;

  @Column({ type: DataType.DECIMAL(20, 6), allowNull: false, field: 'product_price' })
  declare product_price: number;

  @Column({ type: DataType.DECIMAL(20, 6), allowNull: false, field: 'product_price_tax' })
  declare product_price_tax: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 1 })
  declare quantity: number;

  @Column({ type: DataType.DECIMAL(10, 3), allowNull: false, defaultValue: 0, field: 'tax_rate' })
  declare tax_rate: number;

  @Column({
    type: DataType.DECIMAL(20, 6),
    allowNull: false,
    defaultValue: 0,
    field: 'total_price',
  })
  declare total_price: number;

  @BelongsTo(() => Order, 'id_order')
  declare order: Order;

  @BelongsTo(() => Product, 'id_product')
  declare product: Product;
}
