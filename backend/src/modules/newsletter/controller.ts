import { Request, Response } from 'express';
import { newsletterService } from './service.js';
import { sendSuccess } from '../../utils/response.js';

export const newsletterController = {
  /** POST /newsletter/subscribe */
  async subscribe(req: Request, res: Response) {
    const { email, source } = req.body;
    if (!email) {
      res.status(400).json({ success: false, message: 'email required' });
      return;
    }
    const userId = (req as any).user?.id;
    const subscriber = await newsletterService.subscribe(email, userId, source);
    sendSuccess(res, { id: subscriber.id, email: subscriber.email, active: subscriber.active });
  },

  /** GET /newsletter/unsubscribe?token=XXX */
  async unsubscribe(req: Request, res: Response) {
    const token = req.query.token as string;
    if (!token) {
      res.status(400).json({ success: false, message: 'token required' });
      return;
    }
    await newsletterService.unsubscribe(token);
    res.status(200).json({ success: true, message: 'Desuscrito correctamente' });
  },

  /** GET /admin/newsletter/subscribers */
  async listSubscribers(req: Request, res: Response) {
    const page = Number(req.query.page) || 1;
    const perPage = Math.min(Number(req.query.perPage) || 50, 200);
    const { data, meta } = await newsletterService.listSubscribers(page, perPage);
    res.json({ success: true, data, meta });
  },

  /** GET /admin/newsletter/export */
  async exportCsv(_req: Request, res: Response) {
    const csv = await newsletterService.exportCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="newsletter_subscribers.csv"');
    res.send(csv);
  },
};

