import { Router } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { productService } from '../product/service.js';
import { sendSuccess } from '../../utils/response.js';

export const searchRouter = Router();

/**
 * @swagger
 * /search:
 *   get:
 *     tags: [Search]
 *     summary: Búsqueda rápida de productos
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema: { type: string }
 *         description: Texto de búsqueda
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 8 }
 *     responses:
 *       200: { description: Resultados de búsqueda }
 */
searchRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const q = (req.query.q as string) || '';
    const limit = Math.min(Number(req.query.limit) || 8, 20);
    const results = await productService.quickSearch(q, limit);
    sendSuccess(res, results);
  }),
);
