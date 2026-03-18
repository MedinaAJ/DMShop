import { Router } from 'express';
import { mailController } from './mail.controller.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { env } from '../../config/env.js';

export const mailRouter = Router();

// Test endpoint — only available in non-production environments
mailRouter.post(
  '/test',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    if (env.isProd) {
      res.status(403).json({ success: false, errors: [{ message: 'Not available in production', code: 'FORBIDDEN' }] });
      return;
    }
    await mailController.testEmail(req, res);
  }),
);
