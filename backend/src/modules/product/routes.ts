import { Router } from 'express';
import { productController } from './controller.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { optionalAuth } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { createProductSchema, updateProductSchema, paginationSchema } from '@dmshop/shared';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const productId = req.params.id || 'unknown';
    const dir = path.join(process.cwd(), 'uploads', 'products', productId);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    cb(null, allowed.includes(file.mimetype));
  },
});

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
 *         name: search
 *         schema: { type: string }
 *         description: Busca en nombre, descripción corta y referencia
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Alias de search
 *       - in: query
 *         name: idCategory
 *         schema: { type: integer }
 *       - in: query
 *         name: id_manufacturer
 *         schema: { type: integer }
 *       - in: query
 *         name: min_price
 *         schema: { type: number }
 *       - in: query
 *         name: max_price
 *         schema: { type: number }
 *       - in: query
 *         name: in_stock
 *         schema: { type: boolean }
 *       - in: query
 *         name: attributes
 *         schema: { type: string }
 *         description: IDs de attribute_values separados por coma (ej. 1,3,7)
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

// Combinations
productRouter.get('/:id/combinations', asyncHandler(productController.listCombinations));
productRouter.post(
  '/:id/combinations',
  authenticate,
  authorize('admin', 'employee'),
  asyncHandler(productController.createCombination),
);
productRouter.put(
  '/:id/combinations/:combinationId',
  authenticate,
  authorize('admin', 'employee'),
  asyncHandler(productController.updateCombination),
);
productRouter.delete(
  '/:id/combinations/:combinationId',
  authenticate,
  authorize('admin'),
  asyncHandler(productController.removeCombination),
);

// Features
productRouter.get('/:id/features', asyncHandler(productController.listFeatures));
productRouter.post(
  '/:id/features',
  authenticate,
  authorize('admin', 'employee'),
  asyncHandler(productController.setFeature),
);
productRouter.delete(
  '/:id/features/:featureId',
  authenticate,
  authorize('admin'),
  asyncHandler(productController.removeFeature),
);

// Images
productRouter.get('/:id/images', asyncHandler(productController.listImages));
productRouter.post(
  '/:id/images',
  authenticate,
  authorize('admin', 'employee'),
  upload.single('image'),
  asyncHandler(productController.uploadImage),
);
// Reorder images (must be before /:imageId routes to avoid conflict)
productRouter.put(
  '/:id/images/reorder',
  authenticate,
  authorize('admin', 'employee'),
  asyncHandler(productController.reorderImages),
);
productRouter.put(
  '/:id/images/:imageId',
  authenticate,
  authorize('admin', 'employee'),
  asyncHandler(productController.updateImage),
);
// Set cover
productRouter.put(
  '/:id/images/:imageId/cover',
  authenticate,
  authorize('admin', 'employee'),
  asyncHandler(productController.setCoverImage),
);
productRouter.delete(
  '/:id/images/:imageId',
  authenticate,
  authorize('admin'),
  asyncHandler(productController.removeImage),
);

// Categories
productRouter.put(
  '/:id/categories',
  authenticate,
  authorize('admin', 'employee'),
  asyncHandler(productController.setCategories),
);
