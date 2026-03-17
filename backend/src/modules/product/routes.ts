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
import crypto from 'crypto';

const storage = multer.diskStorage({
  destination: 'uploads/products',
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
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
productRouter.put(
  '/:id/images/:imageId',
  authenticate,
  authorize('admin', 'employee'),
  asyncHandler(productController.updateImage),
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
