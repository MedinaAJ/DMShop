import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
import { FeatureLang } from './feature-lang.model.js';
import { FeatureValue } from './feature-value.model.js';

@Table({ tableName: 'features', timestamps: false })
export class Feature extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  declare position: number;

  @HasMany(() => FeatureLang)
  declare translations: FeatureLang[];

  @HasMany(() => FeatureValue)
  declare values: FeatureValue[];
}
