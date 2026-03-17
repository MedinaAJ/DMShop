import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt,
  DeletedAt,
} from 'sequelize-typescript';
import { User } from './user.model.js';
import { Country } from './country.model.js';
import { State } from './state.model.js';

@Table({ tableName: 'addresses', paranoid: true })
export class Address extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_user' })
  declare id_user: number;

  @ForeignKey(() => Country)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_country' })
  declare id_country: number;

  @ForeignKey(() => State)
  @Column({ type: DataType.INTEGER, allowNull: true, field: 'id_state' })
  declare id_state: number | null;

  @Column({ type: DataType.STRING(32), allowNull: false })
  declare alias: string;

  @Column({ type: DataType.STRING(100), allowNull: false, field: 'first_name' })
  declare first_name: string;

  @Column({ type: DataType.STRING(100), allowNull: false, field: 'last_name' })
  declare last_name: string;

  @Column({ type: DataType.STRING(100), allowNull: true })
  declare company: string | null;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare address1: string;

  @Column({ type: DataType.STRING(255), allowNull: true })
  declare address2: string | null;

  @Column({ type: DataType.STRING(64), allowNull: false })
  declare city: string;

  @Column({ type: DataType.STRING(12), allowNull: false })
  declare postcode: string;

  @Column({ type: DataType.STRING(32), allowNull: true })
  declare phone: string | null;

  @Column({ type: DataType.STRING(32), allowNull: true, field: 'phone_mobile' })
  declare phone_mobile: string | null;

  @Column({ type: DataType.STRING(32), allowNull: true, field: 'vat_number' })
  declare vat_number: string | null;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare active: boolean;

  @BelongsTo(() => User, 'id_user')
  declare user: User;

  @BelongsTo(() => Country, 'id_country')
  declare country: Country;

  @BelongsTo(() => State, 'id_state')
  declare state: State | null;

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
