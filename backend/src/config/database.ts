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
  CarrierLang,
  CarrierZone,
  CarrierRange,
  CarrierRangePrice,
  // Orders
  OrderState,
  OrderStateLang,
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
import { Wishlist } from '../models/wishlist.model.js';
import { WishlistItem } from '../models/wishlist-item.model.js';
import { ProductReview } from '../models/product-review.model.js';
import { StockAlert } from '../models/stock-alert.model.js';
import { LoyaltyPoint } from '../models/loyalty-point.model.js';
import { CmsCategory } from '../models/cms-category.model.js';
import { CmsCategoryLang } from '../models/cms-category-lang.model.js';
import { CmsPage } from '../models/cms-page.model.js';
import { CmsPageLang } from '../models/cms-page-lang.model.js';
import { ProductPriceHistory } from '../models/product-price-history.model.js';
import { Translation } from '../models/translation.model.js';
import { Affiliate } from '../models/affiliate.model.js';
import { AffiliateReferral } from '../models/affiliate-referral.model.js';
import { NewsletterSubscriber } from '../models/newsletter-subscriber.model.js';
import { SupportTicket } from '../models/support-ticket.model.js';
import { SupportMessage } from '../models/support-message.model.js';
import { Quote } from '../models/quote.model.js';
import { QuoteItem } from '../models/quote-item.model.js';

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
  CarrierLang,
  CarrierZone,
  CarrierRange,
  CarrierRangePrice,
  // Orders
  OrderState,
  OrderStateLang,
  Order,
  OrderItem,
  OrderHistory,
  OrderPayment,
  OrderCarrier,
  // Pricing
  SpecificPrice,
  ProductPriceHistory,
  // Stock
  StockMovement,
  // Wishlist
  Wishlist,
  WishlistItem,
  // Reviews
  ProductReview,
  // Stock Alerts
  StockAlert,
  // Loyalty
  LoyaltyPoint,
  // CMS
  CmsCategory,
  CmsCategoryLang,
  CmsPage,
  CmsPageLang,
  // Translations
  Translation,
  // Affiliates
  Affiliate,
  AffiliateReferral,
  // Newsletter
  NewsletterSubscriber,
  // Support
  SupportTicket,
  SupportMessage,
  // Quotes
  Quote,
  QuoteItem,
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
