import {
  Table,
  Column,
  Model,
  DataType,
  HasMany,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt,
  DeletedAt,
} from 'sequelize-typescript';

@Table({ tableName: 'users', paranoid: true })
export class User extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @Column({ type: DataType.STRING(255), unique: true, allowNull: false })
  declare email: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare password: string;

  @Column({ type: DataType.STRING(100), allowNull: false, field: 'first_name' })
  declare first_name: string;

  @Column({ type: DataType.STRING(100), allowNull: false, field: 'last_name' })
  declare last_name: string;

  @Column({
    type: DataType.ENUM('customer', 'admin', 'employee'),
    allowNull: false,
    defaultValue: 'customer',
  })
  declare role: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare active: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare newsletter: boolean;

  @Column({ type: DataType.DATE, allowNull: true, field: 'last_login_at' })
  declare last_login_at: Date | null;

  @CreatedAt
  @Column({ type: DataType.DATE, field: 'created_at' })
  declare created_at: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE, field: 'updated_at' })
  declare updated_at: Date;

  @DeletedAt
  @Column({ type: DataType.DATE, field: 'deleted_at' })
  declare deleted_at: Date | null;
}
