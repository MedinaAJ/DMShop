import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { OrderState } from './order-state.model.js';
import { Lang } from './lang.model.js';

/**
 * OrderStateLang — multilingual names for order states.
 * Mirrors PrestaShop's order_state_lang table.
 *
 * If no record exists for a given language, fall back to OrderState.name.
 */
@Table({ tableName: 'order_state_lang', timestamps: false })
export class OrderStateLang extends Model {
  @ForeignKey(() => OrderState)
  @Column({ type: DataType.INTEGER, primaryKey: true, field: 'id_order_state' })
  declare id_order_state: number;

  @ForeignKey(() => Lang)
  @Column({ type: DataType.INTEGER, primaryKey: true, field: 'id_lang' })
  declare id_lang: number;

  /** Translated state name (e.g. "En preparación" / "In preparation") */
  @Column({ type: DataType.STRING(64), allowNull: false })
  declare name: string;

  @BelongsTo(() => OrderState)
  declare orderState: OrderState;

  @BelongsTo(() => Lang)
  declare lang: Lang;
}
