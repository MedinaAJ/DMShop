import { Request, Response } from 'express';
import { returnService } from './service.js';
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/response.js';
import { AppError } from '../../utils/app-error.js';

export const returnController = {
  // POST /orders/:id/returns — create return (customer)
  async createReturn(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();
    const orderId = Number(req.params.id);
    const ret = await returnService.createReturn(orderId, req.user.userId, req.body);
    sendCreated(res, ret);
  },

  // GET /returns — list all returns (admin)
  async list(req: Request, res: Response) {
    const result = await returnService.list(req.query as any);
    sendPaginated(res, result.data, result.meta);
  },

  // GET /returns/:id — detail
  async getById(req: Request, res: Response) {
    const ret = await returnService.getById(Number(req.params.id));
    sendSuccess(res, ret);
  },

  // PATCH /returns/:id/state — update state (admin)
  async updateState(req: Request, res: Response) {
    const ret = await returnService.updateState(Number(req.params.id), req.body);
    sendSuccess(res, ret);
  },

  // GET /returns/mine — get current user's returns (customer)
  async getMine(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();
    const returns = await returnService.getByUser(req.user.userId);
    sendSuccess(res, returns);
  },
};
