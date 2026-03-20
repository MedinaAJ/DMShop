import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Carrier } from './carrier.model.js';
import { Lang } from './lang.model.js';

/**
 * CarrierLang — multilingual names and delay text for carriers.
 * Mirrors PrestaShop's carrier_lang table.
 *
 * If no record exists for a given language, fall back to Carrier.name.
 */
@Table({ tableName: 'carrier_lang', timestamps: false })
export class CarrierLang extends Model {
  @ForeignKey(() => Carrier)
  @Column({ type: DataType.INTEGER, primaryKey: true, field: 'id_carrier' })
  declare id_carrier: number;

  @ForeignKey(() => Lang)
  @Column({ type: DataType.INTEGER, primaryKey: true, field: 'id_lang' })
  declare id_lang: number;

  /** Translated carrier name (e.g. "Standard Delivery" / "Entrega Estándar") */
  @Column({ type: DataType.STRING(64), allowNull: false })
  declare name: string;

  /** Translated delivery time text (e.g. "3-5 business days" / "3-5 días laborables") */
  @Column({ type: DataType.STRING(128), allowNull: true })
  declare delay: string | null;

  @BelongsTo(() => Carrier)
  declare carrier: Carrier;

  @BelongsTo(() => Lang)
  declare lang: Lang;
}
