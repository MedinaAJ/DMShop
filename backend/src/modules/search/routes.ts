import { Router } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { productService } from '../product/service.js';
import { sendSuccess } from '../../utils/response.js';
import { Op } from 'sequelize';
import { Category } from '../../models/category.model.js';
import { CategoryLang } from '../../models/category-lang.model.js';
import { Product } from '../../models/product.model.js';
import { ProductLang } from '../../models/product-lang.model.js';
import { ProductImage } from '../../models/product-image.model.js';
import { env } from '../../config/env.js';

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

/**
 * @swagger
 * /search/autocomplete:
 *   get:
 *     tags: [Search]
 *     summary: Autocompletado de búsqueda (productos + categorías)
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: langId
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 8 }
 *     responses:
 *       200: { description: Productos y categorías coincidentes }
 */
searchRouter.get(
  '/autocomplete',
  asyncHandler(async (req, res) => {
    const q = ((req.query.q as string) || '').trim();
    const langId = Number(req.query.langId) || 1;
    const limit = Math.min(Number(req.query.limit) || 8, 20);

    if (!q || q.length < 2) {
      return sendSuccess(res, { products: [], categories: [] });
    }

    // --- Products ---
    const productLangMatches = await ProductLang.findAll({
      where: { id_lang: langId, name: { [Op.like]: `%${q}%` } },
      attributes: ['id_product', 'name', 'slug'],
      limit,
    });
    const productIds = productLangMatches.map((pl) => pl.id_product);

    const products = productIds.length > 0
      ? await Product.findAll({
          where: { id: { [Op.in]: productIds }, active: true },
          include: [
            {
              model: ProductLang,
              where: { id_lang: langId },
              required: false,
            },
            {
              model: ProductImage,
              as: 'images',
              where: { cover: true },
              required: false,
            },
          ],
          limit,
        })
      : [];

    const productResults = products.map((p: any) => {
      const trans = p.productLangs?.[0] ?? p.translations?.[0] ?? {};
      const cover = p.images?.[0] ?? null;
      let coverImage: string | null = null;
      if (cover?.path) {
        coverImage = cover.path.startsWith('http')
          ? cover.path
          : `${env.APP_URL}/${cover.path.replace(/^\//, '')}`;
      }
      return {
        id: p.id,
        name: trans.name ?? '',
        slug: trans.slug ?? '',
        coverImage,
        price: Number(p.price),
      };
    });

    // --- Categories ---
    const categoryLangMatches = await CategoryLang.findAll({
      where: { id_lang: langId, name: { [Op.like]: `%${q}%` } },
      attributes: ['id_category', 'name', 'slug'],
      limit: Math.max(3, Math.floor(limit / 2)),
    });

    const categoryIds = categoryLangMatches.map((cl) => cl.id_category);
    const categories = categoryIds.length > 0
      ? await Category.findAll({
          where: { id: { [Op.in]: categoryIds }, active: true },
          include: [
            {
              model: CategoryLang,
              where: { id_lang: langId },
              required: false,
            },
          ],
          limit: Math.max(3, Math.floor(limit / 2)),
        })
      : [];

    const categoryResults = categories.map((c: any) => {
      const trans = c.categoryLangs?.[0] ?? c.translations?.[0] ?? {};
      return {
        id: c.id,
        name: trans.name ?? '',
        slug: trans.slug ?? '',
      };
    });

    sendSuccess(res, { products: productResults, categories: categoryResults });
  }),
);
