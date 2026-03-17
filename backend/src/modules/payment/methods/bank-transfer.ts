import { Configuration } from '../../../models/configuration.model.js';
import type { PaymentModule, PaymentResult } from '../payment.interface.js';
import type { Order } from '../../../models/order.model.js';

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

  async process(_order: Order): Promise<PaymentResult> {
    // Bank transfer is an offline method — order stays in "Awaiting payment"
    return {
      status: 'pending',
      metadata: {
        instructions: 'Realiza la transferencia a la cuenta indicada en la confirmación.',
      },
    };
  },
};
