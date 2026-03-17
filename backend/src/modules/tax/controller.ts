import { Request, Response } from 'express';
import { taxService } from './service.js';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/response.js';

export const taxController = {
  // Taxes
  async listTaxes(_req: Request, res: Response) {
    const taxes = await taxService.listTaxes();
    sendSuccess(res, taxes);
  },

  async createTax(req: Request, res: Response) {
    const tax = await taxService.createTax(req.body);
    sendCreated(res, tax);
  },

  async updateTax(req: Request, res: Response) {
    const tax = await taxService.updateTax(Number(req.params.id), req.body);
    sendSuccess(res, tax);
  },

  async removeTax(req: Request, res: Response) {
    await taxService.removeTax(Number(req.params.id));
    sendNoContent(res);
  },

  // Tax Rules Groups
  async listGroups(_req: Request, res: Response) {
    const groups = await taxService.listGroups();
    sendSuccess(res, groups);
  },

  async getGroupById(req: Request, res: Response) {
    const group = await taxService.getGroupById(Number(req.params.id));
    sendSuccess(res, group);
  },

  async createGroup(req: Request, res: Response) {
    const group = await taxService.createGroup(req.body);
    sendCreated(res, group);
  },

  async updateGroup(req: Request, res: Response) {
    const group = await taxService.updateGroup(Number(req.params.id), req.body);
    sendSuccess(res, group);
  },

  async removeGroup(req: Request, res: Response) {
    await taxService.removeGroup(Number(req.params.id));
    sendNoContent(res);
  },

  // Tax Rules
  async listRules(req: Request, res: Response) {
    const rules = await taxService.listRules(Number(req.params.groupId));
    sendSuccess(res, rules);
  },

  async createRule(req: Request, res: Response) {
    const rule = await taxService.createRule(req.body);
    sendCreated(res, rule);
  },

  async updateRule(req: Request, res: Response) {
    const rule = await taxService.updateRule(Number(req.params.ruleId), req.body);
    sendSuccess(res, rule);
  },

  async removeRule(req: Request, res: Response) {
    await taxService.removeRule(Number(req.params.ruleId));
    sendNoContent(res);
  },
};
