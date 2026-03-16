import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Category } from './category.model.js';
import { Lang } from './lang.model.js';

@Table({ tableName: 'category_lang', timestamps: false })
export class CategoryLang extends Model {
  @ForeignKey(() => Category)
  @Column({ type: DataType.INTEGER, primaryKey: true, field: 'id_category' })
  declare id_category: number;

  @ForeignKey(() => Lang)
  @Column({ type: DataType.INTEGER, primaryKey: true, field: 'id_lang' })
  declare id_lang: number;

  @Column({ type: DataType.STRING(128), allowNull: false })
  declare name: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare description: string | null;

  @Column({ type: DataType.STRING(128), allowNull: false })
  declare slug: string;

  @Column({ type: DataType.STRING(128), allowNull: true, field: 'meta_title' })
  declare meta_title: string | null;

  @Column({ type: DataType.STRING(255), allowNull: true, field: 'meta_description' })
  declare meta_description: string | null;

  @BelongsTo(() => Category)
  declare category: Category;

  @BelongsTo(() => Lang)
  declare lang: Lang;
}
