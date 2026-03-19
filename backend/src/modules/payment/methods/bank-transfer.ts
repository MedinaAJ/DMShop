import { Configuration } from '../../../models/configuration.model.js';
import { Order } from '../../../models/order.model.js';
import { OrderHistory } from '../../../models/order-history.model.js';
import { OrderStateId } from '@dmshop/shared';
import type { PaymentModule, PaymentResult } from '../payment.interface.js';

/** State id for "Awaiting bank transfer confirmation" */
const BANK_TRANSFER_STATE_ID = OrderStateId.AWAITING_BANK_TRANSFER; // 10

export const bankTransferModule: PaymentModule = {
  name: 'bank_transfer',
  displayName: 'Transferencia bancaria',
  description: 'Realiza el pago por transferencia bancaria. Recibirás los datos en tu email.',
  icon: 'account_balance',
  requiresConfig: false,

  async isAvailable(): Promise<boolean> {
    const config = await Configuration.findOne({ where: { key: 'PAYMENT_BANK_TRANSFER_ENABLED' } });
    // Enabled by default if no configuration exists
    return config ? config.value === '1' : true;
  },

  async process(order: Order): Promise<PaymentResult> {
    // Update order state to "Awaiting bank transfer confirmation"
    try {
      await order.update({ id_order_state: BANK_TRANSFER_STATE_ID });
      await OrderHistory.create({
        id_order: order.id,
        id_order_state: BANK_TRANSFER_STATE_ID,
        id_user: null,
        comment: 'Esperando confirmación de transferencia bancaria',
      });
    } catch (err) {
      console.warn('[BankTransfer] Could not update order state:', err);
    }

    return {
      status: 'pending',
      metadata: {
        instructions: 'Realiza la transferencia a la cuenta indicada en la confirmación.',
      },
    };
  },
};

