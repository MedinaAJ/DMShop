import { Table, Column, Model, DataType, CreatedAt, UpdatedAt } from 'sequelize-typescript';

export interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  font: string;
  logoUrl?: string;
  faviconUrl?: string;
  showPricesWithoutTax?: boolean;
  productsPerPage?: number;
  bannerText?: string;
  bannerSubtitle?: string;
  bannerImageUrl?: string;
  headerStyle?: 'light' | 'dark' | 'transparent';
  productCardStyle?: 'classic' | 'minimal' | 'detailed';
  borderRadius?: 'none' | 'small' | 'medium' | 'large';
  buttonStyle?: 'filled' | 'outlined' | 'soft';
  colorScheme?: 'light' | 'dark';
}

@Table({ tableName: 'dm_themes', timestamps: true })
export class Theme extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @Column({ type: DataType.STRING(100), allowNull: false })
  declare name: string;

  @Column({ type: DataType.STRING(100), allowNull: false, unique: true })
  declare slug: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare description: string | null;

  @Column({ type: DataType.STRING(255), allowNull: true, field: 'preview_image' })
  declare preview_image: string | null;

  @Column({ type: DataType.TINYINT, defaultValue: 0, field: 'is_active' })
  declare is_active: number;

  @Column({ type: DataType.TINYINT, defaultValue: 0, field: 'is_builtin' })
  declare is_builtin: number;

  @Column({ type: DataType.JSON, allowNull: false })
  declare config: ThemeConfig;

  @CreatedAt
  @Column({ type: DataType.DATE, field: 'createdAt' })
  declare createdAt: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE, field: 'updatedAt' })
  declare updatedAt: Date;
}
