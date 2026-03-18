import { Wishlist } from '../../models/wishlist.model.js';
import { WishlistItem } from '../../models/wishlist-item.model.js';
import { Product } from '../../models/product.model.js';
import { ProductLang } from '../../models/product-lang.model.js';
import { ProductImage } from '../../models/product-image.model.js';
import { AppError } from '../../utils/app-error.js';
import { env } from '../../config/env.js';

function formatImageUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${env.APP_URL}/${path.replace(/^\//, '')}`;
}

export const wishlistService = {
  async getOrCreateWishlist(userId: number): Promise<Wishlist> {
    let wishlist = await Wishlist.findOne({
      where: { id_user: userId },
      include: [
        {
          model: WishlistItem,
          include: [
            {
              model: Product,
              include: [
                { model: ProductLang },
                { model: ProductImage, where: { cover: true }, required: false },
              ],
            },
          ],
        },
      ],
    });

    if (!wishlist) {
      wishlist = await Wishlist.create({ id_user: userId, name: 'Mi lista de deseos' });
      wishlist = await Wishlist.findOne({
        where: { id_user: userId },
        include: [
          {
            model: WishlistItem,
            include: [
              {
                model: Product,
                include: [
                  { model: ProductLang },
                  { model: ProductImage, where: { cover: true }, required: false },
                ],
              },
            ],
          },
        ],
      }) as Wishlist;
    }

    return wishlist;
  },

  formatWishlist(wishlist: Wishlist) {
    const items = ((wishlist as any).items ?? []).map((item: any) => {
      const product = item.product;
      const lang = product?.translations?.[0] ?? {};
      const coverImage = product?.images?.[0] ?? null;
      return {
        id_product: item.id_product,
        id_combination: item.id_combination ?? null,
        created_at: item.created_at,
        product: {
          id: product?.id,
          name: lang.name ?? '',
          slug: lang.slug ?? '',
          price: Number(product?.price ?? 0),
          quantity: product?.quantity ?? 0,
          active: product?.active ?? false,
          coverImage: coverImage ? formatImageUrl(coverImage.path) : null,
        },
      };
    });

    return {
      id: wishlist.id,
      name: wishlist.name,
      items,
    };
  },

  async addItem(userId: number, idProduct: number, idCombination?: number | null) {
    const wishlist = await this.getOrCreateWishlist(userId);

    const [item] = await WishlistItem.findOrCreate({
      where: {
        id_wishlist: wishlist.id,
        id_product: idProduct,
        id_combination: idCombination ?? null,
      },
      defaults: {
        id_wishlist: wishlist.id,
        id_product: idProduct,
        id_combination: idCombination ?? null,
      },
    });

    return item;
  },

  async removeItem(userId: number, idProduct: number) {
    const wishlist = await Wishlist.findOne({ where: { id_user: userId } });
    if (!wishlist) {
      throw AppError.notFound('Wishlist no encontrada');
    }

    await WishlistItem.destroy({
      where: {
        id_wishlist: wishlist.id,
        id_product: idProduct,
      },
    });
  },

  async checkItem(userId: number, idProduct: number): Promise<boolean> {
    const wishlist = await Wishlist.findOne({ where: { id_user: userId } });
    if (!wishlist) return false;

    const item = await WishlistItem.findOne({
      where: { id_wishlist: wishlist.id, id_product: idProduct },
    });

    return !!item;
  },
};
