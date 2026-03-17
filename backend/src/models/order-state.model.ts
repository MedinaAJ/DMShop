import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({ tableName: 'order_states', timestamps: false })
export class OrderState extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @Column({ type: DataType.STRING(64), allowNull: false })
  declare name: string;

  @Column({ type: DataType.STRING(7), allowNull: false, defaultValue: '#000000' })
  declare color: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare paid: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare shipped: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare delivery: boolean;

  @Column({ type: DataType.STRING(64), allowNull: true })
  declare template: string | null;
}
