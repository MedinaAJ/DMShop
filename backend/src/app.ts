import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';

import { env } from './config/env.js';
import { sequelize, initDatabase } from './config/database.js';
import { logger } from './config/logger.js';
import { errorHandler } from './middleware/error-handler.js';
import { resolveLanguage } from './middleware/language.js';
import { setupSwagger } from './config/swagger.js';
import { apiRouter } from './routes/index.js';
import { seoRouter } from './modules/seo/seo.routes.js';
import { registerPaymentModules } from './modules/payment/index.js';
import { cmsService } from './modules/cms/service.js';
import { OrderState } from './models/order-state.model.js';
import { translationService } from './modules/translation/service.js';
import { themeService } from './modules/theme/theme.service.js';
import { initWebSocket } from './websocket/notifications.js';

const app = express();

// --- Security middleware ---
app.use(helmet());
app.use(
  cors({
    origin: [env.FRONTEND_URL, env.ADMIN_URL],
    credentials: true,
  }),
);
app.use(
  rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

// --- Body parsers ---
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// --- Static files (uploads) ---
app.use('/uploads', express.static(env.UPLOAD_DIR));

// --- API docs ---
setupSwagger(app);

// --- Language resolution ---
app.use(resolveLanguage);

// --- API routes ---
app.use('/api/v1', apiRouter);

// --- SEO routes (sitemap.xml, robots.txt) ---
app.use('/', seoRouter);

// --- Health check ---
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- Error handler (must be last) ---
app.use(errorHandler);

// --- Start server ---
async function seedPaymentOrderStates(): Promise<void> {
  const paymentStates = [
    {
      id: 10,
      name: 'En espera de confirmación de pago',
      color: '#F39C12',
      paid: false,
      shipped: false,
      delivery: false,
      send_email: true,
      invoice: false,
      deleted: false,
      template: null,
      icon: null,
    },
    {
      id: 11,
      name: 'En espera de contra reembolso',
      color: '#16A085',
      paid: false,
      shipped: false,
      delivery: false,
      send_email: true,
      invoice: false,
      deleted: false,
      template: null,
      icon: null,
    },
  ];

  for (const state of paymentStates) {
    const existing = await OrderState.findByPk(state.id);
    if (!existing) {
      await OrderState.create(state as any);
      logger.info(`Created order state id=${state.id}: ${state.name}`);
    }
  }
}

async function bootstrap() {
  try {
    await initDatabase();
    logger.info('Database connected successfully');

    registerPaymentModules();
    logger.info('Payment modules registered');

    await cmsService.seedDefaultPages();
    logger.info('CMS default pages seeded');

    // Ensure payment-specific order states exist (ids 10 and 11)
    await seedPaymentOrderStates();
    logger.info('Payment order states ensured');

    // Seed translations if empty
    await translationService.seedDefaults();
    logger.info('Translations seeded');

    // Seed builtin themes
    await themeService.seedBuiltinThemes();
    logger.info('Builtin themes seeded');

    // Create HTTP server and attach WebSocket
    const httpServer = createServer(app);
    initWebSocket(httpServer);

    httpServer.listen(env.PORT, () => {
      logger.info(`DMShop API running on http://localhost:${env.PORT}`);
      logger.info(`Swagger docs at http://localhost:${env.PORT}/api-docs`);
      logger.info(`WebSocket server at ws://localhost:${env.PORT}/ws`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();

export { app, sequelize };
