import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';
import { Zone } from './zone.model.js';
import { State } from './state.model.js';

@Table({ tableName: 'countries', timestamps: false })
export class Country extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @ForeignKey(() => Zone)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_zone' })
  declare id_zone: number;

  @Column({ type: DataType.STRING(3), allowNull: false, field: 'iso_code' })
  declare iso_code: string;

  @Column({ type: DataType.STRING(64), allowNull: false })
  declare name: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare active: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'contains_states',
  })
  declare contains_states: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false, field: 'need_zip_code' })
  declare need_zip_code: boolean;

  @BelongsTo(() => Zone, 'id_zone')
  declare zone: Zone;

  @HasMany(() => State)
  declare states: State[];
}
