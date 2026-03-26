import { Table, Column, Model, DataType, CreatedAt, UpdatedAt } from 'sequelize-typescript';

@Table({ tableName: 'dm_translations' })
export class Translation extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @Column({ type: DataType.STRING(10), allowNull: false })
  declare lang_iso: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare key: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare value: string;

  @CreatedAt
  @Column({ type: DataType.DATE, field: 'created_at' })
  declare created_at: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE, field: 'updated_at' })
  declare updated_at: Date;
}
