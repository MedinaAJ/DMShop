import { Router } from 'express';
import { productController } from './controller.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { optionalAuth } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { createProductSchema, updateProductSchema, paginationSchema } from '@dmshop/shared';

export const productRouter = Router();

/**
 * @swagger
 * /products:
 *   get:
 *     tags: [Products]
 *     summary: Listar productos
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: perPage
 *         schema: { type: integer }
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *       - in: query
 *         name: idCategory
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Lista de productos }
 */
productRouter.get(
  '/',
  optionalAuth,
  validate(paginationSchema, 'query'),
  asyncHandler(productController.list),
);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Detalle de producto
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Producto }
 *       404: { description: No encontrado }
 */
productRouter.get('/:id', optionalAuth, asyncHandler(productController.getById));

productRouter.post(
  '/',
  authenticate,
  authorize('admin', 'employee'),
  validate(createProductSchema),
  asyncHandler(productController.create),
);

productRouter.put(
  '/:id',
  authenticate,
  authorize('admin', 'employee'),
  validate(updateProductSchema),
  asyncHandler(productController.update),
);

productRouter.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  asyncHandler(productController.remove),
);
