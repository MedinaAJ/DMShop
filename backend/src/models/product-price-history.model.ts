import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Product } from './product.model.js';

/**
 * Audit trail for product price changes.
 * Created whenever a SpecificPrice is created, updated, or deleted.
 */
@Table({ tableName: 'dm_product_price_history', timestamps: false })
export class ProductPriceHistory extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @ForeignKey(() => Product)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_product' })
  declare id_product: number;

  @Column({ type: DataType.DECIMAL(20, 6), allowNull: true, field: 'old_price' })
  declare old_price: number | null;

  @Column({ type: DataType.DECIMAL(20, 6), allowNull: true, field: 'new_price' })
  declare new_price: number | null;

  /** Reduction value (0 = no reduction) */
  @Column({ type: DataType.DECIMAL(20, 6), allowNull: false, defaultValue: 0, field: 'old_reduction' })
  declare old_reduction: number;

  @Column({ type: DataType.DECIMAL(20, 6), allowNull: false, defaultValue: 0, field: 'new_reduction' })
  declare new_reduction: number;

  @Column({ type: DataType.STRING(10), allowNull: false, defaultValue: 'percentage', field: 'reduction_type' })
  declare reduction_type: string;

  /** Who triggered the change (admin user id) */
  @Column({ type: DataType.INTEGER, allowNull: true, field: 'changed_by' })
  declare changed_by: number | null;

  /** 'created' | 'updated' | 'deleted' */
  @Column({ type: DataType.STRING(20), allowNull: false, defaultValue: 'created' })
  declare action: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
    field: 'changed_at',
  })
  declare changed_at: Date;

  @BelongsTo(() => Product, 'id_product')
  declare product: Product;
}
