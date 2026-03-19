import { Cart } from '../../models/cart.model.js';
import { CartItem } from '../../models/cart-item.model.js';
import { Product } from '../../models/product.model.js';
import { ProductLang } from '../../models/product-lang.model.js';
import { ProductImage } from '../../models/product-image.model.js';
import { ProductCombination } from '../../models/product-combination.model.js';
import { TaxRule } from '../../models/tax-rule.model.js';
import { Tax } from '../../models/tax.model.js';
import { Address } from '../../models/address.model.js';
import { Country } from '../../models/country.model.js';
import { Carrier } from '../../models/carrier.model.js';
import { CarrierRange } from '../../models/carrier-range.model.js';
import { CarrierRangePrice } from '../../models/carrier-range-price.model.js';
import { CarrierZone } from '../../models/carrier-zone.model.js';
import { User } from '../../models/user.model.js';
import { CustomerGroup } from '../../models/customer-group.model.js';
import type { CartSummary, CartItemDetailed } from '@dmshop/shared';
import { discountService } from '../discount/service.js';

export const cartCalculator = {
  async calculate(cartId: number, idAddressDelivery?: number, idCarrier?: number, userId?: number | null): Promise<CartSummary> {
    const cart = await Cart.findByPk(cartId, {
      include: [
        {
          model: CartItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              include: [
                { model: ProductLang, as: 'translations' },
                { model: ProductImage, as: 'images', where: { cover: true }, required: false },
              ],
            },
          ],
        },
      ],
    });

    if (!cart || !cart.items || cart.items.length === 0) {
      return {
        items: [],
        totalProducts: 0,
        totalProductsTax: 0,
        totalShipping: 0,
        totalShippingTax: 0,
        totalDiscounts: 0,
        totalDiscountsTax: 0,
        totalPaid: 0,
        itemCount: 0,
      };
    }

    // Resolve delivery address for tax calculation
    let countryId: number | null = null;
    let stateId: number | null = null;
    let zoneId: number | null = null;

    const addressId = idAddressDelivery ?? cart.id_address_delivery;
    if (addressId) {
      const address = await Address.findByPk(addressId, {
        include: [{ model: Country, as: 'country' }],
      });
      if (address) {
        countryId = address.id_country;
        stateId = address.id_state;
        zoneId = address.country?.id_zone ?? null;
      }
    }

    // Resolve user groups for specific price matching
    let userGroupIds: number[] = [];
    if (userId) {
      const userForGroups = await User.findByPk(userId, {
        include: [{ model: CustomerGroup, as: 'groups', through: { attributes: [] } }],
      });
      if (userForGroups?.groups?.length) {
        userGroupIds = userForGroups.groups.map((g: CustomerGroup) => g.id);
      }
    }
    // Primary group is the first (or highest-reduction) group
    const primaryGroupId = userGroupIds.length > 0 ? userGroupIds[0] : null;

    const items: CartItemDetailed[] = [];
    let totalProducts = 0;
    let totalProductsTax = 0;
    let totalWeight = 0;

    for (const cartItem of cart.items) {
      const product = cartItem.product;
      if (!product) continue;

      let unitPrice = Number(product.price);
      let combinationName: string | null = null;

      // Apply combination price impact
      if (cartItem.id_combination) {
        const combination = await ProductCombination.findByPk(cartItem.id_combination);
        if (combination) {
          unitPrice += Number(combination.price_impact);
          combinationName = combination.reference;
        }
      }

      // Apply specific price if available (pass user's group for priority matching)
      const specificPrice = await discountService.getSpecificPrice(
        product.id, cartItem.id_combination, userId ?? null,
        primaryGroupId, null, countryId, cartItem.quantity,
      );
      if (specificPrice) {
        unitPrice = discountService.applySpecificPrice(unitPrice, specificPrice);
      }

      // Calculate tax rate for this product
      const taxRate = await this.getTaxRate(product.id_tax_rule_group, countryId, stateId);
      const unitPriceWithTax = unitPrice * (1 + taxRate / 100);

      const lineTotal = unitPrice * cartItem.quantity;
      const lineTotalWithTax = unitPriceWithTax * cartItem.quantity;

      const translation = product.translations?.[0];
      const coverImage = product.images?.[0];

      items.push({
        id: cartItem.id,
        idCart: cart.id,
        idProduct: product.id,
        idCombination: cartItem.id_combination,
        quantity: cartItem.quantity,
        productName: translation?.name ?? `Product #${product.id}`,
        productSlug: translation?.slug ?? '',
        productPrice: round(unitPrice),
        productPriceWithTax: round(unitPriceWithTax),
        combinationName,
        coverImage: coverImage?.path ?? null,
        totalPrice: round(lineTotal),
        totalPriceWithTax: round(lineTotalWithTax),
        createdAt: cartItem.created_at,
        updatedAt: cartItem.updated_at,
      });

      totalProducts += lineTotal;
      totalProductsTax += lineTotalWithTax;
      totalWeight += Number(product.weight || 0) * cartItem.quantity;
    }

    // Calculate shipping cost
    let totalShipping = 0;
    let totalShippingTax = 0;
    const carrierId = idCarrier ?? cart.id_carrier;

    if (carrierId && zoneId) {
      const shippingResult = await this.getShippingCost(carrierId, zoneId, totalProducts, totalWeight);
      totalShipping = shippingResult.cost;
      totalShippingTax = shippingResult.costWithTax;
    }

    // Apply group discount (before cart rules)
    let groupReduction = 0;
    if (userId) {
      const userWithGroups = await User.findByPk(userId, {
        include: [{ model: CustomerGroup, as: 'groups', through: { attributes: [] } }],
      });
      if (userWithGroups?.groups?.length) {
        groupReduction = Math.max(
          ...userWithGroups.groups.map((g: CustomerGroup) => Number(g.reduction) || 0),
        );
      }
    }

    let totalGroupDiscount = 0;
    let totalGroupDiscountTax = 0;
    if (groupReduction > 0) {
      totalGroupDiscount = round(totalProducts * (groupReduction / 100));
      totalGroupDiscountTax = round(totalProductsTax * (groupReduction / 100));
      totalProducts = totalProducts - totalGroupDiscount;
      totalProductsTax = totalProductsTax - totalGroupDiscountTax;
    }

    // Calculate cart rule discounts
    // Use average tax rate for discount calculation
    const avgTaxRate = totalProducts > 0 ? ((totalProductsTax / totalProducts) - 1) * 100 : 0;
    const discountResult = await discountService.calculateCartDiscounts(
      cartId, totalProductsTax, totalProducts, avgTaxRate,
    );

    // Apply free shipping from cart rules
    if (discountResult.freeShipping) {
      totalShipping = 0;
      totalShippingTax = 0;
    }

    const totalPaid = totalProductsTax + totalShippingTax - discountResult.totalDiscountsTax;

    return {
      items,
      totalProducts: round(totalProducts),
      totalProductsTax: round(totalProductsTax),
      totalShipping: round(totalShipping),
      totalShippingTax: round(totalShippingTax),
      totalDiscounts: round(discountResult.totalDiscounts),
      totalDiscountsTax: round(discountResult.totalDiscountsTax),
      groupDiscount: round(totalGroupDiscount),
      totalPaid: round(Math.max(0, totalPaid)),
      itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
      appliedDiscounts: discountResult.discounts,
    } as CartSummary & { appliedDiscounts: unknown[]; groupDiscount: number };
  },

  async getTaxRate(taxRulesGroupId: number, countryId: number | null, stateId: number | null): Promise<number> {
    if (!countryId) return 0;

    // Try state-specific rule first, then country-level
    const where: Record<string, unknown> = {
      id_tax_rules_group: taxRulesGroupId,
      id_country: countryId,
    };

    let rule = stateId
      ? await TaxRule.findOne({ where: { ...where, id_state: stateId }, include: [{ model: Tax, as: 'tax' }] })
      : null;

    if (!rule) {
      rule = await TaxRule.findOne({
        where: { ...where, id_state: null },
        include: [{ model: Tax, as: 'tax' }],
      });
    }

    return rule?.tax ? Number(rule.tax.rate) : 0;
  },

  async getShippingCost(
    carrierId: number,
    zoneId: number,
    cartTotal: number,
    cartWeight: number,
  ): Promise<{ cost: number; costWithTax: number }> {
    const carrier = await Carrier.findByPk(carrierId, {
      include: [
        { model: CarrierRange, as: 'ranges', include: [{ model: CarrierRangePrice, as: 'prices' }] },
      ],
    });

    if (!carrier) return { cost: 0, costWithTax: 0 };

    // Check if carrier serves this zone
    const servesZone = await CarrierZone.findOne({
      where: { id_carrier: carrierId, id_zone: zoneId },
    });
    if (!servesZone) return { cost: 0, costWithTax: 0 };

    if (carrier.is_free) return { cost: 0, costWithTax: 0 };

    // Free shipping threshold: if order total >= free_shipping_starts_at, shipping is free
    if (carrier.free_shipping_starts_at != null && cartTotal >= Number(carrier.free_shipping_starts_at)) {
      return { cost: 0, costWithTax: 0 };
    }

    const delimiter = carrier.shipping_method === 'weight' ? cartWeight : cartTotal;

    // Find matching range
    let shippingCost = 0;
    for (const range of carrier.ranges || []) {
      if (delimiter >= Number(range.delimiter1) && delimiter < Number(range.delimiter2)) {
        const rangePrice = (range.prices || []).find((p: CarrierRangePrice) => p.id_zone === zoneId);
        if (rangePrice) {
          shippingCost = Number(rangePrice.price);
        }
        break;
      }
    }

    // Apply carrier tax
    let shippingCostWithTax = shippingCost;
    if (carrier.id_tax_rules_group) {
      const taxRule = await TaxRule.findOne({
        where: { id_tax_rules_group: carrier.id_tax_rules_group },
        include: [{ model: Tax, as: 'tax' }],
      });
      if (taxRule?.tax) {
        shippingCostWithTax = shippingCost * (1 + Number(taxRule.tax.rate) / 100);
      }
    }

    return { cost: round(shippingCost), costWithTax: round(shippingCostWithTax) };
  },

  async getAvailableCarriers(idAddressDelivery: number, cartTotal?: number, cartWeight: number = 0) {
    const address = await Address.findByPk(idAddressDelivery, {
      include: [{ model: Country, as: 'country' }],
    });
    if (!address) return [];

    const zoneId = address.country?.id_zone;
    if (!zoneId) return [];

    // Find carriers that serve this zone
    const carrierZones = await CarrierZone.findAll({ where: { id_zone: zoneId } });
    const carrierIds = carrierZones.map((cz) => cz.id_carrier);

    if (carrierIds.length === 0) return [];

    const { Op } = await import('sequelize');
    let carriers = await Carrier.findAll({
      where: { id: { [Op.in]: carrierIds }, active: true },
    });

    // Filter by max_weight: max_weight=0 means no limit
    if (cartWeight > 0) {
      carriers = carriers.filter((c) => Number(c.max_weight) === 0 || Number(c.max_weight) >= cartWeight);
    }

    // If cart totals are provided, enrich each carrier with estimated shipping cost
    if (cartTotal !== undefined) {
      const enriched = await Promise.all(
        carriers.map(async (carrier) => {
          const result = await this.getShippingCost(carrier.id, zoneId, cartTotal, cartWeight);
          return Object.assign({}, carrier.toJSON(), {
            estimatedCost: result.cost,
            estimatedCostWithTax: result.costWithTax,
            isFreeShipping: carrier.is_free || result.cost === 0,
          });
        }),
      );
      return enriched;
    }

    return carriers;
  },
};

function round(value: number): number {
  return Number(Math.round(parseFloat(value + 'e+2')) + 'e-2');
}
