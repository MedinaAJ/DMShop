import { Request, Response } from 'express';
import { wishlistService } from './service.js';
import { sendSuccess, sendNoContent } from '../../utils/response.js';
import { AppError } from '../../utils/app-error.js';

export const wishlistController = {
  async getWishlist(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();
    const wishlist = await wishlistService.getOrCreateWishlist(req.user.userId);
    sendSuccess(res, wishlistService.formatWishlist(wishlist));
  },

  async addItem(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();
    const { id_product, id_combination } = req.body;
    if (!id_product) throw AppError.badRequest('id_product es requerido');
    const item = await wishlistService.addItem(req.user.userId, Number(id_product), id_combination ?? null);
    sendSuccess(res, item, 200);
  },

  async removeItem(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();
    const idProduct = Number(req.params.id_product);
    await wishlistService.removeItem(req.user.userId, idProduct);
    sendNoContent(res);
  },

  async checkItem(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();
    const idProduct = Number(req.params.id_product);
    const inWishlist = await wishlistService.checkItem(req.user.userId, idProduct);
    sendSuccess(res, { inWishlist });
  },
};
