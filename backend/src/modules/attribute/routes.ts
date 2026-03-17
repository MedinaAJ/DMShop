import { Router } from 'express';
import { attributeController } from './controller.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import {
  createAttributeSchema,
  updateAttributeSchema,
  createAttributeValueSchema,
  updateAttributeValueSchema,
} from '@dmshop/shared';

export const attributeRouter = Router();

// Attributes
attributeRouter.get('/', asyncHandler(attributeController.list));
attributeRouter.get('/:id', asyncHandler(attributeController.getById));

attributeRouter.post(
  '/',
  authenticate,
  authorize('admin', 'employee'),
  validate(createAttributeSchema),
  asyncHandler(attributeController.create),
);

attributeRouter.put(
  '/:id',
  authenticate,
  authorize('admin', 'employee'),
  validate(updateAttributeSchema),
  asyncHandler(attributeController.update),
);

attributeRouter.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  asyncHandler(attributeController.remove),
);

// Attribute Values
attributeRouter.get('/:id/values', asyncHandler(attributeController.listValues));

attributeRouter.post(
  '/:id/values',
  authenticate,
  authorize('admin', 'employee'),
  validate(createAttributeValueSchema),
  asyncHandler(attributeController.createValue),
);

attributeRouter.put(
  '/:id/values/:valueId',
  authenticate,
  authorize('admin', 'employee'),
  validate(updateAttributeValueSchema),
  asyncHandler(attributeController.updateValue),
);

attributeRouter.delete(
  '/:id/values/:valueId',
  authenticate,
  authorize('admin'),
  asyncHandler(attributeController.removeValue),
);
