import { Supplier } from '../../models/supplier.model.js';
import { AppError } from '../../utils/app-error.js';
import { ErrorCode } from '@dmshop/shared';
import type { PaginationMeta, CreateSupplierInput, UpdateSupplierInput } from '@dmshop/shared';

export const supplierService = {
  async list(query: Record<string, unknown>) {
    const page = Number(query.page) || 1;
    const perPage = Math.min(Number(query.perPage) || 20, 100);
    const offset = (page - 1) * perPage;

    const where: Record<string, unknown> = {};
    if (query.active !== undefined) where.active = query.active === 'true';

    const { count, rows } = await Supplier.findAndCountAll({
      where,
      limit: perPage,
      offset,
      order: [['name', 'ASC']],
    });

    const meta: PaginationMeta = {
      page,
      perPage,
      total: count,
      totalPages: Math.ceil(count / perPage),
    };

    return { data: rows, meta };
  },

  async getById(id: number) {
    const supplier = await Supplier.findByPk(id);
    if (!supplier) {
      throw AppError.notFound('Proveedor no encontrado', ErrorCode.SUPPLIER_NOT_FOUND);
    }
    return supplier;
  },

  async create(input: CreateSupplierInput) {
    return Supplier.create({
      name: input.name,
      active: input.active ?? true,
    });
  },

  async update(id: number, input: UpdateSupplierInput) {
    const supplier = await Supplier.findByPk(id);
    if (!supplier) {
      throw AppError.notFound('Proveedor no encontrado', ErrorCode.SUPPLIER_NOT_FOUND);
    }

    await supplier.update({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.active !== undefined && { active: input.active }),
    });

    return supplier;
  },

  async remove(id: number) {
    const supplier = await Supplier.findByPk(id);
    if (!supplier) {
      throw AppError.notFound('Proveedor no encontrado', ErrorCode.SUPPLIER_NOT_FOUND);
    }
    await supplier.destroy();
  },
};
