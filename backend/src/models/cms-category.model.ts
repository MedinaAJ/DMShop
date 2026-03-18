import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';
import { CmsCategoryLang } from './cms-category-lang.model.js';
import { CmsPage } from './cms-page.model.js';

@Table({ tableName: 'cms_categories', timestamps: false })
export class CmsCategory extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @ForeignKey(() => CmsCategory)
  @Column({ type: DataType.INTEGER, allowNull: true, field: 'id_parent' })
  declare id_parent: number | null;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  declare position: number;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare active: boolean;

  @BelongsTo(() => CmsCategory, 'id_parent')
  declare parent: CmsCategory | null;

  @HasMany(() => CmsCategory, 'id_parent')
  declare children: CmsCategory[];

  @HasMany(() => CmsCategoryLang)
  declare translations: CmsCategoryLang[];

  @HasMany(() => CmsPage)
  declare pages: CmsPage[];
}
