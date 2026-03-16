import { Sequelize } from 'sequelize-typescript';
import { env } from './env.js';
import { logger } from './logger.js';
import {
  User,
  RefreshToken,
  Lang,
  Currency,
  Configuration,
  Category,
  CategoryLang,
  Manufacturer,
  Product,
  ProductLang,
  ProductImage,
  Cart,
  CartItem,
} from '../models/index.js';

const models = [
  User,
  RefreshToken,
  Lang,
  Currency,
  Configuration,
  Category,
  CategoryLang,
  Manufacturer,
  Product,
  ProductLang,
  ProductImage,
  Cart,
  CartItem,
];

export const sequelize = new Sequelize({
  dialect: 'mariadb',
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
