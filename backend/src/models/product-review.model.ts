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
import { Product } from './product.model.js';
import { User } from './user.model.js';

@Table({ tableName: 'product_reviews' })
export class ProductReview extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @ForeignKey(() => Product)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_product' })
  declare id_product: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_user' })
  declare id_user: number;

  @Column({ type: DataType.TINYINT, allowNull: false })
  declare rating: number;

  @Column({ type: DataType.STRING(128), allowNull: false })
  declare title: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare content: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare approved: boolean;

  @CreatedAt
  @Column({ type: DataType.DATE, field: 'created_at' })
  declare created_at: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE, field: 'updated_at' })
  declare updated_at: Date;

  @BelongsTo(() => Product)
  declare product: Product;

  @BelongsTo(() => User)
  declare user: User;
}
