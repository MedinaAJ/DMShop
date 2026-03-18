import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../../config/env.js';
import { configurationService } from '../configuration/service.js';
import { orderConfirmationTemplate } from './templates/order-confirmation.template.js';
import { orderStatusTemplate } from './templates/order-status.template.js';
import { orderShippedTemplate } from './templates/order-shipped.template.js';
import { orderDeliveredTemplate } from './templates/order-delivered.template.js';
import { orderCancelledTemplate } from './templates/order-cancelled.template.js';
import { welcomeTemplate } from './templates/welcome.template.js';
import type { OrderState } from '../../models/order-state.model.js';

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
}

async function getSmtpConfig(): Promise<SmtpConfig> {
  // Try to read from DB first (configured via admin UI)
  try {
    const dbConfigs = await configurationService.getByPrefix('SMTP_');
    const map = new Map<string, string>(dbConfigs.map((c) => [c.key, c.value]));

    const host = map.get('SMTP_HOST') || env.SMTP_HOST;
    const port = parseInt(map.get('SMTP_PORT') || String(env.SMTP_PORT), 10);
    const secure = map.has('SMTP_SECURE') ? map.get('SMTP_SECURE') === 'true' : env.SMTP_SECURE;
    const user = map.get('SMTP_USER') || env.SMTP_USER;
    const pass = map.get('SMTP_PASS') || env.SMTP_PASS;
    const fromName = map.get('SMTP_FROM_NAME') || 'DMShop';
    const fromEmail = map.get('SMTP_FROM_EMAIL') || env.SMTP_FROM;

    return { host, port, secure, user, pass, fromName, fromEmail };
  } catch {
    // Fallback to env vars if DB not available
    return {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
      fromName: 'DMShop',
      fromEmail: env.SMTP_FROM,
    };
  }
}

function createTransporter(config: SmtpConfig): Transporter {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.user ? { user: config.user, pass: config.pass } : undefined,
  });
}

async function getShopName(): Promise<string> {
  try {
    const configs = await configurationService.getByPrefix('SHOP_NAME');
    const found = configs.find((c) => c.key === 'SHOP_NAME');
    return found?.value || 'DMShop';
  } catch {
    return 'DMShop';
  }
}

async function getShopUrl(): Promise<string> {
  return env.FRONTEND_URL || 'http://localhost:4200';
}

export const mailService = {
  async send(to: string, subject: string, html: string): Promise<void> {
    const config = await getSmtpConfig();

    if (!config.host) {
      console.warn('[MailService] SMTP not configured, skipping email to:', to);
      return;
    }

    const transporter = createTransporter(config);
    const from = `"${config.fromName}" <${config.fromEmail}>`;

    await transporter.sendMail({ from, to, subject, html });
    console.log(`[MailService] Email sent to ${to}: ${subject}`);
  },

  async sendOrderConfirmation(order: any): Promise<void> {
    const shopName = await getShopName();
    const shopUrl = await getShopUrl();

    const html = orderConfirmationTemplate({
      reference: order.reference,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      items: (order.items || []).map((i: any) => ({
        productName: i.productName,
        productReference: i.productReference,
        quantity: i.quantity,
        productPriceTax: i.productPriceTax,
        totalPrice: i.totalPrice,
        taxRate: i.taxRate,
      })),
      deliveryAddress: order.deliveryAddress ? {
        firstName: order.deliveryAddress.firstName,
        lastName: order.deliveryAddress.lastName,
        address1: order.deliveryAddress.address1,
        address2: order.deliveryAddress.address2,
        postcode: order.deliveryAddress.postcode,
        city: order.deliveryAddress.city,
        country: order.deliveryAddress.country,
      } : null,
      totalProducts: order.totalProducts,
      totalProductsTax: order.totalProductsTax,
      totalShipping: order.totalShipping,
      totalShippingTax: order.totalShippingTax,
      totalDiscounts: order.totalDiscounts,
      totalPaid: order.totalPaid,
      paymentMethod: order.paymentMethod,
      shopName,
      shopUrl,
      orderUrl: `${shopUrl}/account/orders/${order.id}`,
    });

    await this.send(order.customerEmail, `Confirmación de pedido #${order.reference}`, html);
  },

  /**
   * Send an order status change email using the appropriate template based on
   * the OrderState.template field. Falls back to the generic template when
   * state.template is null/unknown.
   */
  async sendOrderStatusChange(
    order: any,
    state: Pick<OrderState, 'name' | 'color' | 'template'>,
    comment?: string,
    trackingUrl?: string,
  ): Promise<void> {
    const shopName = await getShopName();
    const shopUrl = await getShopUrl();
    const orderUrl = `${shopUrl}/account/orders/${order.id}`;
    const stateColor = state.color ?? order.stateColor ?? '#1a56db';
    const trackingNumber: string | null = order.carrier?.trackingNumber ?? null;

    let html: string;

    switch (state.template) {
      case 'shipped':
        html = orderShippedTemplate({
          reference: order.reference,
          customerName: order.customerName,
          stateColor,
          trackingNumber,
          trackingUrl,
          orderUrl,
          shopName,
          comment,
        });
        break;

      case 'delivered':
        html = orderDeliveredTemplate({
          reference: order.reference,
          customerName: order.customerName,
          stateColor,
          orderUrl,
          shopName,
          comment,
        });
        break;

      case 'cancelled':
        html = orderCancelledTemplate({
          reference: order.reference,
          customerName: order.customerName,
          stateColor,
          orderUrl,
          shopName,
          comment,
        });
        break;

      default:
        // Generic fallback template
        html = orderStatusTemplate({
          reference: order.reference,
          customerName: order.customerName,
          newStateName: state.name,
          stateColor,
          comment: comment ?? null,
          orderUrl,
          shopName,
        });
        break;
    }

    await this.send(order.customerEmail, `Actualización de tu pedido #${order.reference}`, html);
  },

  /**
   * Send a tracking number notification email to the customer.
   */
  async sendTrackingUpdate(order: any, trackingNumber: string, trackingUrl?: string): Promise<void> {
    const shopName = await getShopName();
    const shopUrl = await getShopUrl();
    const orderUrl = `${shopUrl}/account/orders/${order.id}`;

    const html = orderShippedTemplate({
      reference: order.reference,
      customerName: order.customerName,
      stateColor: order.stateColor ?? '#1a56db',
      trackingNumber,
      trackingUrl,
      orderUrl,
      shopName,
    });

    await this.send(order.customerEmail, `Número de seguimiento para tu pedido #${order.reference}`, html);
  },

  async sendWelcome(user: { email: string; first_name: string }): Promise<void> {
    const shopName = await getShopName();
    const shopUrl = await getShopUrl();

    const html = welcomeTemplate({
      firstName: user.first_name,
      shopName,
      shopUrl,
    });

    await this.send(user.email, `Bienvenido/a a ${shopName}`, html);
  },

  async sendPasswordReset(email: string, resetToken: string): Promise<void> {
    const shopName = await getShopName();
    const shopUrl = await getShopUrl();
    const resetUrl = `${shopUrl}/auth/reset-password?token=${resetToken}`;

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h2>Restablecer contraseña</h2>
        <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en ${shopName}.</p>
        <p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
        <a href="${resetUrl}" style="display:inline-block;background:#1a56db;color:#fff;padding:12px 24px;border-radius:4px;text-decoration:none;margin:16px 0;">Restablecer contraseña</a>
        <p style="font-size:12px;color:#888;">Si no solicitaste este cambio, puedes ignorar este email.</p>
      </div>
    `;

    await this.send(email, `Restablecer contraseña - ${shopName}`, html);
  },
};
