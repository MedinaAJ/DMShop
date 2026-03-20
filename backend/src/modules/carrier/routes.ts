import { Router } from 'express';
import { carrierController } from './controller.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { createCarrierSchema, updateCarrierSchema, paginationSchema } from '@dmshop/shared';

export const carrierRouter = Router();

carrierRouter.get('/available', asyncHandler(carrierController.getAvailable));
carrierRouter.get('/', validate(paginationSchema, 'query'), asyncHandler(carrierController.list));
carrierRouter.get('/:id', asyncHandler(carrierController.getById));

carrierRouter.post(
  '/',
  authenticate,
  authorize('admin', 'employee'),
  validate(createCarrierSchema),
  asyncHandler(carrierController.create),
);

carrierRouter.put(
  '/:id',
  authenticate,
  authorize('admin', 'employee'),
  validate(updateCarrierSchema),
  asyncHandler(carrierController.update),
);

carrierRouter.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  asyncHandler(carrierController.remove),
);

// Translation management
carrierRouter.put(
  '/:id/translations/:idLang',
  authenticate,
  authorize('admin', 'employee'),
  asyncHandler(carrierController.upsertTranslation),
);
