import { Router } from 'express';
import { reviewController } from './controller.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

export const reviewRouter = Router();

// Admin routes
reviewRouter.get('/', authenticate, authorize('admin', 'employee'), asyncHandler(reviewController.listPending));
reviewRouter.put('/:id/approve', authenticate, authorize('admin', 'employee'), asyncHandler(reviewController.approve));
reviewRouter.delete('/:id', authenticate, authorize('admin', 'employee'), asyncHandler(reviewController.remove));
