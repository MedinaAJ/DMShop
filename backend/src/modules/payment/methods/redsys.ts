import { Configuration } from '../../../models/configuration.model.js';
import type { PaymentModule, PaymentResult } from '../payment.interface.js';
import type { Order } from '../../../models/order.model.js';

/**
 * Redsys payment module — Spanish bank payment gateway (TPV Virtual)
 *
 * Requires configuration keys in the `configurations` table:
 *   - REDSYS_MERCHANT_CODE  (9-digit merchant code, e.g. "999008881")
 *   - REDSYS_TERMINAL       (terminal number, e.g. "1")
 *   - REDSYS_SECRET_KEY     (SHA-256 key from Redsys administration panel)
 *   - PAYMENT_REDSYS_ENABLED ("1" to enable)
 *
 * Integration notes:
 *   - Supports redirect flow (TPV Virtual — most common in Spain)
 *   - Bizum is available via Redsys REST API v2 (DS_MERCHANT_PAYMETHODS=z)
 *   - Full implementation requires the npm package 'redsys-easy'
 *     (https://www.npmjs.com/package/redsys-easy) or manual HMAC-SHA256 signing
 *
 * TODO (full implementation):
 *   1. npm install redsys-easy
 *   2. Build DS_MERCHANT_PARAMETERS JSON → base64 encode
 *   3. Sign with HMAC3DES (order key) + SHA256
 *   4. Generate auto-submit HTML form pointing to Redsys endpoint
 *   5. Implement webhook handler: verify DS_SIGNATURE, parse DS_RESPONSE
 *   6. DS_RESPONSE < 100 = success; >= 100 = error
 */
export const redsysModule: PaymentModule = {
  name: 'redsys',
  displayName: 'Tarjeta bancaria (Redsys/TPV)',
  description: 'Pago seguro con tarjeta a través de la pasarela bancaria española Redsys.',
  icon: 'account_balance',
  requiresConfig: true,

  async isAvailable(): Promise<boolean> {
    const enabled = await Configuration.findOne({ where: { key: 'PAYMENT_REDSYS_ENABLED' } });
    if (enabled?.value !== '1') return false;

    const merchantCode = await Configuration.findOne({ where: { key: 'REDSYS_MERCHANT_CODE' } });
    const secretKey = await Configuration.findOne({ where: { key: 'REDSYS_SECRET_KEY' } });

    return !!(merchantCode?.value && secretKey?.value);
  },

  async process(order: Order): Promise<PaymentResult> {
    // Redsys requires generating a signed POST form (DS_MERCHANT_PARAMETERS + DS_SIGNATURE)
    // Full implementation requires the 'redsys-easy' library or manual HMAC3DES/SHA256 signing.
    //
    // Steps for full integration:
    // 1. Build merchant parameters JSON:
    //    {
    //      DS_MERCHANT_AMOUNT: String(Math.round(order.total_paid * 100)),  // in cents
    //      DS_MERCHANT_ORDER: order.reference.padStart(4, '0'),             // min 4 chars
    //      DS_MERCHANT_MERCHANTCODE: merchantCode,
    //      DS_MERCHANT_CURRENCY: '978',                                     // EUR
    //      DS_MERCHANT_TRANSACTIONTYPE: '0',                               // Standard auth
    //      DS_MERCHANT_TERMINAL: terminal,
    //      DS_MERCHANT_NOTIFYURL: `${backendUrl}/payment/webhook/redsys`,
    //      DS_MERCHANT_URLOK: `${frontendUrl}/account/orders/${order.id}?payment=success`,
    //      DS_MERCHANT_URLKO: `${frontendUrl}/account/orders/${order.id}?payment=cancelled`,
    //    }
    // 2. Base64-encode the JSON → DS_MERCHANT_PARAMETERS
    // 3. Derive an order key: HMAC3DES(secretKey_base64decoded, DS_MERCHANT_ORDER)
    // 4. Build signature: HMAC-SHA256(orderKey, DS_MERCHANT_PARAMETERS) → base64 → DS_SIGNATURE
    // 5. Return a redirect URL to an intermediate page that auto-posts to Redsys endpoint

    const merchantCode = (await Configuration.findOne({ where: { key: 'REDSYS_MERCHANT_CODE' } }))?.value;
    if (!merchantCode) throw new Error('Redsys merchant code not configured');

    // Pending: generate signed form and redirect
    // For now return pending status with a note
    return {
      status: 'pending',
      metadata: {
        note: 'Redsys integration pending — install redsys-easy and implement signing flow',
        orderId: order.id,
        amount: Number(order.total_paid),
        merchantCode,
      },
    };
  },

  async handleWebhook(
    payload: unknown,
    _headers: Record<string, string>,
  ): Promise<{ orderId: number; transactionId: string; amount: number; success: boolean }> {
    // Redsys sends POST notification with:
    //   Ds_SignatureVersion, Ds_MerchantParameters (base64 JSON), Ds_Signature
    //
    // Verification steps:
    // 1. Decode Ds_MerchantParameters from base64 → parse JSON
    // 2. Extract Ds_Order from the JSON
    // 3. Derive order key: HMAC3DES(secretKey_base64decoded, Ds_Order)
    // 4. Verify: HMAC-SHA256(orderKey, Ds_MerchantParameters) === Ds_Signature (url-safe base64)
    // 5. Check Ds_Response: 0000-0099 = success, anything else = error
    // 6. Map Ds_Order back to our order reference to get orderId

    // TODO: implement with redsys-easy or manual crypto
    void payload;
    throw new Error('Redsys webhook handler not yet implemented — see TODO in redsys.ts');
  },
};
