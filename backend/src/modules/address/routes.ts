import { Router } from 'express';
import { addressController } from './controller.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { createAddressSchema, updateAddressSchema } from '@dmshop/shared';

export const addressRouter = Router();

addressRouter.get('/', authenticate, asyncHandler(addressController.list));
addressRouter.get('/:id', authenticate, asyncHandler(addressController.getById));

addressRouter.post(
  '/',
  authenticate,
  validate(createAddressSchema),
  asyncHandler(addressController.create),
);

addressRouter.put(
  '/:id',
  authenticate,
  validate(updateAddressSchema),
  asyncHandler(addressController.update),
);

addressRouter.delete('/:id', authenticate, asyncHandler(addressController.remove));
