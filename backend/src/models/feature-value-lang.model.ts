import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { FeatureValue } from './feature-value.model.js';
import { Lang } from './lang.model.js';

@Table({ tableName: 'feature_value_lang', timestamps: false })
export class FeatureValueLang extends Model {
  @ForeignKey(() => FeatureValue)
  @Column({ type: DataType.INTEGER, primaryKey: true, field: 'id_feature_value' })
  declare id_feature_value: number;

  @ForeignKey(() => Lang)
  @Column({ type: DataType.INTEGER, primaryKey: true, field: 'id_lang' })
  declare id_lang: number;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare value: string;

  @BelongsTo(() => FeatureValue)
  declare featureValue: FeatureValue;

  @BelongsTo(() => Lang)
  declare lang: Lang;
}
