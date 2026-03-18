import { baseTemplate } from './base.template.js';

interface WelcomeData {
  firstName: string;
  shopName: string;
  shopUrl: string;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function welcomeTemplate(data: WelcomeData): string {
  const content = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">¡Bienvenido/a a ${escapeHtml(data.shopName)}!</h2>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;">
      Hola <strong>${escapeHtml(data.firstName)}</strong>, nos alegra que te hayas unido a nosotros.
      Tu cuenta ha sido creada con éxito y ya puedes empezar a explorar nuestra tienda.
    </p>

    <div style="background-color:#f0f7ff;border-radius:8px;padding:24px;margin-bottom:24px;">
      <h3 style="margin:0 0 12px;font-size:16px;font-weight:600;color:#1a56db;">¿Qué puedes hacer ahora?</h3>
      <ul style="margin:0;padding-left:20px;font-size:14px;color:#374151;line-height:2;">
        <li>Explorar nuestro catálogo de productos</li>
        <li>Añadir productos a tu cesta de la compra</li>
        <li>Gestionar tus direcciones de envío</li>
        <li>Consultar el historial de tus pedidos</li>
      </ul>
    </div>

    <div style="text-align:center;margin-top:32px;">
      <a href="${data.shopUrl}" style="display:inline-block;background-color:#1a56db;color:#ffffff;padding:14px 32px;border-radius:6px;font-size:15px;font-weight:600;text-decoration:none;">Ir a la tienda</a>
    </div>

    <p style="margin:32px 0 0;font-size:13px;color:#9ca3af;text-align:center;">
      Si no has creado esta cuenta, puedes ignorar este email con total tranquilidad.
    </p>
  `;

  return baseTemplate(content, data.shopName);
}
