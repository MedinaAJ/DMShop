/**
 * PayPal-specific routes:
 *  GET  /payment/paypal/success  — callback after buyer approves the payment
 *  GET  /payment/paypal/cancel   — callback when buyer cancels
 *  POST /payment/webhook/paypal  — webhook handler (handled by generic webhook route in payment.routes.ts)
 */

import { Router } from 'express';
import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { orderService } from '../order/service.js';
import { getPayPalConfig, getAccessToken, capturePayPalOrder } from './methods/paypal.js';
import { env } from '../../config/env.js';

export const paypalRouter = Router();

/**
 * GET /payment/paypal/success
 * PayPal redirects here after buyer approves. We capture the payment.
 * Query params: ?token=<paypal_order_id>&PayerID=<payer_id>&orderId=<our_order_id>
 */
paypalRouter.get(
  '/success',
  asyncHandler(async (req: Request, res: Response) => {
    const paypalOrderId = req.query.token as string;
    const ourOrderId = Number(req.query.orderId);
    const frontendUrl = env.FRONTEND_URL || 'http://localhost:4200';

    if (!paypalOrderId || !ourOrderId) {
      return res.redirect(`${frontendUrl}/checkout?payment=error&reason=missing_params`);
    }

    try {
      const config = await getPayPalConfig();
      if (!config) throw new Error('PayPal not configured');

      const accessToken = await getAccessToken(config);
      const capture = await capturePayPalOrder(config, accessToken, paypalOrderId);

      const captureData = capture.purchaseUnits?.[0]?.payments?.captures?.[0];

      if (capture.status === 'COMPLETED' && captureData) {
        // Register the payment in the order
        await orderService.registerPayment(ourOrderId, {
          paymentMethod: 'paypal',
          transactionId: captureData.id,
          amount: parseFloat(captureData.amount.value),
          idCurrency: 1,
        });

        return res.redirect(`${frontendUrl}/account/orders/${ourOrderId}?payment=success`);
      } else {
        return res.redirect(`${frontendUrl}/account/orders/${ourOrderId}?payment=pending`);
      }
    } catch (err) {
      console.error('[PayPal] Error capturing payment:', err);
      return res.redirect(`${frontendUrl}/checkout?payment=error`);
    }
  }),
);

/**
 * GET /payment/paypal/cancel
 * Buyer cancelled the payment on PayPal.
 */
paypalRouter.get('/cancel', (_req: Request, res: Response) => {
  const frontendUrl = env.FRONTEND_URL || 'http://localhost:4200';
  return res.redirect(`${frontendUrl}/checkout?payment=cancelled`);
});
