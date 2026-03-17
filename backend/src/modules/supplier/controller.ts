import { Request, Response } from 'express';
import { supplierService } from './service.js';
import { sendSuccess, sendPaginated, sendCreated, sendNoContent } from '../../utils/response.js';

export const supplierController = {
  async list(req: Request, res: Response) {
    const { data, meta } = await supplierService.list(req.query);
    sendPaginated(res, data, meta);
  },

  async getById(req: Request, res: Response) {
    const supplier = await supplierService.getById(Number(req.params.id));
    sendSuccess(res, supplier);
  },

  async create(req: Request, res: Response) {
    const supplier = await supplierService.create(req.body);
    sendCreated(res, supplier);
  },

  async update(req: Request, res: Response) {
    const supplier = await supplierService.update(Number(req.params.id), req.body);
    sendSuccess(res, supplier);
  },

  async remove(req: Request, res: Response) {
    await supplierService.remove(Number(req.params.id));
    sendNoContent(res);
  },
};
