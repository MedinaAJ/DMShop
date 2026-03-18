// Setup global para tests: mocks de sequelize, etc.
import { vi } from 'vitest';

// Mock sequelize para tests unitarios (no necesitamos BD real)
vi.mock('../config/database.js', () => ({
  sequelize: {
    query: vi.fn(),
    transaction: vi.fn((cb: Function) => cb({ commit: vi.fn(), rollback: vi.fn() })),
    literal: vi.fn((sql: string) => sql),
  },
  initDatabase: vi.fn(),
}));

vi.mock('../config/logger.js', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock env to provide required JWT secrets without real .env
vi.mock('../config/env.js', () => ({
  env: {
    NODE_ENV: 'test',
    JWT_ACCESS_SECRET: 'test-access-secret',
    JWT_REFRESH_SECRET: 'test-refresh-secret',
    JWT_ACCESS_EXPIRATION: '15m',
    JWT_REFRESH_EXPIRATION: '7d',
    APP_URL: 'http://localhost:3000',
    FRONTEND_URL: 'http://localhost:4200',
    ADMIN_URL: 'http://localhost:4300',
    PORT: 3000,
    DB_HOST: 'localhost',
    DB_PORT: 3306,
    DB_NAME: 'dmshop_test',
    DB_USER: 'root',
    DB_PASS: '',
    SMTP_HOST: '',
    SMTP_PORT: 587,
    SMTP_SECURE: false,
    SMTP_USER: '',
    SMTP_PASS: '',
    SMTP_FROM: 'noreply@dmshop.com',
    SMTP_FROM_NAME: 'DMShop',
    SMTP_FROM_EMAIL: 'noreply@dmshop.com',
    UPLOAD_DIR: 'uploads',
    MAX_FILE_SIZE: 10485760,
    RATE_LIMIT_WINDOW_MS: 900000,
    RATE_LIMIT_MAX: 100,
    LOG_LEVEL: 'debug',
    LOG_DIR: 'logs',
    isDev: true,
    isProd: false,
  },
}));
