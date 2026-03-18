import { vi, describe, it, expect, beforeEach } from 'vitest';

// ── Mock models ────────────────────────────────────────────────────────────
vi.mock('../../models/cart-rule.model.js', () => ({ CartRule: { findOne: vi.fn(), findAll: vi.fn() } }));
vi.mock('../../models/cart-cart-rule.model.js', () => ({
  CartCartRule: {
    findOne: vi.fn(),
    findAll: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    destroy: vi.fn(),
  },
}));
vi.mock('../../models/specific-price.model.js', () => ({ SpecificPrice: { findAll: vi.fn() } }));
vi.mock('../../models/cart.model.js', () => ({ Cart: {} }));
vi.mock('../../models/order.model.js', () => ({ Order: { count: vi.fn() } }));
vi.mock('../../utils/app-error.js', () => ({
  AppError: {
    notFound: vi.fn((msg: string, code?: string) => Object.assign(new Error(msg), { statusCode: 404, code })),
    badRequest: vi.fn((msg: string, code?: string) => Object.assign(new Error(msg), { statusCode: 400, code })),
    conflict: vi.fn((msg: string, code?: string) => Object.assign(new Error(msg), { statusCode: 409, code })),
    unauthorized: vi.fn((msg: string, code?: string) => Object.assign(new Error(msg), { statusCode: 401, code })),
  },
}));

import { CartRule } from '../../models/cart-rule.model.js';
import { CartCartRule } from '../../models/cart-cart-rule.model.js';
import { SpecificPrice } from '../../models/specific-price.model.js';
import { discountService } from './service.js';

// ── Helpers ────────────────────────────────────────────────────────────────

function makeSpecificPrice(overrides: Partial<{
  id: number;
  id_product: number;
  id_combination: number | null;
  id_customer: number | null;
  id_customer_group: number | null;
  id_currency: number | null;
  id_country: number | null;
  from_quantity: number;
  price: number;
  reduction: number;
  reduction_type: string;
  date_from: Date | null;
  date_to: Date | null;
}> = {}) {
  return {
    id: 1,
    id_product: 1,
    id_combination: null,
    id_customer: null,
    id_customer_group: null,
    id_currency: null,
    id_country: null,
    from_quantity: 1,
    price: -1,
    reduction: 0,
    reduction_type: 'percentage',
    date_from: null,
    date_to: null,
    ...overrides,
  };
}

function makeCartRule(overrides: Partial<{
  id: number;
  name: string;
  code: string | null;
  active: boolean;
  date_from: Date | null;
  date_to: Date | null;
  quantity: number;
  quantity_per_user: number;
  id_customer: number | null;
  priority: number;
  minimum_amount: number;
  reduction_percent: number;
  reduction_amount: number;
  free_shipping: boolean;
}> = {}) {
  return {
    id: 1,
    name: 'Test Rule',
    code: 'TEST10',
    active: true,
    date_from: null,
    date_to: null,
    quantity: 0,
    quantity_per_user: 0,
    id_customer: null,
    priority: 1,
    minimum_amount: 0,
    reduction_percent: 0,
    reduction_amount: 0,
    free_shipping: false,
    ...overrides,
  };
}

// ── getSpecificPrice ───────────────────────────────────────────────────────

describe('discountService.getSpecificPrice', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sin specific prices → devuelve null', async () => {
    vi.mocked(SpecificPrice.findAll).mockResolvedValue([]);

    const result = await discountService.getSpecificPrice(1, null, null, null, null, null, 1);

    expect(result).toBeNull();
  });

  it('con specific price activo y sin restricciones → lo devuelve', async () => {
    const sp = makeSpecificPrice({ reduction: 10, reduction_type: 'percentage' });
    vi.mocked(SpecificPrice.findAll).mockResolvedValue([sp as any]);

    const result = await discountService.getSpecificPrice(1, null, null, null, null, null, 1);

    expect(result).not.toBeNull();
    expect(result?.reduction).toBe(10);
  });

  it('specific price con fecha expirada es excluido por el query (no se incluye en findAll)', async () => {
    // Simulating that DB already filtered out expired prices via the where clause
    vi.mocked(SpecificPrice.findAll).mockResolvedValue([]);

    const result = await discountService.getSpecificPrice(1, null, null, null, null, null, 1);

    expect(result).toBeNull();
  });

  it('specific price con from_quantity > cantidad solicitada → no se incluye (DB filtra)', async () => {
    // The where clause uses Op.lte on from_quantity, so DB excludes it
    vi.mocked(SpecificPrice.findAll).mockResolvedValue([]);

    const result = await discountService.getSpecificPrice(1, null, null, null, null, null, 2);

    expect(result).toBeNull();
  });

  it('specific price con id_combination diferente → se descarta (score negativo)', async () => {
    // sp has id_combination=5 but we pass combinationId=3 → gets skipped
    const sp = makeSpecificPrice({ id_combination: 5, reduction: 20, reduction_type: 'percentage' });
    vi.mocked(SpecificPrice.findAll).mockResolvedValue([sp as any]);

    const result = await discountService.getSpecificPrice(1, 3, null, null, null, null, 1);

    expect(result).toBeNull();
  });

  it('con múltiples specific prices → devuelve el de mayor score', async () => {
    // Generic sp (score 0) vs customer-specific sp (score 8)
    const genericSp = makeSpecificPrice({ id: 1, reduction: 5, reduction_type: 'percentage' });
    const customerSp = makeSpecificPrice({ id: 2, id_customer: 42, reduction: 15, reduction_type: 'percentage' });
    vi.mocked(SpecificPrice.findAll).mockResolvedValue([genericSp as any, customerSp as any]);

    const result = await discountService.getSpecificPrice(1, null, 42, null, null, null, 1);

    expect(result?.id).toBe(2); // customer-specific wins
  });
});

// ── applySpecificPrice ─────────────────────────────────────────────────────

describe('discountService.applySpecificPrice', () => {
  it('price >= 0 → usa precio fijo', () => {
    const sp = makeSpecificPrice({ price: 75 }) as any;
    const result = discountService.applySpecificPrice(100, sp);
    expect(result).toBe(75);
  });

  it('reduction_type=percentage → aplica porcentaje', () => {
    const sp = makeSpecificPrice({ price: -1, reduction: 10, reduction_type: 'percentage' }) as any;
    const result = discountService.applySpecificPrice(100, sp);
    expect(result).toBe(90);
  });

  it('reduction_type=amount → aplica importe fijo', () => {
    const sp = makeSpecificPrice({ price: -1, reduction: 15, reduction_type: 'amount' }) as any;
    const result = discountService.applySpecificPrice(100, sp);
    expect(result).toBe(85);
  });

  it('descuento mayor que precio → no retorna negativo', () => {
    const sp = makeSpecificPrice({ price: -1, reduction: 200, reduction_type: 'amount' }) as any;
    const result = discountService.applySpecificPrice(100, sp);
    expect(result).toBe(0);
  });

  it('reduction=0 → devuelve precio original', () => {
    const sp = makeSpecificPrice({ price: -1, reduction: 0, reduction_type: 'percentage' }) as any;
    const result = discountService.applySpecificPrice(100, sp);
    expect(result).toBe(100);
  });
});

// ── calculateCartDiscounts ─────────────────────────────────────────────────

describe('discountService.calculateCartDiscounts', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sin reglas aplicadas → devuelve totales en 0', async () => {
    vi.mocked(CartCartRule.findAll).mockResolvedValue([]);

    const result = await discountService.calculateCartDiscounts(1, 100, 82.64, 21);

    expect(result.totalDiscounts).toBe(0);
    expect(result.totalDiscountsTax).toBe(0);
    expect(result.freeShipping).toBe(false);
    expect(result.discounts).toHaveLength(0);
  });

  it('descuento porcentual → calcula savings correctamente', async () => {
    vi.mocked(CartCartRule.findAll).mockResolvedValue([{ id_cart_rule: 1 }] as any);
    vi.mocked(CartRule.findAll).mockResolvedValue([
      makeCartRule({ id: 1, reduction_percent: 10, reduction_amount: 0 }),
    ] as any);

    // subtotalWithTax=100, subtotalWithoutTax=82.64
    const result = await discountService.calculateCartDiscounts(1, 100, 82.64, 21);

    // 10% de 100 (with tax)
    expect(result.totalDiscountsTax).toBe(10);
    // 10% de 82.64 (without tax)
    expect(result.totalDiscounts).toBe(8.26);
    expect(result.discounts[0].type).toBe('percent');
  });

  it('descuento por importe fijo → calcula savings correctamente', async () => {
    vi.mocked(CartCartRule.findAll).mockResolvedValue([{ id_cart_rule: 2 }] as any);
    vi.mocked(CartRule.findAll).mockResolvedValue([
      makeCartRule({ id: 2, reduction_percent: 0, reduction_amount: 10 }),
    ] as any);

    const result = await discountService.calculateCartDiscounts(2, 121, 100, 21);

    expect(result.discounts[0].type).toBe('amount');
    expect(result.totalDiscounts).toBe(10); // capped at subtotalWithoutTax
  });

  it('free_shipping → freeShipping=true', async () => {
    vi.mocked(CartCartRule.findAll).mockResolvedValue([{ id_cart_rule: 3 }] as any);
    vi.mocked(CartRule.findAll).mockResolvedValue([
      makeCartRule({ id: 3, free_shipping: true, reduction_percent: 0, reduction_amount: 0 }),
    ] as any);

    const result = await discountService.calculateCartDiscounts(3, 100, 82.64, 21);

    expect(result.freeShipping).toBe(true);
  });

  it('regla con minimum_amount no cumplido → se omite', async () => {
    vi.mocked(CartCartRule.findAll).mockResolvedValue([{ id_cart_rule: 4 }] as any);
    vi.mocked(CartRule.findAll).mockResolvedValue([
      makeCartRule({ id: 4, reduction_percent: 20, minimum_amount: 200 }),
    ] as any);

    // subtotalWithTax=50 < minimum_amount=200
    const result = await discountService.calculateCartDiscounts(4, 50, 41.32, 21);

    expect(result.totalDiscountsTax).toBe(0);
    expect(result.discounts).toHaveLength(0);
  });
});

// ── applyCode ──────────────────────────────────────────────────────────────

describe('discountService.applyCode', () => {
  beforeEach(() => vi.clearAllMocks());

  it('código no encontrado → lanza error', async () => {
    vi.mocked(CartRule.findOne).mockResolvedValue(null);

    await expect(discountService.applyCode(1, 1, 'INVALID')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('código ya aplicado → lanza error', async () => {
    vi.mocked(CartRule.findOne).mockResolvedValue(
      makeCartRule({ id: 1, date_from: null, date_to: null, quantity: 0, quantity_per_user: 0, id_customer: null }) as any,
    );
    vi.mocked(CartCartRule.count).mockResolvedValue(0 as any);
    vi.mocked(CartCartRule.findOne).mockResolvedValue({ id: 1 } as any); // already exists

    await expect(discountService.applyCode(1, 1, 'TEST10')).rejects.toMatchObject({ statusCode: 400 });
  });

  it('código válido y no aplicado → crea CartCartRule', async () => {
    vi.mocked(CartRule.findOne).mockResolvedValue(
      makeCartRule({ id: 1, date_from: null, date_to: null, quantity: 0, quantity_per_user: 0, id_customer: null }) as any,
    );
    vi.mocked(CartCartRule.count).mockResolvedValue(0 as any);
    vi.mocked(CartCartRule.findOne).mockResolvedValue(null); // not yet applied
    vi.mocked(CartCartRule.create).mockResolvedValue({ id: 99 } as any);

    await expect(discountService.applyCode(1, 1, 'TEST10')).resolves.not.toThrow();
    expect(CartCartRule.create).toHaveBeenCalledWith({ id_cart: 1, id_cart_rule: 1 });
  });
});
