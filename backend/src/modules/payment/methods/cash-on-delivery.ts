import { Configuration } from '../../../models/configuration.model.js';
import { Order } from '../../../models/order.model.js';
import { OrderHistory } from '../../../models/order-history.model.js';
import { OrderStateId } from '@dmshop/shared';
import type { PaymentModule, PaymentResult } from '../payment.interface.js';

/** State id for "Awaiting cash on delivery" */
const CASH_ON_DELIVERY_STATE_ID = OrderStateId.AWAITING_CASH_ON_DELIVERY; // 11

export const cashOnDeliveryModule: PaymentModule = {
  name: 'cash_on_delivery',
  displayName: 'Contra reembolso',
  description: 'Paga en efectivo al recibir tu pedido.',
  icon: 'payments',
  requiresConfig: false,

  async isAvailable(): Promise<boolean> {
    const config = await Configuration.findOne({ where: { key: 'PAYMENT_CASH_ON_DELIVERY_ENABLED' } });
    return config ? config.value === '1' : true;
  },

  async process(order: Order): Promise<PaymentResult> {
    // Update order state to "Awaiting cash on delivery"
    try {
      await order.update({ id_order_state: CASH_ON_DELIVERY_STATE_ID });
      await OrderHistory.create({
        id_order: order.id,
        id_order_state: CASH_ON_DELIVERY_STATE_ID,
        id_user: null,
        comment: 'Pedido contra reembolso — pago a la entrega',
      });
    } catch (err) {
      console.warn('[CashOnDelivery] Could not update order state:', err);
    }

    return {
      status: 'pending',
      metadata: {
        instructions: 'El pago se realizará a la entrega del pedido.',
      },
    };
  },
};

