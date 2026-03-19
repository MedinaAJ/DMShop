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
    vi.mocked(sequelize.transaction).mockImplementation(async (cb: Function) => cb({}) as any);
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
    vi.mocked(sequelize.transaction).mockImplementation(async (cb: Function) => cb({}) as any);
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
    vi.mocked(sequelize.transaction).mockImplementation(async (cb: Function) => cb({}) as any);
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

// ── BLOQUE 7: decrementStock — casos de precisión ─────────────────────────

describe('decrementStock — casos de precisión', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(sequelize.transaction).mockImplementation(async (cb: Function) => cb({}) as any);
  });

  it('decrementar stock a exactamente 0 → no lanza error', async () => {
    // stock=5, decremento=5 → stockAfter=0 → 0 >= 0 → no lanza
    const product = makeProduct(1, 5);
    vi.mocked(Product.findByPk).mockResolvedValue(product as any);
    vi.mocked(StockMovement.create).mockResolvedValue(makeMovement({ stock_before: 5, stock_after: 0 }) as any);

    await expect(
      stockService.move({ id_product: 1, movement_type: 'out', quantity: 5 }),
    ).resolves.not.toThrow();
    expect(product.update).toHaveBeenCalledWith({ quantity: 0 }, expect.anything());
  });

  it('decrementar 0 unidades → stock no cambia', async () => {
    // quantity=0, movement_type='out' → delta = -0 = 0 → stockAfter = stockBefore
    const product = makeProduct(1, 10);
    vi.mocked(Product.findByPk).mockResolvedValue(product as any);
    vi.mocked(StockMovement.create).mockResolvedValue(makeMovement({ stock_before: 10, stock_after: 10 }) as any);

    await stockService.move({ id_product: 1, movement_type: 'out', quantity: 0 });

    expect(product.update).toHaveBeenCalledWith({ quantity: 10 }, expect.anything());
  });

  it('decrementar cantidad decimal (0.5 uds) — documenta comportamiento', async () => {
    // No debería ocurrir en producción (cantidades son enteros), pero el código no lo valida.
    // delta = -0.5, stockAfter = 10 - 0.5 = 9.5 → update con 9.5 (sin redondear)
    const product = makeProduct(1, 10);
    vi.mocked(Product.findByPk).mockResolvedValue(product as any);
    vi.mocked(StockMovement.create).mockResolvedValue(makeMovement({ stock_before: 10, stock_after: 9.5 }) as any);

    // No hay validación de tipo entero → acepta decimales silenciosamente
    await stockService.move({ id_product: 1, movement_type: 'out', quantity: 0.5 });

    expect(product.update).toHaveBeenCalledWith({ quantity: 9.5 }, expect.anything());
  });

  it('dos decrementos consecutivos suman correctamente (stock=10, -3, -4 → 3)', async () => {
    // Primer movimiento: 10 - 3 = 7
    const product = makeProduct(1, 10);
    vi.mocked(Product.findByPk).mockResolvedValue(product as any);
    vi.mocked(StockMovement.create).mockResolvedValue(makeMovement() as any);

    await stockService.move({ id_product: 1, movement_type: 'out', quantity: 3 });
    expect(product.update).toHaveBeenCalledWith({ quantity: 7 }, expect.anything());

    // Segundo movimiento: simulamos el producto con stock actualizado a 7
    product.quantity = 7;
    vi.mocked(Product.findByPk).mockResolvedValue(product as any);

    await stockService.move({ id_product: 1, movement_type: 'out', quantity: 4 });
    expect(product.update).toHaveBeenCalledWith({ quantity: 3 }, expect.anything());
  });

  it('incrementar stock desde 0 → funciona sin error', async () => {
    // stock=0, movement_type='in', quantity=10 → stockAfter=10
    const product = makeProduct(1, 0);
    vi.mocked(Product.findByPk).mockResolvedValue(product as any);
    vi.mocked(StockMovement.create).mockResolvedValue(makeMovement({ stock_before: 0, stock_after: 10 }) as any);

    await stockService.move({ id_product: 1, movement_type: 'in', quantity: 10 });

    expect(product.update).toHaveBeenCalledWith({ quantity: 10 }, expect.anything());
  });
});

// ── BLOQUE 7b: adjustStock — casos adicionales ────────────────────────────

describe('adjustStock — casos adicionales', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(sequelize.transaction).mockImplementation(async (cb: Function) => cb({}) as any);
  });

  it('ajuste directo a una cantidad específica (diferente del actual)', async () => {
    // stock=50, ajuste a 75 → update({ quantity: 75 })
    const product = makeProduct(1, 50);
    vi.mocked(Product.findByPk).mockResolvedValue(product as any);
    vi.mocked(StockMovement.create).mockResolvedValue(makeMovement() as any);

    await stockService.adjustStock(1, null, 75, 'Ajuste inventario');

    expect(product.update).toHaveBeenCalledWith({ quantity: 75 }, expect.anything());
    expect(StockMovement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        movement_type: 'adjustment',
        stock_before: 50,
        stock_after: 75,
        quantity: 25, // |75 - 50| = 25
      }),
      expect.anything(),
    );
  });

  it('ajuste a 0 → stock=0', async () => {
    // stock=30, ajuste a 0 → update({ quantity: 0 })
    const product = makeProduct(1, 30);
    vi.mocked(Product.findByPk).mockResolvedValue(product as any);
    vi.mocked(StockMovement.create).mockResolvedValue(makeMovement() as any);

    await stockService.adjustStock(1, null, 0, 'Liquidación total');

    expect(product.update).toHaveBeenCalledWith({ quantity: 0 }, expect.anything());
    expect(StockMovement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        stock_after: 0,
        quantity: 30, // |0 - 30| = 30
      }),
      expect.anything(),
    );
  });

  it('ajuste cuando stock actual = nueva cantidad → quantity del movimiento = 0', async () => {
    // stock=20, ajuste a 20 → delta = 0 → movement.quantity = |20-20| = 0
    const product = makeProduct(1, 20);
    vi.mocked(Product.findByPk).mockResolvedValue(product as any);
    vi.mocked(StockMovement.create).mockResolvedValue(makeMovement() as any);

    await stockService.adjustStock(1, null, 20, 'Sin cambio');

    expect(product.update).toHaveBeenCalledWith({ quantity: 20 }, expect.anything());
    expect(StockMovement.create).toHaveBeenCalledWith(
      expect.objectContaining({ quantity: 0 }),
      expect.anything(),
    );
  });

  it('producto no encontrado en adjustStock → lanza 404', async () => {
    vi.mocked(Product.findByPk).mockResolvedValue(null);

    await expect(
      stockService.adjustStock(999, null, 10, 'Ajuste'),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('combinación no encontrada en adjustStock → lanza 404', async () => {
    vi.mocked(ProductCombination.findOne).mockResolvedValue(null);

    await expect(
      stockService.adjustStock(1, 999, 10, 'Ajuste combo'),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});
