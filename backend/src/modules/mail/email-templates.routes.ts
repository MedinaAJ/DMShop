import { Router } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { mailService } from './mail.service.js';
import { configurationService } from '../configuration/service.js';
import { sendSuccess } from '../../utils/response.js';
import { orderConfirmationTemplate } from './templates/order-confirmation.template.js';
import { orderShippedTemplate } from './templates/order-shipped.template.js';
import { orderCancelledTemplate } from './templates/order-cancelled.template.js';
import { orderDeliveredTemplate } from './templates/order-delivered.template.js';
import { orderStatusTemplate } from './templates/order-status.template.js';
import { welcomeTemplate } from './templates/welcome.template.js';

export const emailTemplatesRouter = Router();

// All admin email-template routes require authentication
emailTemplatesRouter.use(authenticate, authorize('admin'));

interface EmailTemplateInfo {
  name: string;
  description: string;
  variables: string[];
}

const AVAILABLE_TEMPLATES: EmailTemplateInfo[] = [
  {
    name: 'order-confirmation',
    description: 'Confirmación de pedido enviada al cliente tras realizar la compra',
    variables: ['reference', 'customerName', 'items', 'totalPaid', 'paymentMethod'],
  },
  {
    name: 'order-shipped',
    description: 'Email notificando que el pedido ha sido enviado',
    variables: ['reference', 'customerName', 'trackingNumber', 'trackingUrl'],
  },
  {
    name: 'order-cancelled',
    description: 'Email notificando la cancelación del pedido',
    variables: ['reference', 'customerName', 'reason'],
  },
  {
    name: 'order-delivered',
    description: 'Email notificando la entrega del pedido',
    variables: ['reference', 'customerName'],
  },
  {
    name: 'order-status',
    description: 'Actualización genérica de estado del pedido',
    variables: ['reference', 'stateName', 'stateColor', 'comment'],
  },
  {
    name: 'welcome',
    description: 'Bienvenida al registrarse como nuevo cliente',
    variables: ['firstName', 'email'],
  },
  {
    name: 'password-reset',
    description: 'Email de recuperación de contraseña',
    variables: ['email', 'resetToken'],
  },
];

async function getEmailConfig(): Promise<{ headerColor: string; logoUrl: string; footerText: string; fromName: string }> {
  try {
    const configs = await configurationService.getByPrefix('EMAIL_');
    const map = new Map(configs.map((c) => [c.key, c.value]));

    // Also fetch theme logo as fallback
    const themeConfigs = await configurationService.getByPrefix('THEME_LOGO_URL');
    const themeLogo = themeConfigs.find((c) => c.key === 'THEME_LOGO_URL')?.value ?? '';
    const shopName = (await configurationService.getByPrefix('SHOP_NAME')).find((c) => c.key === 'SHOP_NAME')?.value ?? 'DMShop';

    return {
      headerColor: map.get('EMAIL_HEADER_COLOR') ?? '#1a56db',
      logoUrl: map.get('EMAIL_LOGO_URL') ?? themeLogo,
      footerText: map.get('EMAIL_FOOTER_TEXT') ?? `© ${new Date().getFullYear()} ${shopName}. Todos los derechos reservados.`,
      fromName: map.get('EMAIL_FROM_NAME') ?? shopName,
    };
  } catch {
    return { headerColor: '#1a56db', logoUrl: '', footerText: 'DMShop', fromName: 'DMShop' };
  }
}

function generatePreviewHtml(templateName: string, emailConfig: { headerColor: string; logoUrl: string; footerText: string; fromName: string }): string {
  const shopName = emailConfig.fromName;

  // Sample data for preview
  const sampleOrder = {
    reference: 'ORD-2026-0001',
    customerName: 'Ana García',
    customerEmail: 'ana@ejemplo.com',
    items: [
      { productName: 'Producto Ejemplo A', productReference: 'REF-001', quantity: 2, productPriceTax: 25.99, totalPrice: 51.98 },
      { productName: 'Producto Ejemplo B', productReference: 'REF-002', quantity: 1, productPriceTax: 14.99, totalPrice: 14.99 },
    ],
    deliveryAddress: { firstName: 'Ana', lastName: 'García', address1: 'Calle Mayor 1', postcode: '28001', city: 'Madrid', country: 'España' },
    totalProducts: 60.97,
    totalProductsTax: 12.80,
    totalShipping: 4.99,
    totalShippingTax: 1.05,
    totalDiscounts: 0,
    totalPaid: 65.96,
    paymentMethod: 'Tarjeta de crédito',
    shopName,
    shopUrl: 'http://localhost:4200',
    orderUrl: 'http://localhost:4200/account/orders/1',
  };

  switch (templateName) {
    case 'order-confirmation':
      return orderConfirmationTemplate(sampleOrder);
    case 'order-shipped':
      return orderShippedTemplate({
        reference: sampleOrder.reference,
        customerName: sampleOrder.customerName,
        stateColor: emailConfig.headerColor,
        trackingNumber: 'ES123456789ES',
        trackingUrl: 'https://tracking.ejemplo.com/ES123456789ES',
        shopName,
        orderUrl: sampleOrder.orderUrl,
        comment: 'Tu pedido ha sido enviado por Correos Express.',
      });
    case 'order-cancelled':
      return orderCancelledTemplate({
        reference: sampleOrder.reference,
        customerName: sampleOrder.customerName,
        stateColor: emailConfig.headerColor,
        shopName,
        orderUrl: sampleOrder.orderUrl,
        comment: 'Solicitud del cliente.',
      });
    case 'order-delivered':
      return orderDeliveredTemplate({
        reference: sampleOrder.reference,
        customerName: sampleOrder.customerName,
        stateColor: emailConfig.headerColor,
        shopName,
        orderUrl: sampleOrder.orderUrl,
      });
    case 'order-status':
      return orderStatusTemplate({
        reference: sampleOrder.reference,
        customerName: sampleOrder.customerName,
        newStateName: 'En preparación',
        stateColor: emailConfig.headerColor,
        comment: 'Tu pedido está siendo preparado en nuestro almacén.',
        shopName,
        orderUrl: sampleOrder.orderUrl,
      });
    case 'welcome':
      return welcomeTemplate({ firstName: 'Ana', shopName, shopUrl: sampleOrder.shopUrl });
    case 'password-reset':
      return `<html><body style="font-family:Arial;padding:20px"><h2>Recuperación de contraseña</h2><p>Hola <strong>Ana</strong>,</p><p>Haz clic en el enlace para restablecer tu contraseña:</p><a href="#">Restablecer contraseña</a></body></html>`;
    default:
      return `<html><body><p>Template "${templateName}" not found</p></body></html>`;
  }
}

/** GET /api/v1/admin/email-templates — list templates */
emailTemplatesRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    sendSuccess(res, AVAILABLE_TEMPLATES);
  }),
);

/** GET /api/v1/admin/email-templates/config — get email config */
emailTemplatesRouter.get(
  '/config',
  asyncHandler(async (_req, res) => {
    const config = await getEmailConfig();
    sendSuccess(res, config);
  }),
);

/** PUT /api/v1/admin/email-templates/config — update email config */
emailTemplatesRouter.put(
  '/config',
  asyncHandler(async (req, res) => {
    const { headerColor, logoUrl, footerText, fromName } = req.body;
    const configs: { key: string; value: string }[] = [];
    if (headerColor !== undefined) configs.push({ key: 'EMAIL_HEADER_COLOR', value: String(headerColor) });
    if (logoUrl !== undefined) configs.push({ key: 'EMAIL_LOGO_URL', value: String(logoUrl) });
    if (footerText !== undefined) configs.push({ key: 'EMAIL_FOOTER_TEXT', value: String(footerText) });
    if (fromName !== undefined) configs.push({ key: 'EMAIL_FROM_NAME', value: String(fromName) });

    if (configs.length > 0) {
      await configurationService.bulkUpdate(configs);
    }
    sendSuccess(res, { message: 'Email configuration updated' });
  }),
);

/** GET /api/v1/admin/email-templates/:name/preview — HTML preview */
emailTemplatesRouter.get(
  '/:name/preview',
  asyncHandler(async (req, res) => {
    const { name } = req.params;
    const template = AVAILABLE_TEMPLATES.find((t) => t.name === name);
    if (!template) {
      res.status(404).json({ success: false, message: `Template "${name}" not found` });
      return;
    }

    const emailConfig = await getEmailConfig();
    const html = generatePreviewHtml(name, emailConfig);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }),
);

/** POST /api/v1/admin/email-templates/:name/test — send test email */
emailTemplatesRouter.post(
  '/:name/test',
  asyncHandler(async (req, res) => {
    const { name } = req.params;
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ success: false, message: 'email is required' });
      return;
    }

    const template = AVAILABLE_TEMPLATES.find((t) => t.name === name);
    if (!template) {
      res.status(404).json({ success: false, message: `Template "${name}" not found` });
      return;
    }

    const emailConfig = await getEmailConfig();
    const html = generatePreviewHtml(name, emailConfig);
    await mailService.send(email, `[DMShop TEST] Plantilla: ${name}`, html);

    sendSuccess(res, { message: `Email de prueba enviado a ${email}` });
  }),
);
