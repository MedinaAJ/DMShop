import { Request, Response } from 'express';
import { stockService } from './stock.service.js';
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/response.js';

export const stockController = {
  // GET /stock/movements?id_product=&page=&limit=
  async getMovements(req: Request, res: Response) {
    const id_product = req.query.id_product ? Number(req.query.id_product) : undefined;
    const id_combination = req.query.id_combination ? Number(req.query.id_combination) : undefined;
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 20;

    const result = await stockService.getMovements(id_product, { id_combination, page, limit });
    res.status(200).json({
      success: true,
      data: result.data,
      meta: {
        page: result.meta.page,
        perPage: result.meta.limit,
        total: result.meta.total,
        totalPages: result.meta.totalPages,
      },
    });
  },

  // POST /stock/movements — manual movement (admin only)
  async createMovement(req: Request, res: Response) {
    const { id_product, id_combination, movement_type, quantity, reason } = req.body;

    const movement = await stockService.move({
      id_product: Number(id_product),
      id_combination: id_combination ? Number(id_combination) : null,
      movement_type,
      quantity: Number(quantity),
      reason: reason ?? null,
    });

    sendCreated(res, movement);
  },

  // GET /stock/alerts — products with stock <= low_stock_alert
  async getAlerts(_req: Request, res: Response) {
    const alerts = await stockService.getStockAlerts();
    sendSuccess(res, alerts);
  },

  // GET /stock/back-in-stock — pending back-in-stock email subscriptions (admin)
  async getBackInStockAlerts(req: Request, res: Response) {
    const page = Number(req.query.page) || 1;
    const perPage = Number(req.query.perPage) || 20;
    const result = await stockService.getPendingStockAlerts(page, perPage);
    sendPaginated(res, result.data, result.meta);
  },

  // POST /products/:id/stock-alert — subscribe to back-in-stock alert (public)
  async subscribeStockAlert(req: Request, res: Response) {
    const idProduct = Number(req.params.id);
    const { email, idCombination, idLang } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ success: false, message: 'Email inválido' });
      return;
    }
    const alert = await stockService.subscribeStockAlert(
      idProduct,
      email,
      idCombination ?? null,
      idLang ?? 1,
    );
    sendSuccess(res, { id: alert.id, email: alert.email });
  },

  // PUT /products/:id/stock — quick stock adjustment
  async adjustProductStock(req: Request, res: Response) {
    const id_product = Number(req.params.id);
    const { quantity, reason } = req.body;

    const movement = await stockService.adjustStock(
      id_product,
      null,
      Number(quantity),
      reason,
    );
    sendSuccess(res, movement);
  },

  // PUT /products/:id/combinations/:combId/stock — combination stock adjustment
  async adjustCombinationStock(req: Request, res: Response) {
    const id_product = Number(req.params.id);
    const id_combination = Number(req.params.combId);
    const { quantity, reason } = req.body;

    const movement = await stockService.adjustStock(
      id_product,
      id_combination,
      Number(quantity),
      reason,
    );
    sendSuccess(res, movement);
  },
};
