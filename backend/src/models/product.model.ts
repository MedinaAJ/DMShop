import {
  Table,
  Column,
  Model,
  DataType,
  HasMany,
  ForeignKey,
  BelongsTo,
  BelongsToMany,
  CreatedAt,
  UpdatedAt,
  DeletedAt,
} from 'sequelize-typescript';
import { ProductLang } from './product-lang.model.js';
import { ProductImage } from './product-image.model.js';
import { Category } from './category.model.js';
import { Manufacturer } from './manufacturer.model.js';
import { Supplier } from './supplier.model.js';
import { TaxRulesGroup } from './tax-rules-group.model.js';
import { ProductCombination } from './product-combination.model.js';
import { ProductCategory } from './product-category.model.js';
import { ProductFeature } from './product-feature.model.js';
import { SpecificPrice } from './specific-price.model.js';

@Table({ tableName: 'products', paranoid: true })
export class Product extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @ForeignKey(() => Category)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_category_default' })
  declare id_category_default: number;

  @ForeignKey(() => Manufacturer)
  @Column({ type: DataType.INTEGER, allowNull: true, field: 'id_manufacturer' })
  declare id_manufacturer: number | null;

  @ForeignKey(() => Supplier)
  @Column({ type: DataType.INTEGER, allowNull: true, field: 'id_supplier' })
  declare id_supplier: number | null;

  @ForeignKey(() => TaxRulesGroup)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_tax_rule_group', defaultValue: 1 })
  declare id_tax_rule_group: number;

  @Column({ type: DataType.STRING(64), allowNull: true })
  declare reference: string | null;

  @Column({ type: DataType.STRING(13), allowNull: true })
  declare ean13: string | null;

  @Column({ type: DataType.DECIMAL(20, 6), allowNull: false, defaultValue: 0 })
  declare price: number;

  @Column({
    type: DataType.DECIMAL(20, 6),
    allowNull: false,
    defaultValue: 0,
    field: 'wholesale_price',
  })
  declare wholesale_price: number;

  @Column({ type: DataType.DECIMAL(10, 3), allowNull: false, defaultValue: 0 })
  declare weight: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  declare quantity: number;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare active: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'available_for_order',
  })
  declare available_for_order: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true, field: 'show_price' })
  declare show_price: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false, field: 'is_virtual' })
  declare is_virtual: boolean;

  @BelongsTo(() => Category, 'id_category_default')
  declare defaultCategory: Category;

  @BelongsTo(() => Manufacturer, 'id_manufacturer')
  declare manufacturer: Manufacturer | null;

  @BelongsTo(() => Supplier, 'id_supplier')
  declare supplier: Supplier | null;

  @BelongsTo(() => TaxRulesGroup, 'id_tax_rule_group')
  declare taxRulesGroup: TaxRulesGroup;

  @HasMany(() => ProductLang)
  declare translations: ProductLang[];

  @HasMany(() => ProductImage)
  declare images: ProductImage[];

  @HasMany(() => ProductCombination)
  declare combinations: ProductCombination[];

  @HasMany(() => ProductFeature)
  declare features: ProductFeature[];

  @HasMany(() => SpecificPrice)
  declare specificPrices: SpecificPrice[];

  @BelongsToMany(() => Category, () => ProductCategory)
  declare categories: Category[];

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
