import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { AttributeValue } from './attribute-value.model.js';
import { Lang } from './lang.model.js';

@Table({ tableName: 'attribute_value_lang', timestamps: false })
export class AttributeValueLang extends Model {
  @ForeignKey(() => AttributeValue)
  @Column({ type: DataType.INTEGER, primaryKey: true, field: 'id_attribute_value' })
  declare id_attribute_value: number;

  @ForeignKey(() => Lang)
  @Column({ type: DataType.INTEGER, primaryKey: true, field: 'id_lang' })
  declare id_lang: number;

  @Column({ type: DataType.STRING(128), allowNull: false })
  declare name: string;

  @BelongsTo(() => AttributeValue)
  declare attributeValue: AttributeValue;

  @BelongsTo(() => Lang)
  declare lang: Lang;
}
