import { Table, Column, Model, DataType, ForeignKey } from 'sequelize-typescript';
import { Product } from './product.model.js';
import { Category } from './category.model.js';

@Table({ tableName: 'product_categories', timestamps: false })
export class ProductCategory extends Model {
  @ForeignKey(() => Product)
  @Column({ type: DataType.INTEGER, primaryKey: true, field: 'id_product' })
  declare id_product: number;

  @ForeignKey(() => Category)
  @Column({ type: DataType.INTEGER, primaryKey: true, field: 'id_category' })
  declare id_category: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  declare position: number;
}
