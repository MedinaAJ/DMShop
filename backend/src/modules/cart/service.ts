import { Cart } from '../../models/cart.model.js';
import { CartItem } from '../../models/cart-item.model.js';
import { Product } from '../../models/product.model.js';
import { ProductLang } from '../../models/product-lang.model.js';
import { ProductImage } from '../../models/product-image.model.js';
import { AppError } from '../../utils/app-error.js';
import { ErrorCode, HookName } from '@dmshop/shared';
import { eventBus } from '../../hooks/event-bus.js';

export const cartService = {
  async getOrCreate(userId: number | null) {
    if (userId) {
      let cart = await Cart.findOne({
        where: { id_user: userId },
        include: this.cartItemIncludes(),
        order: [['created_at', 'DESC']],
      });

      if (!cart) {
        cart = await Cart.create({
          id_user: userId,
          id_currency: 1,
          id_lang: 1,
        });
        cart = await Cart.findByPk(cart.id, { include: this.cartItemIncludes() });
      }

      return cart;
    }

    // For guests, cart is managed client-side; this returns an empty structure
    return { id: null, items: [], total: 0 };
  },

  async addItem(
    userId: number | null,
    idProduct: number,
    idCombination: number | null,
    quantity: number,
  ) {
    if (!userId) {
      throw AppError.unauthorized('Debes iniciar sesión para añadir al carrito');
    }

    // Check product exists and has stock
    const product = await Product.findByPk(idProduct);
    if (!product || !product.active) {
      throw AppError.notFound('Producto no encontrado', ErrorCode.PRODUCT_NOT_FOUND);
    }

    if (product.quantity < quantity) {
      throw AppError.badRequest('Stock insuficiente', ErrorCode.PRODUCT_OUT_OF_STOCK);
    }

    await eventBus.emitAsync(HookName.BEFORE_ADD_TO_CART, { userId, idProduct, quantity });

    const cart = (await this.getOrCreate(userId)) as Cart;

    // Check if item already exists in cart
    const existingItem = await CartItem.findOne({
      where: {
        id_cart: cart.id,
        id_product: idProduct,
        id_combination: idCombination,
      },
    });

    if (existingItem) {
      await existingItem.update({ quantity: existingItem.quantity + quantity });
    } else {
      await CartItem.create({
        id_cart: cart.id,
        id_product: idProduct,
        id_combination: idCombination,
        quantity,
      });
    }

    await eventBus.emitAsync(HookName.AFTER_ADD_TO_CART, { userId, idProduct, quantity });

    return this.getOrCreate(userId);
  },

  async updateItem(userId: number | null, cartItemId: number, quantity: number) {
    if (!userId) throw AppError.unauthorized();

    const cart = (await this.getOrCreate(userId)) as Cart;
    const item = await CartItem.findOne({
      where: { id: cartItemId, id_cart: cart.id },
    });

    if (!item) {
      throw AppError.notFound('Item no encontrado en el carrito');
    }

    if (quantity <= 0) {
      await item.destroy();
    } else {
      await item.update({ quantity });
    }

    return this.getOrCreate(userId);
  },

  async removeItem(userId: number | null, cartItemId: number) {
    if (!userId) throw AppError.unauthorized();

    const cart = (await this.getOrCreate(userId)) as Cart;
    const item = await CartItem.findOne({
      where: { id: cartItemId, id_cart: cart.id },
    });

    if (!item) {
      throw AppError.notFound('Item no encontrado en el carrito');
    }

    await item.destroy();
  },

  cartItemIncludes() {
    return [
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
    ];
  },
};
