import { Table, Column, Model, DataType, ForeignKey } from 'sequelize-typescript';
import { User } from './user.model.js';
import { CustomerGroup } from './customer-group.model.js';

@Table({ tableName: 'user_groups', timestamps: false })
export class UserGroup extends Model {
  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, primaryKey: true, field: 'id_user' })
  declare id_user: number;

  @ForeignKey(() => CustomerGroup)
  @Column({ type: DataType.INTEGER, primaryKey: true, field: 'id_customer_group' })
  declare id_customer_group: number;
}
