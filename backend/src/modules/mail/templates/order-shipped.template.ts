import { baseTemplate } from './base.template.js';

interface OrderShippedData {
  reference: string;
  customerName: string;
  stateColor: string;
  trackingNumber?: string | null;
  trackingUrl?: string;
  orderUrl: string;
  shopName: string;
  comment?: string | null;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function orderShippedTemplate(data: OrderShippedData): string {
  const trackingBlock = (data.trackingNumber || data.trackingUrl) ? `
    <div style="background-color:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:20px;margin:24px 0;text-align:center;">
      <p style="margin:0 0 8px;font-size:14px;color:#16a34a;font-weight:600;">🚚 Número de seguimiento</p>
      ${data.trackingNumber ? `<p style="margin:0 0 12px;font-size:20px;font-weight:700;font-family:monospace;color:#111827;">${escapeHtml(data.trackingNumber)}</p>` : ''}
      ${data.trackingUrl ? `<a href="${data.trackingUrl}" style="display:inline-block;background-color:#16a34a;color:#ffffff;padding:10px 24px;border-radius:6px;font-size:14px;font-weight:600;text-decoration:none;">Seguir mi paquete →</a>` : ''}
    </div>
  ` : '';

  const commentBlock = data.comment ? `
    <div style="background-color:#f9fafb;border-left:4px solid #d1d5db;border-radius:0 4px 4px 0;padding:12px 16px;margin-top:16px;">
      <p style="margin:0;font-size:14px;color:#6b7280;font-style:italic;">"${escapeHtml(data.comment)}"</p>
    </div>
  ` : '';

  const content = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">🚚 ¡Tu pedido está en camino!</h2>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;">
      Hola <strong>${escapeHtml(data.customerName)}</strong>, nos complace informarte de que tu pedido ha sido enviado.
    </p>

    <div style="text-align:center;padding:20px;background-color:#f9fafb;border-radius:8px;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:13px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;">Pedido</p>
      <p style="margin:0;font-size:18px;font-weight:700;color:#111827;">${escapeHtml(data.reference)}</p>
    </div>

    ${trackingBlock}
    ${commentBlock}

    <div style="text-align:center;margin-top:32px;">
      <a href="${data.orderUrl}" style="display:inline-block;background-color:#1a56db;color:#ffffff;padding:14px 32px;border-radius:6px;font-size:15px;font-weight:600;text-decoration:none;">Ver mi pedido</a>
    </div>
  `;

  return baseTemplate(content, data.shopName);
}
