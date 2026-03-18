import PDFDocument from 'pdfkit';
import { Order } from '../../models/order.model.js';
import { OrderItem } from '../../models/order-item.model.js';
import { User } from '../../models/user.model.js';
import { Address } from '../../models/address.model.js';
import { Country } from '../../models/country.model.js';
import { AppError } from '../../utils/app-error.js';
import { ErrorCode } from '@dmshop/shared';
import { configurationService } from '../configuration/service.js';

async function getShopConfig(): Promise<{ name: string; address: string; taxId: string; email: string }> {
  try {
    const configs = await configurationService.getByPrefix('SHOP_');
    const map = new Map<string, string>(configs.map((c) => [c.key, c.value]));
    return {
      name: map.get('SHOP_NAME') || 'DMShop',
      address: map.get('SHOP_ADDRESS') || '',
      taxId: map.get('SHOP_TAX_ID') || '',
      email: map.get('SHOP_EMAIL') || '',
    };
  } catch {
    return { name: 'DMShop', address: '', taxId: '', email: '' };
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
}

function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(date));
}

export const invoiceService = {
  async generateInvoicePDF(orderId: number): Promise<Buffer> {
    const order = await Order.findOne({
      where: { id: orderId },
      include: [
        { model: OrderItem, as: 'items' },
        { model: User, as: 'user', attributes: ['first_name', 'last_name', 'email'] },
        {
          model: Address, as: 'invoiceAddress',
          include: [{ model: Country, as: 'country' }],
        },
        {
          model: Address, as: 'deliveryAddress',
          include: [{ model: Country, as: 'country' }],
        },
      ],
    });

    if (!order) {
      throw AppError.notFound('Pedido no encontrado', ErrorCode.ORDER_NOT_FOUND);
    }

    const shopConfig = await getShopConfig();

    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // ─── Colors & Helpers ─────────────────────────────────────────────
      const primaryColor = '#1a56db';
      const grayColor = '#6b7280';
      const lightGray = '#f3f4f6';
      const borderColor = '#e5e7eb';

      const pageWidth = doc.page.width - 100; // 50 margin each side

      // ─── Header ───────────────────────────────────────────────────────
      doc.rect(50, 40, pageWidth, 80).fill(primaryColor);

      doc.fontSize(24).fillColor('#ffffff').font('Helvetica-Bold')
        .text(shopConfig.name, 60, 55);

      if (shopConfig.address) {
        doc.fontSize(9).fillColor('rgba(255,255,255,0.8)').font('Helvetica')
          .text(shopConfig.address, 60, 85);
      }
      if (shopConfig.email) {
        doc.fontSize(9).fillColor('rgba(255,255,255,0.8)')
          .text(shopConfig.email, 60, 100);
      }

      // Invoice title on the right
      doc.fontSize(18).fillColor('#ffffff').font('Helvetica-Bold')
        .text('FACTURA', 0, 55, { align: 'right' });
      doc.fontSize(11).fillColor('rgba(255,255,255,0.9)').font('Helvetica')
        .text(`Nº: ${order.reference}`, 0, 80, { align: 'right' });
      doc.fontSize(10).fillColor('rgba(255,255,255,0.7)')
        .text(`Fecha: ${formatDate(order.created_at)}`, 0, 97, { align: 'right' });

      // ─── Customer Info & Invoice Details ──────────────────────────────
      const infoY = 145;
      doc.fillColor('#000000');

      // Left: Customer
      doc.fontSize(10).font('Helvetica-Bold').fillColor(grayColor)
        .text('CLIENTE', 50, infoY);
      doc.moveTo(50, infoY + 14).lineTo(210, infoY + 14).stroke(borderColor);

      const customerName = order.user
        ? `${order.user.first_name} ${order.user.last_name}`
        : 'Cliente';
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#111827')
        .text(customerName, 50, infoY + 20);
      if (order.user?.email) {
        doc.fontSize(9).font('Helvetica').fillColor(grayColor)
          .text(order.user.email, 50, infoY + 35);
      }

      // Invoice address
      const addr = order.invoiceAddress ?? order.deliveryAddress;
      if (addr) {
        let addrY = infoY + 50;
        doc.fontSize(9).font('Helvetica').fillColor('#374151');
        doc.text(`${addr.address1}`, 50, addrY); addrY += 14;
        if (addr.address2) { doc.text(addr.address2, 50, addrY); addrY += 14; }
        doc.text(`${addr.postcode} ${addr.city}`, 50, addrY); addrY += 14;
        if ((addr as any).country?.name) {
          doc.text((addr as any).country.name, 50, addrY);
        }
      }

      // Right: Invoice details box
      doc.roundedRect(350, infoY, 200, 80, 4).fill(lightGray);
      doc.fontSize(9).font('Helvetica-Bold').fillColor(grayColor)
        .text('DETALLES DE FACTURA', 360, infoY + 8);

      doc.fontSize(9).font('Helvetica').fillColor('#374151')
        .text('Número:', 360, infoY + 26)
        .text(order.reference, 430, infoY + 26);
      doc.text('Fecha:', 360, infoY + 40)
        .text(formatDate(order.created_at), 430, infoY + 40);
      doc.text('Pago:', 360, infoY + 54)
        .text(order.payment_method ?? '-', 430, infoY + 54);

      if (shopConfig.taxId) {
        doc.text('CIF/NIF:', 360, infoY + 68)
          .text(shopConfig.taxId, 430, infoY + 68);
      }

      // ─── Items Table ──────────────────────────────────────────────────
      const tableY = infoY + 115;
      const colWidths = { product: 230, ref: 70, qty: 40, price: 70, tax: 45, total: 80 };
      const colX = {
        product: 50,
        ref: 50 + colWidths.product,
        qty: 50 + colWidths.product + colWidths.ref,
        price: 50 + colWidths.product + colWidths.ref + colWidths.qty,
        tax: 50 + colWidths.product + colWidths.ref + colWidths.qty + colWidths.price,
        total: 50 + colWidths.product + colWidths.ref + colWidths.qty + colWidths.price + colWidths.tax,
      };

      // Table header
      doc.rect(50, tableY, pageWidth, 22).fill(primaryColor);
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#ffffff');
      doc.text('PRODUCTO', colX.product + 4, tableY + 7);
      doc.text('REF.', colX.ref + 4, tableY + 7);
      doc.text('CANT.', colX.qty + 4, tableY + 7);
      doc.text('PRECIO', colX.price + 4, tableY + 7);
      doc.text('IVA%', colX.tax + 4, tableY + 7);
      doc.text('TOTAL', colX.total + 4, tableY + 7);

      // Table rows
      const items = order.items || [];
      let rowY = tableY + 22;

      items.forEach((item: OrderItem, idx: number) => {
        const rowHeight = 24;
        if (idx % 2 === 1) {
          doc.rect(50, rowY, pageWidth, rowHeight).fill('#f9fafb');
        }

        doc.fontSize(9).font('Helvetica').fillColor('#111827');
        const truncatedName = item.product_name.length > 38
          ? item.product_name.substring(0, 35) + '...'
          : item.product_name;

        doc.text(truncatedName, colX.product + 4, rowY + 7, { width: colWidths.product - 8 });
        doc.text(item.product_reference ?? '-', colX.ref + 4, rowY + 7, { width: colWidths.ref - 4 });
        doc.text(String(item.quantity), colX.qty + 4, rowY + 7, { align: 'center', width: colWidths.qty - 8 });
        doc.text(formatCurrency(Number(item.product_price_tax)), colX.price + 4, rowY + 7, { align: 'right', width: colWidths.price - 8 });
        doc.text(`${Number(item.tax_rate).toFixed(0)}%`, colX.tax + 4, rowY + 7, { align: 'center', width: colWidths.tax - 8 });
        doc.font('Helvetica-Bold').text(formatCurrency(Number(item.total_price)), colX.total + 4, rowY + 7, { align: 'right', width: colWidths.total - 8 });

        doc.moveTo(50, rowY + rowHeight).lineTo(550, rowY + rowHeight).stroke(borderColor);
        rowY += rowHeight;
      });

      // ─── Totals ───────────────────────────────────────────────────────
      const totalsX = 380;
      const totalsWidth = 170;
      let totalsY = rowY + 16;

      const totalShipping = Number(order.total_shipping_tax);
      const totalDiscounts = Number(order.total_discounts_tax);
      const totalPaid = Number(order.total_paid);

      // Calculate tax breakdown from items
      const taxBreakdown = new Map<number, number>();
      for (const item of items) {
        const rate = Math.round(Number(item.tax_rate));
        const taxAmount = Number(item.total_price) - (Number(item.product_price) * item.quantity);
        taxBreakdown.set(rate, (taxBreakdown.get(rate) ?? 0) + taxAmount);
      }

      doc.fontSize(9).font('Helvetica').fillColor('#374151');

      // Subtotal
      doc.text('Subtotal (sin IVA):', totalsX, totalsY, { width: 110 });
      doc.text(formatCurrency(Number(order.total_products)), totalsX + 110, totalsY, { align: 'right', width: totalsWidth - 110 });
      totalsY += 16;

      // Shipping
      doc.text('Envío:', totalsX, totalsY, { width: 110 });
      doc.text(formatCurrency(totalShipping), totalsX + 110, totalsY, { align: 'right', width: totalsWidth - 110 });
      totalsY += 16;

      // Tax breakdown
      taxBreakdown.forEach((amount, rate) => {
        doc.text(`IVA ${rate}%:`, totalsX, totalsY, { width: 110 });
        doc.text(formatCurrency(amount), totalsX + 110, totalsY, { align: 'right', width: totalsWidth - 110 });
        totalsY += 16;
      });

      // Discounts
      if (totalDiscounts > 0) {
        doc.fillColor('#10b981');
        doc.text('Descuentos:', totalsX, totalsY, { width: 110 });
        doc.text(`-${formatCurrency(totalDiscounts)}`, totalsX + 110, totalsY, { align: 'right', width: totalsWidth - 110 });
        totalsY += 16;
        doc.fillColor('#374151');
      }

      // Divider
      doc.moveTo(totalsX, totalsY).lineTo(550, totalsY).stroke(borderColor);
      totalsY += 8;

      // Grand total
      doc.rect(totalsX - 4, totalsY, totalsWidth + 4, 28).fill(primaryColor);
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#ffffff');
      doc.text('TOTAL:', totalsX + 2, totalsY + 8, { width: 110 });
      doc.text(formatCurrency(totalPaid), totalsX + 110, totalsY + 8, { align: 'right', width: totalsWidth - 114 });

      // ─── Footer ───────────────────────────────────────────────────────
      const footerY = doc.page.height - 80;
      doc.moveTo(50, footerY).lineTo(550, footerY).stroke(borderColor);

      doc.fontSize(8).font('Helvetica').fillColor(grayColor);
      doc.text(
        'Gracias por su compra. Esta factura es el documento justificante de su pedido.',
        50, footerY + 10, { align: 'center', width: pageWidth }
      );
      if (shopConfig.taxId) {
        doc.text(`${shopConfig.name} — CIF/NIF: ${shopConfig.taxId}`, 50, footerY + 26, { align: 'center', width: pageWidth });
      }

      doc.end();
    });
  },
};
