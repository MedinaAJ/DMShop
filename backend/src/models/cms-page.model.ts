import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { CmsCategory } from './cms-category.model.js';
import { CmsPageLang } from './cms-page-lang.model.js';

@Table({ tableName: 'cms_pages' })
export class CmsPage extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @ForeignKey(() => CmsCategory)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_cms_category' })
  declare id_cms_category: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  declare position: number;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare active: boolean;

  @CreatedAt
  @Column({ type: DataType.DATE, field: 'created_at' })
  declare created_at: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE, field: 'updated_at' })
  declare updated_at: Date;

  @BelongsTo(() => CmsCategory)
  declare category: CmsCategory;

  @HasMany(() => CmsPageLang)
  declare translations: CmsPageLang[];
}
