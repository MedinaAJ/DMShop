import { Router } from 'express';
import { orderController } from './controller.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import {
  createOrderSchema,
  updateOrderStateSchema,
  registerPaymentSchema,
  updateTrackingSchema,
  orderListQuerySchema,
} from '@dmshop/shared';

export const orderRouter = Router();

// --- Customer endpoints ---
orderRouter.get('/states', authenticate, asyncHandler(orderController.getStates));
orderRouter.get('/carriers', authenticate, asyncHandler(orderController.getCarriers));
orderRouter.post('/calculate', authenticate, asyncHandler(orderController.calculate));
orderRouter.post('/', authenticate, validate(createOrderSchema), asyncHandler(orderController.checkout));
orderRouter.get('/', authenticate, validate(orderListQuerySchema, 'query'), asyncHandler(orderController.list));
orderRouter.get('/:id', authenticate, asyncHandler(orderController.getById));

// --- Admin endpoints ---
orderRouter.get('/admin/list', authenticate, authorize('admin'), validate(orderListQuerySchema, 'query'), asyncHandler(orderController.adminList));
orderRouter.get('/admin/:id', authenticate, authorize('admin'), asyncHandler(orderController.adminGetById));
orderRouter.put('/admin/:id/state', authenticate, authorize('admin'), validate(updateOrderStateSchema), asyncHandler(orderController.adminUpdateState));
orderRouter.post('/admin/:id/payment', authenticate, authorize('admin'), validate(registerPaymentSchema), asyncHandler(orderController.adminRegisterPayment));
orderRouter.put('/admin/:id/tracking', authenticate, authorize('admin'), validate(updateTrackingSchema), asyncHandler(orderController.adminUpdateTracking));
