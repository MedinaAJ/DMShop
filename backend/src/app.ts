import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import { env } from './config/env.js';
import { sequelize, initDatabase } from './config/database.js';
import { logger } from './config/logger.js';
import { errorHandler } from './middleware/error-handler.js';
import { resolveLanguage } from './middleware/language.js';
import { setupSwagger } from './config/swagger.js';
import { apiRouter } from './routes/index.js';

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

// --- Health check ---
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- Error handler (must be last) ---
app.use(errorHandler);

// --- Start server ---
async function bootstrap() {
  try {
    await initDatabase();
    logger.info('Database connected successfully');

    app.listen(env.PORT, () => {
      logger.info(`DMShop API running on http://localhost:${env.PORT}`);
      logger.info(`Swagger docs at http://localhost:${env.PORT}/api-docs`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();

export { app, sequelize };
