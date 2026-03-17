import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Product } from './product.model.js';
import { Feature } from './feature.model.js';
import { FeatureValue } from './feature-value.model.js';

@Table({ tableName: 'product_features', timestamps: false })
export class ProductFeature extends Model {
  @ForeignKey(() => Product)
  @Column({ type: DataType.INTEGER, primaryKey: true, field: 'id_product' })
  declare id_product: number;

  @ForeignKey(() => Feature)
  @Column({ type: DataType.INTEGER, primaryKey: true, field: 'id_feature' })
  declare id_feature: number;

  @ForeignKey(() => FeatureValue)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_feature_value' })
  declare id_feature_value: number;

  @BelongsTo(() => Product)
  declare product: Product;

  @BelongsTo(() => Feature)
  declare feature: Feature;

  @BelongsTo(() => FeatureValue)
  declare featureValue: FeatureValue;
}
