/**
 * PayPal payment module for DMShop.
 *
 * Uses the PayPal Orders API v2 (REST) with OAuth2 client-credentials flow.
 * Works in both sandbox and live mode via PAYPAL_MODE env var.
 *
 * Environment variables required:
 *   PAYPAL_CLIENT_ID     — PayPal app client id
 *   PAYPAL_CLIENT_SECRET — PayPal app client secret
 *   PAYPAL_MODE          — 'sandbox' | 'live' (default: sandbox)
 */

import axios from 'axios';
import { Configuration } from '../../../models/configuration.model.js';
import { env } from '../../../config/env.js';
import type { PaymentModule, PaymentResult } from '../payment.interface.js';
import type { Order } from '../../../models/order.model.js';

// ─── PayPal API base URLs ────────────────────────────────────────────────────

function getBaseUrl(mode: string): string {
  return mode === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}

// ─── Configuration helpers ──────────────────────────────────────────────────

interface PayPalConfig {
  clientId: string;
  clientSecret: string;
  mode: string;
}

async function getPayPalConfig(): Promise<PayPalConfig | null> {
  // Prefer DB config, fall back to env vars
  try {
    const rows = await Configuration.findAll({
      where: { key: ['PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET', 'PAYPAL_MODE'] },
    });
    const map = new Map(rows.map((r) => [r.key, r.value]));

    const clientId = map.get('PAYPAL_CLIENT_ID') || (env as any).PAYPAL_CLIENT_ID || '';
    const clientSecret = map.get('PAYPAL_CLIENT_SECRET') || (env as any).PAYPAL_CLIENT_SECRET || '';
    const mode = map.get('PAYPAL_MODE') || (env as any).PAYPAL_MODE || 'sandbox';

    if (!clientId || !clientSecret) return null;
    return { clientId, clientSecret, mode };
  } catch {
    const clientId = (env as any).PAYPAL_CLIENT_ID || '';
    const clientSecret = (env as any).PAYPAL_CLIENT_SECRET || '';
    const mode = (env as any).PAYPAL_MODE || 'sandbox';
    if (!clientId || !clientSecret) return null;
    return { clientId, clientSecret, mode };
  }
}

// ─── OAuth2 Access Token ─────────────────────────────────────────────────────

async function getAccessToken(config: PayPalConfig): Promise<string> {
  const base = getBaseUrl(config.mode);
  const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');

  const { data } = await axios.post<{ access_token: string }>(
    `${base}/v1/oauth2/token`,
    'grant_type=client_credentials',
    {
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    },
  );

  return data.access_token;
}

// ─── PayPal Orders API helpers ───────────────────────────────────────────────

async function createPayPalOrder(
  config: PayPalConfig,
  accessToken: string,
  order: Order,
  returnUrl: string,
  cancelUrl: string,
): Promise<{ id: string; approvalUrl: string }> {
  const base = getBaseUrl(config.mode);
  const amount = Number(order.total_paid).toFixed(2);

  const { data } = await axios.post(
    `${base}/v2/checkout/orders`,
    {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: String(order.id),
          description: `Pedido #${order.reference}`,
          amount: {
            currency_code: 'EUR',
            value: amount,
          },
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            payment_method_preference: 'IMMEDIATE_PAYMENT_REQUIRED',
            brand_name: 'DMShop',
            locale: 'es-ES',
            landing_page: 'LOGIN',
            shipping_preference: 'NO_SHIPPING',
            user_action: 'PAY_NOW',
            return_url: returnUrl,
            cancel_url: cancelUrl,
          },
        },
      },
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': `dmshop-${order.id}-${Date.now()}`,
      },
    },
  );

  const approvalLink = (data.links as Array<{ rel: string; href: string }>).find(
    (l) => l.rel === 'payer-action',
  );

  if (!approvalLink) {
    throw new Error('PayPal did not return an approval URL');
  }

  return { id: data.id, approvalUrl: approvalLink.href };
}

async function capturePayPalOrder(
  config: PayPalConfig,
  accessToken: string,
  paypalOrderId: string,
): Promise<{ status: string; captureId: string; amount: number }> {
  const base = getBaseUrl(config.mode);

  const { data } = await axios.post(
    `${base}/v2/checkout/orders/${paypalOrderId}/capture`,
    {},
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    },
  );

  const capture = data.purchase_units?.[0]?.payments?.captures?.[0];

  return {
    status: data.status,
    captureId: capture?.id ?? '',
    amount: parseFloat(capture?.amount?.value ?? '0'),
  };
}

// ─── Payment Module ──────────────────────────────────────────────────────────

export const paypalModule: PaymentModule = {
  name: 'paypal',
  displayName: 'PayPal',
  description: 'Paga de forma segura con tu cuenta PayPal o tarjeta.',
  icon: 'account_balance_wallet',
  requiresConfig: true,

  async isAvailable(): Promise<boolean> {
    const enabled = await Configuration.findOne({ where: { key: 'PAYMENT_PAYPAL_ENABLED' } });
    if (enabled && enabled.value !== '1') return false;
    const config = await getPayPalConfig();
    return config !== null;
  },

  async process(order: Order): Promise<PaymentResult> {
    const config = await getPayPalConfig();
    if (!config) throw new Error('PayPal is not configured');

    const frontendUrl = env.FRONTEND_URL || 'http://localhost:4200';
    const backendUrl = env.APP_URL || 'http://localhost:3000';

    const returnUrl = `${backendUrl}/payment/paypal/success?orderId=${order.id}`;
    const cancelUrl = `${frontendUrl}/checkout?payment=cancelled`;

    const accessToken = await getAccessToken(config);
    const { id: paypalOrderId, approvalUrl } = await createPayPalOrder(
      config,
      accessToken,
      order,
      returnUrl,
      cancelUrl,
    );

    return {
      status: 'redirect',
      redirectUrl: approvalUrl,
      transactionId: paypalOrderId,
      metadata: { paypalOrderId },
    };
  },

  /**
   * Handle PayPal webhook events (IPN/Webhooks API).
   * For simplicity, we only handle PAYMENT.CAPTURE.COMPLETED.
   */
  async handleWebhook(
    payload: unknown,
    _headers: Record<string, string>,
  ): Promise<{ orderId: number; transactionId: string; amount: number; success: boolean }> {
    const event = payload as any;

    if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      const capture = event.resource;
      const orderId = Number(capture?.custom_id || capture?.invoice_id || 0);
      const captureId: string = capture?.id ?? '';
      const amount = parseFloat(capture?.amount?.value ?? '0');

      return { orderId, transactionId: captureId, amount, success: true };
    }

    throw new Error(`Unhandled PayPal event type: ${event.event_type}`);
  },
};

// ─── Exported helpers for controller ────────────────────────────────────────

export { getPayPalConfig, getAccessToken, capturePayPalOrder };
