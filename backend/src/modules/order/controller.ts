import { Request, Response } from 'express';
import { orderService } from './service.js';
import { cartCalculator } from '../cart/cart-calculator.service.js';
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/response.js';
import { Cart } from '../../models/cart.model.js';

export const orderController = {
  // POST /orders — checkout
  async checkout(req: Request, res: Response) {
    const order = await orderService.checkout(req.user!.userId, req.body);
    sendCreated(res, order);
  },

  // GET /orders — list user's orders
  async list(req: Request, res: Response) {
    const result = await orderService.list(req.user!.userId, req.query as any);
    sendPaginated(res, result.data, result.meta);
  },

  // GET /orders/:id — user's order detail
  async getById(req: Request, res: Response) {
    const order = await orderService.getById(Number(req.params.id), req.user!.userId);
    sendSuccess(res, order);
  },

  // GET /orders/states — list all order states
  async getStates(req: Request, res: Response) {
    const idLang = Number(req.query.idLang) || undefined;
    const states = await orderService.getStates(idLang);
    sendSuccess(res, states);
  },

  // POST /orders/calculate — calculate cart summary for checkout preview
  async calculate(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { idAddressDelivery, idCarrier, paymentMethod } = req.body;

    const cart = await Cart.findOne({
      where: { id_user: userId },
      order: [['created_at', 'DESC']],
    });

    if (!cart) {
      sendSuccess(res, { items: [], totalProducts: 0, totalProductsTax: 0, totalShipping: 0, totalShippingTax: 0, totalDiscounts: 0, totalDiscountsTax: 0, paymentSurcharge: 0, totalPaid: 0, itemCount: 0 });
      return;
    }

    const summary = await cartCalculator.calculate(cart.id, idAddressDelivery, idCarrier, userId, paymentMethod);
    sendSuccess(res, summary);
  },

  // GET /orders/carriers — get available carriers for address
  async getCarriers(req: Request, res: Response) {
    const idAddressDelivery = Number(req.query.idAddressDelivery);
    const userId = req.user!.userId;

    // Try to get cart totals to estimate shipping cost
    let cartTotal: number | undefined;
    let cartWeight: number | undefined;
    try {
      const cart = await Cart.findOne({
        where: { id_user: userId },
        order: [['created_at', 'DESC']],
      });
      if (cart) {
        const summary = await cartCalculator.calculate(cart.id, idAddressDelivery, undefined, userId);
        cartTotal = summary.totalProducts;
        cartWeight = 0; // weight calculation could be added in the future
      }
    } catch {
      // If we can't get the cart, just return carriers without cost estimate
    }

    const carriers = await cartCalculator.getAvailableCarriers(idAddressDelivery, cartTotal, cartWeight);
    sendSuccess(res, carriers);
  },

  // --- Admin endpoints ---

  // GET /admin/orders
  async adminList(req: Request, res: Response) {
    const result = await orderService.adminList(req.query as any);
    sendPaginated(res, result.data, result.meta);
  },

  // GET /admin/orders/:id
  async adminGetById(req: Request, res: Response) {
    const order = await orderService.getById(Number(req.params.id));
    sendSuccess(res, order);
  },

  // PUT /admin/orders/:id/state
  async adminUpdateState(req: Request, res: Response) {
    const order = await orderService.updateState(
      Number(req.params.id),
      req.body,
      req.user!.userId,
    );
    sendSuccess(res, order);
  },

  // PATCH /orders/admin/bulk-state
  async adminBulkUpdateState(req: Request, res: Response) {
    const { orderIds, stateId } = req.body;
    if (!Array.isArray(orderIds) || orderIds.length === 0 || !stateId) {
      res.status(400).json({ success: false, message: 'orderIds (array) and stateId are required' });
      return;
    }
    await orderService.bulkUpdateState(orderIds.map(Number), Number(stateId), req.user!.userId);
    sendSuccess(res, { updated: orderIds.length });
  },

  // POST /admin/orders/:id/payment
  async adminRegisterPayment(req: Request, res: Response) {
    const order = await orderService.registerPayment(Number(req.params.id), req.body, req.user!.userId);
    sendSuccess(res, order);
  },

  // PUT /admin/orders/:id/tracking
  async adminUpdateTracking(req: Request, res: Response) {
    const order = await orderService.updateTracking(Number(req.params.id), req.body);
    sendSuccess(res, order);
  },

  // --- Admin: Order State management ---

  // POST /orders/admin/states
  async adminCreateState(req: Request, res: Response) {
    const state = await orderService.createState(req.body);
    sendCreated(res, state);
  },

  // PUT /orders/admin/states/:id
  async adminUpdateState2(req: Request, res: Response) {
    const state = await orderService.updateStateConfig(Number(req.params.id), req.body);
    sendSuccess(res, state);
  },

  // DELETE /orders/admin/states/:id
  async adminDeleteState(req: Request, res: Response) {
    await orderService.deleteState(Number(req.params.id));
    sendSuccess(res, { deleted: true });
  },

  // PUT /orders/admin/states/:id/translations/:idLang
  async adminUpsertStateTranslation(req: Request, res: Response) {
    const idOrderState = Number(req.params.id);
    const idLang = Number(req.params.idLang);
    const { name } = req.body;
    const record = await orderService.upsertStateTranslation(idOrderState, idLang, name);
    sendSuccess(res, record);
  },
};
