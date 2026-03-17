import { Request, Response } from 'express';
import { featureService } from './service.js';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/response.js';

export const featureController = {
  async list(_req: Request, res: Response) {
    const features = await featureService.list();
    sendSuccess(res, features);
  },

  async getById(req: Request, res: Response) {
    const feature = await featureService.getById(Number(req.params.id));
    sendSuccess(res, feature);
  },

  async create(req: Request, res: Response) {
    const feature = await featureService.create(req.body);
    sendCreated(res, feature);
  },

  async update(req: Request, res: Response) {
    const feature = await featureService.update(Number(req.params.id), req.body);
    sendSuccess(res, feature);
  },

  async remove(req: Request, res: Response) {
    await featureService.remove(Number(req.params.id));
    sendNoContent(res);
  },

  // Feature Values
  async listValues(req: Request, res: Response) {
    const values = await featureService.listValues(Number(req.params.id));
    sendSuccess(res, values);
  },

  async createValue(req: Request, res: Response) {
    const value = await featureService.createValue(Number(req.params.id), req.body);
    sendCreated(res, value);
  },

  async updateValue(req: Request, res: Response) {
    const value = await featureService.updateValue(Number(req.params.valueId), req.body);
    sendSuccess(res, value);
  },

  async removeValue(req: Request, res: Response) {
    await featureService.removeValue(Number(req.params.valueId));
    sendNoContent(res);
  },
};
