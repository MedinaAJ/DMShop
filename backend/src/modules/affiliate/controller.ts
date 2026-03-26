import { Request, Response } from 'express';
import { affiliateService } from './service.js';
import { sendSuccess } from '../../utils/response.js';

export const affiliateController = {
  /** GET /account/affiliate — current user's affiliate data */
  async getMyAffiliate(req: Request, res: Response) {
    const userId = (req as any).user.id;
    const affiliate = await affiliateService.getOrCreate(userId);
    const referrals = await affiliateService.getReferrals(affiliate.id);
    sendSuccess(res, {
      affiliate,
      referrals,
      totalReferrals: referrals.length,
    });
  },

  /** GET /admin/affiliates — list all affiliates */
  async listAffiliates(req: Request, res: Response) {
    const page = Number(req.query.page) || 1;
    const perPage = Math.min(Number(req.query.perPage) || 20, 100);
    const { data, meta } = await affiliateService.listAffiliates(page, perPage);
    res.json({ success: true, data, meta });
  },
};
