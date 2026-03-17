import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({ tableName: 'taxes', timestamps: false })
export class Tax extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @Column({ type: DataType.STRING(64), allowNull: false })
  declare name: string;

  @Column({ type: DataType.DECIMAL(10, 3), allowNull: false })
  declare rate: number;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare active: boolean;
}
