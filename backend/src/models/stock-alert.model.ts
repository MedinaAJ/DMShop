import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
} from 'sequelize-typescript';

/**
 * StockAlert — stores email subscriptions for out-of-stock notifications.
 * When a product (or combination) returns to stock, subscribed emails are notified
 * and sent_at is set so they won't be notified again until they re-subscribe.
 */
@Table({ tableName: 'dm_stock_alerts', timestamps: false })
export class StockAlert extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_product' })
  declare id_product: number;

  @Column({ type: DataType.INTEGER, allowNull: true, field: 'id_combination' })
  declare id_combination: number | null;

  @Column({ type: DataType.STRING(128), allowNull: false })
  declare email: string;

  @Column({ type: DataType.INTEGER, allowNull: true, field: 'id_lang', defaultValue: 1 })
  declare id_lang: number;

  @CreatedAt
  @Column({ type: DataType.DATE, field: 'created_at' })
  declare created_at: Date;

  @Column({ type: DataType.DATE, allowNull: true, field: 'sent_at' })
  declare sent_at: Date | null;
}
