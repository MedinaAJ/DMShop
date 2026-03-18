import { vi, describe, it, expect, beforeEach } from 'vitest';

// ── Mock models ────────────────────────────────────────────────────────────
vi.mock('../../models/order.model.js', () => ({
  Order: { findByPk: vi.fn(), findOne: vi.fn(), create: vi.fn(), findAndCountAll: vi.fn() },
}));
vi.mock('../../models/order-item.model.js', () => ({ OrderItem: { create: vi.fn(), findAll: vi.fn() } }));
vi.mock('../../models/order-history.model.js', () => ({ OrderHistory: { create: vi.fn() } }));
vi.mock('../../models/order-payment.model.js', () => ({ OrderPayment: { create: vi.fn(), sum: vi.fn() } }));
vi.mock('../../models/order-carrier.model.js', () => ({
  OrderCarrier: { create: vi.fn(), findOne: vi.fn() },
}));
vi.mock('../../models/order-state.model.js', () => ({ OrderState: { findByPk: vi.fn(), findAll: vi.fn() } }));
vi.mock('../../models/cart.model.js', () => ({ Cart: { findOne: vi.fn() } }));
vi.mock('../../models/cart-item.model.js', () => ({ CartItem: { destroy: vi.fn() } }));
vi.mock('../../models/product.model.js', () => ({ Product: { findByPk: vi.fn() } }));
vi.mock('../../models/product-lang.model.js', () => ({ ProductLang: {} }));
vi.mock('../../models/product-combination.model.js', () => ({ ProductCombination: { findByPk: vi.fn() } }));
vi.mock('../../models/user.model.js', () => ({ User: { findByPk: vi.fn() } }));
vi.mock('../../models/address.model.js', () => ({ Address: { findOne: vi.fn(), findByPk: vi.fn() } }));
vi.mock('../../models/carrier.model.js', () => ({ Carrier: { findByPk: vi.fn() } }));
vi.mock('../../models/currency.model.js', () => ({ Currency: {} }));
vi.mock('../../models/lang.model.js', () => ({ Lang: {} }));
vi.mock('../../models/country.model.js', () => ({ Country: {} }));
vi.mock('../../models/state.model.js', () => ({ State: {} }));
vi.mock('../cart/cart-calculator.service.js', () => ({
  cartCalculator: { calculate: vi.fn() },
}));
vi.mock('../stock/stock.service.js', () => ({
  stockService: { move: vi.fn().mockResolvedValue(undefined) },
}));
vi.mock('../mail/mail.service.js', () => ({
  mailService: {
    sendOrderConfirmation: vi.fn().mockResolvedValue(undefined),
    sendOrderStatusChange: vi.fn().mockResolvedValue(undefined),
    sendTrackingUpdate: vi.fn().mockResolvedValue(undefined),
  },
}));
vi.mock('../../hooks/event-bus.js', () => ({
  eventBus: { emitAsync: vi.fn().mockResolvedValue(undefined) },
}));
vi.mock('../../utils/app-error.js', () => ({
  AppError: {
    notFound: vi.fn((msg: string, code?: string) => Object.assign(new Error(msg), { statusCode: 404, code })),
    badRequest: vi.fn((msg: string, code?: string) => Object.assign(new Error(msg), { statusCode: 400, code })),
    conflict: vi.fn((msg: string, code?: string) => Object.assign(new Error(msg), { statusCode: 409, code })),
    unauthorized: vi.fn((msg: string, code?: string) => Object.assign(new Error(msg), { statusCode: 401, code })),
    forbidden: vi.fn((msg: string) => Object.assign(new Error(msg), { statusCode: 403 })),
  },
}));

import { Order } from '../../models/order.model.js';
import { OrderCarrier } from '../../models/order-carrier.model.js';
import { mailService } from '../mail/mail.service.js';
import { orderService } from './service.js';

// ── Helpers ────────────────────────────────────────────────────────────────

function makeOrder(overrides: object = {}) {
  return {
    id: 1,
    reference: 'TEST1234',
    id_user: 1,
    id_order_state: 1,
    id_carrier: 1,
    total_paid: 50,
    carrier: null,
    update: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function makeOrderCarrier(overrides: object = {}) {
  return {
    id: 1,
    id_order: 1,
    id_carrier: 1,
    tracking_number: null,
    weight: 0,
    shipping_cost: 5,
    shipping_cost_tax: 6,
    carrier: null,
    update: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

// ── buildTrackingUrl (pure utility — tested independently) ─────────────────

describe('Tracking URL construction', () => {
  function buildTrackingUrl(carrierUrl: string | null | undefined, trackingNumber: string): string | null {
    if (!trackingNumber) return null;
    if (!carrierUrl || !carrierUrl.includes('@')) return null;
    return carrierUrl.replace('@', encodeURIComponent(trackingNumber));
  }

  it('construye URL de tracking sustituyendo @ por el número', () => {
    const url = buildTrackingUrl('https://tracking.example.com/?n=@', 'ABC123');
    expect(url).toBe('https://tracking.example.com/?n=ABC123');
  });

  it('codifica caracteres especiales en el número de seguimiento', () => {
    const url = buildTrackingUrl('https://tracking.example.com/?n=@', 'AB C/123');
    expect(url).toBe('https://tracking.example.com/?n=AB%20C%2F123');
  });

  it('retorna null si el transportista no tiene URL', () => {
    const url = buildTrackingUrl(null, 'ABC123');
    expect(url).toBeNull();
  });

  it('retorna null si la URL no contiene @', () => {
    const url = buildTrackingUrl('https://tracking.example.com/', 'ABC123');
    expect(url).toBeNull();
  });
});

// ── orderService.updateTracking ────────────────────────────────────────────

describe('orderService.updateTracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(orderService, 'getById').mockResolvedValue({
      id: 1,
      reference: 'TEST1234',
      customerEmail: 'test@example.com',
      customerName: 'Test User',
      carrier: { id: 1, carrierName: 'Correos', trackingNumber: 'ABC123' },
    } as any);
  });

  it('updateTracking actualiza tracking_number del pedido', async () => {
    const order = makeOrder({
      carrier: { id: 1, name: 'Correos', url: null },
    });
    const orderCarrier = makeOrderCarrier();

    vi.mocked(Order.findByPk).mockResolvedValue(order as any);
    vi.mocked(OrderCarrier.findOne).mockResolvedValue(orderCarrier as any);

    await orderService.updateTracking(1, { trackingNumber: 'ABC123' });

    expect(orderCarrier.update).toHaveBeenCalledWith({ tracking_number: 'ABC123' });
  });

  it('updateTracking en pedido no encontrado → lanza error 404', async () => {
    vi.mocked(Order.findByPk).mockResolvedValue(null);

    await expect(
      orderService.updateTracking(999, { trackingNumber: 'ABC123' }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('updateTracking sin OrderCarrier no lanza error', async () => {
    const order = makeOrder({ carrier: null });
    vi.mocked(Order.findByPk).mockResolvedValue(order as any);
    vi.mocked(OrderCarrier.findOne).mockResolvedValue(null);

    // Should complete without error
    const result = await orderService.updateTracking(1, { trackingNumber: 'XYZ' });
    expect(result).toBeDefined();
  });

  it('construye URL de tracking y envía email cuando carrier.url tiene @', async () => {
    const order = makeOrder({
      carrier: { id: 1, name: 'Correos', url: 'https://tracking.correos.es/?id=@' },
    });
    const orderCarrier = makeOrderCarrier({ tracking_number: null });

    vi.mocked(Order.findByPk).mockResolvedValue(order as any);
    vi.mocked(OrderCarrier.findOne).mockResolvedValue(orderCarrier as any);

    await orderService.updateTracking(1, { trackingNumber: 'ES123456789ES' });

    // Give fire-and-forget a tick
    await new Promise((r) => setTimeout(r, 20));
    expect(mailService.sendTrackingUpdate).toHaveBeenCalledWith(
      expect.anything(),
      'ES123456789ES',
      'https://tracking.correos.es/?id=ES123456789ES',
    );
  });

  it('no envía email cuando trackingNumber está vacío', async () => {
    // This case shouldn't happen due to Zod schema validation (min 1), but test defensively
    const order = makeOrder({ carrier: null });
    vi.mocked(Order.findByPk).mockResolvedValue(order as any);
    vi.mocked(OrderCarrier.findOne).mockResolvedValue(null);

    // Empty string tracking - service should not send email
    await orderService.updateTracking(1, { trackingNumber: '' });

    await new Promise((r) => setTimeout(r, 20));
    // sendTrackingUpdate is gated by `if (input.trackingNumber)` so empty string = falsy
    expect(mailService.sendTrackingUpdate).not.toHaveBeenCalled();
  });
});
