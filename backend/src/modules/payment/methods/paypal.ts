/**
 * PayPal payment module — OAuth2 + Orders API v2
 *
 * Configuration (DB table `configurations` takes precedence over env vars):
 *   - PAYPAL_CLIENT_ID
 *   - PAYPAL_CLIENT_SECRET
 *   - PAYPAL_MODE  (sandbox | live)
 *   - PAYMENT_PAYPAL_ENABLED  (1 to enable)
 *
 * Flow:
 *  1. POST /payment/process { orderId, paymentMethod: 'paypal' }
 *     → calls paypalModule.process() → creates PayPal order → returns redirectUrl
 *  2. User approves on PayPal, returns to GET /payment/paypal/success?token=XXX&orderId=YYY
 *     → controller verifies token→orderId mapping
 *     → calls paypalModule.handleWebhook({ type:'capture', token, orderId })
 *     → captures payment, stores transaction, updates order state
 */

import { Configuration } from '../../../models/configuration.model.js';
import type { PaymentModule, PaymentResult } from '../payment.interface.js';
import type { Order } from '../../../models/order.model.js';

// --------------------------------------------------------------------------
// Config helpers
// --------------------------------------------------------------------------

interface PayPalConfig {
  clientId: string;
  clientSecret: string;
  mode: 'sandbox' | 'live';
  baseUrl: string;
}

export async function getPayPalConfig(): Promise<PayPalConfig | null> {
  const keys = ['PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET', 'PAYPAL_MODE'];
  const configs = await Configuration.findAll({ where: { key: keys } });
  const map = new Map<string, string>(configs.map((c) => [c.key, c.value]));

  const clientId = map.get('PAYPAL_CLIENT_ID') || process.env['PAYPAL_CLIENT_ID'] || '';
  const clientSecret = map.get('PAYPAL_CLIENT_SECRET') || process.env['PAYPAL_CLIENT_SECRET'] || '';
  const mode = (map.get('PAYPAL_MODE') || process.env['PAYPAL_MODE'] || 'sandbox') as 'sandbox' | 'live';

  if (!clientId || !clientSecret) return null;

  const baseUrl = mode === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

  return { clientId, clientSecret, mode, baseUrl };
}

// --------------------------------------------------------------------------
// PayPal REST API helpers
// --------------------------------------------------------------------------

export async function getAccessToken(config: PayPalConfig): Promise<string> {
  const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
  const response = await fetch(`${config.baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`PayPal auth failed: ${error}`);
  }

  const data = await response.json() as { access_token: string };
  return data.access_token;
}

async function createPayPalOrder(
  config: PayPalConfig,
  accessToken: string,
  order: Order,
  returnUrl: string,
  cancelUrl: string,
): Promise<{ id: string; approveUrl: string }> {
  const body = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        reference_id: String(order.id),
        description: `Pedido #${order.reference}`,
        amount: {
          currency_code: 'EUR',
          value: Number(order.total_paid).toFixed(2),
        },
      },
    ],
    payment_source: {
      paypal: {
        experience_context: {
          payment_method_preference: 'IMMEDIATE_PAYMENT_REQUIRED',
          landing_page: 'LOGIN',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'PAY_NOW',
          return_url: returnUrl,
          cancel_url: cancelUrl,
        },
      },
    },
  };

  const response = await fetch(`${config.baseUrl}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': `dmshop-${order.id}-${Date.now()}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`PayPal createOrder failed: ${error}`);
  }

  const data = await response.json() as {
    id: string;
    links: Array<{ rel: string; href: string }>;
  };

  const approveLink = data.links.find((l) => l.rel === 'payer-action' || l.rel === 'approve');
  if (!approveLink) throw new Error('PayPal: no approval URL in response');

  return { id: data.id, approveUrl: approveLink.href };
}

export async function capturePayPalOrder(
  config: PayPalConfig,
  accessToken: string,
  paypalOrderId: string,
): Promise<{
  id: string;
  status: string;
  purchaseUnits: Array<{
    referenceId: string;
    payments: { captures: Array<{ id: string; amount: { value: string }; status: string }> };
  }>;
}> {
  const response = await fetch(`${config.baseUrl}/v2/checkout/orders/${paypalOrderId}/capture`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: '{}',
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`PayPal captureOrder failed: ${error}`);
  }

  const data = await response.json() as {
    id: string;
    status: string;
    purchase_units: Array<{
      reference_id: string;
      payments: { captures: Array<{ id: string; amount: { value: string }; status: string }> };
    }>;
  };

  return {
    id: data.id,
    status: data.status,
    purchaseUnits: data.purchase_units.map((pu) => ({
      referenceId: pu.reference_id,
      payments: pu.payments,
    })),
  };
}

// --------------------------------------------------------------------------
// Payment module
// --------------------------------------------------------------------------

export const paypalModule: PaymentModule = {
  name: 'paypal',
  displayName: 'PayPal',
  description: 'Paga de forma segura con tu cuenta PayPal o tarjeta.',
  icon: 'payment',
  requiresConfig: true,

  async isAvailable(): Promise<boolean> {
    const enabled = await Configuration.findOne({ where: { key: 'PAYMENT_PAYPAL_ENABLED' } });
    if (enabled?.value !== '1') return false;
    const config = await getPayPalConfig();
    return config !== null;
  },

  async process(order: Order): Promise<PaymentResult> {
    const config = await getPayPalConfig();
    if (!config) throw new Error('PayPal no está configurado');

    const backendUrl = process.env['BACKEND_URL'] || process.env['API_URL'] || 'http://localhost:3000';

    const returnUrl = `${backendUrl}/api/v1/payment/paypal/success?orderId=${order.id}`;
    const cancelUrl = `${backendUrl}/api/v1/payment/paypal/cancel?orderId=${order.id}`;

    const accessToken = await getAccessToken(config);
    const { id: paypalOrderId, approveUrl } = await createPayPalOrder(
      config, accessToken, order, returnUrl, cancelUrl,
    );

    // Extract token from the approveUrl (PayPal appends ?token=XXXXX)
    try {
      const url = new URL(approveUrl);
      const token = url.searchParams.get('token');
      if (token) {
        // Store the token → orderId mapping for security verification in the success handler
        await Configuration.upsert({
          key: `PAYPAL_TOKEN_${token}`,
          value: String(order.id),
        });
      }
    } catch {
      // If we can't parse the URL, store by paypalOrderId as fallback
      await Configuration.upsert({
        key: `PAYPAL_TOKEN_${paypalOrderId}`,
        value: String(order.id),
      });
    }

    return {
      status: 'redirect',
      redirectUrl: approveUrl,
      transactionId: paypalOrderId,
      metadata: { paypalOrderId },
    };
  },

  async handleWebhook(
    payload: unknown,
    _headers: Record<string, string>,
  ): Promise<{ orderId: number; transactionId: string; amount: number; success: boolean }> {
    const body = payload as { type?: string; token?: string; orderId?: number; paypalOrderId?: string };

    if (body.type === 'capture') {
      // Called from the success redirect handler in the controller
      const config = await getPayPalConfig();
      if (!config) throw new Error('PayPal no está configurado');

      const paypalOrderId = body.token ?? body.paypalOrderId ?? '';
      if (!paypalOrderId) throw new Error('PayPal: missing token/order ID');

      const accessToken = await getAccessToken(config);
      const captured = await capturePayPalOrder(config, accessToken, paypalOrderId);

      const capture = captured.purchaseUnits[0]?.payments?.captures?.[0];
      if (!capture) throw new Error('PayPal: no capture in response');

      const orderId = body.orderId ?? Number(captured.purchaseUnits[0]?.referenceId ?? 0);
      const amount = parseFloat(capture.amount?.value ?? '0');
      const success = capture.status === 'COMPLETED' || captured.status === 'COMPLETED';

      return {
        orderId,
        transactionId: capture.id,
        amount,
        success,
      };
    }

    // IPN / Webhook notification (not commonly used with Orders API v2)
    throw new Error('PayPal webhook: unhandled payload type');
  },
};
