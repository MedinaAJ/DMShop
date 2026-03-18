import { Carrier } from '../../models/carrier.model.js';
import { CarrierZone } from '../../models/carrier-zone.model.js';
import { CarrierRange } from '../../models/carrier-range.model.js';
import { CarrierRangePrice } from '../../models/carrier-range-price.model.js';
import { Zone } from '../../models/zone.model.js';
import { AppError } from '../../utils/app-error.js';
import { ErrorCode } from '@dmshop/shared';
import type { PaginationMeta, CreateCarrierInput, UpdateCarrierInput } from '@dmshop/shared';

export const carrierService = {
  async list(query: Record<string, unknown>) {
    const page = Number(query.page) || 1;
    const perPage = Math.min(Number(query.perPage) || 20, 100);
    const offset = (page - 1) * perPage;

    const where: Record<string, unknown> = {};
    if (query.active !== undefined) where.active = query.active === 'true';

    const { count, rows } = await Carrier.findAndCountAll({
      where,
      include: [{ model: Zone, as: 'zones' }],
      limit: perPage,
      offset,
      order: [['grade', 'ASC']],
      distinct: true,
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
    const carrier = await Carrier.findByPk(id, {
      include: [
        { model: Zone, as: 'zones' },
        {
          model: CarrierRange,
          as: 'ranges',
          include: [{ model: CarrierRangePrice, as: 'prices' }],
        },
      ],
    });

    if (!carrier) {
      throw AppError.notFound('Transportista no encontrado', ErrorCode.CARRIER_NOT_FOUND);
    }

    return carrier;
  },

  async create(input: CreateCarrierInput) {
    const carrier = await Carrier.create({
      name: input.name,
      id_tax_rules_group: input.idTaxRulesGroup ?? null,
      url: input.url ?? null,
      active: input.active ?? true,
      is_free: input.isFree ?? false,
      shipping_method: input.shippingMethod ?? 'price',
      max_width: input.maxWidth ?? 0,
      max_height: input.maxHeight ?? 0,
      max_depth: input.maxDepth ?? 0,
      max_weight: input.maxWeight ?? 0,
      grade: input.grade ?? 0,
      delay: input.delay ?? 0,
      free_shipping_starts_at: (input as any).freeShippingStartsAt ?? null,
    });

    // Assign zones
    if (input.zones?.length) {
      for (const idZone of input.zones) {
        await CarrierZone.create({ id_carrier: carrier.id, id_zone: idZone });
      }
    }

    // Create ranges with prices
    if (input.ranges?.length) {
      for (const rangeInput of input.ranges) {
        const range = await CarrierRange.create({
          id_carrier: carrier.id,
          delimiter1: rangeInput.delimiter1,
          delimiter2: rangeInput.delimiter2,
        });

        for (const priceInput of rangeInput.prices) {
          await CarrierRangePrice.create({
            id_carrier_range: range.id,
            id_zone: priceInput.idZone,
            price: priceInput.price,
          });
        }
      }
    }

    return this.getById(carrier.id);
  },

  async update(id: number, input: UpdateCarrierInput) {
    const carrier = await Carrier.findByPk(id);
    if (!carrier) {
      throw AppError.notFound('Transportista no encontrado', ErrorCode.CARRIER_NOT_FOUND);
    }

    await carrier.update({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.idTaxRulesGroup !== undefined && { id_tax_rules_group: input.idTaxRulesGroup }),
      ...(input.url !== undefined && { url: input.url }),
      ...(input.active !== undefined && { active: input.active }),
      ...(input.isFree !== undefined && { is_free: input.isFree }),
      ...(input.shippingMethod !== undefined && { shipping_method: input.shippingMethod }),
      ...(input.maxWidth !== undefined && { max_width: input.maxWidth }),
      ...(input.maxHeight !== undefined && { max_height: input.maxHeight }),
      ...(input.maxDepth !== undefined && { max_depth: input.maxDepth }),
      ...(input.maxWeight !== undefined && { max_weight: input.maxWeight }),
      ...(input.grade !== undefined && { grade: input.grade }),
      ...(input.delay !== undefined && { delay: input.delay }),
      ...((input as any).freeShippingStartsAt !== undefined && { free_shipping_starts_at: (input as any).freeShippingStartsAt }),
    });

    // Update zones if provided
    if (input.zones !== undefined) {
      await CarrierZone.destroy({ where: { id_carrier: id } });
      for (const idZone of input.zones) {
        await CarrierZone.create({ id_carrier: id, id_zone: idZone });
      }
    }

    // Update ranges if provided
    if (input.ranges !== undefined) {
      const existingRanges = await CarrierRange.findAll({ where: { id_carrier: id } });
      for (const range of existingRanges) {
        await CarrierRangePrice.destroy({ where: { id_carrier_range: range.id } });
      }
      await CarrierRange.destroy({ where: { id_carrier: id } });

      for (const rangeInput of input.ranges) {
        const range = await CarrierRange.create({
          id_carrier: id,
          delimiter1: rangeInput.delimiter1,
          delimiter2: rangeInput.delimiter2,
        });

        for (const priceInput of rangeInput.prices) {
          await CarrierRangePrice.create({
            id_carrier_range: range.id,
            id_zone: priceInput.idZone,
            price: priceInput.price,
          });
        }
      }
    }

    return this.getById(id);
  },

  async remove(id: number) {
    const carrier = await Carrier.findByPk(id);
    if (!carrier) {
      throw AppError.notFound('Transportista no encontrado', ErrorCode.CARRIER_NOT_FOUND);
    }
    await carrier.destroy();
  },

  async getAvailable(idZone?: number) {
    const where: Record<string, unknown> = { active: true };

    const include: any[] = [{ model: Zone, as: 'zones' }];

    const carriers = await Carrier.findAll({ where, include, order: [['grade', 'ASC']] });

    if (idZone) {
      return carriers.filter((c: any) => c.zones?.some((z: any) => z.id === idZone));
    }

    return carriers;
  },
};
