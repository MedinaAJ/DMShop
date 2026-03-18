import { Router } from 'express';
import { returnController } from './controller.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

export const returnRouter = Router();

// Customer: my returns
returnRouter.get('/mine', authenticate, asyncHandler(returnController.getMine));

// Admin: list all returns
returnRouter.get('/', authenticate, authorize('admin', 'employee'), asyncHandler(returnController.list));

// Admin: get return detail
returnRouter.get('/:id', authenticate, authorize('admin', 'employee'), asyncHandler(returnController.getById));

// Admin: update return state
returnRouter.patch('/:id/state', authenticate, authorize('admin', 'employee'), asyncHandler(returnController.updateState));
