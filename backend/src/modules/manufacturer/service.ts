import { Manufacturer } from '../../models/manufacturer.model.js';
import { AppError } from '../../utils/app-error.js';
import { ErrorCode } from '@dmshop/shared';
import type {
  PaginationMeta,
  CreateManufacturerInput,
  UpdateManufacturerInput,
} from '@dmshop/shared';

export const manufacturerService = {
  async list(query: Record<string, unknown>) {
    const page = Number(query.page) || 1;
    const perPage = Math.min(Number(query.perPage) || 20, 100);
    const offset = (page - 1) * perPage;

    const where: Record<string, unknown> = {};
    if (query.active !== undefined) where.active = query.active === 'true';

    const { count, rows } = await Manufacturer.findAndCountAll({
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
    const manufacturer = await Manufacturer.findByPk(id);
    if (!manufacturer) {
      throw AppError.notFound('Fabricante no encontrado', ErrorCode.MANUFACTURER_NOT_FOUND);
    }
    return manufacturer;
  },

  async create(input: CreateManufacturerInput) {
    return Manufacturer.create({
      name: input.name,
      active: input.active ?? true,
    });
  },

  async update(id: number, input: UpdateManufacturerInput) {
    const manufacturer = await Manufacturer.findByPk(id);
    if (!manufacturer) {
      throw AppError.notFound('Fabricante no encontrado', ErrorCode.MANUFACTURER_NOT_FOUND);
    }

    await manufacturer.update({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.active !== undefined && { active: input.active }),
    });

    return manufacturer;
  },

  async remove(id: number) {
    const manufacturer = await Manufacturer.findByPk(id);
    if (!manufacturer) {
      throw AppError.notFound('Fabricante no encontrado', ErrorCode.MANUFACTURER_NOT_FOUND);
    }
    await manufacturer.destroy();
  },
};
