import { Router } from 'express';
import { userController } from './controller.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

export const userRouter = Router();

userRouter.get('/', authenticate, authorize('admin'), asyncHandler(userController.list));
userRouter.get('/:id', authenticate, authorize('admin'), asyncHandler(userController.getById));
userRouter.put('/:id', authenticate, authorize('admin'), asyncHandler(userController.update));
userRouter.delete('/:id', authenticate, authorize('admin'), asyncHandler(userController.remove));
userRouter.patch(
  '/:id/toggle-active',
  authenticate,
  authorize('admin'),
  asyncHandler(userController.toggleActive),
);
userRouter.get(
  '/:id/addresses',
  authenticate,
  authorize('admin'),
  asyncHandler(userController.getAddresses),
);
