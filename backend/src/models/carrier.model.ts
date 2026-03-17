import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
  BelongsToMany,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { TaxRulesGroup } from './tax-rules-group.model.js';
import { CarrierZone } from './carrier-zone.model.js';
import { CarrierRange } from './carrier-range.model.js';
import { Zone } from './zone.model.js';

@Table({ tableName: 'carriers' })
export class Carrier extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @Column({ type: DataType.STRING(64), allowNull: false })
  declare name: string;

  @ForeignKey(() => TaxRulesGroup)
  @Column({ type: DataType.INTEGER, allowNull: true, field: 'id_tax_rules_group' })
  declare id_tax_rules_group: number | null;

  @Column({ type: DataType.STRING(255), allowNull: true })
  declare url: string | null;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare active: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false, field: 'is_free' })
  declare is_free: boolean;

  @Column({
    type: DataType.ENUM('weight', 'price'),
    allowNull: false,
    defaultValue: 'price',
    field: 'shipping_method',
  })
  declare shipping_method: string;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0, field: 'max_width' })
  declare max_width: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0, field: 'max_height' })
  declare max_height: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0, field: 'max_depth' })
  declare max_depth: number;

  @Column({ type: DataType.DECIMAL(10, 3), allowNull: false, defaultValue: 0, field: 'max_weight' })
  declare max_weight: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  declare grade: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  declare delay: number;

  @BelongsTo(() => TaxRulesGroup, 'id_tax_rules_group')
  declare taxRulesGroup: TaxRulesGroup | null;

  @HasMany(() => CarrierRange)
  declare ranges: CarrierRange[];

  @BelongsToMany(() => Zone, () => CarrierZone)
  declare zones: Zone[];

  @CreatedAt
  @Column({ type: DataType.DATE, field: 'created_at' })
  declare created_at: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE, field: 'updated_at' })
  declare updated_at: Date;
}
