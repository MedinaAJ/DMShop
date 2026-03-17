import { Request, Response } from 'express';
import { paymentRegistry } from './payment-registry.js';
import { orderService } from '../order/service.js';
import { Order } from '../../models/order.model.js';
import { AppError } from '../../utils/app-error.js';
import { sendSuccess } from '../../utils/response.js';
import { OrderStateId } from '@dmshop/shared';

export const paymentController = {
  /** GET /payment/methods — list available payment methods */
  async listMethods(_req: Request, res: Response) {
    const methods = await paymentRegistry.getAvailable();
    sendSuccess(
      res,
      methods.map((m) => ({
        name: m.name,
        displayName: m.displayName,
        description: m.description,
        icon: m.icon,
      })),
    );
  },

  /** POST /payment/process — initiate payment for an existing order */
  async process(req: Request, res: Response) {
    const { orderId, paymentMethod } = req.body;
    const userId = req.user!.userId;

    const order = await Order.findOne({
      where: { id: orderId, id_user: userId },
    });
    if (!order) {
      throw AppError.notFound('Pedido no encontrado');
    }

    const module = paymentRegistry.get(paymentMethod);
    if (!module || !(await module.isAvailable())) {
      throw AppError.badRequest('Método de pago no disponible');
    }

    const result = await module.process(order, req.body.paymentData);

    // If payment completed inline, register it
    if (result.status === 'completed' && result.transactionId) {
      await orderService.registerPayment(order.id, {
        paymentMethod,
        transactionId: result.transactionId,
        amount: Number(order.total_paid),
        idCurrency: order.id_currency,
      });
    }

    sendSuccess(res, result);
  },

  /** POST /payment/webhook/:method — handle payment provider callback */
  async webhook(req: Request, res: Response) {
    const method = req.params.method;
    const module = paymentRegistry.get(method);

    if (!module?.handleWebhook) {
      throw AppError.notFound('Webhook handler not found');
    }

    const result = await module.handleWebhook(req.body, req.headers as Record<string, string>);

    if (result.success) {
      await orderService.registerPayment(result.orderId, {
        paymentMethod: method,
        transactionId: result.transactionId,
        amount: result.amount,
        idCurrency: 1,
      });
    } else {
      // Payment failed — update order state
      const order = await Order.findByPk(result.orderId);
      if (order && order.id_order_state === OrderStateId.AWAITING_PAYMENT) {
        await orderService.updateState(result.orderId, {
          idOrderState: OrderStateId.PAYMENT_ERROR,
        }, 0);
      }
    }

    // Always respond 200 to webhooks
    res.status(200).json({ received: true });
  },

  /** GET /payment/confirmation/:orderId — check payment status */
  async confirmation(req: Request, res: Response) {
    const userId = req.user!.userId;
    const order = await orderService.getById(Number(req.params.orderId), userId);
    sendSuccess(res, {
      orderId: order.id,
      reference: order.reference,
      status: order.stateName,
      paymentMethod: order.paymentMethod,
      totalPaid: order.totalPaid,
      payments: order.payments,
    });
  },
};
