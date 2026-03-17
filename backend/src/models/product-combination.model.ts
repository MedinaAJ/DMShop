import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  BelongsToMany,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { Product } from './product.model.js';
import { AttributeValue } from './attribute-value.model.js';
import { CombinationAttributeValue } from './combination-attribute-value.model.js';
import { ProductImage } from './product-image.model.js';
import { CombinationImage } from './combination-image.model.js';

@Table({ tableName: 'product_combinations' })
export class ProductCombination extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @ForeignKey(() => Product)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_product' })
  declare id_product: number;

  @Column({ type: DataType.STRING(64), allowNull: true })
  declare reference: string | null;

  @Column({ type: DataType.STRING(13), allowNull: true })
  declare ean13: string | null;

  @Column({
    type: DataType.DECIMAL(20, 6),
    allowNull: false,
    defaultValue: 0,
    field: 'price_impact',
  })
  declare price_impact: number;

  @Column({
    type: DataType.DECIMAL(10, 3),
    allowNull: false,
    defaultValue: 0,
    field: 'weight_impact',
  })
  declare weight_impact: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  declare quantity: number;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false, field: 'is_default' })
  declare is_default: boolean;

  @BelongsTo(() => Product, 'id_product')
  declare product: Product;

  @BelongsToMany(() => AttributeValue, {
    through: () => CombinationAttributeValue,
    uniqueKey: 'cav_comb_attr_unique',
  })
  declare attributeValues: AttributeValue[];

  @BelongsToMany(() => ProductImage, {
    through: () => CombinationImage,
    uniqueKey: 'ci_comb_img_unique',
  })
  declare images: ProductImage[];

  @CreatedAt
  @Column({ type: DataType.DATE, field: 'created_at' })
  declare created_at: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE, field: 'updated_at' })
  declare updated_at: Date;
}
