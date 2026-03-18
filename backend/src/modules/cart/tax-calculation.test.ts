/**
 * BLOQUE 3 — Tests de getTaxRate
 *
 * Prueba la lógica de resolución de impuestos del cartCalculator:
 * - Sin país → 0
 * - Country-level fallback
 * - State-level override
 * - Múltiples grupos de impuesto
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

import { TaxRule } from '../../models/tax-rule.model.js';
import { cartCalculator } from './cart-calculator.service.js';

// ── Helpers ────────────────────────────────────────────────────────────────

function makeTaxRule(rate: number) {
  return { tax: { rate } };
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('cartCalculator.getTaxRate', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sin countryId (null) → devuelve 0', async () => {
    // Cuando countryId es null, getTaxRate retorna 0 sin consultar la BD
    const rate = await cartCalculator.getTaxRate(1, null, null);
    expect(rate).toBe(0);
    expect(TaxRule.findOne).not.toHaveBeenCalled();
  });

  it('con country pero sin regla de impuesto → devuelve 0', async () => {
    // No existe ningún TaxRule para este grupo y país → rate = 0
    vi.mocked(TaxRule.findOne).mockResolvedValue(null);

    const rate = await cartCalculator.getTaxRate(1, 6, null);
    expect(rate).toBe(0);
  });

  it('regla por país devuelve el rate correcto (IVA España 21%)', async () => {
    // TaxRule para España (id_country=6), id_tax_rules_group=1, Tax.rate=21
    vi.mocked(TaxRule.findOne).mockResolvedValue(makeTaxRule(21) as any);

    const rate = await cartCalculator.getTaxRate(1, 6, null);
    expect(rate).toBe(21);
  });

  it('regla por estado prevalece sobre regla por país', async () => {
    // Primera llamada: state-specific (id_state=52) → rate=10
    // Segunda llamada: country-level (id_state=null) → rate=21
    // El método intenta state primero; si encuentra, usa ese rate
    vi.mocked(TaxRule.findOne)
      .mockResolvedValueOnce(makeTaxRule(10) as any)  // state-specific rule wins
      .mockResolvedValueOnce(makeTaxRule(21) as any); // country-level (should NOT be used)

    const rate = await cartCalculator.getTaxRate(1, 6, 52);
    expect(rate).toBe(10);
    // Solo debería haber llamado una vez (encontró la regla del estado)
    expect(TaxRule.findOne).toHaveBeenCalledTimes(1);
  });

  it('sin regla para el estado específico → usa la regla del país (fallback)', async () => {
    // No hay regla para state=999
    // Sí hay regla para country=6 sin estado → rate=21
    vi.mocked(TaxRule.findOne)
      .mockResolvedValueOnce(null)                    // no state-specific rule
      .mockResolvedValueOnce(makeTaxRule(21) as any); // country-level fallback

    const rate = await cartCalculator.getTaxRate(1, 6, 999);
    expect(rate).toBe(21);
    expect(TaxRule.findOne).toHaveBeenCalledTimes(2);
  });

  it('múltiples grupos de impuesto — devuelve el rate correcto por id_tax_rules_group', async () => {
    // grupo 1=21%, grupo 2=10%, grupo 3=4%
    // Llamamos con grupo 2 → debe devolver 10
    vi.mocked(TaxRule.findOne).mockImplementation((opts: any) => {
      const groupId = opts?.where?.id_tax_rules_group;
      const rateMap: Record<number, number> = { 1: 21, 2: 10, 3: 4 };
      const rate = rateMap[groupId];
      if (rate !== undefined) return Promise.resolve(makeTaxRule(rate) as any);
      return Promise.resolve(null);
    });

    const rate1 = await cartCalculator.getTaxRate(1, 6, null);
    const rate2 = await cartCalculator.getTaxRate(2, 6, null);
    const rate3 = await cartCalculator.getTaxRate(3, 6, null);

    expect(rate1).toBe(21);
    expect(rate2).toBe(10);
    expect(rate3).toBe(4);
  });

  it('rate=0 cuando no hay Tax asociado al TaxRule', async () => {
    // TaxRule existe pero tax es null → rate = 0
    vi.mocked(TaxRule.findOne).mockResolvedValue({ tax: null } as any);

    const rate = await cartCalculator.getTaxRate(1, 6, null);
    expect(rate).toBe(0);
  });

  it('taxRulesGroupId=0 (producto sin grupo) → devuelve 0', async () => {
    // Cuando group=0, no hay reglas → devuelve 0
    vi.mocked(TaxRule.findOne).mockResolvedValue(null);

    const rate = await cartCalculator.getTaxRate(0, 6, null);
    expect(rate).toBe(0);
  });
});
