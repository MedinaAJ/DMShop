import { Request, Response } from 'express';
import { translationService } from './service.js';
import { sendSuccess, sendNoContent } from '../../utils/response.js';

export const translationController = {
  /** GET /translations/:lang — get translations for a language (public) */
  async getByLang(req: Request, res: Response) {
    const { lang } = req.params;
    const data = await translationService.getByLang(lang);
    sendSuccess(res, data);
  },

  /** PUT /admin/translations/:lang — bulk update translations (admin) */
  async bulkUpdate(req: Request, res: Response) {
    const { lang } = req.params;
    const { translations } = req.body;

    if (!translations || typeof translations !== 'object') {
      res.status(400).json({ success: false, message: 'translations object required' });
      return;
    }

    await translationService.bulkUpdate(lang, translations);
    sendNoContent(res);
  },
};
