import { Router } from 'express';
import { featureController } from './controller.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import {
  createFeatureSchema,
  updateFeatureSchema,
  createFeatureValueSchema,
  updateFeatureValueSchema,
} from '@dmshop/shared';

export const featureRouter = Router();

// Features
featureRouter.get('/', asyncHandler(featureController.list));
featureRouter.get('/:id', asyncHandler(featureController.getById));

featureRouter.post(
  '/',
  authenticate,
  authorize('admin', 'employee'),
  validate(createFeatureSchema),
  asyncHandler(featureController.create),
);

featureRouter.put(
  '/:id',
  authenticate,
  authorize('admin', 'employee'),
  validate(updateFeatureSchema),
  asyncHandler(featureController.update),
);

featureRouter.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  asyncHandler(featureController.remove),
);

// Feature Values
featureRouter.get('/:id/values', asyncHandler(featureController.listValues));

featureRouter.post(
  '/:id/values',
  authenticate,
  authorize('admin', 'employee'),
  validate(createFeatureValueSchema),
  asyncHandler(featureController.createValue),
);

featureRouter.put(
  '/:id/values/:valueId',
  authenticate,
  authorize('admin', 'employee'),
  validate(updateFeatureValueSchema),
  asyncHandler(featureController.updateValue),
);

featureRouter.delete(
  '/:id/values/:valueId',
  authenticate,
  authorize('admin'),
  asyncHandler(featureController.removeValue),
);
