import { Router } from 'express';
import { orderController } from './controller.js';
import { returnController } from '../return/controller.js';
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

// --- Customer endpoints (specific paths before :id) ---
orderRouter.get('/states', authenticate, asyncHandler(orderController.getStates));
orderRouter.get('/carriers', authenticate, asyncHandler(orderController.getCarriers));
orderRouter.post('/calculate', authenticate, asyncHandler(orderController.calculate));
orderRouter.post('/', authenticate, validate(createOrderSchema), asyncHandler(orderController.checkout));
orderRouter.get('/', authenticate, validate(orderListQuerySchema, 'query'), asyncHandler(orderController.list));

// --- Admin: Order State CRUD (must be before /admin/:id) ---
orderRouter.post('/admin/states', authenticate, authorize('admin'), asyncHandler(orderController.adminCreateState));
orderRouter.put('/admin/states/:id', authenticate, authorize('admin'), asyncHandler(orderController.adminUpdateState2));
orderRouter.delete('/admin/states/:id', authenticate, authorize('admin'), asyncHandler(orderController.adminDeleteState));

// --- Admin: Order management (must be before /:id) ---
orderRouter.get('/admin/list', authenticate, authorize('admin'), validate(orderListQuerySchema, 'query'), asyncHandler(orderController.adminList));
orderRouter.get('/admin/:id', authenticate, authorize('admin'), asyncHandler(orderController.adminGetById));
orderRouter.put('/admin/:id/state', authenticate, authorize('admin'), validate(updateOrderStateSchema), asyncHandler(orderController.adminUpdateState));
orderRouter.post('/admin/:id/payment', authenticate, authorize('admin'), validate(registerPaymentSchema), asyncHandler(orderController.adminRegisterPayment));
orderRouter.put('/admin/:id/tracking', authenticate, authorize('admin'), validate(updateTrackingSchema), asyncHandler(orderController.adminUpdateTracking));

// --- Customer: order by id + returns ---
orderRouter.get('/:id', authenticate, asyncHandler(orderController.getById));
orderRouter.post('/:id/returns', authenticate, asyncHandler(returnController.createReturn));
