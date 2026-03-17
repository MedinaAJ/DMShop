import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { CustomerGroup } from './customer-group.model.js';
import { Lang } from './lang.model.js';

@Table({ tableName: 'customer_group_lang', timestamps: false })
export class CustomerGroupLang extends Model {
  @ForeignKey(() => CustomerGroup)
  @Column({ type: DataType.INTEGER, primaryKey: true, field: 'id_customer_group' })
  declare id_customer_group: number;

  @ForeignKey(() => Lang)
  @Column({ type: DataType.INTEGER, primaryKey: true, field: 'id_lang' })
  declare id_lang: number;

  @Column({ type: DataType.STRING(64), allowNull: false })
  declare name: string;

  @BelongsTo(() => CustomerGroup)
  declare customerGroup: CustomerGroup;

  @BelongsTo(() => Lang)
  declare lang: Lang;
}
