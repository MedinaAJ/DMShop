import { Request, Response } from 'express';
import { categoryService } from './service.js';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/response.js';

export const categoryController = {
  async list(req: Request, res: Response) {
    const categories = await categoryService.list(req.query);
    sendSuccess(res, categories);
  },

  async tree(_req: Request, res: Response) {
    const tree = await categoryService.getTree();
    sendSuccess(res, tree);
  },

  async getById(req: Request, res: Response) {
    const category = await categoryService.getById(Number(req.params.id));
    sendSuccess(res, category);
  },

  async create(req: Request, res: Response) {
    const category = await categoryService.create(req.body);
    sendCreated(res, category);
  },

  async update(req: Request, res: Response) {
    const category = await categoryService.update(Number(req.params.id), req.body);
    sendSuccess(res, category);
  },

  async remove(req: Request, res: Response) {
    await categoryService.remove(Number(req.params.id));
    sendNoContent(res);
  },
};
