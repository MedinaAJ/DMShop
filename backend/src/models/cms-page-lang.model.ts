import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { CmsPage } from './cms-page.model.js';
import { Lang } from './lang.model.js';

@Table({ tableName: 'cms_page_lang', timestamps: false })
export class CmsPageLang extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @ForeignKey(() => CmsPage)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_cms_page' })
  declare id_cms_page: number;

  @ForeignKey(() => Lang)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_lang' })
  declare id_lang: number;

  @Column({ type: DataType.STRING(128), allowNull: false })
  declare title: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare content: string | null;

  @Column({ type: DataType.STRING(128), allowNull: false })
  declare slug: string;

  @Column({ type: DataType.STRING(128), allowNull: true, field: 'meta_title' })
  declare meta_title: string | null;

  @Column({ type: DataType.STRING(255), allowNull: true, field: 'meta_description' })
  declare meta_description: string | null;

  @BelongsTo(() => CmsPage)
  declare page: CmsPage;

  @BelongsTo(() => Lang)
  declare lang: Lang;
}
