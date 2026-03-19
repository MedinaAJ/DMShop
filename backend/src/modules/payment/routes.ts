import { Router, raw } from 'express';
import { paymentController } from './controller.js';
import { paypalRouter } from './paypal.routes.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate } from '../../middleware/authenticate.js';

export const paymentRouter = Router();

// Public (authenticated user)
paymentRouter.get('/methods', authenticate, asyncHandler(paymentController.listMethods));
paymentRouter.post('/process', authenticate, asyncHandler(paymentController.process));
paymentRouter.get('/confirmation/:orderId', authenticate, asyncHandler(paymentController.confirmation));

// PayPal redirect callbacks (no authentication required — user comes back from PayPal)
paymentRouter.use('/paypal', paypalRouter);

// Webhooks from payment providers (raw body for signature verification)
paymentRouter.post('/webhook/:method', raw({ type: 'application/json' }), asyncHandler(paymentController.webhook));
