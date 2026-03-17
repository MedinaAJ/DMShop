import { Configuration } from '../../../models/configuration.model.js';
import type { PaymentModule, PaymentResult } from '../payment.interface.js';
import type { Order } from '../../../models/order.model.js';
import { env } from '../../../config/env.js';

async function getStripeKeys(): Promise<{ secretKey: string; publicKey: string } | null> {
  const sk = await Configuration.findOne({ where: { key: 'STRIPE_SECRET_KEY' } });
  const pk = await Configuration.findOne({ where: { key: 'STRIPE_PUBLIC_KEY' } });
  if (sk?.value && pk?.value) return { secretKey: sk.value, publicKey: pk.value };
  return null;
}

export const stripeModule: PaymentModule = {
  name: 'stripe',
  displayName: 'Tarjeta de crédito/débito',
  description: 'Pago seguro con tarjeta a través de Stripe.',
  icon: 'credit_card',
  requiresConfig: true,

  async isAvailable(): Promise<boolean> {
    const enabled = await Configuration.findOne({ where: { key: 'PAYMENT_STRIPE_ENABLED' } });
    if (enabled && enabled.value !== '1') return false;
    const keys = await getStripeKeys();
    return keys !== null;
  },

  async process(order: Order): Promise<PaymentResult> {
    const keys = await getStripeKeys();
    if (!keys) throw new Error('Stripe is not configured');

    // Dynamic import to avoid hard dependency
    const stripe = (await import('stripe')).default;
    const client = new stripe(keys.secretKey);

    const frontendUrl = env.FRONTEND_URL || 'http://localhost:4200';

    const session = await client.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      client_reference_id: String(order.id),
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: { name: `Pedido #${order.reference}` },
            unit_amount: Math.round(Number(order.total_paid) * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${frontendUrl}/account/orders/${order.id}?payment=success`,
      cancel_url: `${frontendUrl}/account/orders/${order.id}?payment=cancelled`,
      metadata: { orderId: String(order.id), reference: order.reference },
    });

    return {
      status: 'redirect',
      redirectUrl: session.url!,
      transactionId: session.id,
    };
  },

  async handleWebhook(payload: unknown, headers: Record<string, string>) {
    const keys = await getStripeKeys();
    if (!keys) throw new Error('Stripe is not configured');

    const webhookSecret = (await Configuration.findOne({ where: { key: 'STRIPE_WEBHOOK_SECRET' } }))?.value;
    if (!webhookSecret) throw new Error('Stripe webhook secret not configured');

    const stripe = (await import('stripe')).default;
    const client = new stripe(keys.secretKey);

    const sig = headers['stripe-signature'];
    const event = client.webhooks.constructEvent(payload as string | Buffer, sig, webhookSecret);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const orderId = Number(session.metadata?.orderId);
      return {
        orderId,
        transactionId: session.payment_intent as string,
        amount: (session.amount_total ?? 0) / 100,
        success: session.payment_status === 'paid',
      };
    }

    throw new Error(`Unhandled Stripe event type: ${event.type}`);
  },
};
