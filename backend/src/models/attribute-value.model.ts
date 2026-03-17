import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';
import { Attribute } from './attribute.model.js';
import { AttributeValueLang } from './attribute-value-lang.model.js';

@Table({ tableName: 'attribute_values', timestamps: false })
export class AttributeValue extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @ForeignKey(() => Attribute)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_attribute' })
  declare id_attribute: number;

  @Column({ type: DataType.STRING(7), allowNull: true })
  declare color: string | null;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  declare position: number;

  @BelongsTo(() => Attribute, 'id_attribute')
  declare attribute: Attribute;

  @HasMany(() => AttributeValueLang)
  declare translations: AttributeValueLang[];
}
