import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  CreatedAt,
} from 'sequelize-typescript';
import { Wishlist } from './wishlist.model.js';
import { Product } from './product.model.js';
import { ProductCombination } from './product-combination.model.js';

@Table({ tableName: 'wishlist_items', timestamps: false })
export class WishlistItem extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @ForeignKey(() => Wishlist)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_wishlist' })
  declare id_wishlist: number;

  @ForeignKey(() => Product)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_product' })
  declare id_product: number;

  @ForeignKey(() => ProductCombination)
  @Column({ type: DataType.INTEGER, allowNull: true, field: 'id_combination' })
  declare id_combination: number | null;

  @CreatedAt
  @Column({ type: DataType.DATE, field: 'created_at' })
  declare created_at: Date;

  @BelongsTo(() => Wishlist)
  declare wishlist: Wishlist;

  @BelongsTo(() => Product)
  declare product: Product;
}
