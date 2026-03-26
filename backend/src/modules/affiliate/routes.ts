import { Router } from 'express';
import { affiliateController } from './controller.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

export const affiliateRouter = Router();

// Customer: get own affiliate data
affiliateRouter.get('/account/affiliate', authenticate, asyncHandler(affiliateController.getMyAffiliate));

// Admin: list all affiliates
affiliateRouter.get(
  '/admin/affiliates',
  authenticate,
  authorize('admin'),
  asyncHandler(affiliateController.listAffiliates),
);
