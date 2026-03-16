import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Product } from './product.model.js';
import { Lang } from './lang.model.js';

@Table({ tableName: 'product_lang', timestamps: false })
export class ProductLang extends Model {
  @ForeignKey(() => Product)
  @Column({ type: DataType.INTEGER, primaryKey: true, field: 'id_product' })
  declare id_product: number;

  @ForeignKey(() => Lang)
  @Column({ type: DataType.INTEGER, primaryKey: true, field: 'id_lang' })
  declare id_lang: number;

  @Column({ type: DataType.STRING(128), allowNull: false })
  declare name: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare description: string | null;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'description_short' })
  declare description_short: string | null;

  @Column({ type: DataType.STRING(128), allowNull: false })
  declare slug: string;

  @Column({ type: DataType.STRING(128), allowNull: true, field: 'meta_title' })
  declare meta_title: string | null;

  @Column({ type: DataType.STRING(255), allowNull: true, field: 'meta_description' })
  declare meta_description: string | null;

  @BelongsTo(() => Product)
  declare product: Product;

  @BelongsTo(() => Lang)
  declare lang: Lang;
}
