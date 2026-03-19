import { Op } from 'sequelize';
import { sequelize } from '../../config/database.js';
import { Order } from '../../models/order.model.js';
import { OrderItem } from '../../models/order-item.model.js';
import { OrderHistory } from '../../models/order-history.model.js';
import { OrderPayment } from '../../models/order-payment.model.js';
import { OrderCarrier } from '../../models/order-carrier.model.js';
import { OrderState } from '../../models/order-state.model.js';
import { Cart } from '../../models/cart.model.js';
import { CartItem } from '../../models/cart-item.model.js';
import { Product } from '../../models/product.model.js';
import { ProductLang } from '../../models/product-lang.model.js';
import { ProductCombination } from '../../models/product-combination.model.js';
import { User } from '../../models/user.model.js';
import { Address } from '../../models/address.model.js';
import { Carrier } from '../../models/carrier.model.js';
import { Currency } from '../../models/currency.model.js';
import { Country } from '../../models/country.model.js';
import { State } from '../../models/state.model.js';
import { AppError } from '../../utils/app-error.js';
import { ErrorCode, OrderStateId, HookName } from '@dmshop/shared';
import type { CreateOrderInput, OrderListQuery, UpdateOrderStateInput, RegisterPaymentInput, UpdateTrackingInput } from '@dmshop/shared';
import { cartCalculator } from '../cart/cart-calculator.service.js';
import { eventBus } from '../../hooks/event-bus.js';
import { stockService } from '../stock/stock.service.js';
import { mailService } from '../mail/mail.service.js';
import crypto from 'crypto';

function generateReference(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

export const orderService = {
  async checkout(userId: number, input: CreateOrderInput) {
    const cart = await Cart.findOne({
      where: { id_user: userId },
      include: [
        {
          model: CartItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              include: [{ model: ProductLang, as: 'translations' }],
            },
          ],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    if (!cart || !cart.items || cart.items.length === 0) {
      throw AppError.badRequest('El carrito está vacío', ErrorCode.CART_EMPTY);
    }

    // Verify delivery address belongs to user
    const deliveryAddress = await Address.findOne({
      where: { id: input.idAddressDelivery, id_user: userId },
    });
    if (!deliveryAddress) {
      throw AppError.notFound('Dirección de envío no encontrada', ErrorCode.ADDRESS_NOT_FOUND);
    }

    const invoiceAddressId = input.idAddressInvoice ?? input.idAddressDelivery;
    if (input.idAddressInvoice) {
      const invoiceAddress = await Address.findOne({
        where: { id: input.idAddressInvoice, id_user: userId },
      });
      if (!invoiceAddress) {
        throw AppError.notFound('Dirección de facturación no encontrada', ErrorCode.ADDRESS_NOT_FOUND);
      }
    }

    // Verify carrier exists and is active
    const carrier = await Carrier.findByPk(input.idCarrier);
    if (!carrier || !carrier.active) {
      throw AppError.notFound('Transportista no disponible', ErrorCode.CARRIER_NOT_AVAILABLE);
    }

    // Calculate cart totals
    const summary = await cartCalculator.calculate(cart.id, input.idAddressDelivery, input.idCarrier, userId);

    if (summary.items.length === 0) {
      throw AppError.badRequest('El carrito está vacío', ErrorCode.CART_EMPTY);
    }

    await eventBus.emitAsync(HookName.BEFORE_CREATE_ORDER, { userId, cart, summary });

    const order = await sequelize.transaction(async (t) => {
      // Validate stock and create stock movements (order_reserved)
      for (const cartItem of cart.items) {
        const product = await Product.findByPk(cartItem.id_product, { transaction: t, lock: true });
        if (!product) {
          throw AppError.notFound(`Producto #${cartItem.id_product} no encontrado`, ErrorCode.PRODUCT_NOT_FOUND);
        }

        if (cartItem.id_combination) {
          const combination = await ProductCombination.findByPk(cartItem.id_combination, { transaction: t, lock: true });
          if (!combination || combination.quantity < cartItem.quantity) {
            throw AppError.badRequest(
              `Stock insuficiente para la combinación del producto "${product.reference || product.id}"`,
              ErrorCode.PRODUCT_OUT_OF_STOCK,
            );
          }
        } else {
          if (product.quantity < cartItem.quantity) {
            throw AppError.badRequest(
              `Stock insuficiente para "${product.reference || product.id}"`,
              ErrorCode.PRODUCT_OUT_OF_STOCK,
            );
          }
        }
      }

      // Create order
      const reference = generateReference();
      const newOrder = await Order.create(
        {
          reference,
          id_user: userId,
          id_cart: cart.id,
          id_currency: cart.id_currency || 1,
          id_lang: cart.id_lang || 1,
          id_address_delivery: input.idAddressDelivery,
          id_address_invoice: invoiceAddressId,
          id_carrier: input.idCarrier,
          id_order_state: OrderStateId.AWAITING_PAYMENT,
          payment_method: input.paymentMethod,
          total_products: summary.totalProducts,
          total_products_tax: summary.totalProductsTax,
          total_shipping: summary.totalShipping,
          total_shipping_tax: summary.totalShippingTax,
          total_discounts: summary.totalDiscounts,
          total_discounts_tax: summary.totalDiscountsTax,
          total_paid: summary.totalPaid,
          conversion_rate: 1,
          note: input.note ?? null,
        },
        { transaction: t },
      );

      // Create order items
      for (const item of summary.items) {
        const cartItem = cart.items.find((ci) => ci.id === item.id);
        const product = cartItem?.product;
        const translation = product?.translations?.[0];

        await OrderItem.create(
          {
            id_order: newOrder.id,
            id_product: item.idProduct,
            id_combination: item.idCombination,
            product_name: translation?.name ?? item.productName,
            product_reference: product?.reference ?? null,
            product_price: item.productPrice,
            product_price_tax: item.productPriceWithTax,
            quantity: item.quantity,
            tax_rate: item.productPriceWithTax > 0 && item.productPrice > 0
              ? Math.round(((item.productPriceWithTax / item.productPrice) - 1) * 10000) / 100
              : 0,
            total_price: item.totalPriceWithTax,
          },
          { transaction: t },
        );
      }

      // Create order carrier record
      await OrderCarrier.create(
        {
          id_order: newOrder.id,
          id_carrier: input.idCarrier,
          tracking_number: null,
          weight: 0,
          shipping_cost: summary.totalShipping,
          shipping_cost_tax: summary.totalShippingTax,
        },
        { transaction: t },
      );

      // Create initial order history
      await OrderHistory.create(
        {
          id_order: newOrder.id,
          id_order_state: OrderStateId.AWAITING_PAYMENT,
          id_user: null,
          comment: 'Pedido creado',
        },
        { transaction: t },
      );

    // Register stock movements (order_reserved) for each cart item
      for (const cartItem of cart.items) {
        await stockService.move({
          id_product: cartItem.id_product,
          id_combination: cartItem.id_combination ?? null,
          movement_type: 'order_reserved',
          quantity: cartItem.quantity,
          id_order: newOrder.id,
          reason: `Pedido #${newOrder.reference}`,
          transaction: t,
        });
      }

      // Clear cart items
      await CartItem.destroy({ where: { id_cart: cart.id }, transaction: t });

      return newOrder;
    });

    await eventBus.emitAsync(HookName.AFTER_CREATE_ORDER, { order, userId });

    const orderDetail = await this.getById(order.id, userId);

    // Fire-and-forget: send confirmation email (don't block if email fails)
    mailService.sendOrderConfirmation(orderDetail).catch((err) =>
      console.error('[OrderService] Error sending order confirmation email:', err),
    );

    return orderDetail;
  },

  async list(userId: number, query: OrderListQuery) {
    const where: Record<string, unknown> = { id_user: userId };
    if (query.state) where.id_order_state = query.state;

    if (query.dateFrom || query.dateTo) {
      const dateFilter: Record<string | symbol, unknown> = {};
      if (query.dateFrom) dateFilter[Op.gte] = new Date(query.dateFrom);
      if (query.dateTo) dateFilter[Op.lte] = new Date(query.dateTo);
      where.created_at = dateFilter;
    }

    const offset = (query.page - 1) * query.limit;

    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [
        { model: OrderState, as: 'orderState' },
        { model: OrderItem, as: 'items', attributes: ['id'] },
        { model: User, as: 'user', attributes: ['first_name', 'last_name', 'email'] },
      ],
      order: [['created_at', 'DESC']],
      limit: query.limit,
      offset,
      distinct: true,
    });

    return {
      data: rows.map(mapOrderListItem),
      meta: {
        page: query.page,
        perPage: query.limit,
        total: count,
        totalPages: Math.ceil(count / query.limit),
      },
    };
  },

  async adminList(query: OrderListQuery) {
    const where: Record<string, unknown> = {};
    if (query.state) where.id_order_state = query.state;
    if (query.userId) where.id_user = query.userId;


    if (query.dateFrom || query.dateTo) {
      const dateFilter: Record<string | symbol, unknown> = {};
      if (query.dateFrom) dateFilter[Op.gte] = new Date(query.dateFrom);
      if (query.dateTo) dateFilter[Op.lte] = new Date(query.dateTo);
      where.created_at = dateFilter;
    }

    if (query.q) {
      where.reference = { [Op.like]: `%${query.q}%` };
    }

    const offset = (query.page - 1) * query.limit;

    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [
        { model: OrderState, as: 'orderState' },
        { model: OrderItem, as: 'items', attributes: ['id'] },
        { model: User, as: 'user', attributes: ['first_name', 'last_name', 'email'] },
      ],
      order: [['created_at', 'DESC']],
      limit: query.limit,
      offset,
      distinct: true,
    });

    return {
      data: rows.map(mapOrderListItem),
      meta: {
        page: query.page,
        perPage: query.limit,
        total: count,
        totalPages: Math.ceil(count / query.limit),
      },
    };
  },

  async getById(orderId: number, userId?: number) {
    const where: Record<string, unknown> = { id: orderId };
    if (userId) where.id_user = userId;

    const order = await Order.findOne({
      where,
      include: [
        { model: OrderState, as: 'orderState' },
        { model: OrderItem, as: 'items' },
        {
          model: OrderHistory,
          as: 'history',
          include: [
            { model: OrderState, as: 'orderState' },
            { model: User, as: 'user', attributes: ['first_name', 'last_name'] },
          ],
          order: [['created_at', 'DESC']],
        },
        {
          model: OrderPayment,
          as: 'payments',
          include: [{ model: Currency, as: 'currency' }],
        },
        { model: User, as: 'user', attributes: ['first_name', 'last_name', 'email'] },
        {
          model: Address,
          as: 'deliveryAddress',
          include: [
            { model: Country, as: 'country' },
            { model: State, as: 'state' },
          ],
        },
        {
          model: Address,
          as: 'invoiceAddress',
          include: [
            { model: Country, as: 'country' },
            { model: State, as: 'state' },
          ],
        },
        {
          model: Carrier,
          as: 'carrier',
        },
      ],
    });

    if (!order) {
      throw AppError.notFound('Pedido no encontrado', ErrorCode.ORDER_NOT_FOUND);
    }

    // Get order carrier info
    const orderCarrier = await OrderCarrier.findOne({ where: { id_order: orderId } });

    return mapOrderDetail(order, orderCarrier);
  },

  async updateState(orderId: number, input: UpdateOrderStateInput, adminUserId: number) {
    const order = await Order.findByPk(orderId);
    if (!order) {
      throw AppError.notFound('Pedido no encontrado', ErrorCode.ORDER_NOT_FOUND);
    }

    const state = await OrderState.findByPk(input.idOrderState);
    if (!state) {
      throw AppError.badRequest('Estado de pedido inválido', ErrorCode.ORDER_INVALID_STATE);
    }

    const previousStateId = order.id_order_state;
    await order.update({ id_order_state: input.idOrderState });

    await OrderHistory.create({
      id_order: orderId,
      id_order_state: input.idOrderState,
      id_user: adminUserId,
      comment: input.comment ?? null,
    });

    // If transitioning to "Cancelled" state (id 6), restore stock
    const CANCELLED_STATE_ID = 6;
    if (input.idOrderState === CANCELLED_STATE_ID && previousStateId !== CANCELLED_STATE_ID) {
      const items = await OrderItem.findAll({ where: { id_order: orderId } });
      for (const item of items) {
        try {
          await stockService.move({
            id_product: item.id_product,
            id_combination: item.id_combination ?? null,
            movement_type: 'order_cancelled',
            quantity: item.quantity,
            id_order: orderId,
            reason: `Pedido #${order.reference} cancelado`,
          });
        } catch (err) {
          // Log but don't fail the state update if stock restoration fails
          console.warn(`Could not restore stock for order item ${item.id}:`, err);
        }
      }
    }

    const updatedOrder = await this.getById(orderId);

    // Send email if new state has send_email=true
    if (state.send_email) {
      // Build tracking URL if state is "shipped" and there's a tracking number
      let trackingUrl: string | undefined;
      const orderCarrierForEmail = await OrderCarrier.findOne({
        where: { id_order: orderId },
        include: [{ model: Carrier, as: 'carrier' }],
      });
      const trackingNumber = orderCarrierForEmail?.tracking_number ?? undefined;
      if (trackingNumber && (orderCarrierForEmail as any)?.carrier?.url) {
        const carrierUrl = (orderCarrierForEmail as any).carrier.url as string;
        if (carrierUrl.includes('@')) {
          trackingUrl = carrierUrl.replace('@', encodeURIComponent(trackingNumber));
        }
      }

      mailService.sendOrderStatusChange(
        updatedOrder,
        state,
        input.comment ?? undefined,
        trackingUrl,
      ).catch((err) =>
        console.error('[OrderService] Error sending order status email:', err),
      );
    }

    return updatedOrder;
  },

  async registerPayment(orderId: number, input: RegisterPaymentInput, adminUserId?: number) {
    const order = await Order.findByPk(orderId);
    if (!order) {
      throw AppError.notFound('Pedido no encontrado', ErrorCode.ORDER_NOT_FOUND);
    }

    await OrderPayment.create({
      id_order: orderId,
      payment_method: input.paymentMethod,
      transaction_id: input.transactionId ?? null,
      amount: input.amount,
      id_currency: input.idCurrency,
    });

    // If payment covers total, update state to "Payment accepted"
    const totalPayments = await OrderPayment.sum('amount', { where: { id_order: orderId } });
    if (totalPayments >= Number(order.total_paid)) {
      await order.update({ id_order_state: OrderStateId.PAYMENT_ACCEPTED });
      await OrderHistory.create({
        id_order: orderId,
        id_order_state: OrderStateId.PAYMENT_ACCEPTED,
        id_user: adminUserId ?? null,
        comment: 'Pago completo registrado',
      });
    }

    return this.getById(orderId);
  },

  async updateTracking(orderId: number, input: UpdateTrackingInput) {
    const order = await Order.findByPk(orderId, {
      include: [{ model: Carrier, as: 'carrier' }],
    });
    if (!order) {
      throw AppError.notFound('Pedido no encontrado', ErrorCode.ORDER_NOT_FOUND);
    }

    const orderCarrier = await OrderCarrier.findOne({ where: { id_order: orderId } });
    if (orderCarrier) {
      await orderCarrier.update({ tracking_number: input.trackingNumber });
    }

    // Build tracking URL if carrier has a URL with @ placeholder
    const carrier = order.carrier;
    let trackingUrl: string | undefined;
    if (carrier?.url && carrier.url.includes('@') && input.trackingNumber) {
      trackingUrl = carrier.url.replace('@', encodeURIComponent(input.trackingNumber));
    }

    const updatedOrder = await this.getById(orderId);

    // Send tracking email to customer (fire-and-forget)
    if (input.trackingNumber) {
      mailService.sendTrackingUpdate(updatedOrder, input.trackingNumber, trackingUrl).catch((err) =>
        console.error('[OrderService] Error sending tracking email:', err),
      );
    }

    return updatedOrder;
  },

  async getStates() {
    return OrderState.findAll({ order: [['id', 'ASC']] });
  },

  async createState(input: {
    name: string;
    color?: string;
    paid?: boolean;
    shipped?: boolean;
    send_email?: boolean;
    invoice?: boolean;
    icon?: string;
  }) {
    return OrderState.create({
      name: input.name,
      color: input.color ?? '#777777',
      paid: input.paid ?? false,
      shipped: input.shipped ?? false,
      send_email: input.send_email ?? false,
      invoice: input.invoice ?? false,
      icon: input.icon ?? null,
      deleted: false,
    });
  },

  async updateStateConfig(stateId: number, input: {
    name?: string;
    color?: string;
    paid?: boolean;
    shipped?: boolean;
    send_email?: boolean;
    invoice?: boolean;
    icon?: string;
  }) {
    const state = await OrderState.findByPk(stateId);
    if (!state) throw AppError.notFound('Estado no encontrado', ErrorCode.NOT_FOUND);
    await state.update({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.color !== undefined && { color: input.color }),
      ...(input.paid !== undefined && { paid: input.paid }),
      ...(input.shipped !== undefined && { shipped: input.shipped }),
      ...(input.send_email !== undefined && { send_email: input.send_email }),
      ...(input.invoice !== undefined && { invoice: input.invoice }),
      ...(input.icon !== undefined && { icon: input.icon }),
    });
    return state;
  },

  async deleteState(stateId: number) {
    const state = await OrderState.findByPk(stateId);
    if (!state) throw AppError.notFound('Estado no encontrado', ErrorCode.NOT_FOUND);
    // Soft delete
    await state.update({ deleted: true });
  },

  async bulkUpdateState(orderIds: number[], stateId: number, adminUserId: number): Promise<void> {
    const state = await OrderState.findByPk(stateId);
    if (!state) {
      throw AppError.badRequest('Estado de pedido inválido', ErrorCode.ORDER_INVALID_STATE);
    }

    await Promise.all(
      orderIds.map((orderId) =>
        this.updateState(orderId, { idOrderState: stateId }, adminUserId).catch((err) => {
          console.warn(`[bulkUpdateState] Failed for order ${orderId}:`, err.message);
        }),
      ),
    );
  },
};

function mapOrderListItem(order: Order) {
  return {
    id: order.id,
    reference: order.reference,
    customerName: order.user ? `${order.user.first_name} ${order.user.last_name}` : '',
    customerEmail: order.user?.email ?? '',
    stateName: order.orderState?.name ?? '',
    stateColor: order.orderState?.color ?? '#000',
    paymentMethod: order.payment_method,
    totalPaid: Number(order.total_paid),
    itemCount: order.items?.length ?? 0,
    createdAt: order.created_at,
  };
}

function mapOrderDetail(order: Order, orderCarrier: OrderCarrier | null) {
  return {
    id: order.id,
    reference: order.reference,
    idUser: order.id_user,
    customerName: order.user ? `${order.user.first_name} ${order.user.last_name}` : '',
    customerEmail: order.user?.email ?? '',
    idOrderState: order.id_order_state,
    stateName: order.orderState?.name ?? '',
    stateColor: order.orderState?.color ?? '#000',
    paymentMethod: order.payment_method,
    totalProducts: Number(order.total_products),
    totalProductsTax: Number(order.total_products_tax),
    totalShipping: Number(order.total_shipping),
    totalShippingTax: Number(order.total_shipping_tax),
    totalDiscounts: Number(order.total_discounts),
    totalDiscountsTax: Number(order.total_discounts_tax),
    totalPaid: Number(order.total_paid),
    note: order.note,
    deliveryAddress: mapAddress(order.deliveryAddress),
    invoiceAddress: mapAddress(order.invoiceAddress),
    carrier: orderCarrier
      ? {
          id: orderCarrier.id,
          carrierName: order.carrier?.name ?? '',
          carrierUrl: order.carrier?.url ?? null,
          trackingNumber: orderCarrier.tracking_number,
          weight: Number(orderCarrier.weight),
          shippingCost: Number(orderCarrier.shipping_cost),
          shippingCostTax: Number(orderCarrier.shipping_cost_tax),
        }
      : null,
    items: (order.items || []).map((item) => ({
      id: item.id,
      idProduct: item.id_product,
      idCombination: item.id_combination,
      productName: item.product_name,
      productReference: item.product_reference,
      productPrice: Number(item.product_price),
      productPriceTax: Number(item.product_price_tax),
      quantity: item.quantity,
      taxRate: Number(item.tax_rate),
      totalPrice: Number(item.total_price),
    })),
    history: (order.history || []).map((h) => ({
      id: h.id,
      idOrderState: h.id_order_state,
      stateName: h.orderState?.name ?? '',
      stateColor: h.orderState?.color ?? '#000',
      userName: h.user ? `${h.user.first_name} ${h.user.last_name}` : null,
      comment: h.comment,
      createdAt: h.created_at,
    })),
    payments: (order.payments || []).map((p) => ({
      id: p.id,
      paymentMethod: p.payment_method,
      transactionId: p.transaction_id,
      amount: Number(p.amount),
      currencyCode: (p as any).currency?.iso_code ?? 'EUR',
      createdAt: p.created_at,
    })),
    createdAt: order.created_at,
    updatedAt: order.updated_at,
  };
}

function mapAddress(address: Address | null) {
  if (!address) return null;
  return {
    id: address.id,
    alias: address.alias,
    firstName: address.first_name,
    lastName: address.last_name,
    company: address.company,
    address1: address.address1,
    address2: address.address2,
    city: address.city,
    postcode: address.postcode,
    country: address.country?.name ?? '',
    state: address.state?.name ?? null,
    phone: address.phone,
  };
}
