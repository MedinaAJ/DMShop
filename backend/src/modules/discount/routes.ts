import { Router } from 'express';
import { discountController } from './controller.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import {
  createCartRuleSchema,
  updateCartRuleSchema,
  createSpecificPriceSchema,
} from '@dmshop/shared';

export const discountRouter = Router();

// --- Cart Rules (admin) ---
discountRouter.get(
  '/cart-rules',
  authenticate, authorize('admin'),
  asyncHandler(discountController.listCartRules),
);
discountRouter.get(
  '/cart-rules/:id',
  authenticate, authorize('admin'),
  asyncHandler(discountController.getCartRule),
);
discountRouter.post(
  '/cart-rules',
  authenticate, authorize('admin'),
  validate(createCartRuleSchema),
  asyncHandler(discountController.createCartRule),
);
discountRouter.put(
  '/cart-rules/:id',
  authenticate, authorize('admin'),
  validate(updateCartRuleSchema),
  asyncHandler(discountController.updateCartRule),
);
discountRouter.delete(
  '/cart-rules/:id',
  authenticate, authorize('admin'),
  asyncHandler(discountController.deleteCartRule),
);

// --- Specific Prices (admin) ---
discountRouter.get(
  '/specific-prices',
  authenticate, authorize('admin'),
  asyncHandler(discountController.listSpecificPrices),
);
discountRouter.post(
  '/specific-prices',
  authenticate, authorize('admin'),
  validate(createSpecificPriceSchema),
  asyncHandler(discountController.createSpecificPrice),
);
discountRouter.delete(
  '/specific-prices/:id',
  authenticate, authorize('admin'),
  asyncHandler(discountController.deleteSpecificPrice),
);
