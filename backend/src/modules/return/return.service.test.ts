import { vi, describe, it, expect, beforeEach } from 'vitest';

// ── Mock models & dependencies ─────────────────────────────────────────────
vi.mock('../../models/order-return.model.js', () => ({
  OrderReturn: {
    findOne: vi.fn(),
    findByPk: vi.fn(),
    findAll: vi.fn(),
    findAndCountAll: vi.fn(),
    create: vi.fn(),
  },
  OrderReturnState: {},
}));
vi.mock('../../models/order-return-item.model.js', () => ({
  OrderReturnItem: {
    create: vi.fn(),
  },
}));
vi.mock('../../models/order.model.js', () => ({
  Order: {
    findOne: vi.fn(),
    findAndCountAll: vi.fn(),
  },
}));
vi.mock('../../models/order-item.model.js', () => ({ OrderItem: { findAll: vi.fn() } }));
vi.mock('../../models/user.model.js', () => ({ User: {} }));
vi.mock('../../models/order-state.model.js', () => ({ OrderState: {} }));
vi.mock('../../utils/app-error.js', () => ({
  AppError: {
    notFound: vi.fn((msg: string, code?: string) => Object.assign(new Error(msg), { statusCode: 404, code })),
    badRequest: vi.fn((msg: string, code?: string) => Object.assign(new Error(msg), { statusCode: 400, code })),
  },
}));

import { Order } from '../../models/order.model.js';
import { OrderReturn } from '../../models/order-return.model.js';
import { OrderReturnItem } from '../../models/order-return-item.model.js';
import { OrderItem } from '../../models/order-item.model.js';
import { returnService } from './service.js';

// ── Helpers ────────────────────────────────────────────────────────────────

function makeOrderReturn(overrides: object = {}) {
  return {
    id: 1,
    id_order: 10,
    id_user: 1,
    state: 'waiting',
    reason: 'Producto defectuoso',
    customer_note: null,
    admin_note: null,
    update: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

const validInput = {
  reason: 'Producto defectuoso',
  customer_note: 'Llegó roto',
  items: [{ id_order_item: 5, quantity: 1 }],
};

// ── createReturn ───────────────────────────────────────────────────────────

describe('returnService.createReturn', () => {
  beforeEach(() => vi.clearAllMocks());

  it('pedido no encontrado → lanza 404', async () => {
    vi.mocked(Order.findOne).mockResolvedValue(null);

    await expect(returnService.createReturn(999, 1, validInput)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('pedido no en estado enviado/entregado → lanza 400', async () => {
    vi.mocked(Order.findOne).mockResolvedValue({
      id: 10,
      orderState: { shipped: false, delivery: false, name: 'En preparación' },
    } as any);

    await expect(returnService.createReturn(10, 1, validInput)).rejects.toMatchObject({ statusCode: 400 });
  });

  it('ya existe una devolución activa → lanza 400', async () => {
    vi.mocked(Order.findOne).mockResolvedValue({
      id: 10,
      orderState: { shipped: true, delivery: false, name: 'Enviado' },
    } as any);
    vi.mocked(OrderReturn.findOne).mockResolvedValue({ id: 99 } as any); // existing return

    await expect(returnService.createReturn(10, 1, validInput)).rejects.toMatchObject({ statusCode: 400 });
  });

  it('pedido enviado sin devolución previa → crea OrderReturn con estado waiting', async () => {
    vi.mocked(Order.findOne).mockResolvedValue({
      id: 10,
      orderState: { shipped: true, delivery: false, name: 'Enviado' },
    } as any);
    vi.mocked(OrderReturn.findOne).mockResolvedValue(null);
    vi.mocked(OrderItem.findAll).mockResolvedValue([{ id: 5, id_order: 10 }] as any);
    const createdReturn = makeOrderReturn();
    vi.mocked(OrderReturn.create).mockResolvedValue(createdReturn as any);
    vi.mocked(OrderReturnItem.create).mockResolvedValue({} as any);

    const result = await returnService.createReturn(10, 1, validInput);

    expect(OrderReturn.create).toHaveBeenCalledWith(
      expect.objectContaining({ id_order: 10, id_user: 1, state: 'waiting', reason: 'Producto defectuoso' }),
    );
    expect(result.state).toBe('waiting');
  });

  it('pedido entregado → también permite devolución', async () => {
    vi.mocked(Order.findOne).mockResolvedValue({
      id: 10,
      orderState: { shipped: false, delivery: true, name: 'Entregado' },
    } as any);
    vi.mocked(OrderReturn.findOne).mockResolvedValue(null);
    vi.mocked(OrderItem.findAll).mockResolvedValue([{ id: 5, id_order: 10 }] as any);
    vi.mocked(OrderReturn.create).mockResolvedValue(makeOrderReturn() as any);
    vi.mocked(OrderReturnItem.create).mockResolvedValue({} as any);

    await expect(returnService.createReturn(10, 1, validInput)).resolves.toBeDefined();
  });

  it('crea los OrderReturnItems para cada artículo', async () => {
    vi.mocked(Order.findOne).mockResolvedValue({
      id: 10,
      orderState: { shipped: true, delivery: false, name: 'Enviado' },
    } as any);
    vi.mocked(OrderReturn.findOne).mockResolvedValue(null);
    vi.mocked(OrderItem.findAll).mockResolvedValue([{ id: 5 }, { id: 6 }] as any);
    const createdReturn = makeOrderReturn();
    vi.mocked(OrderReturn.create).mockResolvedValue(createdReturn as any);
    vi.mocked(OrderReturnItem.create).mockResolvedValue({} as any);

    const multiItemInput = {
      reason: 'Devolución múltiple',
      items: [
        { id_order_item: 5, quantity: 1 },
        { id_order_item: 6, quantity: 2 },
      ],
    };

    await returnService.createReturn(10, 1, multiItemInput);

    expect(OrderReturnItem.create).toHaveBeenCalledTimes(2);
  });
});

// ── updateState ────────────────────────────────────────────────────────────

describe('returnService.updateState', () => {
  beforeEach(() => vi.clearAllMocks());

  it('devolución no encontrada → lanza 404', async () => {
    vi.mocked(OrderReturn.findByPk).mockResolvedValue(null);

    await expect(returnService.updateState(999, { state: 'confirmed' })).rejects.toMatchObject({ statusCode: 404 });
  });

  it('actualiza el estado correctamente', async () => {
    const ret = makeOrderReturn({ state: 'waiting' });
    vi.mocked(OrderReturn.findByPk).mockResolvedValue(ret as any);

    await returnService.updateState(1, { state: 'confirmed' });

    expect(ret.update).toHaveBeenCalledWith(expect.objectContaining({ state: 'confirmed' }));
  });

  it('actualiza admin_note si se proporciona', async () => {
    const ret = makeOrderReturn();
    vi.mocked(OrderReturn.findByPk).mockResolvedValue(ret as any);

    await returnService.updateState(1, { admin_note: 'Recibido en almacén' });

    expect(ret.update).toHaveBeenCalledWith(expect.objectContaining({ admin_note: 'Recibido en almacén' }));
  });
});
