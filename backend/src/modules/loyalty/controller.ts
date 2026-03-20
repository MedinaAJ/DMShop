import { Request, Response } from 'express';
import { loyaltyService } from './service.js';
import { sendSuccess } from '../../utils/response.js';

export const loyaltyController = {
  // GET /account/loyalty — user's loyalty balance + history
  async getMyLoyalty(req: Request, res: Response) {
    const userId = req.user!.userId;
    const page = Number(req.query.page) || 1;
    const perPage = Number(req.query.perPage) || 20;
    const result = await loyaltyService.getHistory(userId, page, perPage);
    sendSuccess(res, { balance: result.balance, history: result.data }, 200, result.meta);
  },

  // POST /cart/apply-loyalty — redeem points for discount
  async applyPoints(req: Request, res: Response) {
    const userId = req.user!.userId;
    const points = Number(req.body.points);
    if (!points || points <= 0) {
      res.status(400).json({ success: false, message: 'Puntos inválidos' });
      return;
    }
    const result = await loyaltyService.applyPoints(userId, points);
    sendSuccess(res, result);
  },

  // GET /admin/loyalty/config — get loyalty config
  async adminGetConfig(_req: Request, res: Response) {
    const config = await loyaltyService.getConfig();
    sendSuccess(res, config);
  },

  // PUT /admin/loyalty/config — save loyalty config
  async adminSaveConfig(req: Request, res: Response) {
    const { pointsPerEuro, euroPerPoint } = req.body;
    await loyaltyService.saveConfig(Number(pointsPerEuro), Number(euroPerPoint));
    sendSuccess(res, { saved: true });
  },

  // GET /admin/users/:id/loyalty — admin view user's points
  async adminGetUserPoints(req: Request, res: Response) {
    const idUser = Number(req.params.id);
    const result = await loyaltyService.adminGetUserPoints(idUser);
    sendSuccess(res, result);
  },

  // POST /admin/users/:id/loyalty/adjust — manual adjustment
  async adminAdjustPoints(req: Request, res: Response) {
    const idUser = Number(req.params.id);
    const { points } = req.body;
    const record = await loyaltyService.adminAdjustPoints(idUser, Number(points));
    sendSuccess(res, record);
  },
};
