/**
 * BLOQUE 4 — Tests de getShippingCost
 *
 * Prueba directamente cartCalculator.getShippingCost():
 * - Carrier no encontrado, is_free, sin zona
 * - IVA en envío
 * - Rangos por precio y por peso
 * - Casos límite de rangos
 */
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ── Mock models ────────────────────────────────────────────────────────────
vi.mock('../../models/cart.model.js', () => ({ Cart: { findByPk: vi.fn() } }));
vi.mock('../../models/cart-item.model.js', () => ({ CartItem: {} }));
vi.mock('../../models/product.model.js', () => ({ Product: {} }));
vi.mock('../../models/product-lang.model.js', () => ({ ProductLang: {} }));
vi.mock('../../models/product-image.model.js', () => ({ ProductImage: {} }));
vi.mock('../../models/product-combination.model.js', () => ({ ProductCombination: { findByPk: vi.fn() } }));
vi.mock('../../models/tax-rule.model.js', () => ({ TaxRule: { findOne: vi.fn() } }));
vi.mock('../../models/tax.model.js', () => ({ Tax: {} }));
vi.mock('../../models/address.model.js', () => ({ Address: { findByPk: vi.fn() } }));
vi.mock('../../models/country.model.js', () => ({ Country: {} }));
vi.mock('../../models/carrier.model.js', () => ({ Carrier: { findByPk: vi.fn(), findAll: vi.fn() } }));
vi.mock('../../models/carrier-range.model.js', () => ({ CarrierRange: {} }));
vi.mock('../../models/carrier-range-price.model.js', () => ({ CarrierRangePrice: {} }));
vi.mock('../../models/carrier-zone.model.js', () => ({ CarrierZone: { findOne: vi.fn(), findAll: vi.fn() } }));
vi.mock('../../models/user.model.js', () => ({ User: { findByPk: vi.fn() } }));
vi.mock('../../models/customer-group.model.js', () => ({ CustomerGroup: {} }));

vi.mock('../discount/service.js', () => ({
  discountService: {
    getSpecificPrice: vi.fn().mockResolvedValue(null),
    applySpecificPrice: vi.fn((p: number) => p),
    calculateCartDiscounts: vi.fn().mockResolvedValue({
      discounts: [], totalDiscounts: 0, totalDiscountsTax: 0, freeShipping: false,
    }),
  },
}));

import { Carrier } from '../../models/carrier.model.js';
import { CarrierZone } from '../../models/carrier-zone.model.js';
import { TaxRule } from '../../models/tax-rule.model.js';
import { cartCalculator } from './cart-calculator.service.js';

// ── Helpers ────────────────────────────────────────────────────────────────

const ZONE_ID = 1;

function makeCarrier(overrides: {
  id?: number;
  is_free?: boolean;
  shipping_method?: string;
  id_tax_rules_group?: number | null;
  ranges?: Array<{ delimiter1: number; delimiter2: number; price: number }>;
}) {
  const { id = 1, is_free = false, shipping_method = 'price', id_tax_rules_group = null, ranges = [] } = overrides;
  return {
    id,
    is_free,
    shipping_method,
    id_tax_rules_group,
    ranges: ranges.map((r, i) => ({
      id: i + 1,
      delimiter1: r.delimiter1,
      delimiter2: r.delimiter2,
      prices: [{ id_zone: ZONE_ID, price: r.price }],
    })),
  };
}

function setupZone(carrierId: number, zoneId = ZONE_ID) {
  vi.mocked(CarrierZone.findOne).mockResolvedValue({ id_carrier: carrierId, id_zone: zoneId } as any);
}

function setupNoZone() {
  vi.mocked(CarrierZone.findOne).mockResolvedValue(null);
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('cartCalculator.getShippingCost', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(TaxRule.findOne).mockResolvedValue(null);
  });

  // ── Carrier no encontrado ──────────────────────────────────────────────
  it('carrier no encontrado → { cost: 0, costWithTax: 0 }', async () => {
    vi.mocked(Carrier.findByPk).mockResolvedValue(null);

    const result = await cartCalculator.getShippingCost(999, ZONE_ID, 100, 0);

    expect(result).toEqual({ cost: 0, costWithTax: 0 });
  });

  // ── Carrier is_free ────────────────────────────────────────────────────
  it('carrier is_free=true → { cost: 0, costWithTax: 0 }', async () => {
    const carrier = makeCarrier({
      is_free: true,
      ranges: [{ delimiter1: 0, delimiter2: 100, price: 5.99 }],
    });
    vi.mocked(Carrier.findByPk).mockResolvedValue(carrier as any);
    setupZone(carrier.id);

    const result = await cartCalculator.getShippingCost(1, ZONE_ID, 50, 0);

    expect(result).toEqual({ cost: 0, costWithTax: 0 });
  });

  // ── Sin zona para este carrier ─────────────────────────────────────────
  it('carrier no sirve la zona → { cost: 0, costWithTax: 0 }', async () => {
    const carrier = makeCarrier({ ranges: [{ delimiter1: 0, delimiter2: 100, price: 5.99 }] });
    vi.mocked(Carrier.findByPk).mockResolvedValue(carrier as any);
    setupNoZone();

    const result = await cartCalculator.getShippingCost(1, ZONE_ID, 50, 0);

    expect(result).toEqual({ cost: 0, costWithTax: 0 });
  });

  // ── Shipping sin IVA ───────────────────────────────────────────────────
  it('shipping sin IVA → cost === costWithTax', async () => {
    const carrier = makeCarrier({ ranges: [{ delimiter1: 0, delimiter2: 100, price: 6.99 }] });
    vi.mocked(Carrier.findByPk).mockResolvedValue(carrier as any);
    setupZone(carrier.id);
    vi.mocked(TaxRule.findOne).mockResolvedValue(null); // no tax

    const result = await cartCalculator.getShippingCost(1, ZONE_ID, 50, 0);

    expect(result.cost).toBe(6.99);
    expect(result.costWithTax).toBe(6.99);
    expect(result.cost).toBe(result.costWithTax);
  });

  // ── Shipping con IVA 21% ───────────────────────────────────────────────
  it('shipping con IVA 21%: cost=10, costWithTax=12.10', async () => {
    // round(10 * 1.21) = round(12.1) = 12.1 (JS representation)
    const carrier = makeCarrier({
      id_tax_rules_group: 1,
      ranges: [{ delimiter1: 0, delimiter2: 200, price: 10 }],
    });
    vi.mocked(Carrier.findByPk).mockResolvedValue(carrier as any);
    setupZone(carrier.id);
    vi.mocked(TaxRule.findOne).mockResolvedValue({ tax: { rate: 21 } } as any);

    const result = await cartCalculator.getShippingCost(1, ZONE_ID, 100, 0);

    expect(result.cost).toBe(10);
    expect(result.costWithTax).toBe(12.1); // Math representation: 12.1, not 12.10
  });

  // ── Shipping con IVA 10% ───────────────────────────────────────────────
  it('shipping con IVA 10%: cost=5.99, costWithTax=6.59', async () => {
    // round(5.99 * 1.10) = round(6.589) = 6.59
    const carrier = makeCarrier({
      id_tax_rules_group: 2,
      ranges: [{ delimiter1: 0, delimiter2: 200, price: 5.99 }],
    });
    vi.mocked(Carrier.findByPk).mockResolvedValue(carrier as any);
    setupZone(carrier.id);
    vi.mocked(TaxRule.findOne).mockResolvedValue({ tax: { rate: 10 } } as any);

    const result = await cartCalculator.getShippingCost(1, ZONE_ID, 100, 0);

    expect(result.cost).toBe(5.99);
    expect(result.costWithTax).toBe(6.59);
  });

  // ── Rango por precio: justo antes del límite ───────────────────────────
  it('rango por precio: cartTotal=99.99 → rango [50-100) → aplica precio del rango', async () => {
    // 99.99 >= 50 && 99.99 < 100 → segundo rango
    const carrier = makeCarrier({
      ranges: [
        { delimiter1: 0, delimiter2: 50, price: 7.99 },
        { delimiter1: 50, delimiter2: 100, price: 4.99 },
        { delimiter1: 100, delimiter2: 500, price: 2.99 },
      ],
    });
    vi.mocked(Carrier.findByPk).mockResolvedValue(carrier as any);
    setupZone(carrier.id);

    const result = await cartCalculator.getShippingCost(1, ZONE_ID, 99.99, 0);

    expect(result.cost).toBe(4.99);
  });

  // ── Rango por precio: exactamente en el límite ─────────────────────────
  it('rango por precio: cartTotal=100 exacto → rango [100-500) → siguiente rango', async () => {
    // 100 >= 100 && 100 < 500 → tercer rango
    const carrier = makeCarrier({
      ranges: [
        { delimiter1: 0, delimiter2: 50, price: 7.99 },
        { delimiter1: 50, delimiter2: 100, price: 4.99 },
        { delimiter1: 100, delimiter2: 500, price: 2.99 },
      ],
    });
    vi.mocked(Carrier.findByPk).mockResolvedValue(carrier as any);
    setupZone(carrier.id);

    const result = await cartCalculator.getShippingCost(1, ZONE_ID, 100, 0);

    expect(result.cost).toBe(2.99);
  });

  // ── Rango por peso con decimales ───────────────────────────────────────
  it('envío por peso con decimales: weight=1.999kg → rango [0-2kg) → aplica precio correcto', async () => {
    // 1.999 >= 0 && 1.999 < 2 → primer rango
    const carrier = makeCarrier({
      shipping_method: 'weight',
      ranges: [
        { delimiter1: 0, delimiter2: 2, price: 3.99 },
        { delimiter1: 2, delimiter2: 5, price: 6.99 },
      ],
    });
    vi.mocked(Carrier.findByPk).mockResolvedValue(carrier as any);
    setupZone(carrier.id);

    const result = await cartCalculator.getShippingCost(1, ZONE_ID, 0, 1.999);

    expect(result.cost).toBe(3.99);
  });

  // ── Sin zona disponible ────────────────────────────────────────────────
  it('sin zona disponible para el carrier → { cost: 0, costWithTax: 0 }', async () => {
    // Carrier existe y tiene rangos, pero CarrierZone.findOne retorna null
    const carrier = makeCarrier({ ranges: [{ delimiter1: 0, delimiter2: 200, price: 4.99 }] });
    vi.mocked(Carrier.findByPk).mockResolvedValue(carrier as any);
    vi.mocked(CarrierZone.findOne).mockResolvedValue(null);

    const result = await cartCalculator.getShippingCost(1, ZONE_ID, 100, 0);

    expect(result).toEqual({ cost: 0, costWithTax: 0 });
  });

  // ── Rangos sin precio para la zona ────────────────────────────────────
  it('rango existe pero sin precio para la zona → cost = 0', async () => {
    // El rango no tiene CarrierRangePrice para id_zone=1 → shippingCost = 0
    const carrier = {
      id: 1,
      is_free: false,
      shipping_method: 'price',
      id_tax_rules_group: null,
      ranges: [{
        id: 1,
        delimiter1: 0,
        delimiter2: 200,
        prices: [{ id_zone: 99, price: 5.99 }], // zona 99, no zona 1
      }],
    };
    vi.mocked(Carrier.findByPk).mockResolvedValue(carrier as any);
    setupZone(carrier.id);

    const result = await cartCalculator.getShippingCost(1, ZONE_ID, 100, 0);

    // No rangePrice found for zone 1 → shippingCost stays 0
    expect(result.cost).toBe(0);
    expect(result.costWithTax).toBe(0);
  });
});
