import { Request, Response } from 'express';
import { customerGroupService } from './service.js';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/response.js';

export const customerGroupController = {
  async list(_req: Request, res: Response) {
    const groups = await customerGroupService.list();
    sendSuccess(res, groups);
  },

  async getById(req: Request, res: Response) {
    const group = await customerGroupService.getById(Number(req.params.id));
    sendSuccess(res, group);
  },

  async create(req: Request, res: Response) {
    const group = await customerGroupService.create(req.body);
    sendCreated(res, group);
  },

  async update(req: Request, res: Response) {
    const group = await customerGroupService.update(Number(req.params.id), req.body);
    sendSuccess(res, group);
  },

  async remove(req: Request, res: Response) {
    await customerGroupService.delete(Number(req.params.id));
    sendNoContent(res);
  },

  async getUsers(req: Request, res: Response) {
    const users = await customerGroupService.getUsers(Number(req.params.id));
    sendSuccess(res, users);
  },

  async assignUser(req: Request, res: Response) {
    const { userId } = req.body;
    const record = await customerGroupService.assignUser(Number(req.params.id), Number(userId));
    sendCreated(res, record);
  },

  async removeUser(req: Request, res: Response) {
    await customerGroupService.removeUser(Number(req.params.id), Number(req.params.userId));
    sendNoContent(res);
  },
};
