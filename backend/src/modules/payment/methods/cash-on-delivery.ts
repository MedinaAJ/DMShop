import { Configuration } from '../../../models/configuration.model.js';
import type { PaymentModule, PaymentResult } from '../payment.interface.js';
import type { Order } from '../../../models/order.model.js';

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

  async process(_order: Order): Promise<PaymentResult> {
    return {
      status: 'pending',
      metadata: {
        instructions: 'El pago se realizará a la entrega del pedido.',
      },
    };
  },
};
