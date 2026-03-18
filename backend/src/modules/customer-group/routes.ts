import { Router } from 'express';
import { customerGroupController } from './controller.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

export const customerGroupRouter = Router();

// List all groups (admin)
customerGroupRouter.get(
  '/',
  authenticate,
  authorize('admin', 'employee'),
  asyncHandler(customerGroupController.list),
);

// Get group by ID (admin)
customerGroupRouter.get(
  '/:id',
  authenticate,
  authorize('admin', 'employee'),
  asyncHandler(customerGroupController.getById),
);

// Create group (admin)
customerGroupRouter.post(
  '/',
  authenticate,
  authorize('admin'),
  asyncHandler(customerGroupController.create),
);

// Update group (admin)
customerGroupRouter.put(
  '/:id',
  authenticate,
  authorize('admin'),
  asyncHandler(customerGroupController.update),
);

// Delete group (admin) — protected groups 1,2,3 cannot be deleted
customerGroupRouter.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  asyncHandler(customerGroupController.remove),
);

// Get users in a group (admin)
customerGroupRouter.get(
  '/:id/users',
  authenticate,
  authorize('admin', 'employee'),
  asyncHandler(customerGroupController.getUsers),
);

// Assign user to group (admin)
customerGroupRouter.post(
  '/:id/users',
  authenticate,
  authorize('admin'),
  asyncHandler(customerGroupController.assignUser),
);

// Remove user from group (admin)
customerGroupRouter.delete(
  '/:id/users/:userId',
  authenticate,
  authorize('admin'),
  asyncHandler(customerGroupController.removeUser),
);
