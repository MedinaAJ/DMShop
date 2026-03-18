import { vi, describe, it, expect, beforeEach } from 'vitest';

// ── Mock models & dependencies ─────────────────────────────────────────────
vi.mock('../../models/product.model.js', () => ({
  Product: {
    findByPk: vi.fn(),
  },
}));
vi.mock('../../models/product-combination.model.js', () => ({
  ProductCombination: {
    findByPk: vi.fn(),
    findOne: vi.fn(),
  },
}));
vi.mock('../../models/product-lang.model.js', () => ({ ProductLang: {} }));
vi.mock('../../models/stock-movement.model.js', () => ({
  StockMovement: {
    create: vi.fn(),
    findAndCountAll: vi.fn(),
  },
  StockMovementType: {},
}));
vi.mock('../../utils/app-error.js', () => ({
  AppError: {
    notFound: vi.fn((msg: string, code?: string) => Object.assign(new Error(msg), { statusCode: 404, code })),
    badRequest: vi.fn((msg: string, code?: string) => Object.assign(new Error(msg), { statusCode: 400, code })),
  },
}));

import { Product } from '../../models/product.model.js';
import { ProductCombination } from '../../models/product-combination.model.js';
import { StockMovement } from '../../models/stock-movement.model.js';
import { sequelize } from '../../config/database.js';
import { stockService } from './stock.service.js';

// ── Helpers ────────────────────────────────────────────────────────────────

function makeProduct(id: number, quantity: number) {
  const prod = {
    id,
    quantity,
    reference: `REF-${id}`,
    update: vi.fn().mockImplementation(function (this: any, data: any) {
      Object.assign(this, data);
      return Promise.resolve(this);
    }),
  };
  return prod;
}

function makeCombination(id: number, idProduct: number, quantity: number) {
  const combo = {
    id,
    id_product: idProduct,
    quantity,
    reference: `COMBO-${id}`,
    update: vi.fn().mockImplementation(function (this: any, data: any) {
      Object.assign(this, data);
      return Promise.resolve(this);
    }),
  };
  return combo;
}

function makeMovement(overrides: object = {}) {
  return { id: 1, ...overrides };
}

// ── move — product without combination ─────────────────────────────────────

describe('stockService.move — sin combinación', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Make sequelize.transaction call the callback directly with a fake transaction
    vi.mocked(sequelize.transaction).mockImplementation(async (cb: Function) => cb({}));
  });

  it('movement_type=out → decrementa stock del producto', async () => {
    const product = makeProduct(1, 50);
    vi.mocked(Product.findByPk).mockResolvedValue(product as any);
    vi.mocked(StockMovement.create).mockResolvedValue(makeMovement({ stock_before: 50, stock_after: 45 }) as any);

    await stockService.move({ id_product: 1, movement_type: 'out', quantity: 5 });

    expect(product.update).toHaveBeenCalledWith({ quantity: 45 }, expect.anything());
  });

  it('movement_type=in → incrementa stock del producto', async () => {
    const product = makeProduct(1, 20);
    vi.mocked(Product.findByPk).mockResolvedValue(product as any);
    vi.mocked(StockMovement.create).mockResolvedValue(makeMovement({ stock_before: 20, stock_after: 30 }) as any);

    await stockService.move({ id_product: 1, movement_type: 'in', quantity: 10 });

    expect(product.update).toHaveBeenCalledWith({ quantity: 30 }, expect.anything());
  });

  it('movement_type=order_reserved → decrementa stock', async () => {
    const product = makeProduct(1, 10);
    vi.mocked(Product.findByPk).mockResolvedValue(product as any);
    vi.mocked(StockMovement.create).mockResolvedValue(makeMovement() as any);

    await stockService.move({ id_product: 1, movement_type: 'order_reserved', quantity: 3 });

    expect(product.update).toHaveBeenCalledWith({ quantity: 7 }, expect.anything());
  });

  it('stock insuficiente → lanza OUT_OF_STOCK', async () => {
    const product = makeProduct(1, 2);
    vi.mocked(Product.findByPk).mockResolvedValue(product as any);

    await expect(
      stockService.move({ id_product: 1, movement_type: 'out', quantity: 10 }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('producto no encontrado → lanza 404', async () => {
    vi.mocked(Product.findByPk).mockResolvedValue(null);

    await expect(
      stockService.move({ id_product: 999, movement_type: 'out', quantity: 1 }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('crea un StockMovement con los datos correctos', async () => {
    const product = makeProduct(5, 100);
    vi.mocked(Product.findByPk).mockResolvedValue(product as any);
    const movement = makeMovement({ id_product: 5, stock_before: 100, stock_after: 90 });
    vi.mocked(StockMovement.create).mockResolvedValue(movement as any);

    const result = await stockService.move({ id_product: 5, movement_type: 'out', quantity: 10 });

    expect(StockMovement.create).toHaveBeenCalledWith(
      expect.objectContaining({ id_product: 5, movement_type: 'out', quantity: 10 }),
      expect.anything(),
    );
    expect(result).toEqual(movement);
  });
});

// ── move — product with combination ───────────────────────────────────────

describe('stockService.move — con combinación', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(sequelize.transaction).mockImplementation(async (cb: Function) => cb({}));
  });

  it('movement_type=out → decrementa stock de la combinación', async () => {
    const combo = makeCombination(10, 1, 30);
    vi.mocked(ProductCombination.findByPk).mockResolvedValue(combo as any);
    vi.mocked(StockMovement.create).mockResolvedValue(makeMovement() as any);

    await stockService.move({ id_product: 1, id_combination: 10, movement_type: 'out', quantity: 5 });

    expect(combo.update).toHaveBeenCalledWith({ quantity: 25 }, expect.anything());
  });

  it('stock de combinación insuficiente → lanza OUT_OF_STOCK', async () => {
    const combo = makeCombination(10, 1, 2);
    vi.mocked(ProductCombination.findByPk).mockResolvedValue(combo as any);

    await expect(
      stockService.move({ id_product: 1, id_combination: 10, movement_type: 'out', quantity: 5 }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('combinación no encontrada → lanza 404', async () => {
    vi.mocked(ProductCombination.findByPk).mockResolvedValue(null);

    await expect(
      stockService.move({ id_product: 1, id_combination: 999, movement_type: 'out', quantity: 1 }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('movement_type=order_cancelled → incrementa stock de la combinación', async () => {
    const combo = makeCombination(10, 1, 5);
    vi.mocked(ProductCombination.findByPk).mockResolvedValue(combo as any);
    vi.mocked(StockMovement.create).mockResolvedValue(makeMovement() as any);

    await stockService.move({ id_product: 1, id_combination: 10, movement_type: 'order_cancelled', quantity: 3 });

    expect(combo.update).toHaveBeenCalledWith({ quantity: 8 }, expect.anything());
  });
});

// ── adjustStock ────────────────────────────────────────────────────────────

describe('stockService.adjustStock', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(sequelize.transaction).mockImplementation(async (cb: Function) => cb({}));
  });

  it('ajuste de producto sin combinación → fija cantidad absoluta', async () => {
    const product = makeProduct(1, 50);
    vi.mocked(Product.findByPk).mockResolvedValue(product as any);
    vi.mocked(StockMovement.create).mockResolvedValue(makeMovement() as any);

    await stockService.adjustStock(1, null, 100, 'Inventario físico');

    expect(product.update).toHaveBeenCalledWith({ quantity: 100 }, expect.anything());
    expect(StockMovement.create).toHaveBeenCalledWith(
      expect.objectContaining({ movement_type: 'adjustment', stock_after: 100 }),
      expect.anything(),
    );
  });

  it('ajuste de combinación → fija cantidad absoluta en la combinación', async () => {
    const combo = makeCombination(5, 1, 10);
    vi.mocked(ProductCombination.findOne).mockResolvedValue(combo as any);
    vi.mocked(StockMovement.create).mockResolvedValue(makeMovement() as any);

    await stockService.adjustStock(1, 5, 25, 'Ajuste manual');

    expect(combo.update).toHaveBeenCalledWith({ quantity: 25 }, expect.anything());
  });
});
