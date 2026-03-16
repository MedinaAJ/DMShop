import { Request, Response } from 'express';
import { productService } from './service.js';
import { sendSuccess, sendPaginated, sendCreated, sendNoContent } from '../../utils/response.js';

export const productController = {
  async list(req: Request, res: Response) {
    const { data, meta } = await productService.list(req.query);
    sendPaginated(res, data, meta);
  },

  async getById(req: Request, res: Response) {
    const product = await productService.getById(Number(req.params.id), req.query.lang as string);
    sendSuccess(res, product);
  },

  async create(req: Request, res: Response) {
    const product = await productService.create(req.body);
    sendCreated(res, product);
  },

  async update(req: Request, res: Response) {
    const product = await productService.update(Number(req.params.id), req.body);
    sendSuccess(res, product);
  },

  async remove(req: Request, res: Response) {
    await productService.remove(Number(req.params.id));
    sendNoContent(res);
  },
};
