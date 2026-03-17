import { Router } from 'express';
import { supplierController } from './controller.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { createSupplierSchema, updateSupplierSchema, paginationSchema } from '@dmshop/shared';

export const supplierRouter = Router();

supplierRouter.get('/', validate(paginationSchema, 'query'), asyncHandler(supplierController.list));
supplierRouter.get('/:id', asyncHandler(supplierController.getById));

supplierRouter.post(
  '/',
  authenticate,
  authorize('admin', 'employee'),
  validate(createSupplierSchema),
  asyncHandler(supplierController.create),
);

supplierRouter.put(
  '/:id',
  authenticate,
  authorize('admin', 'employee'),
  validate(updateSupplierSchema),
  asyncHandler(supplierController.update),
);

supplierRouter.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  asyncHandler(supplierController.remove),
);
