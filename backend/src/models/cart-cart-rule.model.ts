import { Table, Column, Model, DataType, ForeignKey, CreatedAt } from 'sequelize-typescript';
import { Cart } from './cart.model.js';
import { CartRule } from './cart-rule.model.js';

@Table({ tableName: 'cart_cart_rules', updatedAt: false })
export class CartCartRule extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @ForeignKey(() => Cart)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_cart' })
  declare id_cart: number;

  @ForeignKey(() => CartRule)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_cart_rule' })
  declare id_cart_rule: number;

  @CreatedAt
  @Column({ type: DataType.DATE, field: 'created_at' })
  declare created_at: Date;
}
