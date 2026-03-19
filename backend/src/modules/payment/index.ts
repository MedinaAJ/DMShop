import { paymentRegistry } from './payment-registry.js';
import { bankTransferModule } from './methods/bank-transfer.js';
import { cashOnDeliveryModule } from './methods/cash-on-delivery.js';
import { stripeModule } from './methods/stripe.js';
import { redsysModule } from './methods/redsys.js';
import { paypalModule } from './methods/paypal.js';

export function registerPaymentModules(): void {
  paymentRegistry.register(bankTransferModule);
  paymentRegistry.register(cashOnDeliveryModule);
  paymentRegistry.register(stripeModule);
  paymentRegistry.register(redsysModule);
  paymentRegistry.register(paypalModule);
}
