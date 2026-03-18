import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
  CreatedAt,
} from 'sequelize-typescript';
import { User } from './user.model.js';
import { WishlistItem } from './wishlist-item.model.js';

@Table({ tableName: 'wishlists', timestamps: false })
export class Wishlist extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_user' })
  declare id_user: number;

  @Column({ type: DataType.STRING(64), allowNull: false, defaultValue: 'Mi lista de deseos' })
  declare name: string;

  @Column({ type: DataType.STRING(64), allowNull: true, unique: true })
  declare token: string | null;

  @CreatedAt
  @Column({ type: DataType.DATE, field: 'created_at' })
  declare created_at: Date;

  @BelongsTo(() => User)
  declare user: User;

  @HasMany(() => WishlistItem)
  declare items: WishlistItem[];
}
