import { Request, Response } from 'express';
import { reviewService } from './service.js';
import { sendSuccess, sendNoContent } from '../../utils/response.js';
import { AppError } from '../../utils/app-error.js';

export const reviewController = {
  async listForProduct(req: Request, res: Response) {
    const productId = Number(req.params.id);
    const result = await reviewService.listForProduct(productId, req.query);
    sendSuccess(res, result);
  },

  async createReview(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();
    const productId = Number(req.params.id);
    const { rating, title, content } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      throw AppError.badRequest('El rating debe estar entre 1 y 5');
    }
    if (!title || title.length > 128) {
      throw AppError.badRequest('El título es obligatorio y máximo 128 caracteres');
    }
    if (!content) {
      throw AppError.badRequest('El contenido es obligatorio');
    }

    const review = await reviewService.createReview(productId, req.user.userId, {
      rating: Number(rating),
      title,
      content,
    });

    sendSuccess(res, review, 201);
  },

  async listPending(req: Request, res: Response) {
    const result = await reviewService.listPending(req.query);
    res.json({ success: true, ...result });
  },

  async approve(req: Request, res: Response) {
    const reviewId = Number(req.params.id);
    const review = await reviewService.approve(reviewId);
    sendSuccess(res, review);
  },

  async remove(req: Request, res: Response) {
    const reviewId = Number(req.params.id);
    await reviewService.remove(reviewId);
    sendNoContent(res);
  },
};
