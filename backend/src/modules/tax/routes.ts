import { Router } from 'express';
import { taxController } from './controller.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import {
  createTaxSchema,
  updateTaxSchema,
  createTaxRulesGroupSchema,
  updateTaxRulesGroupSchema,
  createTaxRuleSchema,
  updateTaxRuleSchema,
} from '@dmshop/shared';

export const taxRouter = Router();

const adminOnly = [authenticate, authorize('admin', 'employee')];

// Taxes
taxRouter.get('/taxes', ...adminOnly, asyncHandler(taxController.listTaxes));
taxRouter.post(
  '/taxes',
  ...adminOnly,
  validate(createTaxSchema),
  asyncHandler(taxController.createTax),
);
taxRouter.put(
  '/taxes/:id',
  ...adminOnly,
  validate(updateTaxSchema),
  asyncHandler(taxController.updateTax),
);
taxRouter.delete(
  '/taxes/:id',
  authenticate,
  authorize('admin'),
  asyncHandler(taxController.removeTax),
);

// Tax Rules Groups
taxRouter.get('/groups', ...adminOnly, asyncHandler(taxController.listGroups));
taxRouter.get('/groups/:id', ...adminOnly, asyncHandler(taxController.getGroupById));
taxRouter.post(
  '/groups',
  ...adminOnly,
  validate(createTaxRulesGroupSchema),
  asyncHandler(taxController.createGroup),
);
taxRouter.put(
  '/groups/:id',
  ...adminOnly,
  validate(updateTaxRulesGroupSchema),
  asyncHandler(taxController.updateGroup),
);
taxRouter.delete(
  '/groups/:id',
  authenticate,
  authorize('admin'),
  asyncHandler(taxController.removeGroup),
);

// Tax Rules
taxRouter.get('/groups/:groupId/rules', ...adminOnly, asyncHandler(taxController.listRules));
taxRouter.post(
  '/rules',
  ...adminOnly,
  validate(createTaxRuleSchema),
  asyncHandler(taxController.createRule),
);
taxRouter.put(
  '/rules/:ruleId',
  ...adminOnly,
  validate(updateTaxRuleSchema),
  asyncHandler(taxController.updateRule),
);
taxRouter.delete(
  '/rules/:ruleId',
  authenticate,
  authorize('admin'),
  asyncHandler(taxController.removeRule),
);
