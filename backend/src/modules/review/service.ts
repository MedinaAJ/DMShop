import { ProductReview } from '../../models/product-review.model.js';
import { User } from '../../models/user.model.js';
import { Product } from '../../models/product.model.js';
import { ProductLang } from '../../models/product-lang.model.js';
import { AppError } from '../../utils/app-error.js';
import type { PaginationMeta } from '@dmshop/shared';

export const reviewService = {
  async listForProduct(productId: number, query: Record<string, unknown>) {
    const page = Number(query.page) || 1;
    const perPage = Math.min(Number(query.perPage) || 10, 100);
    const offset = (page - 1) * perPage;

    const { count, rows } = await ProductReview.findAndCountAll({
      where: { id_product: productId, approved: true },
      include: [{ model: User, attributes: ['id', 'first_name'] }],
      order: [['created_at', 'DESC']],
      limit: perPage,
      offset,
    });

    // Rating distribution
    const all = await ProductReview.findAll({
      where: { id_product: productId, approved: true },
      attributes: ['rating'],
    });

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let ratingSum = 0;
    for (const r of all) {
      distribution[r.rating] = (distribution[r.rating] || 0) + 1;
      ratingSum += r.rating;
    }
    const avgRating = all.length > 0 ? Math.round((ratingSum / all.length) * 10) / 10 : 0;

    const meta: PaginationMeta = {
      page,
      perPage,
      total: count,
      totalPages: Math.ceil(count / perPage),
    };

    return {
      reviews: rows.map((r) => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        content: r.content,
        created_at: r.created_at,
        user: { firstName: (r as any).user?.first_name ?? 'Usuario' },
      })),
      avgRating,
      totalReviews: all.length,
      distribution,
      meta,
    };
  },

  async createReview(
    productId: number,
    userId: number,
    data: { rating: number; title: string; content: string },
  ) {
    const existing = await ProductReview.findOne({
      where: { id_product: productId, id_user: userId },
    });

    if (existing) {
      await existing.update({ ...data, approved: false });
      return existing;
    }

    const review = await ProductReview.create({
      id_product: productId,
      id_user: userId,
      rating: data.rating,
      title: data.title,
      content: data.content,
      approved: false,
    });

    return review;
  },

  async listPending(query: Record<string, unknown>) {
    const page = Number(query.page) || 1;
    const perPage = Math.min(Number(query.perPage) || 20, 100);
    const offset = (page - 1) * perPage;

    const approvedFilter = query.approved === 'true' ? true : false;

    const { count, rows } = await ProductReview.findAndCountAll({
      where: { approved: approvedFilter },
      include: [
        { model: User, attributes: ['id', 'first_name', 'last_name', 'email'] },
        {
          model: Product,
          include: [{ model: ProductLang, attributes: ['name', 'slug'] }],
        },
      ],
      order: [['created_at', 'DESC']],
      limit: perPage,
      offset,
    });

    const meta: PaginationMeta = {
      page,
      perPage,
      total: count,
      totalPages: Math.ceil(count / perPage),
    };

    return { reviews: rows, meta };
  },

  async approve(reviewId: number) {
    const review = await ProductReview.findByPk(reviewId);
    if (!review) throw AppError.notFound('Reseña no encontrada');
    await review.update({ approved: true });
    return review;
  },

  async remove(reviewId: number) {
    const review = await ProductReview.findByPk(reviewId);
    if (!review) throw AppError.notFound('Reseña no encontrada');
    await review.destroy();
  },
};
