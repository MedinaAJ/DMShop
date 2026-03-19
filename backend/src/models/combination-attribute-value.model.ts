import { Table, Column, Model, DataType, ForeignKey } from 'sequelize-typescript';
import { ProductCombination } from './product-combination.model.js';
import { AttributeValue } from './attribute-value.model.js';

@Table({
  tableName: 'combination_attribute_values',
  timestamps: false,
  indexes: [
    {
      unique: true,
      name: 'cav_comb_attr_unique',
      fields: ['id_combination', 'id_attribute_value'],
    },
  ],
})
export class CombinationAttributeValue extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @ForeignKey(() => ProductCombination)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_combination' })
  declare id_combination: number;

  @ForeignKey(() => AttributeValue)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_attribute_value' })
  declare id_attribute_value: number;
}
