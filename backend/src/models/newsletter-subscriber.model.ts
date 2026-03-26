import { Table, Column, Model, DataType, CreatedAt, UpdatedAt, BelongsTo, ForeignKey } from 'sequelize-typescript';
import { User } from './user.model.js';

@Table({ tableName: 'dm_newsletter_subscribers' })
export class NewsletterSubscriber extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @Column({ type: DataType.STRING(255), unique: true, allowNull: false })
  declare email: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: true, field: 'id_user' })
  declare id_user: number | null;

  @BelongsTo(() => User, 'id_user')
  declare user: User;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare active: boolean;

  @Column({ type: DataType.STRING(64), allowNull: true })
  declare token: string | null;

  @Column({ type: DataType.STRING(50), allowNull: true, defaultValue: 'website' })
  declare source: string;

  @Column({ type: DataType.DATE, allowNull: true, field: 'unsubscribed_at' })
  declare unsubscribed_at: Date | null;

  @CreatedAt
  @Column({ type: DataType.DATE, field: 'subscribed_at' })
  declare subscribed_at: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE, field: 'updated_at' })
  declare updated_at: Date;
}
