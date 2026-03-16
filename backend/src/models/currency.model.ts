import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({ tableName: 'currencies', timestamps: false })
export class Currency extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @Column({ type: DataType.STRING(64), allowNull: false })
  declare name: string;

  @Column({ type: DataType.STRING(3), allowNull: false, field: 'iso_code' })
  declare iso_code: string;

  @Column({ type: DataType.STRING(8), allowNull: false })
  declare symbol: string;

  @Column({
    type: DataType.DECIMAL(13, 6),
    allowNull: false,
    defaultValue: 1,
    field: 'conversion_rate',
  })
  declare conversion_rate: number;

  @Column({ type: DataType.TINYINT, allowNull: false, defaultValue: 2 })
  declare decimals: number;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare active: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false, field: 'is_default' })
  declare is_default: boolean;
}
