import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Feature } from './feature.model.js';
import { Lang } from './lang.model.js';

@Table({ tableName: 'feature_lang', timestamps: false })
export class FeatureLang extends Model {
  @ForeignKey(() => Feature)
  @Column({ type: DataType.INTEGER, primaryKey: true, field: 'id_feature' })
  declare id_feature: number;

  @ForeignKey(() => Lang)
  @Column({ type: DataType.INTEGER, primaryKey: true, field: 'id_lang' })
  declare id_lang: number;

  @Column({ type: DataType.STRING(128), allowNull: false })
  declare name: string;

  @BelongsTo(() => Feature)
  declare feature: Feature;

  @BelongsTo(() => Lang)
  declare lang: Lang;
}
