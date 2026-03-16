import { Request, Response } from 'express';
import { cartService } from './service.js';
import { sendSuccess, sendNoContent } from '../../utils/response.js';

export const cartController = {
  async get(req: Request, res: Response) {
    const cart = await cartService.getOrCreate(req.user?.userId ?? null);
    sendSuccess(res, cart);
  },

  async addItem(req: Request, res: Response) {
    const { idProduct, idCombination, quantity } = req.body;
    const cart = await cartService.addItem(
      req.user?.userId ?? null,
      idProduct,
      idCombination ?? null,
      quantity ?? 1,
    );
    sendSuccess(res, cart);
  },

  async updateItem(req: Request, res: Response) {
    const { quantity } = req.body;
    const cart = await cartService.updateItem(
      req.user?.userId ?? null,
      Number(req.params.id),
      quantity,
    );
    sendSuccess(res, cart);
  },

  async removeItem(req: Request, res: Response) {
    await cartService.removeItem(req.user?.userId ?? null, Number(req.params.id));
    sendNoContent(res);
  },
};
