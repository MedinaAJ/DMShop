import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { Cart } from './cart.model.js';
import { Product } from './product.model.js';

@Table({ tableName: 'cart_items' })
export class CartItem extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @ForeignKey(() => Cart)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_cart' })
  declare id_cart: number;

  @ForeignKey(() => Product)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_product' })
  declare id_product: number;

  @Column({ type: DataType.INTEGER, allowNull: true, field: 'id_combination' })
  declare id_combination: number | null;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 1 })
  declare quantity: number;

  @BelongsTo(() => Cart)
  declare cart: Cart;

  @BelongsTo(() => Product)
  declare product: Product;

  @CreatedAt
  @Column({ type: DataType.DATE, field: 'created_at' })
  declare created_at: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE, field: 'updated_at' })
  declare updated_at: Date;
}
