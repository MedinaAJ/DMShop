import { vi, describe, it, expect, beforeEach } from 'vitest';

// ── Mock models & dependencies ─────────────────────────────────────────────
vi.mock('../../models/wishlist.model.js', () => ({
  Wishlist: {
    findOne: vi.fn(),
    create: vi.fn(),
    findAll: vi.fn(),
  },
}));
vi.mock('../../models/wishlist-item.model.js', () => ({
  WishlistItem: {
    findOrCreate: vi.fn(),
    findOne: vi.fn(),
    destroy: vi.fn(),
  },
}));
vi.mock('../../models/product.model.js', () => ({ Product: {} }));
vi.mock('../../models/product-lang.model.js', () => ({ ProductLang: {} }));
vi.mock('../../models/product-image.model.js', () => ({ ProductImage: {} }));
vi.mock('../../utils/app-error.js', () => ({
  AppError: {
    notFound: vi.fn((msg: string, code?: string) => Object.assign(new Error(msg), { statusCode: 404, code })),
    badRequest: vi.fn((msg: string, code?: string) => Object.assign(new Error(msg), { statusCode: 400, code })),
  },
}));

import { Wishlist } from '../../models/wishlist.model.js';
import { WishlistItem } from '../../models/wishlist-item.model.js';
import { wishlistService } from './service.js';

// ── Helpers ────────────────────────────────────────────────────────────────

function makeWishlist(overrides: object = {}) {
  return {
    id: 1,
    id_user: 42,
    name: 'Mi lista de deseos',
    token: null,
    items: [],
    update: vi.fn().mockImplementation(function (this: any, data: any) {
      Object.assign(this, data);
      return Promise.resolve(this);
    }),
    ...overrides,
  };
}

// ── shareWishlist ──────────────────────────────────────────────────────────

describe('wishlistService.shareWishlist', () => {
  beforeEach(() => vi.clearAllMocks());

  it('wishlist no encontrada → lanza 404', async () => {
    vi.mocked(Wishlist.findOne).mockResolvedValue(null);

    await expect(wishlistService.shareWishlist(42, 999)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('sin token previo → genera token y lo guarda', async () => {
    const wishlist = makeWishlist({ token: null });
    vi.mocked(Wishlist.findOne).mockResolvedValue(wishlist as any);

    const result = await wishlistService.shareWishlist(42, 1);

    expect(wishlist.update).toHaveBeenCalled();
    expect(result.shareUrl).toContain('/wishlist/shared/');
  });

  it('ya tiene token → devuelve mismo shareUrl sin regenerar', async () => {
    const existingToken = 'existing-token-abc123';
    const wishlist = makeWishlist({ token: existingToken });
    vi.mocked(Wishlist.findOne).mockResolvedValue(wishlist as any);

    const result = await wishlistService.shareWishlist(42, 1);

    // Token should not be regenerated (update should not be called for token)
    expect(result.shareUrl).toContain(existingToken);
  });
});

// ── getSharedWishlist ──────────────────────────────────────────────────────

describe('wishlistService.getSharedWishlist', () => {
  beforeEach(() => vi.clearAllMocks());

  it('token inválido → lanza 404', async () => {
    vi.mocked(Wishlist.findOne).mockResolvedValue(null);

    await expect(wishlistService.getSharedWishlist('invalid-token')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('token válido → devuelve wishlist con items', async () => {
    const wishlist = makeWishlist({
      token: 'valid-token-xyz',
      items: [
        {
          id_product: 5,
          id_combination: null,
          product: {
            id: 5,
            price: 29.99,
            quantity: 10,
            active: true,
            translations: [{ name: 'Producto Test', slug: 'producto-test' }],
            images: [{ path: '/uploads/product-5.jpg', cover: true }],
          },
        },
      ],
    });
    vi.mocked(Wishlist.findOne).mockResolvedValue(wishlist as any);

    const result = await wishlistService.getSharedWishlist('valid-token-xyz');

    expect(result).toBeDefined();
    expect(result.id).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].id_product).toBe(5);
  });

  it('devuelve items con datos del producto formateados', async () => {
    const wishlist = makeWishlist({
      token: 'token-test',
      items: [
        {
          id_product: 3,
          id_combination: null,
          product: {
            id: 3,
            price: 15.5,
            quantity: 5,
            active: true,
            translations: [{ name: 'Camisa', slug: 'camisa' }],
            images: [],
          },
        },
      ],
    });
    vi.mocked(Wishlist.findOne).mockResolvedValue(wishlist as any);

    const result = await wishlistService.getSharedWishlist('token-test');

    const item = result.items[0];
    expect(item.product.name).toBe('Camisa');
    expect(item.product.price).toBe(15.5);
    expect(item.product.coverImage).toBeNull();
  });
});

// ── getOrCreateWishlist ────────────────────────────────────────────────────

describe('wishlistService.getOrCreateWishlist', () => {
  beforeEach(() => vi.clearAllMocks());

  it('wishlist existente → la devuelve sin crear nueva', async () => {
    const wishlist = makeWishlist();
    vi.mocked(Wishlist.findOne).mockResolvedValue(wishlist as any);

    const result = await wishlistService.getOrCreateWishlist(42);

    expect(result).toBe(wishlist);
    expect(Wishlist.create).not.toHaveBeenCalled();
  });

  it('no existe → crea nueva wishlist', async () => {
    const newWishlist = makeWishlist({ id: 2, id_user: 99 });
    // First findOne returns null (not found), second returns the created one
    vi.mocked(Wishlist.findOne)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(newWishlist as any);
    vi.mocked(Wishlist.create).mockResolvedValue(newWishlist as any);

    const result = await wishlistService.getOrCreateWishlist(99);

    expect(Wishlist.create).toHaveBeenCalledWith({ id_user: 99, name: 'Mi lista de deseos' });
    expect(result).toBe(newWishlist);
  });
});

// ── addItem ────────────────────────────────────────────────────────────────

describe('wishlistService.addItem', () => {
  beforeEach(() => vi.clearAllMocks());

  it('añade producto a la wishlist', async () => {
    const wishlist = makeWishlist();
    vi.mocked(Wishlist.findOne).mockResolvedValue(wishlist as any);
    const newItem = { id: 10, id_wishlist: 1, id_product: 7 };
    vi.mocked(WishlistItem.findOrCreate).mockResolvedValue([newItem as any, true]);

    const result = await wishlistService.addItem(42, 7);

    expect(WishlistItem.findOrCreate).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ id_product: 7 }) }),
    );
    expect(result).toBe(newItem);
  });
});

// ── checkItem ─────────────────────────────────────────────────────────────

describe('wishlistService.checkItem', () => {
  beforeEach(() => vi.clearAllMocks());

  it('producto en wishlist → devuelve true', async () => {
    vi.mocked(Wishlist.findOne).mockResolvedValue(makeWishlist() as any);
    vi.mocked(WishlistItem.findOne).mockResolvedValue({ id: 1 } as any);

    const result = await wishlistService.checkItem(42, 5);

    expect(result).toBe(true);
  });

  it('producto no en wishlist → devuelve false', async () => {
    vi.mocked(Wishlist.findOne).mockResolvedValue(makeWishlist() as any);
    vi.mocked(WishlistItem.findOne).mockResolvedValue(null);

    const result = await wishlistService.checkItem(42, 99);

    expect(result).toBe(false);
  });

  it('wishlist no existe → devuelve false', async () => {
    vi.mocked(Wishlist.findOne).mockResolvedValue(null);

    const result = await wishlistService.checkItem(42, 5);

    expect(result).toBe(false);
  });
});
