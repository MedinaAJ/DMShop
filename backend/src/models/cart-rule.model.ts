import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';

@Table({ tableName: 'cart_rules' })
export class CartRule extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @Column({ type: DataType.STRING(64), allowNull: true, unique: true })
  declare code: string | null;

  @Column({ type: DataType.STRING(128), allowNull: false })
  declare name: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare description: string | null;

  @Column({ type: DataType.DATE, allowNull: true, field: 'date_from' })
  declare date_from: Date | null;

  @Column({ type: DataType.DATE, allowNull: true, field: 'date_to' })
  declare date_to: Date | null;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 1 })
  declare quantity: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 1, field: 'quantity_per_user' })
  declare quantity_per_user: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 1 })
  declare priority: number;

  @Column({
    type: DataType.DECIMAL(20, 6),
    allowNull: false,
    defaultValue: 0,
    field: 'minimum_amount',
  })
  declare minimum_amount: number;

  @Column({ type: DataType.INTEGER, allowNull: true, field: 'minimum_amount_currency' })
  declare minimum_amount_currency: number | null;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false, field: 'free_shipping' })
  declare free_shipping: boolean;

  @Column({
    type: DataType.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'reduction_percent',
  })
  declare reduction_percent: number;

  @Column({
    type: DataType.DECIMAL(20, 6),
    allowNull: false,
    defaultValue: 0,
    field: 'reduction_amount',
  })
  declare reduction_amount: number;

  @Column({ type: DataType.INTEGER, allowNull: true, field: 'reduction_currency' })
  declare reduction_currency: number | null;

  @Column({ type: DataType.INTEGER, allowNull: true, field: 'id_customer' })
  declare id_customer: number | null;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare active: boolean;

  @CreatedAt
  @Column({ type: DataType.DATE, field: 'created_at' })
  declare created_at: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE, field: 'updated_at' })
  declare updated_at: Date;
}
