import { Sequelize } from 'sequelize-typescript';
import { env } from './env.js';
import { logger } from './logger.js';
import {
  // Core
  User,
  RefreshToken,
  Lang,
  Currency,
  Configuration,
  // Catalog
  Category,
  CategoryLang,
  Manufacturer,
  Supplier,
  Product,
  ProductLang,
  ProductImage,
  ProductCategory,
  // Attributes & Combinations
  Attribute,
  AttributeLang,
  AttributeValue,
  AttributeValueLang,
  ProductCombination,
  CombinationAttributeValue,
  CombinationImage,
  // Features
  Feature,
  FeatureLang,
  FeatureValue,
  FeatureValueLang,
  ProductFeature,
  // Geography
  Zone,
  Country,
  State,
  Address,
  // Tax
  Tax,
  TaxRulesGroup,
  TaxRule,
  // Customer groups
  CustomerGroup,
  CustomerGroupLang,
  UserGroup,
  // Cart
  Cart,
  CartItem,
  CartCartRule,
  CartRule,
  // Carriers
  Carrier,
  CarrierZone,
  CarrierRange,
  CarrierRangePrice,
  // Orders
  OrderState,
  Order,
  OrderItem,
  OrderHistory,
  OrderPayment,
  OrderCarrier,
  // Pricing
  SpecificPrice,
  // Stock
  StockMovement,
} from '../models/index.js';

const models = [
  // Core
  User,
  RefreshToken,
  Lang,
  Currency,
  Configuration,
  // Catalog
  Category,
  CategoryLang,
  Manufacturer,
  Supplier,
  Product,
  ProductLang,
  ProductImage,
  ProductCategory,
  // Attributes & Combinations
  Attribute,
  AttributeLang,
  AttributeValue,
  AttributeValueLang,
  ProductCombination,
  CombinationAttributeValue,
  CombinationImage,
  // Features
  Feature,
  FeatureLang,
  FeatureValue,
  FeatureValueLang,
  ProductFeature,
  // Geography
  Zone,
  Country,
  State,
  Address,
  // Tax
  Tax,
  TaxRulesGroup,
  TaxRule,
  // Customer groups
  CustomerGroup,
  CustomerGroupLang,
  UserGroup,
  // Cart
  Cart,
  CartItem,
  CartCartRule,
  CartRule,
  // Carriers
  Carrier,
  CarrierZone,
  CarrierRange,
  CarrierRangePrice,
  // Orders
  OrderState,
  Order,
  OrderItem,
  OrderHistory,
  OrderPayment,
  OrderCarrier,
  // Pricing
  SpecificPrice,
  // Stock
  StockMovement,
];

export const sequelize = new Sequelize({
  dialect: 'mysql',
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  username: env.DB_USER,
  password: env.DB_PASS,
  models,
  logging: env.isDev ? (msg) => logger.debug(msg) : false,
  define: {
    timestamps: true,
    underscored: true,
    paranoid: false,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  pool: {
    max: 10,
    min: 2,
    acquire: 30000,
    idle: 10000,
  },
});

export async function initDatabase(): Promise<void> {
  await sequelize.authenticate();

  if (env.isDev) {
    // In development, sync models (creates tables if they don't exist)
    await sequelize.sync({ alter: false });
  }
}
