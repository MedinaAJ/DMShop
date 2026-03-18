import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { CmsCategory } from './cms-category.model.js';
import { Lang } from './lang.model.js';

@Table({ tableName: 'cms_category_lang', timestamps: false })
export class CmsCategoryLang extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @ForeignKey(() => CmsCategory)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_cms_category' })
  declare id_cms_category: number;

  @ForeignKey(() => Lang)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_lang' })
  declare id_lang: number;

  @Column({ type: DataType.STRING(128), allowNull: false })
  declare name: string;

  @Column({ type: DataType.STRING(128), allowNull: false })
  declare slug: string;

  @BelongsTo(() => CmsCategory)
  declare category: CmsCategory;

  @BelongsTo(() => Lang)
  declare lang: Lang;
}
