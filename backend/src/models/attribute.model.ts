import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
import { AttributeLang } from './attribute-lang.model.js';
import { AttributeValue } from './attribute-value.model.js';

@Table({ tableName: 'attributes', timestamps: false })
export class Attribute extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  declare position: number;

  @HasMany(() => AttributeLang)
  declare translations: AttributeLang[];

  @HasMany(() => AttributeValue)
  declare values: AttributeValue[];
}
