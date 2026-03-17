import { Table, Column, Model, DataType, ForeignKey } from 'sequelize-typescript';
import { ProductCombination } from './product-combination.model.js';
import { ProductImage } from './product-image.model.js';

@Table({ tableName: 'combination_images', timestamps: false })
export class CombinationImage extends Model {
  @ForeignKey(() => ProductCombination)
  @Column({ type: DataType.INTEGER, primaryKey: true, field: 'id_combination' })
  declare id_combination: number;

  @ForeignKey(() => ProductImage)
  @Column({ type: DataType.INTEGER, primaryKey: true, field: 'id_product_image' })
  declare id_product_image: number;
}
