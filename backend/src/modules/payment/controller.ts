import { Request, Response } from 'express';
import { paymentRegistry } from './payment-registry.js';
import { orderService } from '../order/service.js';
import { Order } from '../../models/order.model.js';
import { Address } from '../../models/address.model.js';
import { Country } from '../../models/country.model.js';
import { Configuration } from '../../models/configuration.model.js';
import { AppError } from '../../utils/app-error.js';
import { sendSuccess } from '../../utils/response.js';
import { OrderStateId } from '@dmshop/shared';
import { buildRedsysForm } from './methods/redsys.js';

export const paymentController = {
  /** GET /payment/methods — list available payment methods, filtered by delivery country if known */
  async listMethods(req: Request, res: Response) {
    const userId = req.user!.userId;

    // Try to resolve the user's delivery country for country filtering
    let deliveryCountryIso: string | null = null;
    const idAddress = Number(req.query.idAddress) || null;
    if (idAddress) {
      const address = await Address.findOne({
        where: { id: idAddress, id_user: userId },
        include: [{ model: Country, as: 'country' }],
      });
      deliveryCountryIso = (address as any)?.country?.iso_code ?? null;
    }

    const allMethods = await paymentRegistry.getAvailable();

    // Filter by allowedCountries if the module defines restrictions
    const methods = allMethods.filter((m) => {
      if (!m.allowedCountries || m.allowedCountries.length === 0) return true;
      if (!deliveryCountryIso) return true; // No address yet — show all
      return m.allowedCountries.includes(deliveryCountryIso.toUpperCase());
    });

    sendSuccess(
      res,
      methods.map((m) => ({
        name: m.name,
        displayName: m.displayName,
        description: m.description,
        icon: m.icon,
        surchargePercent: m.surchargePercent ?? 0,
        surchargeAmount: m.surchargeAmount ?? 0,
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

  /**
   * POST /payment/redsys/form — build signed form fields for frontend to POST to Redsys TPV
   * Body: { orderId: number }
   */
  async redsysForm(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { orderId } = req.body;

    const order = await Order.findOne({ where: { id: orderId, id_user: userId } });
    if (!order) throw AppError.notFound('Pedido no encontrado');

    const formData = await buildRedsysForm(order);
    sendSuccess(res, formData);
  },

  /** POST /payment/webhook/:method — handle payment provider callback */
  async webhook(req: Request, res: Response) {
    // For Redsys, the method param may come from URL (/webhook/redsys) or from the specific route
    const method = req.params.method ?? 'redsys';
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

  /** GET /payment/paypal/success?token=XXX&orderId=YYY — PayPal return callback */
  async paypalSuccess(req: Request, res: Response) {
    const { token, orderId } = req.query as Record<string, string>;
    if (!token || !orderId) throw AppError.badRequest('Parámetros inválidos');

    // Verify token→orderId mapping stored during createOrder
    const storedMapping = await Configuration.findOne({
      where: { key: `PAYPAL_TOKEN_${token}` },
    });
    if (!storedMapping || storedMapping.value !== String(orderId)) {
      throw AppError.badRequest('Token PayPal inválido o no coincide con el pedido');
    }

    const paypalModule = paymentRegistry.get('paypal');
    if (!paypalModule?.handleWebhook) throw AppError.badRequest('PayPal no disponible');

    // Capture the payment
    const result = await paypalModule.handleWebhook(
      { type: 'capture', token, orderId: Number(orderId) },
      req.headers as Record<string, string>,
    );

    // Clean up the token mapping
    await storedMapping.destroy();

    if (result.success) {
      await orderService.registerPayment(result.orderId, {
        paymentMethod: 'paypal',
        transactionId: result.transactionId,
        amount: result.amount,
        idCurrency: 1,
      });
    }

    // Redirect to frontend success page
    const frontendUrl = process.env['FRONTEND_URL'] || 'http://localhost:4200';
    res.redirect(`${frontendUrl}/checkout/success?orderId=${orderId}`);
  },

  /** GET /payment/paypal/cancel?orderId=YYY — PayPal cancel callback */
  async paypalCancel(req: Request, res: Response) {
    const { orderId, token } = req.query as Record<string, string>;
    // Clean up token mapping if it exists
    if (token) {
      await Configuration.destroy({ where: { key: `PAYPAL_TOKEN_${token}` } });
    }
    const frontendUrl = process.env['FRONTEND_URL'] || 'http://localhost:4200';
    res.redirect(`${frontendUrl}/checkout/error?orderId=${orderId ?? ''}`);
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
