import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';
import { Feature } from './feature.model.js';
import { FeatureValueLang } from './feature-value-lang.model.js';

@Table({ tableName: 'feature_values', timestamps: false })
export class FeatureValue extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @ForeignKey(() => Feature)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_feature' })
  declare id_feature: number;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare custom: boolean;

  @BelongsTo(() => Feature, 'id_feature')
  declare feature: Feature;

  @HasMany(() => FeatureValueLang)
  declare translations: FeatureValueLang[];
}
