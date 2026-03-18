import { describe, it, expect } from 'vitest';

// Import templates directly — no side effects, no DB
import { orderShippedTemplate } from './templates/order-shipped.template.js';
import { orderDeliveredTemplate } from './templates/order-delivered.template.js';
import { orderCancelledTemplate } from './templates/order-cancelled.template.js';
import { orderStatusTemplate } from './templates/order-status.template.js';

// Minimal data factories
const baseData = {
  reference: 'TEST1234',
  customerName: 'Ana García',
  stateColor: '#1a56db',
  orderUrl: 'http://localhost:4200/account/orders/1',
  shopName: 'DMShop Test',
};

describe('Email templates', () => {
  // ── order-shipped ──────────────────────────────────────────────────────
  describe('orderShippedTemplate', () => {
    it('genera HTML con el número de seguimiento', () => {
      const html = orderShippedTemplate({
        ...baseData,
        trackingNumber: 'ES123456789ES',
        trackingUrl: 'https://tracking.correos.es/?id=ES123456789ES',
      });

      expect(html).toContain('ES123456789ES');
      expect(html).toContain('Seguir mi paquete');
      expect(html).toContain('está en camino');
    });

    it('genera HTML sin tracking si no se proporciona', () => {
      const html = orderShippedTemplate({ ...baseData });
      // Should not contain tracking block content
      expect(html).not.toContain('Seguir mi paquete');
      expect(html).toContain('está en camino');
    });

    it('incluye el nombre del cliente', () => {
      const html = orderShippedTemplate({ ...baseData, trackingNumber: 'ABC' });
      expect(html).toContain('Ana García');
    });

    it('escapa HTML en el nombre del cliente', () => {
      const html = orderShippedTemplate({
        ...baseData,
        customerName: '<script>alert("xss")</script>',
      });
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });
  });

  // ── order-delivered ────────────────────────────────────────────────────
  describe('orderDeliveredTemplate', () => {
    it('genera HTML con mensaje de entregado', () => {
      const html = orderDeliveredTemplate({ ...baseData });
      expect(html).toContain('ha sido entregado');
      expect(html).toContain('TEST1234');
      expect(html).toContain('Ana García');
    });

    it('incluye comentario si se proporciona', () => {
      const html = orderDeliveredTemplate({ ...baseData, comment: 'Entregado en buzón' });
      expect(html).toContain('Entregado en buzón');
    });

    it('no incluye bloque de comentario si es null', () => {
      const html = orderDeliveredTemplate({ ...baseData, comment: null });
      // The commentBlock is only rendered when comment is truthy
      expect(html).not.toContain('font-style:italic');
    });
  });

  // ── order-cancelled ────────────────────────────────────────────────────
  describe('orderCancelledTemplate', () => {
    it('genera HTML con motivo de cancelación', () => {
      const html = orderCancelledTemplate({
        ...baseData,
        comment: 'Producto no disponible',
      });
      expect(html).toContain('cancelado');
      expect(html).toContain('Producto no disponible');
      expect(html).toContain('Motivo');
    });

    it('genera HTML sin motivo si comment es null', () => {
      const html = orderCancelledTemplate({ ...baseData, comment: null });
      expect(html).toContain('cancelado');
      expect(html).not.toContain('Motivo');
    });

    it('escapa HTML en el motivo de cancelación', () => {
      const html = orderCancelledTemplate({ ...baseData, comment: '<b>bold</b>' });
      expect(html).not.toContain('<b>');
      expect(html).toContain('&lt;b&gt;');
    });
  });

  // ── mailService template selection logic ───────────────────────────────
  describe('Selección de template según state.template', () => {
    /**
     * Reproduces the switch logic from mail.service.ts inline so we can unit-test
     * it without mocking SMTP or the database.
     */
    function selectTemplate(stateTemplate: string | null, data: {
      reference: string;
      customerName: string;
      stateColor: string;
      orderUrl: string;
      shopName: string;
      stateName: string;
      trackingNumber?: string | null;
      trackingUrl?: string;
      comment?: string;
    }): string {
      switch (stateTemplate) {
        case 'shipped':
          return orderShippedTemplate({
            reference: data.reference,
            customerName: data.customerName,
            stateColor: data.stateColor,
            trackingNumber: data.trackingNumber,
            trackingUrl: data.trackingUrl,
            orderUrl: data.orderUrl,
            shopName: data.shopName,
            comment: data.comment,
          });
        case 'delivered':
          return orderDeliveredTemplate({
            reference: data.reference,
            customerName: data.customerName,
            stateColor: data.stateColor,
            orderUrl: data.orderUrl,
            shopName: data.shopName,
            comment: data.comment,
          });
        case 'cancelled':
          return orderCancelledTemplate({
            reference: data.reference,
            customerName: data.customerName,
            stateColor: data.stateColor,
            orderUrl: data.orderUrl,
            shopName: data.shopName,
            comment: data.comment,
          });
        default:
          return orderStatusTemplate({
            reference: data.reference,
            customerName: data.customerName,
            newStateName: data.stateName,
            stateColor: data.stateColor,
            comment: data.comment ?? null,
            orderUrl: data.orderUrl,
            shopName: data.shopName,
          });
      }
    }

    const testData = {
      ...baseData,
      stateName: 'Procesando',
    };

    it('template genérico se usa cuando state.template es null', () => {
      const html = selectTemplate(null, testData);
      expect(html).toContain('Actualización de tu pedido');
      expect(html).toContain('Procesando');
    });

    it('template genérico se usa cuando state.template es desconocido', () => {
      const html = selectTemplate('unknown_state_xyz', testData);
      expect(html).toContain('Actualización de tu pedido');
    });

    it('template shipped se selecciona cuando state.template = "shipped"', () => {
      const html = selectTemplate('shipped', { ...testData, trackingNumber: 'TR123' });
      expect(html).toContain('está en camino');
      expect(html).not.toContain('Actualización de tu pedido');
    });

    it('template delivered se selecciona cuando state.template = "delivered"', () => {
      const html = selectTemplate('delivered', testData);
      expect(html).toContain('ha sido entregado');
      expect(html).not.toContain('Actualización de tu pedido');
    });

    it('template cancelled se selecciona cuando state.template = "cancelled"', () => {
      const html = selectTemplate('cancelled', testData);
      expect(html).toContain('cancelado');
      expect(html).not.toContain('Actualización de tu pedido');
    });
  });
});
