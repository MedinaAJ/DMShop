import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';
import { Carrier } from './carrier.model.js';
import { CarrierRangePrice } from './carrier-range-price.model.js';

@Table({ tableName: 'carrier_ranges', timestamps: false })
export class CarrierRange extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @ForeignKey(() => Carrier)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_carrier' })
  declare id_carrier: number;

  @Column({ type: DataType.DECIMAL(20, 6), allowNull: false })
  declare delimiter1: number;

  @Column({ type: DataType.DECIMAL(20, 6), allowNull: false })
  declare delimiter2: number;

  @BelongsTo(() => Carrier, 'id_carrier')
  declare carrier: Carrier;

  @HasMany(() => CarrierRangePrice)
  declare prices: CarrierRangePrice[];
}
