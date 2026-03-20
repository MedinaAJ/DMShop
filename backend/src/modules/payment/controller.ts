import { Request, Response } from 'express';
import { paymentRegistry } from './payment-registry.js';
import { orderService } from '../order/service.js';
import { Order } from '../../models/order.model.js';
import { Address } from '../../models/address.model.js';
import { Country } from '../../models/country.model.js';
import { User } from '../../models/user.model.js';
import { CustomerGroup } from '../../models/customer-group.model.js';
import { Configuration } from '../../models/configuration.model.js';
import { AppError } from '../../utils/app-error.js';
import { sendSuccess } from '../../utils/response.js';
import { OrderStateId } from '@dmshop/shared';

/** Load allowed countries for a payment method from configuration */
async function loadAllowedCountries(methodName: string): Promise<string[] | undefined> {
  const key = `PAYMENT_${methodName.toUpperCase()}_ALLOWED_COUNTRIES`;
  const row = await Configuration.findOne({ where: { key } });
  if (!row?.value || row.value.trim() === '') return undefined;
  return row.value.split(',').map((c) => c.trim().toUpperCase()).filter(Boolean);
}

/** Load allowed group IDs for a payment method from configuration */
async function loadAllowedGroups(methodName: string): Promise<number[] | undefined> {
  const key = `PAYMENT_${methodName.toUpperCase()}_ALLOWED_GROUPS`;
  const row = await Configuration.findOne({ where: { key } });
  if (!row?.value || row.value.trim() === '') return undefined;
  return row.value.split(',').map((g) => parseInt(g.trim(), 10)).filter((g) => !isNaN(g));
}

export const paymentController = {
  /** GET /payment/methods — list available payment methods, filtered by delivery country if known */
  async listMethods(req: Request, res: Response) {
    const userId = req.user!.userId;

    // Resolve delivery country
    let deliveryCountryIso: string | null = null;
    const idAddress = Number(req.query.idAddress) || null;
    if (idAddress) {
      const address = await Address.findOne({
        where: { id: idAddress, id_user: userId },
        include: [{ model: Country, as: 'country' }],
      });
      deliveryCountryIso = (address as any)?.country?.iso_code ?? null;
    }

    // Resolve user groups
    let userGroupIds: number[] = [];
    const userWithGroups = await User.findByPk(userId, {
      include: [{ model: CustomerGroup, as: 'groups', through: { attributes: [] } }],
    });
    if (userWithGroups?.groups?.length) {
      userGroupIds = userWithGroups.groups.map((g: CustomerGroup) => g.id);
    }

    const allMethods = await paymentRegistry.getAvailable();

    const filteredMethods = await Promise.all(
      allMethods.map(async (m) => {
        // Load config-based restrictions
        const configCountries = await loadAllowedCountries(m.name);
        const configGroups = await loadAllowedGroups(m.name);

        // Merge with module-defined restrictions
        const allowedCountries = configCountries ?? m.allowedCountries;
        const allowedGroups = configGroups ?? m.allowedGroups;

        // Filter by country
        if (allowedCountries && allowedCountries.length > 0) {
          if (!deliveryCountryIso) return null; // If no address, hide restricted methods
          if (!allowedCountries.includes(deliveryCountryIso.toUpperCase())) return null;
        }

        // Filter by customer group
        if (allowedGroups && allowedGroups.length > 0) {
          if (!userGroupIds.some((g) => allowedGroups.includes(g))) return null;
        }

        return m;
      }),
    );

    const methods = filteredMethods.filter(Boolean) as typeof allMethods;

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
