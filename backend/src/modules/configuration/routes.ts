import { Router } from 'express';
import { configurationController } from './controller.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

export const configurationRouter = Router();

configurationRouter.get('/', authenticate, authorize('admin'), asyncHandler(configurationController.list));
configurationRouter.put('/', authenticate, authorize('admin'), asyncHandler(configurationController.bulkUpdate));
