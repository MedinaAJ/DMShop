import { Request, Response } from 'express';
import { attributeService } from './service.js';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/response.js';

export const attributeController = {
  async list(_req: Request, res: Response) {
    const attributes = await attributeService.list();
    sendSuccess(res, attributes);
  },

  async getById(req: Request, res: Response) {
    const attribute = await attributeService.getById(Number(req.params.id));
    sendSuccess(res, attribute);
  },

  async create(req: Request, res: Response) {
    const attribute = await attributeService.create(req.body);
    sendCreated(res, attribute);
  },

  async update(req: Request, res: Response) {
    const attribute = await attributeService.update(Number(req.params.id), req.body);
    sendSuccess(res, attribute);
  },

  async remove(req: Request, res: Response) {
    await attributeService.remove(Number(req.params.id));
    sendNoContent(res);
  },

  // Attribute Values
  async listValues(req: Request, res: Response) {
    const values = await attributeService.listValues(Number(req.params.id));
    sendSuccess(res, values);
  },

  async createValue(req: Request, res: Response) {
    const value = await attributeService.createValue(Number(req.params.id), req.body);
    sendCreated(res, value);
  },

  async updateValue(req: Request, res: Response) {
    const value = await attributeService.updateValue(Number(req.params.valueId), req.body);
    sendSuccess(res, value);
  },

  async removeValue(req: Request, res: Response) {
    await attributeService.removeValue(Number(req.params.valueId));
    sendNoContent(res);
  },
};
