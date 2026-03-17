import { Request, Response } from 'express';
import { manufacturerService } from './service.js';
import { sendSuccess, sendPaginated, sendCreated, sendNoContent } from '../../utils/response.js';

export const manufacturerController = {
  async list(req: Request, res: Response) {
    const { data, meta } = await manufacturerService.list(req.query);
    sendPaginated(res, data, meta);
  },

  async getById(req: Request, res: Response) {
    const manufacturer = await manufacturerService.getById(Number(req.params.id));
    sendSuccess(res, manufacturer);
  },

  async create(req: Request, res: Response) {
    const manufacturer = await manufacturerService.create(req.body);
    sendCreated(res, manufacturer);
  },

  async update(req: Request, res: Response) {
    const manufacturer = await manufacturerService.update(Number(req.params.id), req.body);
    sendSuccess(res, manufacturer);
  },

  async remove(req: Request, res: Response) {
    await manufacturerService.remove(Number(req.params.id));
    sendNoContent(res);
  },
};
