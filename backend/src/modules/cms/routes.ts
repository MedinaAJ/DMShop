import { Router } from 'express';
import { cmsController } from './controller.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

export const cmsRouter = Router();

// Public routes
cmsRouter.get('/pages', asyncHandler(cmsController.listPages));
cmsRouter.get('/pages/:slug', asyncHandler(cmsController.getPage));

// Admin routes
cmsRouter.get(
  '/admin/pages',
  authenticate,
  authorize('admin', 'employee'),
  asyncHandler(cmsController.listAdmin),
);
cmsRouter.post(
  '/admin/pages',
  authenticate,
  authorize('admin', 'employee'),
  asyncHandler(cmsController.createPage),
);
cmsRouter.put(
  '/admin/pages/:id',
  authenticate,
  authorize('admin', 'employee'),
  asyncHandler(cmsController.updatePage),
);
cmsRouter.delete(
  '/admin/pages/:id',
  authenticate,
  authorize('admin'),
  asyncHandler(cmsController.deletePage),
);
