import { Op } from 'sequelize';
import { CartRule } from '../../models/cart-rule.model.js';
import { CartCartRule } from '../../models/cart-cart-rule.model.js';
import { SpecificPrice } from '../../models/specific-price.model.js';
import { Cart } from '../../models/cart.model.js';
import { Order } from '../../models/order.model.js';
import { AppError } from '../../utils/app-error.js';
import { ErrorCode } from '@dmshop/shared';

export interface AppliedDiscount {
  id: number;
  name: string;
  code: string | null;
  type: 'percent' | 'amount' | 'free_shipping';
  value: number;
  savings: number;
}

export interface DiscountResult {
  discounts: AppliedDiscount[];
  totalDiscounts: number;
  totalDiscountsTax: number;
  freeShipping: boolean;
}

export const discountService = {
  /**
   * Validate and apply a cart rule code to a cart
   */
  async applyCode(cartId: number, userId: number, code: string): Promise<void> {
    const rule = await CartRule.findOne({ where: { code, active: true } });
    if (!rule) {
      throw AppError.notFound('Código de descuento no encontrado', ErrorCode.CART_RULE_NOT_FOUND);
    }

    await this.validateRule(rule, cartId, userId);

    // Check not already applied
    const existing = await CartCartRule.findOne({
      where: { id_cart: cartId, id_cart_rule: rule.id },
    });
    if (existing) {
      throw AppError.badRequest('Este cupón ya está aplicado', ErrorCode.CART_RULE_INVALID);
    }

    await CartCartRule.create({ id_cart: cartId, id_cart_rule: rule.id });
  },

  /**
   * Remove a cart rule from a cart
   */
  async removeCode(cartId: number, cartRuleId: number): Promise<void> {
    const deleted = await CartCartRule.destroy({
      where: { id_cart: cartId, id_cart_rule: cartRuleId },
    });
    if (!deleted) {
      throw AppError.notFound('Cupón no encontrado en el carrito', ErrorCode.CART_RULE_NOT_FOUND);
    }
  },

  /**
   * Validate a cart rule can be used
   */
  async validateRule(rule: CartRule, _cartId: number, userId: number): Promise<void> {
    const now = new Date();

    // Check dates
    if (rule.date_from && new Date(rule.date_from) > now) {
      throw AppError.badRequest('Este cupón aún no es válido', ErrorCode.CART_RULE_INVALID);
    }
    if (rule.date_to && new Date(rule.date_to) < now) {
      throw AppError.badRequest('Este cupón ha expirado', ErrorCode.CART_RULE_EXPIRED);
    }

    // Check global quantity
    if (rule.quantity > 0) {
      const usedCount = await CartCartRule.count({ where: { id_cart_rule: rule.id } });
      // Also count orders that used this rule
      if (usedCount >= rule.quantity) {
        throw AppError.badRequest('Este cupón ha alcanzado su límite de uso', ErrorCode.CART_RULE_INVALID);
      }
    }

    // Check per-user quantity
    if (rule.quantity_per_user > 0 && userId) {
      // Count orders by this user that contain this cart rule in their cart
      const userOrderCount = await Order.count({
        include: [{
          model: Cart,
          as: 'cart',
          required: true,
          include: [{
            model: CartCartRule,
            as: 'cartRules',
            where: { id_cart_rule: rule.id },
            required: true,
          }],
        }],
        where: { id_user: userId },
      });
      if (userOrderCount >= rule.quantity_per_user) {
        throw AppError.badRequest('Has alcanzado el límite de uso de este cupón', ErrorCode.CART_RULE_INVALID);
      }
    }

    // Check customer restriction
    if (rule.id_customer && rule.id_customer !== userId) {
      throw AppError.badRequest('Este cupón no es válido para tu cuenta', ErrorCode.CART_RULE_INVALID);
    }
  },

  /**
   * Calculate discounts for a cart based on applied cart rules
   */
  async calculateCartDiscounts(
    cartId: number,
    subtotalWithTax: number,
    subtotalWithoutTax: number,
    taxRate: number,
  ): Promise<DiscountResult> {
    const appliedRules = await CartCartRule.findAll({
      where: { id_cart: cartId },
    });

    if (appliedRules.length === 0) {
      return { discounts: [], totalDiscounts: 0, totalDiscountsTax: 0, freeShipping: false };
    }

    const ruleIds = appliedRules.map((r) => r.id_cart_rule);
    const rules = await CartRule.findAll({
      where: { id: { [Op.in]: ruleIds }, active: true },
      order: [['priority', 'ASC']],
    });

    const discounts: AppliedDiscount[] = [];
    let totalDiscounts = 0;
    let totalDiscountsTax = 0;
    let freeShipping = false;

    for (const rule of rules) {
      // Check minimum amount
      if (Number(rule.minimum_amount) > 0 && subtotalWithTax < Number(rule.minimum_amount)) {
        continue;
      }

      if (rule.free_shipping) {
        freeShipping = true;
        discounts.push({
          id: rule.id,
          name: rule.name,
          code: rule.code,
          type: 'free_shipping',
          value: 0,
          savings: 0,
        });
      }

      if (Number(rule.reduction_percent) > 0) {
        const savings = round(subtotalWithoutTax * Number(rule.reduction_percent) / 100);
        const savingsTax = round(subtotalWithTax * Number(rule.reduction_percent) / 100);
        totalDiscounts += savings;
        totalDiscountsTax += savingsTax;
        discounts.push({
          id: rule.id,
          name: rule.name,
          code: rule.code,
          type: 'percent',
          value: Number(rule.reduction_percent),
          savings: savingsTax,
        });
      } else if (Number(rule.reduction_amount) > 0) {
        const amount = Number(rule.reduction_amount);
        const amountWithTax = round(amount * (1 + taxRate / 100));
        totalDiscounts += Math.min(amount, subtotalWithoutTax);
        totalDiscountsTax += Math.min(amountWithTax, subtotalWithTax);
        discounts.push({
          id: rule.id,
          name: rule.name,
          code: rule.code,
          type: 'amount',
          value: amount,
          savings: Math.min(amountWithTax, subtotalWithTax),
        });
      }
    }

    return {
      discounts,
      totalDiscounts: round(totalDiscounts),
      totalDiscountsTax: round(totalDiscountsTax),
      freeShipping,
    };
  },

  /**
   * Get the best specific price for a product
   * customerGroupId: primary group ID of the user (for matching group-specific prices)
   * userGroupIds: all group IDs of the user (optional, for broader matching)
   */
  async getSpecificPrice(
    productId: number,
    combinationId: number | null,
    userId: number | null,
    customerGroupId: number | null,
    currencyId: number | null,
    countryId: number | null,
    quantity: number,
    userGroupIds?: number[],
  ): Promise<SpecificPrice | null> {
    const now = new Date();

    const where: Record<string, unknown> = {
      id_product: productId,
      from_quantity: { [Op.lte]: quantity },
      [Op.or]: [
        { date_from: null, date_to: null },
        { date_from: { [Op.lte]: now }, date_to: null },
        { date_from: null, date_to: { [Op.gte]: now } },
        { date_from: { [Op.lte]: now }, date_to: { [Op.gte]: now } },
      ],
    };

    const prices = await SpecificPrice.findAll({ where, order: [['from_quantity', 'DESC']] });

    // All group IDs the user belongs to (for broader matching)
    const allGroupIds = userGroupIds ?? (customerGroupId ? [customerGroupId] : []);

    // Score each specific price (more specific = higher score)
    let bestPrice: SpecificPrice | null = null;
    let bestScore = -1;

    for (const sp of prices) {
      let score = 0;

      // Check combination match
      if (sp.id_combination) {
        if (sp.id_combination !== combinationId) continue;
        score += 10;
      }

      // Check customer match
      if (sp.id_customer) {
        if (sp.id_customer !== userId) continue;
        score += 8;
      }

      // Check group match — give higher priority to prices matching user's group
      if (sp.id_customer_group) {
        if (!allGroupIds.includes(sp.id_customer_group)) continue;
        // Primary group match scores higher than secondary group
        if (sp.id_customer_group === customerGroupId) {
          score += 6;
        } else {
          score += 4;
        }
      }

      // Check currency match
      if (sp.id_currency) {
        if (sp.id_currency !== currencyId) continue;
        score += 2;
      }

      // Check country match
      if (sp.id_country) {
        if (sp.id_country !== countryId) continue;
        score += 1;
      }

      if (score > bestScore) {
        bestScore = score;
        bestPrice = sp;
      }
    }

    return bestPrice;
  },

  /**
   * Apply specific price to a base price
   */
  applySpecificPrice(basePrice: number, specificPrice: SpecificPrice): number {
    // If override price is set (not -1), use it
    if (Number(specificPrice.price) >= 0) {
      return Number(specificPrice.price);
    }

    // Apply reduction
    const reduction = Number(specificPrice.reduction);
    if (reduction <= 0) return basePrice;

    if (specificPrice.reduction_type === 'percentage') {
      return round(basePrice * (1 - reduction / 100));
    }

    // Amount reduction
    return round(Math.max(0, basePrice - reduction));
  },

  /**
   * Get applied cart rules for a cart
   */
  async getAppliedRules(cartId: number): Promise<CartRule[]> {
    const applied = await CartCartRule.findAll({ where: { id_cart: cartId } });
    if (applied.length === 0) return [];

    const ruleIds = applied.map((r) => r.id_cart_rule);
    return CartRule.findAll({
      where: { id: { [Op.in]: ruleIds }, active: true },
      order: [['priority', 'ASC']],
    });
  },
};

function round(value: number): number {
  return Number(Math.round(parseFloat(value + 'e+2')) + 'e-2');
}
