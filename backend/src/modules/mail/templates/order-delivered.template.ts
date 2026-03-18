import { baseTemplate } from './base.template.js';

interface OrderDeliveredData {
  reference: string;
  customerName: string;
  stateColor: string;
  orderUrl: string;
  shopName: string;
  comment?: string | null;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function orderDeliveredTemplate(data: OrderDeliveredData): string {
  const commentBlock = data.comment ? `
    <div style="background-color:#f9fafb;border-left:4px solid #d1d5db;border-radius:0 4px 4px 0;padding:12px 16px;margin-top:16px;">
      <p style="margin:0;font-size:14px;color:#6b7280;font-style:italic;">"${escapeHtml(data.comment)}"</p>
    </div>
  ` : '';

  const content = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">✅ ¡Tu pedido ha sido entregado!</h2>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;">
      Hola <strong>${escapeHtml(data.customerName)}</strong>, tu pedido ha sido entregado correctamente. ¡Esperamos que disfrutes tu compra!
    </p>

    <div style="text-align:center;padding:20px;background-color:#f0fdf4;border-radius:8px;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:13px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;">Pedido</p>
      <p style="margin:0 0 12px;font-size:18px;font-weight:700;color:#111827;">${escapeHtml(data.reference)}</p>
      <span style="display:inline-block;background-color:#16a34a;color:#ffffff;padding:8px 20px;border-radius:20px;font-size:15px;font-weight:600;">
        Entregado
      </span>
    </div>

    ${commentBlock}

    <p style="font-size:14px;color:#6b7280;text-align:center;margin-top:16px;">
      Si tienes algún problema con tu pedido, puedes contactarnos a través de nuestra tienda.
    </p>

    <div style="text-align:center;margin-top:24px;">
      <a href="${data.orderUrl}" style="display:inline-block;background-color:#1a56db;color:#ffffff;padding:14px 32px;border-radius:6px;font-size:15px;font-weight:600;text-decoration:none;">Ver mi pedido</a>
    </div>
  `;

  return baseTemplate(content, data.shopName);
}
