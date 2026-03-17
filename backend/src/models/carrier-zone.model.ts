import { Table, Column, Model, DataType, ForeignKey } from 'sequelize-typescript';
import { Carrier } from './carrier.model.js';
import { Zone } from './zone.model.js';

@Table({ tableName: 'carrier_zones', timestamps: false })
export class CarrierZone extends Model {
  @ForeignKey(() => Carrier)
  @Column({ type: DataType.INTEGER, primaryKey: true, field: 'id_carrier' })
  declare id_carrier: number;

  @ForeignKey(() => Zone)
  @Column({ type: DataType.INTEGER, primaryKey: true, field: 'id_zone' })
  declare id_zone: number;
}
