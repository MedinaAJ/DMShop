import { Router } from 'express';
import { Lang } from '../../models/lang.model.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import { sendSuccess } from '../../utils/response.js';

export const langRouter = Router();

/** GET /langs — list all active languages */
langRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const langs = await Lang.findAll({ where: { active: true }, order: [['is_default', 'DESC'], ['name', 'ASC']] });
    sendSuccess(res, langs);
  }),
);
