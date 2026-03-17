import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  CreatedAt,
} from 'sequelize-typescript';
import { User } from './user.model.js';

@Table({ tableName: 'refresh_tokens', timestamps: false })
export class RefreshToken extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_user' })
  declare id_user: number;

  @BelongsTo(() => User)
  declare user: User;

  @Column({ type: DataType.STRING(500), allowNull: false })
  declare token: string;

  @Column({ type: DataType.DATE, allowNull: false, field: 'expires_at' })
  declare expires_at: Date;

  @CreatedAt
  @Column({ type: DataType.DATE, field: 'created_at' })
  declare created_at: Date;
}
