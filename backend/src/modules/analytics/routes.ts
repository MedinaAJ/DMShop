import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import { analyticsController } from './controller.js';

export const analyticsRouter = Router();

analyticsRouter.use(authenticate);
analyticsRouter.use(authorize('admin', 'employee'));

analyticsRouter.get('/summary', asyncHandler(analyticsController.getSummary));
analyticsRouter.get('/revenue-chart', asyncHandler(analyticsController.getRevenueChart));
analyticsRouter.get('/top-products', asyncHandler(analyticsController.getTopProducts));
analyticsRouter.get('/top-categories', asyncHandler(analyticsController.getTopCategories));
analyticsRouter.get('/customers-chart', asyncHandler(analyticsController.getCustomersChart));
analyticsRouter.get('/dashboard/stats', asyncHandler(analyticsController.getDashboardStats));

