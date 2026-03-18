import { baseTemplate } from './base.template.js';

interface OrderItem {
  productName: string;
  productReference?: string | null;
  quantity: number;
  productPriceTax: number;
  totalPrice: number;
  taxRate?: number;
}

interface OrderAddress {
  firstName?: string;
  lastName?: string;
  address1?: string;
  address2?: string | null;
  postcode?: string;
  city?: string;
  country?: string;
}

interface OrderConfirmationData {
  reference: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  deliveryAddress: OrderAddress | null;
  totalProducts: number;
  totalProductsTax: number;
  totalShipping: number;
  totalShippingTax: number;
  totalDiscounts: number;
  totalPaid: number;
  paymentMethod: string;
  createdAt?: Date | string;
  shopName: string;
  shopUrl: string;
  orderUrl: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
}

export function orderConfirmationTemplate(data: OrderConfirmationData): string {
  const itemsRows = data.items.map((item) => `
    <tr>
      <td style="padding:10px 8px;border-bottom:1px solid #f3f4f6;font-size:14px;color:#374151;">
        <strong>${escapeHtml(item.productName)}</strong>
        ${item.productReference ? `<br/><span style="font-size:12px;color:#9ca3af;">Ref: ${escapeHtml(item.productReference)}</span>` : ''}
      </td>
      <td style="padding:10px 8px;border-bottom:1px solid #f3f4f6;font-size:14px;color:#374151;text-align:center;">${item.quantity}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #f3f4f6;font-size:14px;color:#374151;text-align:right;">${formatCurrency(item.productPriceTax)}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #f3f4f6;font-size:14px;color:#374151;text-align:right;font-weight:600;">${formatCurrency(item.totalPrice)}</td>
    </tr>
  `).join('');

  const addressHtml = data.deliveryAddress ? `
    <div style="background-color:#f9fafb;border-radius:6px;padding:16px;margin-top:24px;">
      <h3 style="margin:0 0 8px;font-size:14px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:0.05em;">Dirección de envío</h3>
      <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;">
        ${data.deliveryAddress.firstName ?? ''} ${data.deliveryAddress.lastName ?? ''}<br/>
        ${data.deliveryAddress.address1 ?? ''}
        ${data.deliveryAddress.address2 ? `<br/>${data.deliveryAddress.address2}` : ''}
        <br/>${data.deliveryAddress.postcode ?? ''} ${data.deliveryAddress.city ?? ''}
        ${data.deliveryAddress.country ? `<br/>${data.deliveryAddress.country}` : ''}
      </p>
    </div>
  ` : '';

  const discountsRow = data.totalDiscounts > 0 ? `
    <tr>
      <td style="padding:6px 0;font-size:14px;color:#10b981;">Descuentos</td>
      <td style="padding:6px 0;font-size:14px;color:#10b981;text-align:right;">-${formatCurrency(data.totalDiscounts)}</td>
    </tr>
  ` : '';

  const content = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">¡Gracias por tu pedido!</h2>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;">
      Hola <strong>${escapeHtml(data.customerName)}</strong>, hemos recibido tu pedido correctamente.<br/>
      Tu número de referencia es: <strong style="color:#1a56db;">${data.reference}</strong>
    </p>

    <!-- Items table -->
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
      <thead>
        <tr style="background-color:#f9fafb;">
          <th style="padding:10px 8px;text-align:left;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Producto</th>
          <th style="padding:10px 8px;text-align:center;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Cant.</th>
          <th style="padding:10px 8px;text-align:right;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Precio</th>
          <th style="padding:10px 8px;text-align:right;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <!-- Totals -->
    <table width="260" cellpadding="0" cellspacing="0" style="margin:16px 0 0 auto;">
      <tr>
        <td style="padding:6px 0;font-size:14px;color:#6b7280;">Subtotal productos</td>
        <td style="padding:6px 0;font-size:14px;color:#374151;text-align:right;">${formatCurrency(data.totalProductsTax)}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;font-size:14px;color:#6b7280;">Envío</td>
        <td style="padding:6px 0;font-size:14px;color:#374151;text-align:right;">${formatCurrency(data.totalShippingTax)}</td>
      </tr>
      ${discountsRow}
      <tr>
        <td style="padding:12px 0 4px;font-size:16px;font-weight:700;color:#111827;border-top:2px solid #e5e7eb;">Total</td>
        <td style="padding:12px 0 4px;font-size:16px;font-weight:700;color:#1a56db;text-align:right;border-top:2px solid #e5e7eb;">${formatCurrency(data.totalPaid)}</td>
      </tr>
    </table>

    ${addressHtml}

    <!-- CTA Button -->
    <div style="text-align:center;margin-top:32px;">
      <a href="${data.orderUrl}" style="display:inline-block;background-color:#1a56db;color:#ffffff;padding:14px 32px;border-radius:6px;font-size:15px;font-weight:600;text-decoration:none;">Ver mi pedido</a>
    </div>

    <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;text-align:center;">
      Si tienes alguna pregunta, contáctanos en ${escapeHtml(data.customerEmail)}
    </p>
  `;

  return baseTemplate(content, data.shopName);
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
