import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Product } from './product.model.js';

@Table({ tableName: 'specific_prices', timestamps: false })
export class SpecificPrice extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @ForeignKey(() => Product)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_product' })
  declare id_product: number;

  @Column({ type: DataType.INTEGER, allowNull: true, field: 'id_combination' })
  declare id_combination: number | null;

  @Column({ type: DataType.INTEGER, allowNull: true, field: 'id_customer' })
  declare id_customer: number | null;

  @Column({ type: DataType.INTEGER, allowNull: true, field: 'id_customer_group' })
  declare id_customer_group: number | null;

  @Column({ type: DataType.INTEGER, allowNull: true, field: 'id_currency' })
  declare id_currency: number | null;

  @Column({ type: DataType.INTEGER, allowNull: true, field: 'id_country' })
  declare id_country: number | null;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 1, field: 'from_quantity' })
  declare from_quantity: number;

  @Column({ type: DataType.DECIMAL(20, 6), allowNull: false, defaultValue: -1 })
  declare price: number;

  @Column({ type: DataType.DECIMAL(20, 6), allowNull: false, defaultValue: 0 })
  declare reduction: number;

  @Column({
    type: DataType.ENUM('percentage', 'amount'),
    allowNull: false,
    defaultValue: 'percentage',
    field: 'reduction_type',
  })
  declare reduction_type: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true, field: 'reduction_tax' })
  declare reduction_tax: boolean;

  @Column({ type: DataType.DATE, allowNull: true, field: 'date_from' })
  declare date_from: Date | null;

  @Column({ type: DataType.DATE, allowNull: true, field: 'date_to' })
  declare date_to: Date | null;

  @BelongsTo(() => Product, 'id_product')
  declare product: Product;
}
