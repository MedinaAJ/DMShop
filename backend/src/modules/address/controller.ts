import { Request, Response } from 'express';
import { addressService } from './service.js';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/response.js';

export const addressController = {
  async list(req: Request, res: Response) {
    const userId = req.user!.userId;
    const addresses = await addressService.listByUser(userId);
    sendSuccess(res, addresses);
  },

  async getById(req: Request, res: Response) {
    const address = await addressService.getById(
      Number(req.params.id),
      req.user!.userId,
      req.user!.role,
    );
    sendSuccess(res, address);
  },

  async create(req: Request, res: Response) {
    const address = await addressService.create(req.user!.userId, req.body);
    sendCreated(res, address);
  },

  async update(req: Request, res: Response) {
    const address = await addressService.update(
      Number(req.params.id),
      req.user!.userId,
      req.user!.role,
      req.body,
    );
    sendSuccess(res, address);
  },

  async remove(req: Request, res: Response) {
    await addressService.remove(Number(req.params.id), req.user!.userId, req.user!.role);
    sendNoContent(res);
  },
};
