import {
  Table,
  Column,
  Model,
  DataType,
  HasMany,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt,
  DeletedAt,
} from 'sequelize-typescript';
import { CategoryLang } from './category-lang.model.js';

@Table({ tableName: 'categories', paranoid: true })
export class Category extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @ForeignKey(() => Category)
  @Column({ type: DataType.INTEGER, allowNull: true, field: 'id_parent' })
  declare id_parent: number | null;

  @BelongsTo(() => Category, 'id_parent')
  declare parent: Category | null;

  @HasMany(() => Category, 'id_parent')
  declare children: Category[];

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  declare position: number;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare active: boolean;

  @HasMany(() => CategoryLang)
  declare translations: CategoryLang[];

  @CreatedAt
  @Column({ type: DataType.DATE, field: 'created_at' })
  declare created_at: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE, field: 'updated_at' })
  declare updated_at: Date;

  @DeletedAt
  @Column({ type: DataType.DATE, field: 'deleted_at' })
  declare deleted_at: Date | null;
}
