import { Router } from 'express';
import { newsletterController } from './controller.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

export const newsletterRouter = Router();

newsletterRouter.post('/newsletter/subscribe', asyncHandler(newsletterController.subscribe));
newsletterRouter.get('/newsletter/unsubscribe', asyncHandler(newsletterController.unsubscribe));

// Admin
newsletterRouter.get(
  '/admin/newsletter/subscribers',
  authenticate,
  authorize('admin'),
  asyncHandler(newsletterController.listSubscribers),
);
newsletterRouter.get(
  '/admin/newsletter/export',
  authenticate,
  authorize('admin'),
  asyncHandler(newsletterController.exportCsv),
);
