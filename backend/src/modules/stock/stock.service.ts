import { Transaction } from 'sequelize';
import { sequelize } from '../../config/database.js';
import { StockMovement, StockMovementType } from '../../models/stock-movement.model.js';
import { Product } from '../../models/product.model.js';
import { ProductCombination } from '../../models/product-combination.model.js';
import { ProductLang } from '../../models/product-lang.model.js';
import { AppError } from '../../utils/app-error.js';
import { ErrorCode } from '@dmshop/shared';

export interface MoveStockParams {
  id_product: number;
  id_combination?: number | null;
  movement_type: StockMovementType;
  quantity: number; // always positive; direction determined by movement_type
  id_order?: number | null;
  reason?: string | null;
  transaction?: Transaction;
}

/** Tipos que reducen stock */
const DECREASE_TYPES: StockMovementType[] = ['out', 'order_reserved'];
/** Tipos que aumentan stock */
const INCREASE_TYPES: StockMovementType[] = ['in', 'order_cancelled'];

function getStockDelta(type: StockMovementType, quantity: number): number {
  if (DECREASE_TYPES.includes(type)) return -quantity;
  if (INCREASE_TYPES.includes(type)) return +quantity;
  // 'adjustment' sets absolute value — handled separately
  return 0;
}

export const stockService = {
  /**
   * Crea un movimiento de stock y actualiza la cantidad en el producto/combinación.
   * Usa transacción propia si no se proporciona una.
   */
  async move(params: MoveStockParams): Promise<StockMovement> {
    const run = async (t: Transaction) => {
      if (params.id_combination) {
        const combination = await ProductCombination.findByPk(params.id_combination, {
          transaction: t,
          lock: true,
        });
        if (!combination) {
          throw AppError.notFound('Combinación no encontrada', ErrorCode.COMBINATION_NOT_FOUND);
        }

        const stockBefore = combination.quantity;
        const delta = getStockDelta(params.movement_type, params.quantity);
        const stockAfter = stockBefore + delta;

        if (params.movement_type !== 'adjustment' && stockAfter < 0) {
          throw AppError.badRequest(
            `Stock insuficiente para la combinación #${params.id_combination}`,
            ErrorCode.PRODUCT_OUT_OF_STOCK,
          );
        }

        await combination.update({ quantity: stockAfter }, { transaction: t });

        return StockMovement.create(
          {
            id_product: params.id_product,
            id_combination: params.id_combination,
            movement_type: params.movement_type,
            quantity: params.quantity,
            stock_before: stockBefore,
            stock_after: stockAfter,
            id_order: params.id_order ?? null,
            reason: params.reason ?? null,
          },
          { transaction: t },
        );
      } else {
        const product = await Product.findByPk(params.id_product, {
          transaction: t,
          lock: true,
        });
        if (!product) {
          throw AppError.notFound('Producto no encontrado', ErrorCode.PRODUCT_NOT_FOUND);
        }

        const stockBefore = product.quantity;
        const delta = getStockDelta(params.movement_type, params.quantity);
        const stockAfter = stockBefore + delta;

        if (params.movement_type !== 'adjustment' && stockAfter < 0) {
          throw AppError.badRequest(
            `Stock insuficiente para el producto #${params.id_product}`,
            ErrorCode.PRODUCT_OUT_OF_STOCK,
          );
        }

        await product.update({ quantity: stockAfter }, { transaction: t });

        return StockMovement.create(
          {
            id_product: params.id_product,
            id_combination: null,
            movement_type: params.movement_type,
            quantity: params.quantity,
            stock_before: stockBefore,
            stock_after: stockAfter,
            id_order: params.id_order ?? null,
            reason: params.reason ?? null,
          },
          { transaction: t },
        );
      }
    };

    if (params.transaction) {
      return run(params.transaction);
    }

    return sequelize.transaction(run);
  },

  /**
   * Ajuste manual: fija el stock a un valor absoluto.
   */
  async adjustStock(
    id_product: number,
    id_combination: number | null,
    newQuantity: number,
    reason?: string,
  ): Promise<StockMovement> {
    return sequelize.transaction(async (t) => {
      if (id_combination) {
        const combination = await ProductCombination.findOne({
          where: { id: id_combination, id_product },
          transaction: t,
          lock: true,
        });
        if (!combination) {
          throw AppError.notFound('Combinación no encontrada', ErrorCode.COMBINATION_NOT_FOUND);
        }

        const stockBefore = combination.quantity;
        const qty = Math.abs(newQuantity - stockBefore);

        await combination.update({ quantity: newQuantity }, { transaction: t });

        return StockMovement.create(
          {
            id_product,
            id_combination,
            movement_type: 'adjustment',
            quantity: qty,
            stock_before: stockBefore,
            stock_after: newQuantity,
            id_order: null,
            reason: reason ?? 'Ajuste manual',
          },
          { transaction: t },
        );
      } else {
        const product = await Product.findByPk(id_product, { transaction: t, lock: true });
        if (!product) {
          throw AppError.notFound('Producto no encontrado', ErrorCode.PRODUCT_NOT_FOUND);
        }

        const stockBefore = product.quantity;
        const qty = Math.abs(newQuantity - stockBefore);

        await product.update({ quantity: newQuantity }, { transaction: t });

        return StockMovement.create(
          {
            id_product,
            id_combination: null,
            movement_type: 'adjustment',
            quantity: qty,
            stock_before: stockBefore,
            stock_after: newQuantity,
            id_order: null,
            reason: reason ?? 'Ajuste manual',
          },
          { transaction: t },
        );
      }
    });
  },

  /**
   * Lista movimientos con paginación.
   */
  async getMovements(
    id_product?: number,
    filters: { id_combination?: number; page?: number; limit?: number } = {},
  ) {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 20, 100);
    const offset = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (id_product) where.id_product = id_product;
    if (filters.id_combination !== undefined) where.id_combination = filters.id_combination;

    const { count, rows } = await StockMovement.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    return {
      data: rows,
      meta: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  },

  /**
   * Lista productos con stock bajo (quantity <= low_stock_alert).
   */
  async getStockAlerts() {
    const products = await Product.findAll({
      where: sequelize.literal('`Product`.`quantity` <= `Product`.`low_stock_alert` AND `Product`.`active` = 1 AND `Product`.`deleted_at` IS NULL') as any,
      include: [
        {
          model: ProductLang,
          as: 'translations',
          where: { id_lang: 1 },
          required: false,
        },
      ],
      order: [['quantity', 'ASC']],
    });

    return products.map((p) => ({
      id: p.id,
      reference: p.reference,
      name: p.translations?.[0]?.name ?? `Producto #${p.id}`,
      quantity: p.quantity,
      lowStockAlert: p.low_stock_alert,
    }));
  },
};
