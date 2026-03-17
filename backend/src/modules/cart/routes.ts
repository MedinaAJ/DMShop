import { Router } from 'express';
import { cartController } from './controller.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate, optionalAuth } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { applyCartRuleSchema } from '@dmshop/shared';

export const cartRouter = Router();

cartRouter.get('/', optionalAuth, asyncHandler(cartController.get));
cartRouter.post('/items', optionalAuth, asyncHandler(cartController.addItem));
cartRouter.put('/items/:id', optionalAuth, asyncHandler(cartController.updateItem));
cartRouter.delete('/items/:id', optionalAuth, asyncHandler(cartController.removeItem));

// Discount codes
cartRouter.post('/apply-discount', authenticate, validate(applyCartRuleSchema), asyncHandler(cartController.applyDiscount));
cartRouter.delete('/remove-discount/:id', authenticate, asyncHandler(cartController.removeDiscount));
