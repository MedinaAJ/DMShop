import { vi, describe, it, expect, beforeEach } from 'vitest';

// ── Mock all Sequelize models used by cart-calculator ──────────────────────
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

vi.mock('../discount/service.js', () => ({
  discountService: {
    getSpecificPrice: vi.fn().mockResolvedValue(null),
    applySpecificPrice: vi.fn(),
    calculateCartDiscounts: vi.fn().mockResolvedValue({
      discounts: [],
      totalDiscounts: 0,
      totalDiscountsTax: 0,
      freeShipping: false,
    }),
  },
}));

import { Cart } from '../../models/cart.model.js';
import { ProductCombination } from '../../models/product-combination.model.js';
import { TaxRule } from '../../models/tax-rule.model.js';
import { Address } from '../../models/address.model.js';
import { discountService } from '../discount/service.js';
import { cartCalculator } from './cart-calculator.service.js';

// ── Helpers ────────────────────────────────────────────────────────────────

function makeProduct(id: number, price: number, taxRuleGroupId = 0) {
  return {
    id,
    price,
    id_tax_rule_group: taxRuleGroupId,
    quantity: 100,
    translations: [{ name: `Producto ${id}`, slug: `producto-${id}` }],
    images: [],
  };
}

function makeCartItem(id: number, product: ReturnType<typeof makeProduct>, quantity: number, idCombination: number | null = null) {
  return {
    id,
    id_product: product.id,
    id_combination: idCombination,
    quantity,
    product,
    created_at: new Date(),
    updated_at: new Date(),
  };
}

function makeCart(id: number, items: ReturnType<typeof makeCartItem>[]) {
  return {
    id,
    items,
    id_address_delivery: null,
    id_carrier: null,
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('cartCalculator.calculate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no tax, no address, no carrier
    vi.mocked(TaxRule.findOne).mockResolvedValue(null);
    vi.mocked(Address.findByPk).mockResolvedValue(null);
    vi.mocked(discountService.getSpecificPrice).mockResolvedValue(null);
    vi.mocked(discountService.applySpecificPrice).mockImplementation((price: number) => price);
    vi.mocked(discountService.calculateCartDiscounts).mockResolvedValue({
      discounts: [],
      totalDiscounts: 0,
      totalDiscountsTax: 0,
      freeShipping: false,
    });
  });

  // ── Test 1: empty cart ─────────────────────────────────────────────────
  it('carrito vacío devuelve totales en cero', async () => {
    vi.mocked(Cart.findByPk).mockResolvedValue(null as any);

    const result = await cartCalculator.calculate(1);

    expect(result.totalPaid).toBe(0);
    expect(result.itemCount).toBe(0);
    expect(result.totalProducts).toBe(0);
    expect(result.items).toHaveLength(0);
  });

  it('carrito con items vacíos devuelve totales en cero', async () => {
    vi.mocked(Cart.findByPk).mockResolvedValue(makeCart(1, []) as any);

    const result = await cartCalculator.calculate(1);

    expect(result.totalPaid).toBe(0);
    expect(result.itemCount).toBe(0);
    expect(result.items).toHaveLength(0);
  });

  // ── Test 2: 1 product, no tax, no discount ─────────────────────────────
  it('1 producto sin impuesto: totalPaid = precio * cantidad', async () => {
    const product = makeProduct(10, 10);
    const item = makeCartItem(1, product, 2);
    vi.mocked(Cart.findByPk).mockResolvedValue(makeCart(1, [item]) as any);

    const result = await cartCalculator.calculate(1);

    expect(result.totalProducts).toBe(20);
    expect(result.totalProductsTax).toBe(20); // no tax
    expect(result.totalPaid).toBe(20);
    expect(result.itemCount).toBe(2); // sum of quantities
    expect(result.items).toHaveLength(1);
    expect(result.items[0].productPrice).toBe(10);
    expect(result.items[0].quantity).toBe(2);
  });

  // ── Test 3: specific price — percentage discount ───────────────────────
  it('aplica descuento porcentual de specific price', async () => {
    const product = makeProduct(10, 100);
    const item = makeCartItem(1, product, 1);
    vi.mocked(Cart.findByPk).mockResolvedValue(makeCart(1, [item]) as any);

    const fakeSpecificPrice = {
      price: -1,
      reduction: 10,
      reduction_type: 'percentage',
    } as any;
    vi.mocked(discountService.getSpecificPrice).mockResolvedValue(fakeSpecificPrice);
    // Make applySpecificPrice behave realistically
    vi.mocked(discountService.applySpecificPrice).mockImplementation((basePrice: number, sp: any) => {
      if (Number(sp.price) >= 0) return Number(sp.price);
      const reduction = Number(sp.reduction);
      if (sp.reduction_type === 'percentage') return Math.round(basePrice * (1 - reduction / 100) * 100) / 100;
      return Math.max(0, basePrice - reduction);
    });

    const result = await cartCalculator.calculate(1);

    expect(result.items[0].productPrice).toBe(90);
  });

  // ── Test 4: specific price — fixed price override ─────────────────────
  it('aplica precio fijo de specific price', async () => {
    const product = makeProduct(10, 100);
    const item = makeCartItem(1, product, 1);
    vi.mocked(Cart.findByPk).mockResolvedValue(makeCart(1, [item]) as any);

    const fakeSpecificPrice = { price: 75, reduction: 0, reduction_type: 'percentage' } as any;
    vi.mocked(discountService.getSpecificPrice).mockResolvedValue(fakeSpecificPrice);
    vi.mocked(discountService.applySpecificPrice).mockImplementation((basePrice: number, sp: any) => {
      if (Number(sp.price) >= 0) return Number(sp.price);
      return basePrice;
    });

    const result = await cartCalculator.calculate(1);

    expect(result.items[0].productPrice).toBe(75);
  });

  // ── Test 5: specific price — fixed amount discount ────────────────────
  it('aplica descuento por importe fijo de specific price', async () => {
    const product = makeProduct(10, 100);
    const item = makeCartItem(1, product, 1);
    vi.mocked(Cart.findByPk).mockResolvedValue(makeCart(1, [item]) as any);

    const fakeSpecificPrice = { price: -1, reduction: 15, reduction_type: 'amount' } as any;
    vi.mocked(discountService.getSpecificPrice).mockResolvedValue(fakeSpecificPrice);
    vi.mocked(discountService.applySpecificPrice).mockImplementation((basePrice: number, sp: any) => {
      if (Number(sp.price) >= 0) return Number(sp.price);
      const reduction = Number(sp.reduction);
      if (sp.reduction_type === 'percentage') return Math.round(basePrice * (1 - reduction / 100) * 100) / 100;
      return Math.max(0, basePrice - reduction);
    });

    const result = await cartCalculator.calculate(1);

    expect(result.items[0].productPrice).toBe(85);
  });

  // ── Test 6: specific price not applied if quantity < from_quantity ─────
  it('no aplica specific price si cantidad menor que from_quantity', async () => {
    const product = makeProduct(10, 100);
    const item = makeCartItem(1, product, 3); // quantity=3
    vi.mocked(Cart.findByPk).mockResolvedValue(makeCart(1, [item]) as any);

    // getSpecificPrice returns null because quantity < from_quantity (the service handles this via DB query)
    vi.mocked(discountService.getSpecificPrice).mockResolvedValue(null);
    vi.mocked(discountService.applySpecificPrice).mockImplementation((price: number) => price);

    const result = await cartCalculator.calculate(1);

    expect(result.items[0].productPrice).toBe(100); // no discount applied
  });

  // ── Test 7: combination price impact ──────────────────────────────────
  it('aplica el price_impact de la combinación', async () => {
    const product = makeProduct(10, 100);
    const item = makeCartItem(1, product, 1, 5); // idCombination=5
    vi.mocked(Cart.findByPk).mockResolvedValue(makeCart(1, [item]) as any);
    vi.mocked(ProductCombination.findByPk).mockResolvedValue({
      price_impact: 20,
      reference: 'COMBO-REF',
    } as any);

    const result = await cartCalculator.calculate(1);

    expect(result.items[0].productPrice).toBe(120);
  });

  // ── Test 8: multiple items, correct totals ─────────────────────────────
  it('múltiples items: totalProducts es la suma correcta', async () => {
    const product1 = makeProduct(1, 10);
    const product2 = makeProduct(2, 25);
    const items = [
      makeCartItem(1, product1, 2),   // 20
      makeCartItem(2, product2, 3),   // 75
    ];
    vi.mocked(Cart.findByPk).mockResolvedValue(makeCart(1, items) as any);

    const result = await cartCalculator.calculate(1);

    expect(result.totalProducts).toBe(95);
    expect(result.itemCount).toBe(5); // 2+3
    expect(result.items).toHaveLength(2);
  });
});
