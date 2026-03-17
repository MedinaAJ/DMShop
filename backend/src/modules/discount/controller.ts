import { Request, Response } from 'express';
import { CartRule } from '../../models/cart-rule.model.js';
import { SpecificPrice } from '../../models/specific-price.model.js';
import { AppError } from '../../utils/app-error.js';
import { ErrorCode } from '@dmshop/shared';
import { sendSuccess, sendCreated, sendPaginated, sendNoContent } from '../../utils/response.js';
import { Op } from 'sequelize';

export const discountController = {
  // --- Cart Rules CRUD (admin) ---

  async listCartRules(req: Request, res: Response) {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const q = req.query.q as string | undefined;

    const where: Record<string, unknown> = {};
    if (q) {
      where[Op.or as any] = [
        { name: { [Op.like]: `%${q}%` } },
        { code: { [Op.like]: `%${q}%` } },
      ];
    }

    const { count, rows } = await CartRule.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit,
      offset: (page - 1) * limit,
    });

    sendPaginated(res, rows.map(mapCartRule), {
      page, perPage: limit, total: count, totalPages: Math.ceil(count / limit),
    });
  },

  async getCartRule(req: Request, res: Response) {
    const rule = await CartRule.findByPk(Number(req.params.id));
    if (!rule) throw AppError.notFound('Regla de carrito no encontrada', ErrorCode.CART_RULE_NOT_FOUND);
    sendSuccess(res, mapCartRule(rule));
  },

  async createCartRule(req: Request, res: Response) {
    const data = mapInputToModel(req.body);
    const rule = await CartRule.create(data);
    sendCreated(res, mapCartRule(rule));
  },

  async updateCartRule(req: Request, res: Response) {
    const rule = await CartRule.findByPk(Number(req.params.id));
    if (!rule) throw AppError.notFound('Regla de carrito no encontrada', ErrorCode.CART_RULE_NOT_FOUND);
    const data = mapInputToModel(req.body);
    await rule.update(data);
    sendSuccess(res, mapCartRule(rule));
  },

  async deleteCartRule(req: Request, res: Response) {
    const rule = await CartRule.findByPk(Number(req.params.id));
    if (!rule) throw AppError.notFound('Regla de carrito no encontrada', ErrorCode.CART_RULE_NOT_FOUND);
    await rule.destroy();
    sendNoContent(res);
  },

  // --- Specific Prices CRUD (admin) ---

  async listSpecificPrices(req: Request, res: Response) {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const idProduct = req.query.idProduct ? Number(req.query.idProduct) : undefined;

    const where: Record<string, unknown> = {};
    if (idProduct) where.id_product = idProduct;

    const { count, rows } = await SpecificPrice.findAndCountAll({
      where,
      order: [['id', 'DESC']],
      limit,
      offset: (page - 1) * limit,
    });

    sendPaginated(res, rows.map(mapSpecificPrice), {
      page, perPage: limit, total: count, totalPages: Math.ceil(count / limit),
    });
  },

  async createSpecificPrice(req: Request, res: Response) {
    const sp = await SpecificPrice.create({
      id_product: req.body.idProduct,
      id_combination: req.body.idCombination ?? null,
      id_customer: req.body.idCustomer ?? null,
      id_customer_group: req.body.idCustomerGroup ?? null,
      id_currency: req.body.idCurrency ?? null,
      id_country: req.body.idCountry ?? null,
      from_quantity: req.body.fromQuantity ?? 1,
      price: req.body.price ?? -1,
      reduction: req.body.reduction ?? 0,
      reduction_type: req.body.reductionType ?? 'percentage',
      reduction_tax: req.body.reductionTax ?? true,
      date_from: req.body.dateFrom ?? null,
      date_to: req.body.dateTo ?? null,
    });
    sendCreated(res, mapSpecificPrice(sp));
  },

  async deleteSpecificPrice(req: Request, res: Response) {
    const sp = await SpecificPrice.findByPk(Number(req.params.id));
    if (!sp) throw AppError.notFound('Precio específico no encontrado');
    await sp.destroy();
    sendNoContent(res);
  },
};

function mapCartRule(rule: CartRule) {
  return {
    id: rule.id,
    code: rule.code,
    name: rule.name,
    description: rule.description,
    dateFrom: rule.date_from,
    dateTo: rule.date_to,
    quantity: rule.quantity,
    quantityPerUser: rule.quantity_per_user,
    priority: rule.priority,
    minimumAmount: Number(rule.minimum_amount),
    freeShipping: rule.free_shipping,
    reductionPercent: Number(rule.reduction_percent),
    reductionAmount: Number(rule.reduction_amount),
    idCustomer: rule.id_customer,
    active: rule.active,
    createdAt: rule.created_at,
  };
}

function mapSpecificPrice(sp: SpecificPrice) {
  return {
    id: sp.id,
    idProduct: sp.id_product,
    idCombination: sp.id_combination,
    idCustomer: sp.id_customer,
    idCustomerGroup: sp.id_customer_group,
    idCurrency: sp.id_currency,
    idCountry: sp.id_country,
    fromQuantity: sp.from_quantity,
    price: Number(sp.price),
    reduction: Number(sp.reduction),
    reductionType: sp.reduction_type,
    reductionTax: sp.reduction_tax,
    dateFrom: sp.date_from,
    dateTo: sp.date_to,
  };
}

function mapInputToModel(body: Record<string, unknown>) {
  const data: Record<string, unknown> = {};
  if (body.code !== undefined) data.code = body.code || null;
  if (body.name !== undefined) data.name = body.name;
  if (body.description !== undefined) data.description = body.description || null;
  if (body.dateFrom !== undefined) data.date_from = body.dateFrom || null;
  if (body.dateTo !== undefined) data.date_to = body.dateTo || null;
  if (body.quantity !== undefined) data.quantity = body.quantity;
  if (body.quantityPerUser !== undefined) data.quantity_per_user = body.quantityPerUser;
  if (body.priority !== undefined) data.priority = body.priority;
  if (body.minimumAmount !== undefined) data.minimum_amount = body.minimumAmount;
  if (body.minimumAmountCurrency !== undefined) data.minimum_amount_currency = body.minimumAmountCurrency || null;
  if (body.freeShipping !== undefined) data.free_shipping = body.freeShipping;
  if (body.reductionPercent !== undefined) data.reduction_percent = body.reductionPercent;
  if (body.reductionAmount !== undefined) data.reduction_amount = body.reductionAmount;
  if (body.reductionCurrency !== undefined) data.reduction_currency = body.reductionCurrency || null;
  if (body.idCustomer !== undefined) data.id_customer = body.idCustomer || null;
  if (body.active !== undefined) data.active = body.active;
  return data;
}
