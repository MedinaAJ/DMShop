import { Router, raw, urlencoded } from 'express';
import { paymentController } from './controller.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate } from '../../middleware/authenticate.js';

export const paymentRouter = Router();

// Public (authenticated user)
paymentRouter.get('/methods', authenticate, asyncHandler(paymentController.listMethods));
paymentRouter.post('/process', authenticate, asyncHandler(paymentController.process));
paymentRouter.get('/confirmation/:orderId', authenticate, asyncHandler(paymentController.confirmation));

// Redsys: get signed form fields to redirect to TPV
paymentRouter.post('/redsys/form', authenticate, asyncHandler(paymentController.redsysForm));

// PayPal: OAuth2 callback routes (no auth middleware — user comes back from PayPal)
paymentRouter.get('/paypal/success', asyncHandler(paymentController.paypalSuccess));
paymentRouter.get('/paypal/cancel', asyncHandler(paymentController.paypalCancel));

// Webhooks from payment providers (raw body for signature verification)
// Redsys sends URL-encoded POST, so accept both JSON and form-encoded
paymentRouter.post(
  '/webhook/redsys',
  urlencoded({ extended: false }),
  asyncHandler(paymentController.webhook.bind(paymentController)),
);
paymentRouter.post('/webhook/:method', raw({ type: 'application/json' }), asyncHandler(paymentController.webhook));
