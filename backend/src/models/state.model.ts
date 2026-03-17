import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Country } from './country.model.js';

@Table({ tableName: 'states', timestamps: false })
export class State extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @ForeignKey(() => Country)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_country' })
  declare id_country: number;

  @Column({ type: DataType.STRING(4), allowNull: false, field: 'iso_code' })
  declare iso_code: string;

  @Column({ type: DataType.STRING(64), allowNull: false })
  declare name: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare active: boolean;

  @BelongsTo(() => Country, 'id_country')
  declare country: Country;
}
