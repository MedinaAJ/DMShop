import dotenv from 'dotenv';
import { resolve } from 'path';

// Cargar .env desde la raíz del monorepo
dotenv.config({ path: resolve(__dirname, '..', '..', '..', '.env') });
// Fallback: intentar también desde cwd (por si se ejecuta desde la raíz)
dotenv.config();

const requiredEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const optionalEnv = (key: string, defaultValue: string): string => {
  return process.env[key] || defaultValue;
};

export const env = {
  NODE_ENV: optionalEnv('NODE_ENV', 'development'),
  PORT: parseInt(optionalEnv('PORT', '3000'), 10),

  APP_URL: optionalEnv('APP_URL', 'http://localhost:3000'),
  FRONTEND_URL: optionalEnv('FRONTEND_URL', 'http://localhost:4200'),
  ADMIN_URL: optionalEnv('ADMIN_URL', 'http://localhost:4300'),

  DB_HOST: optionalEnv('DB_HOST', 'localhost'),
  DB_PORT: parseInt(optionalEnv('DB_PORT', '3306'), 10),
  DB_NAME: optionalEnv('DB_NAME', 'dmshop'),
  DB_USER: optionalEnv('DB_USER', 'root'),
  DB_PASS: optionalEnv('DB_PASS', ''),

  JWT_ACCESS_SECRET: requiredEnv('JWT_ACCESS_SECRET'),
  JWT_REFRESH_SECRET: requiredEnv('JWT_REFRESH_SECRET'),
  JWT_ACCESS_EXPIRATION: optionalEnv('JWT_ACCESS_EXPIRATION', '15m'),
  JWT_REFRESH_EXPIRATION: optionalEnv('JWT_REFRESH_EXPIRATION', '7d'),

  SMTP_HOST: optionalEnv('SMTP_HOST', ''),
  SMTP_PORT: parseInt(optionalEnv('SMTP_PORT', '587'), 10),
  SMTP_SECURE: optionalEnv('SMTP_SECURE', 'false') === 'true',
  SMTP_USER: optionalEnv('SMTP_USER', ''),
  SMTP_PASS: optionalEnv('SMTP_PASS', ''),
  SMTP_FROM: optionalEnv('SMTP_FROM', 'noreply@dmshop.com'),
  SMTP_FROM_NAME: optionalEnv('SMTP_FROM_NAME', 'DMShop'),
  SMTP_FROM_EMAIL: optionalEnv('SMTP_FROM_EMAIL', 'noreply@dmshop.com'),

  // PayPal
  PAYPAL_CLIENT_ID: optionalEnv('PAYPAL_CLIENT_ID', ''),
  PAYPAL_CLIENT_SECRET: optionalEnv('PAYPAL_CLIENT_SECRET', ''),
  PAYPAL_MODE: optionalEnv('PAYPAL_MODE', 'sandbox'),

  UPLOAD_DIR: optionalEnv('UPLOAD_DIR', 'uploads'),
  MAX_FILE_SIZE: parseInt(optionalEnv('MAX_FILE_SIZE', '10485760'), 10),

  RATE_LIMIT_WINDOW_MS: parseInt(optionalEnv('RATE_LIMIT_WINDOW_MS', '900000'), 10),
  RATE_LIMIT_MAX: parseInt(optionalEnv('RATE_LIMIT_MAX', '100'), 10),

  LOG_LEVEL: optionalEnv('LOG_LEVEL', 'debug'),
  LOG_DIR: optionalEnv('LOG_DIR', 'logs'),

  get isDev() {
    return this.NODE_ENV === 'development';
  },
  get isProd() {
    return this.NODE_ENV === 'production';
  },
};
