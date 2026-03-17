import { Router } from 'express';
import { manufacturerController } from './controller.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import {
  createManufacturerSchema,
  updateManufacturerSchema,
  paginationSchema,
} from '@dmshop/shared';

export const manufacturerRouter = Router();

manufacturerRouter.get(
  '/',
  validate(paginationSchema, 'query'),
  asyncHandler(manufacturerController.list),
);
manufacturerRouter.get('/:id', asyncHandler(manufacturerController.getById));

manufacturerRouter.post(
  '/',
  authenticate,
  authorize('admin', 'employee'),
  validate(createManufacturerSchema),
  asyncHandler(manufacturerController.create),
);

manufacturerRouter.put(
  '/:id',
  authenticate,
  authorize('admin', 'employee'),
  validate(updateManufacturerSchema),
  asyncHandler(manufacturerController.update),
);

manufacturerRouter.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  asyncHandler(manufacturerController.remove),
);
