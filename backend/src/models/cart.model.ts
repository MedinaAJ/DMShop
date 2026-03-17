import {
  Table,
  Column,
  Model,
  DataType,
  HasMany,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { CartItem } from './cart-item.model.js';
import { CartCartRule } from './cart-cart-rule.model.js';
import { User } from './user.model.js';

@Table({ tableName: 'carts' })
export class Cart extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: true, field: 'id_user' })
  declare id_user: number | null;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 1, field: 'id_currency' })
  declare id_currency: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 1, field: 'id_lang' })
  declare id_lang: number;

  @Column({ type: DataType.INTEGER, allowNull: true, field: 'id_address_delivery' })
  declare id_address_delivery: number | null;

  @Column({ type: DataType.INTEGER, allowNull: true, field: 'id_address_invoice' })
  declare id_address_invoice: number | null;

  @Column({ type: DataType.INTEGER, allowNull: true, field: 'id_carrier' })
  declare id_carrier: number | null;

  @BelongsTo(() => User, 'id_user')
  declare user: User | null;

  @HasMany(() => CartItem)
  declare items: CartItem[];

  @HasMany(() => CartCartRule)
  declare cartRules: CartCartRule[];

  @CreatedAt
  @Column({ type: DataType.DATE, field: 'created_at' })
  declare created_at: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE, field: 'updated_at' })
  declare updated_at: Date;
}
