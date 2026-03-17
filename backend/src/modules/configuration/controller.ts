import { Request, Response } from 'express';
import { configurationService } from './service.js';
import { sendSuccess, sendNoContent } from '../../utils/response.js';

export const configurationController = {
  /** GET /configurations?prefix= — list configurations */
  async list(req: Request, res: Response) {
    const prefix = req.query.prefix as string | undefined;
    const data = prefix
      ? await configurationService.getByPrefix(prefix)
      : await configurationService.getAll();
    sendSuccess(res, data);
  },

  /** PUT /configurations — bulk upsert */
  async bulkUpdate(req: Request, res: Response) {
    const configs: { key: string; value: string }[] = req.body.configs;
    if (!Array.isArray(configs)) {
      res.status(400).json({ success: false, message: 'configs array required' });
      return;
    }
    await configurationService.bulkUpdate(configs);
    sendNoContent(res);
  },
};
