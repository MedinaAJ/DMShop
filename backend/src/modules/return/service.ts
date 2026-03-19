import { Op } from 'sequelize';
import { OrderReturn, OrderReturnState } from '../../models/order-return.model.js';
import { OrderReturnItem } from '../../models/order-return-item.model.js';
import { Order } from '../../models/order.model.js';
import { OrderItem } from '../../models/order-item.model.js';
import { User } from '../../models/user.model.js';
import { OrderState } from '../../models/order-state.model.js';
import { AppError } from '../../utils/app-error.js';

export const returnService = {
  /**
   * Create a return request for an order (customer)
   */
  async createReturn(
    orderId: number,
    userId: number,
    input: {
      reason: string;
      customer_note?: string;
      items: Array<{ id_order_item: number; quantity: number; reason?: string }>;
    },
  ): Promise<OrderReturn> {
    // Verify order belongs to user and is in a returnable state
    const order = await Order.findOne({
      where: { id: orderId, id_user: userId },
      include: [{ model: OrderState }],
    });
    if (!order) {
      throw AppError.notFound('Pedido no encontrado');
    }

    const state = (order as any).orderState ?? (order as any).state;
    // Allow returns only for shipped or delivered orders
    const isReturnable = state?.shipped || state?.delivery ||
      /entr|enviad|deliver|ship/i.test(state?.name ?? '');

    if (!isReturnable) {
      throw AppError.badRequest('Solo se pueden devolver pedidos enviados o entregados');
    }

    // Check no existing open return for this order
    const existingReturn = await OrderReturn.findOne({
      where: { id_order: orderId, id_user: userId, state: { [Op.in]: ['waiting', 'confirmed'] } },
    });
    if (existingReturn) {
      throw AppError.badRequest('Ya existe una solicitud de devolución activa para este pedido');
    }

    // Validate order items
    const orderItemIds = input.items.map((i) => i.id_order_item);
    if (orderItemIds.length > 0) {
      const orderItems = await OrderItem.findAll({
        where: { id: { [Op.in]: orderItemIds }, id_order: orderId },
      });
      if (orderItems.length !== orderItemIds.length) {
        throw AppError.badRequest('Algunos artículos no pertenecen a este pedido');
      }
    }

    const orderReturn = await OrderReturn.create({
      id_order: orderId,
      id_user: userId,
      state: 'waiting',
      reason: input.reason,
      customer_note: input.customer_note ?? null,
      admin_note: null,
    });

    // Create return items
    for (const item of input.items) {
      await OrderReturnItem.create({
        id_return: orderReturn.id,
        id_order_item: item.id_order_item,
        quantity: item.quantity,
        reason: item.reason ?? null,
      });
    }

    return orderReturn;
  },

  /**
   * List all returns (admin)
   */
  async list(filters: { page?: number; limit?: number; state?: string } = {}) {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 20, 100);
    const offset = (page - 1) * limit;

    const where: any = {};
    if (filters.state) where.state = filters.state;

    const { count, rows } = await OrderReturn.findAndCountAll({
      where,
      include: [
        {
          model: Order,
          attributes: ['id', 'reference'],
        },
        {
          model: User,
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
        {
          model: OrderReturnItem,
          include: [{ model: OrderItem }],
        },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    return {
      data: rows,
      meta: {
        page,
        perPage: limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  },

  /**
   * Get return detail
   */
  async getById(returnId: number) {
    const ret = await OrderReturn.findByPk(returnId, {
      include: [
        { model: Order, attributes: ['id', 'reference'] },
        { model: User, attributes: ['id', 'firstName', 'lastName', 'email'] },
        {
          model: OrderReturnItem,
          include: [{ model: OrderItem }],
        },
      ],
    });
    if (!ret) throw AppError.notFound('Devolución no encontrada');
    return ret;
  },

  /**
   * Update return state (admin)
   */
  async updateState(
    returnId: number,
    input: { state?: OrderReturnState; admin_note?: string },
  ): Promise<OrderReturn> {
    const ret = await OrderReturn.findByPk(returnId);
    if (!ret) throw AppError.notFound('Devolución no encontrada');

    const updateData: any = {};
    if (input.state !== undefined) updateData.state = input.state;
    if (input.admin_note !== undefined) updateData.admin_note = input.admin_note;

    await ret.update(updateData);
    return ret;
  },

  /**
   * Get returns for a specific user
   */
  async getByUser(userId: number) {
    return OrderReturn.findAll({
      where: { id_user: userId },
      include: [
        { model: Order, attributes: ['id', 'reference'] },
        {
          model: OrderReturnItem,
          include: [{ model: OrderItem }],
        },
      ],
      order: [['created_at', 'DESC']],
    });
  },
};
