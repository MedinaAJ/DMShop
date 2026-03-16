import { Router } from 'express';
import { categoryController } from './controller.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { createCategorySchema, updateCategorySchema } from '@dmshop/shared';

export const categoryRouter = Router();

categoryRouter.get('/', asyncHandler(categoryController.list));
categoryRouter.get('/tree', asyncHandler(categoryController.tree));
categoryRouter.get('/:id', asyncHandler(categoryController.getById));

categoryRouter.post(
  '/',
  authenticate,
  authorize('admin', 'employee'),
  validate(createCategorySchema),
  asyncHandler(categoryController.create),
);

categoryRouter.put(
  '/:id',
  authenticate,
  authorize('admin', 'employee'),
  validate(updateCategorySchema),
  asyncHandler(categoryController.update),
);

categoryRouter.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  asyncHandler(categoryController.remove),
);
