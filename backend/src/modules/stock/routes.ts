import { Router } from 'express';
import { stockController } from './controller.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

export const stockRouter = Router();

// GET /stock/movements — list movements (admin only)
stockRouter.get(
  '/movements',
  authenticate,
  authorize('admin'),
  asyncHandler(stockController.getMovements),
);

// POST /stock/movements — manual movement (admin only)
stockRouter.post(
  '/movements',
  authenticate,
  authorize('admin'),
  asyncHandler(stockController.createMovement),
);

// GET /stock/alerts — products with low stock (admin only)
stockRouter.get(
  '/alerts',
  authenticate,
  authorize('admin'),
  asyncHandler(stockController.getAlerts),
);
