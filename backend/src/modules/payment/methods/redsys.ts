import crypto from 'crypto';
import { Configuration } from '../../../models/configuration.model.js';
import type { PaymentModule, PaymentResult } from '../payment.interface.js';
import type { Order } from '../../../models/order.model.js';
import { env } from '../../../config/env.js';

// --------------------------------------------------------------------------
// Redsys SHA-256 signing helpers
// --------------------------------------------------------------------------

/**
 * Encrypt buffer with 3DES-CBC using secretKey. IV is all-zeros (8 bytes).
 */
function des3CbcEncrypt(secretKey: Buffer, data: Buffer): Buffer {
  // Redsys uses DES-EDE3-CBC with zeroed IV
  const iv = Buffer.alloc(8, 0);
  const cipher = crypto.createCipheriv('des-ede3-cbc', secretKey, iv);
  cipher.setAutoPadding(false);
  // Pad data to 8-byte block boundary
  const padLength = 8 - (data.length % 8);
  const padded = padLength === 8 ? data : Buffer.concat([data, Buffer.alloc(padLength, padLength)]);
  return Buffer.concat([cipher.update(padded), cipher.final()]);
}

/**
 * Derive order key from merchant secret key.
 * secretKeyBase64: the Redsys secret key as given by the bank (base64 encoded)
 * orderNumber: the DS_MERCHANT_ORDER string (must be at least 4, max 12 chars)
 */
function deriveOrderKey(secretKeyBase64: string, orderNumber: string): Buffer {
  const secretKey = Buffer.from(secretKeyBase64, 'base64');
  // Pad order to 8 bytes, then encrypt with 3DES
  const orderBuffer = Buffer.alloc(8, 0);
  const orderBytes = Buffer.from(orderNumber, 'utf8');
  orderBytes.copy(orderBuffer, 0, 0, Math.min(orderBytes.length, 8));
  return des3CbcEncrypt(secretKey, orderBuffer).slice(0, 16);
}

/**
 * Build the DS_SIGNATURE for a given merchantParameters base64 string and order key.
 */
function buildSignature(orderKey: Buffer, merchantParamsBase64: string): string {
  const hmac = crypto.createHmac('sha256', orderKey);
  hmac.update(merchantParamsBase64);
  return hmac.digest('base64');
}

// --------------------------------------------------------------------------
// Config helpers
// --------------------------------------------------------------------------

async function getRedsysConfig(): Promise<{
  merchantCode: string;
  secretKey: string;
  terminal: string;
  environment: 'test' | 'prod';
  merchantUrl: string;
} | null> {
  const keys = ['REDSYS_MERCHANT_CODE', 'REDSYS_SECRET_KEY', 'REDSYS_TERMINAL', 'REDSYS_ENVIRONMENT', 'REDSYS_MERCHANT_URL'];
  const configs = await Configuration.findAll({ where: { key: keys } });
  const map = new Map<string, string>(configs.map((c) => [c.key, c.value]));

  // Fall back to env vars
  const merchantCode = map.get('REDSYS_MERCHANT_CODE') || process.env['REDSYS_MERCHANT_CODE'] || '';
  const secretKey = map.get('REDSYS_SECRET_KEY') || process.env['REDSYS_MERCHANT_KEY'] || '';
  const terminal = map.get('REDSYS_TERMINAL') || process.env['REDSYS_TERMINAL'] || '001';
  const environment = (map.get('REDSYS_ENVIRONMENT') || process.env['REDSYS_ENVIRONMENT'] || 'test') as 'test' | 'prod';
  const merchantUrl = map.get('REDSYS_MERCHANT_URL') || process.env['REDSYS_MERCHANT_URL'] || '';

  if (!merchantCode || !secretKey) return null;
  return { merchantCode, secretKey, terminal, environment, merchantUrl };
}

/**
 * Build the signed form data for posting to Redsys TPV.
 * Returns: { Ds_SignatureVersion, Ds_MerchantParameters, Ds_Signature, actionUrl }
 */
export async function buildRedsysForm(order: Order): Promise<{
  Ds_SignatureVersion: string;
  Ds_MerchantParameters: string;
  Ds_Signature: string;
  actionUrl: string;
}> {
  const config = await getRedsysConfig();
  if (!config) throw new Error('Redsys no está configurado');

  const frontendUrl = env.FRONTEND_URL || 'http://localhost:4200';
  const backendUrl = process.env['BACKEND_URL'] || process.env['API_URL'] || 'http://localhost:3000';

  // DS_MERCHANT_ORDER: 4-12 alphanumeric chars. Use reference, padded to 4 chars, max 12.
  const rawRef = (order.reference || String(order.id)).replace(/[^A-Za-z0-9]/g, '');
  const orderNum = rawRef.padStart(4, '0').substring(0, 12);

  const params = {
    DS_MERCHANT_AMOUNT: String(Math.round(Number(order.total_paid) * 100)),
    DS_MERCHANT_ORDER: orderNum,
    DS_MERCHANT_MERCHANTCODE: config.merchantCode,
    DS_MERCHANT_TERMINAL: config.terminal,
    DS_MERCHANT_TRANSACTIONTYPE: '0',
    DS_MERCHANT_CURRENCY: '978', // EUR
    DS_MERCHANT_URLOK: `${frontendUrl}/checkout/success?orderId=${order.id}`,
    DS_MERCHANT_URLKO: `${frontendUrl}/checkout/error?orderId=${order.id}`,
    DS_MERCHANT_MERCHANTURL: config.merchantUrl || `${backendUrl}/api/v1/payment/webhook/redsys`,
    DS_MERCHANT_CONSUMERLANGUAGE: '001',
  };

  const paramsBase64 = Buffer.from(JSON.stringify(params), 'utf8').toString('base64');
  const orderKey = deriveOrderKey(config.secretKey, orderNum);
  const signature = buildSignature(orderKey, paramsBase64);

  const actionUrl = config.environment === 'prod'
    ? 'https://sis.redsys.es/sis/realizarPago'
    : 'https://sis-t.redsys.es:25443/sis/realizarPago';

  return {
    Ds_SignatureVersion: 'HMAC_SHA256_V1',
    Ds_MerchantParameters: paramsBase64,
    Ds_Signature: signature,
    actionUrl,
  };
}

/**
 * Verify Redsys webhook notification signature.
 */
export async function verifyRedsysNotification(
  merchantParamsBase64: string,
  receivedSignature: string,
): Promise<{ valid: boolean; params: Record<string, string> }> {
  const config = await getRedsysConfig();
  if (!config) throw new Error('Redsys no está configurado');

  // Decode merchant params
  const paramsJson = Buffer.from(merchantParamsBase64, 'base64').toString('utf8');
  const params = JSON.parse(paramsJson) as Record<string, string>;

  const orderNum = params['Ds_Order'] || params['DS_MERCHANT_ORDER'] || '';
  const orderKey = deriveOrderKey(config.secretKey, orderNum);

  // Redsys uses URL-safe base64 for the received signature; normalize
  const normalizedSig = receivedSignature.replace(/-/g, '+').replace(/_/g, '/');
  const expectedSig = buildSignature(orderKey, merchantParamsBase64);

  return {
    valid: normalizedSig === expectedSig,
    params,
  };
}

// --------------------------------------------------------------------------
// Payment module
// --------------------------------------------------------------------------

export const redsysModule: PaymentModule = {
  name: 'redsys',
  displayName: 'Tarjeta bancaria (Redsys/TPV)',
  description: 'Pago seguro con tarjeta a través de la pasarela bancaria española Redsys.',
  icon: 'account_balance',
  requiresConfig: true,

  async isAvailable(): Promise<boolean> {
    const enabled = await Configuration.findOne({ where: { key: 'PAYMENT_REDSYS_ENABLED' } });
    if (enabled?.value !== '1') return false;
    const config = await getRedsysConfig();
    return config !== null;
  },

  async process(order: Order): Promise<PaymentResult> {
    const formData = await buildRedsysForm(order);

    return {
      status: 'redirect',
      // Encode form data as a special URL that the frontend can decode
      redirectUrl: `redsys://form?data=${encodeURIComponent(JSON.stringify(formData))}`,
      metadata: formData,
    };
  },

  async handleWebhook(
    payload: unknown,
    _headers: Record<string, string>,
  ): Promise<{ orderId: number; transactionId: string; amount: number; success: boolean }> {
    const body = payload as Record<string, string>;

    const merchantParams = body['Ds_MerchantParameters'];
    const signature = body['Ds_Signature'];

    if (!merchantParams || !signature) {
      throw new Error('Redsys webhook: missing Ds_MerchantParameters or Ds_Signature');
    }

    const { valid, params } = await verifyRedsysNotification(merchantParams, signature);
    if (!valid) {
      throw new Error('Redsys webhook: invalid signature');
    }

    // Ds_Response: 0000-0099 = authorised, anything else = rejected/error
    const response = params['Ds_Response'] || '9999';
    const responseCode = parseInt(response, 10);
    const success = responseCode >= 0 && responseCode <= 99;

    const orderRef = params['Ds_Order'] || '';
    const amountCents = parseInt(params['Ds_Amount'] || '0', 10);
    const transactionId = params['Ds_AuthorisationCode'] || orderRef;

    // Map Ds_Order (padded reference) back to orderId
    // Import Order here to avoid circular deps
    const { Order } = await import('../../../models/order.model.js');
    const order = await Order.findOne({
      where: { reference: orderRef.replace(/^0+/, '') || orderRef },
    });
    const orderId = order?.id ?? 0;

    return {
      orderId,
      transactionId,
      amount: amountCents / 100,
      success,
    };
  },
};
