import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Product } from './product.model.js';

@Table({ tableName: 'product_images', timestamps: false })
export class ProductImage extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @ForeignKey(() => Product)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_product' })
  declare id_product: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  declare position: number;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare cover: boolean;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare path: string;

  @BelongsTo(() => Product)
  declare product: Product;
}
