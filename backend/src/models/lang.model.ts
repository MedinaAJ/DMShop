import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({ tableName: 'langs', timestamps: false })
export class Lang extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @Column({ type: DataType.STRING(64), allowNull: false })
  declare name: string;

  @Column({ type: DataType.STRING(2), allowNull: false, field: 'iso_code' })
  declare iso_code: string;

  @Column({ type: DataType.STRING(5), allowNull: false })
  declare locale: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare active: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false, field: 'is_default' })
  declare is_default: boolean;
}
