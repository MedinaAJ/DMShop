import { Router } from 'express';
import { loyaltyController } from './controller.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

export const loyaltyRouter = Router();

// Customer routes (mounted under /account/loyalty and /cart/apply-loyalty via main router)
loyaltyRouter.get('/account/loyalty', authenticate, asyncHandler(loyaltyController.getMyLoyalty));
loyaltyRouter.post('/cart/apply-loyalty', authenticate, asyncHandler(loyaltyController.applyPoints));

// Admin routes
loyaltyRouter.get('/admin/loyalty/config', authenticate, authorize('admin'), asyncHandler(loyaltyController.adminGetConfig));
loyaltyRouter.put('/admin/loyalty/config', authenticate, authorize('admin'), asyncHandler(loyaltyController.adminSaveConfig));
loyaltyRouter.get('/admin/users/:id/loyalty', authenticate, authorize('admin', 'employee'), asyncHandler(loyaltyController.adminGetUserPoints));
loyaltyRouter.post('/admin/users/:id/loyalty/adjust', authenticate, authorize('admin'), asyncHandler(loyaltyController.adminAdjustPoints));
