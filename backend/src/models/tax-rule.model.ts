import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { TaxRulesGroup } from './tax-rules-group.model.js';
import { Country } from './country.model.js';
import { State } from './state.model.js';
import { Tax } from './tax.model.js';

@Table({ tableName: 'tax_rules', timestamps: false })
export class TaxRule extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @ForeignKey(() => TaxRulesGroup)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_tax_rules_group' })
  declare id_tax_rules_group: number;

  @ForeignKey(() => Country)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_country' })
  declare id_country: number;

  @ForeignKey(() => State)
  @Column({ type: DataType.INTEGER, allowNull: true, field: 'id_state' })
  declare id_state: number | null;

  @ForeignKey(() => Tax)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_tax' })
  declare id_tax: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  declare behavior: number;

  @BelongsTo(() => TaxRulesGroup, 'id_tax_rules_group')
  declare taxRulesGroup: TaxRulesGroup;

  @BelongsTo(() => Country, 'id_country')
  declare country: Country;

  @BelongsTo(() => State, 'id_state')
  declare state: State | null;

  @BelongsTo(() => Tax, 'id_tax')
  declare tax: Tax;
}
