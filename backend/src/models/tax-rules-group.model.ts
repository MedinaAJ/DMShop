import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
import { TaxRule } from './tax-rule.model.js';

@Table({ tableName: 'tax_rules_groups', timestamps: false })
export class TaxRulesGroup extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @Column({ type: DataType.STRING(64), allowNull: false })
  declare name: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare active: boolean;

  @HasMany(() => TaxRule)
  declare rules: TaxRule[];
}
