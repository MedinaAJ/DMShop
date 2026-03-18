import { baseTemplate } from './base.template.js';

interface OrderStatusData {
  reference: string;
  customerName: string;
  newStateName: string;
  stateColor: string;
  comment?: string | null;
  orderUrl: string;
  shopName: string;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function orderStatusTemplate(data: OrderStatusData): string {
  const commentBlock = data.comment ? `
    <div style="background-color:#f9fafb;border-left:4px solid #d1d5db;border-radius:0 4px 4px 0;padding:12px 16px;margin-top:16px;">
      <p style="margin:0;font-size:14px;color:#6b7280;font-style:italic;">"${escapeHtml(data.comment)}"</p>
    </div>
  ` : '';

  const content = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">Actualización de tu pedido</h2>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;">
      Hola <strong>${escapeHtml(data.customerName)}</strong>, el estado de tu pedido ha cambiado.
    </p>

    <div style="text-align:center;padding:24px;background-color:#f9fafb;border-radius:8px;margin-bottom:24px;">
      <p style="margin:0 0 8px;font-size:13px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;">Pedido</p>
      <p style="margin:0 0 16px;font-size:18px;font-weight:700;color:#111827;">${escapeHtml(data.reference)}</p>
      <p style="margin:0 0 4px;font-size:13px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;">Nuevo estado</p>
      <span style="display:inline-block;background-color:${escapeHtml(data.stateColor)};color:#ffffff;padding:8px 20px;border-radius:20px;font-size:15px;font-weight:600;">
        ${escapeHtml(data.newStateName)}
      </span>
    </div>

    ${commentBlock}

    <div style="text-align:center;margin-top:32px;">
      <a href="${data.orderUrl}" style="display:inline-block;background-color:#1a56db;color:#ffffff;padding:14px 32px;border-radius:6px;font-size:15px;font-weight:600;text-decoration:none;">Ver mi pedido</a>
    </div>
  `;

  return baseTemplate(content, data.shopName);
}
