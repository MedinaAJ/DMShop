import { Configuration } from '../../../models/configuration.model.js';
import type { PaymentModule, PaymentResult } from '../payment.interface.js';
import type { Order } from '../../../models/order.model.js';

/**
 * Bizum payment module — Spanish mobile payment via Redsys REST API v2
 *
 * Bizum is the most used mobile payment method in Spain (37% of online payments).
 * It integrates via Redsys using DS_MERCHANT_PAYMETHODS = 'z'.
 *
 * Shares all configuration with the Redsys module (same merchant credentials).
 * Toggle: PAYMENT_BIZUM_ENABLED = '1'
 */

/** Build the DS_MERCHANT_PARAMETERS base64 JSON */
function buildMerchantParameters(params: Record<string, string>): string {
  return Buffer.from(JSON.stringify(params)).toString('base64');
}

/** HMAC3DES (Triple-DES ECB) key derivation from base64 secret + order number */
async function deriveOrderKey(secretKeyBase64: string, order: string): Promise<Buffer> {
  const { createCipheriv } = await import('crypto');
  const secretKey = Buffer.from(secretKeyBase64, 'base64');
  // DES3 ECB encrypt order (padded to 8 bytes multiples)
  const orderBuf = Buffer.alloc(8, 0);
  Buffer.from(order, 'ascii').copy(orderBuf);
  const cipher = createCipheriv('des-ede3-ecb', secretKey, null as any);
  cipher.setAutoPadding(false);
  const encrypted = Buffer.concat([cipher.update(orderBuf), cipher.final()]);
  return encrypted;
}

/** Sign with HMAC-SHA256 using the derived order key */
async function signParameters(orderKey: Buffer, merchantParametersB64: string): Promise<string> {
  const { createHmac } = await import('crypto');
  const hmac = createHmac('sha256', orderKey);
  hmac.update(merchantParametersB64);
  return hmac.digest('base64');
}

export const bizumModule: PaymentModule = {
  name: 'bizum',
  displayName: 'Bizum',
  description: 'Pago rápido y seguro con Bizum desde tu móvil.',
  icon: 'phone_android',
  requiresConfig: true,

  async isAvailable(): Promise<boolean> {
    const bizumEnabled = await Configuration.findOne({ where: { key: 'PAYMENT_BIZUM_ENABLED' } });
    if (bizumEnabled?.value !== '1') return false;

    // Requires Redsys credentials (same merchant)
    const merchantCode = await Configuration.findOne({ where: { key: 'REDSYS_MERCHANT_CODE' } });
    const secretKey = await Configuration.findOne({ where: { key: 'REDSYS_SECRET_KEY' } });

    return !!(merchantCode?.value && secretKey?.value);
  },

  async process(order: Order): Promise<PaymentResult> {
    const [merchantCodeRow, terminalRow, secretKeyRow] = await Promise.all([
      Configuration.findOne({ where: { key: 'REDSYS_MERCHANT_CODE' } }),
      Configuration.findOne({ where: { key: 'REDSYS_TERMINAL' } }),
      Configuration.findOne({ where: { key: 'REDSYS_SECRET_KEY' } }),
    ]);

    const merchantCode = merchantCodeRow?.value;
    const terminal = terminalRow?.value ?? '1';
    const secretKey = secretKeyRow?.value;

    if (!merchantCode || !secretKey) {
      throw new Error('Redsys/Bizum merchant credentials not configured');
    }

    const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:3000';
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:4200';

    // DS_MERCHANT_ORDER must be 4-12 alphanumeric chars
    const dsOrder = String(order.id).padStart(4, '0').slice(0, 12);

    const merchantParams: Record<string, string> = {
      DS_MERCHANT_AMOUNT: String(Math.round(Number(order.total_paid) * 100)),
      DS_MERCHANT_ORDER: dsOrder,
      DS_MERCHANT_MERCHANTCODE: merchantCode,
      DS_MERCHANT_CURRENCY: '978',              // EUR
      DS_MERCHANT_TRANSACTIONTYPE: '0',         // Standard authorization
      DS_MERCHANT_TERMINAL: terminal,
      DS_MERCHANT_NOTIFYURL: `${backendUrl}/payment/webhook/bizum`,
      DS_MERCHANT_URLOK: `${frontendUrl}/account/orders/${order.id}?payment=success`,
      DS_MERCHANT_URLKO: `${frontendUrl}/account/orders/${order.id}?payment=cancelled`,
      // Key differentiator: Bizum payment method
      DS_MERCHANT_PAYMETHODS: 'z',
    };

    const merchantParamsB64 = buildMerchantParameters(merchantParams);
    const orderKey = await deriveOrderKey(secretKey, dsOrder);
    const signature = await signParameters(orderKey, merchantParamsB64);

    // Redsys TPV endpoint (test environment)
    const redsysEndpoint = process.env.REDSYS_ENDPOINT
      ?? 'https://sis-t.redsys.es:25443/sis/realizarPago';

    // Return form data for auto-post redirect
    return {
      status: 'redirect',
      redirectUrl: redsysEndpoint,
      metadata: {
        Ds_SignatureVersion: 'HMAC_SHA256_V1',
        Ds_MerchantParameters: merchantParamsB64,
        Ds_Signature: signature,
        // The frontend should auto-submit a form to redirectUrl with these fields
        formFields: {
          Ds_SignatureVersion: 'HMAC_SHA256_V1',
          Ds_MerchantParameters: merchantParamsB64,
          Ds_Signature: signature,
        },
      },
    };
  },

  async handleWebhook(
    payload: unknown,
    _headers: Record<string, string>,
  ): Promise<{ orderId: number; transactionId: string; amount: number; success: boolean }> {
    const body = payload as Record<string, string>;
    const dsSignatureVersion = body['Ds_SignatureVersion'];
    const dsMerchantParameters = body['Ds_MerchantParameters'];
    const dsSignature = body['Ds_Signature'];

    if (!dsSignatureVersion || !dsMerchantParameters || !dsSignature) {
      throw new Error('Bizum webhook: missing Redsys fields');
    }

    const secretKeyRow = await Configuration.findOne({ where: { key: 'REDSYS_SECRET_KEY' } });
    if (!secretKeyRow?.value) throw new Error('Bizum: REDSYS_SECRET_KEY not configured');

    // Decode parameters
    const decoded = JSON.parse(Buffer.from(dsMerchantParameters, 'base64').toString('utf-8'));
    const dsOrder: string = decoded['Ds_Order'];
    const dsResponse: string = decoded['Ds_Response'] ?? '9999';
    const dsAmount: string = decoded['Ds_Amount'] ?? '0';
    const dsAuthCode: string = decoded['Ds_AuthorisationCode'] ?? '';

    // Verify signature
    const orderKey = await deriveOrderKey(secretKeyRow.value, dsOrder);
    const expectedSig = await signParameters(orderKey, dsMerchantParameters);
    // Compare url-safe base64 variants
    const normalize = (s: string) => s.replace(/-/g, '+').replace(/_/g, '/');
    if (normalize(expectedSig) !== normalize(dsSignature)) {
      throw new Error('Bizum webhook: invalid signature');
    }

    const responseCode = parseInt(dsResponse, 10);
    const success = responseCode >= 0 && responseCode < 100;

    // Reconstruct orderId from dsOrder (we padded with zeros)
    const orderId = parseInt(dsOrder, 10);

    return {
      orderId,
      transactionId: dsAuthCode || dsOrder,
      amount: parseInt(dsAmount, 10) / 100,
      success,
    };
  },
};
