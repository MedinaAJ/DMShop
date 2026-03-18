import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
import { CustomerGroupLang } from './customer-group-lang.model.js';

@Table({ tableName: 'customer_groups', timestamps: false })
export class CustomerGroup extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @Column({ type: DataType.DECIMAL(5, 2), allowNull: false, defaultValue: 0 })
  declare reduction: number;

  @Column({
    type: DataType.TINYINT,
    allowNull: true,
    defaultValue: 0,
    field: 'price_display_method',
  })
  declare price_display_method: number;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true, field: 'show_prices' })
  declare show_prices: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: true, defaultValue: false })
  declare deleted: boolean;

  @HasMany(() => CustomerGroupLang, { foreignKey: 'id_customer_group' })
  declare translations: CustomerGroupLang[];
}
