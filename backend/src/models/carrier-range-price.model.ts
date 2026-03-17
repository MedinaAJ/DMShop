import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { CarrierRange } from './carrier-range.model.js';
import { Zone } from './zone.model.js';

@Table({ tableName: 'carrier_range_prices', timestamps: false })
export class CarrierRangePrice extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @ForeignKey(() => CarrierRange)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_carrier_range' })
  declare id_carrier_range: number;

  @ForeignKey(() => Zone)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_zone' })
  declare id_zone: number;

  @Column({ type: DataType.DECIMAL(20, 6), allowNull: false, defaultValue: 0 })
  declare price: number;

  @BelongsTo(() => CarrierRange, 'id_carrier_range')
  declare carrierRange: CarrierRange;

  @BelongsTo(() => Zone, 'id_zone')
  declare zone: Zone;
}
