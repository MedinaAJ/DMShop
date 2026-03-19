import { vi, describe, it, expect, beforeEach } from 'vitest';

// ── Mock models & dependencies ─────────────────────────────────────────────
vi.mock('../../models/order.model.js', () => ({ Order: { findByPk: vi.fn(), findOne: vi.fn(), create: vi.fn(), findAndCountAll: vi.fn() } }));
vi.mock('../../models/order-item.model.js', () => ({ OrderItem: { create: vi.fn(), findAll: vi.fn() } }));
vi.mock('../../models/order-history.model.js', () => ({ OrderHistory: { create: vi.fn() } }));
vi.mock('../../models/order-payment.model.js', () => ({ OrderPayment: { create: vi.fn(), sum: vi.fn() } }));
vi.mock('../../models/order-carrier.model.js', () => ({ OrderCarrier: { create: vi.fn(), findOne: vi.fn() } }));
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
import { OrderState } from '../../models/order-state.model.js';
import { OrderHistory } from '../../models/order-history.model.js';
import { Cart } from '../../models/cart.model.js';
import { Address } from '../../models/address.model.js';
import { mailService } from '../mail/mail.service.js';
import { sequelize } from '../../config/database.js';
import { orderService } from './service.js';

// ── Helpers ────────────────────────────────────────────────────────────────

function makeOrder(overrides: object = {}) {
  return {
    id: 1,
    reference: 'ABCD1234',
    id_user: 1,
    id_order_state: 1,
    total_paid: 100,
    update: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

// ── checkout ───────────────────────────────────────────────────────────────

describe('orderService.checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(sequelize.transaction).mockImplementation(async (cb: Function) => cb({}) as any);
  });

  it('carrito vacío → lanza CART_EMPTY', async () => {
    vi.mocked(Cart.findOne).mockResolvedValue(null);

    await expect(
      orderService.checkout(1, { idAddressDelivery: 1, idCarrier: 1, paymentMethod: 'card' }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('carrito con items=[] → lanza CART_EMPTY', async () => {
    vi.mocked(Cart.findOne).mockResolvedValue({ id: 1, items: [] } as any);

    await expect(
      orderService.checkout(1, { idAddressDelivery: 1, idCarrier: 1, paymentMethod: 'card' }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('dirección que no pertenece al usuario → lanza 404', async () => {
    const cartItem = {
      id: 1,
      id_product: 1,
      id_combination: null,
      quantity: 1,
      product: { id: 1, price: 10, translations: [{ name: 'Test' }] },
    };
    vi.mocked(Cart.findOne).mockResolvedValue({ id: 1, items: [cartItem] } as any);
    vi.mocked(Address.findOne).mockResolvedValue(null); // address not found

    await expect(
      orderService.checkout(1, { idAddressDelivery: 999, idCarrier: 1, paymentMethod: 'card' }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

// ── updateState ────────────────────────────────────────────────────────────

describe('orderService.updateState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock getById (used internally after update)
    vi.spyOn(orderService, 'getById').mockResolvedValue({ id: 1 } as any);
  });

  it('pedido no encontrado → lanza 404', async () => {
    vi.mocked(Order.findByPk).mockResolvedValue(null);

    await expect(
      orderService.updateState(999, { idOrderState: 2 }, 1),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('estado inválido → lanza 400', async () => {
    vi.mocked(Order.findByPk).mockResolvedValue(makeOrder() as any);
    vi.mocked(OrderState.findByPk).mockResolvedValue(null);

    await expect(
      orderService.updateState(1, { idOrderState: 999 }, 1),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('estado válido → actualiza id_order_state y crea historial', async () => {
    const order = makeOrder({ id_order_state: 1 });
    vi.mocked(Order.findByPk).mockResolvedValue(order as any);
    vi.mocked(OrderState.findByPk).mockResolvedValue({ id: 2, name: 'Preparando', send_email: false, color: '#00f' } as any);
    vi.mocked(OrderHistory.create).mockResolvedValue({} as any);

    await orderService.updateState(1, { idOrderState: 2, comment: 'Cambio de estado' }, 1);

    expect(order.update).toHaveBeenCalledWith({ id_order_state: 2 });
    expect(OrderHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({ id_order: 1, id_order_state: 2, id_user: 1 }),
    );
  });

  it('estado con send_email=true → llama a mailService.sendOrderStatusChange', async () => {
    const order = makeOrder({ id_order_state: 1 });
    vi.mocked(Order.findByPk).mockResolvedValue(order as any);
    vi.mocked(OrderState.findByPk).mockResolvedValue({
      id: 3,
      name: 'Enviado',
      send_email: true,
      color: '#0f0',
    } as any);
    vi.mocked(OrderHistory.create).mockResolvedValue({} as any);

    await orderService.updateState(1, { idOrderState: 3 }, 1);

    // sendOrderStatusChange is called asynchronously (fire-and-forget), give it a tick
    await new Promise((r) => setTimeout(r, 10));
    expect(mailService.sendOrderStatusChange).toHaveBeenCalled();
  });

  it('estado con send_email=false → NO llama a mailService', async () => {
    const order = makeOrder({ id_order_state: 1 });
    vi.mocked(Order.findByPk).mockResolvedValue(order as any);
    vi.mocked(OrderState.findByPk).mockResolvedValue({
      id: 4,
      name: 'Procesando',
      send_email: false,
      color: '#ff0',
    } as any);
    vi.mocked(OrderHistory.create).mockResolvedValue({} as any);

    await orderService.updateState(1, { idOrderState: 4 }, 1);

    await new Promise((r) => setTimeout(r, 10));
    expect(mailService.sendOrderStatusChange).not.toHaveBeenCalled();
  });
});
