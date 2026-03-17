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
  async getStates(_req: Request, res: Response) {
    const states = await orderService.getStates();
    sendSuccess(res, states);
  },

  // POST /orders/calculate — calculate cart summary for checkout preview
  async calculate(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { idAddressDelivery, idCarrier } = req.body;

    const cart = await Cart.findOne({
      where: { id_user: userId },
      order: [['created_at', 'DESC']],
    });

    if (!cart) {
      sendSuccess(res, { items: [], totalProducts: 0, totalProductsTax: 0, totalShipping: 0, totalShippingTax: 0, totalDiscounts: 0, totalDiscountsTax: 0, totalPaid: 0, itemCount: 0 });
      return;
    }

    const summary = await cartCalculator.calculate(cart.id, idAddressDelivery, idCarrier);
    sendSuccess(res, summary);
  },

  // GET /orders/carriers — get available carriers for address
  async getCarriers(req: Request, res: Response) {
    const idAddressDelivery = Number(req.query.idAddressDelivery);
    const carriers = await cartCalculator.getAvailableCarriers(idAddressDelivery);
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

  // POST /admin/orders/:id/payment
  async adminRegisterPayment(req: Request, res: Response) {
    const order = await orderService.registerPayment(Number(req.params.id), req.body);
    sendSuccess(res, order);
  },

  // PUT /admin/orders/:id/tracking
  async adminUpdateTracking(req: Request, res: Response) {
    const order = await orderService.updateTracking(Number(req.params.id), req.body);
    sendSuccess(res, order);
  },
};
