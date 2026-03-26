import { Router } from 'express';
import { translationController } from './controller.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

export const translationRouter = Router();

// Public: get translations for a language
translationRouter.get('/:lang', asyncHandler(translationController.getByLang));

// Admin: update translations
translationRouter.put(
  '/admin/:lang',
  authenticate,
  authorize('admin'),
  asyncHandler(translationController.bulkUpdate),
);
