import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({ tableName: 'zones', timestamps: false })
export class Zone extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @Column({ type: DataType.STRING(64), allowNull: false })
  declare name: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare active: boolean;
}
