import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Attribute } from './attribute.model.js';
import { Lang } from './lang.model.js';

@Table({ tableName: 'attribute_lang', timestamps: false })
export class AttributeLang extends Model {
  @ForeignKey(() => Attribute)
  @Column({ type: DataType.INTEGER, primaryKey: true, field: 'id_attribute' })
  declare id_attribute: number;

  @ForeignKey(() => Lang)
  @Column({ type: DataType.INTEGER, primaryKey: true, field: 'id_lang' })
  declare id_lang: number;

  @Column({ type: DataType.STRING(128), allowNull: false })
  declare name: string;

  @BelongsTo(() => Attribute)
  declare attribute: Attribute;

  @BelongsTo(() => Lang)
  declare lang: Lang;
}
