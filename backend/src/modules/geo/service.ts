import { Zone } from '../../models/zone.model.js';
import { Country } from '../../models/country.model.js';
import { State } from '../../models/state.model.js';
import { AppError } from '../../utils/app-error.js';
import { ErrorCode } from '@dmshop/shared';
import type {
  CreateZoneInput,
  UpdateZoneInput,
  CreateCountryInput,
  UpdateCountryInput,
  CreateStateInput,
  UpdateStateInput,
} from '@dmshop/shared';

export const geoService = {
  // Zones
  async listZones() {
    return Zone.findAll({ order: [['name', 'ASC']] });
  },

  async createZone(input: CreateZoneInput) {
    return Zone.create({ name: input.name, active: input.active ?? true });
  },

  async updateZone(id: number, input: UpdateZoneInput) {
    const zone = await Zone.findByPk(id);
    if (!zone) {
      throw AppError.notFound('Zona no encontrada', ErrorCode.ZONE_NOT_FOUND);
    }
    await zone.update({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.active !== undefined && { active: input.active }),
    });
    return zone;
  },

  async removeZone(id: number) {
    const zone = await Zone.findByPk(id);
    if (!zone) {
      throw AppError.notFound('Zona no encontrada', ErrorCode.ZONE_NOT_FOUND);
    }
    await zone.destroy();
  },

  // Countries
  async listCountries(query: Record<string, unknown>) {
    const where: Record<string, unknown> = {};
    if (query.active !== undefined) where.active = query.active === 'true';
    if (query.idZone) where.id_zone = Number(query.idZone);

    return Country.findAll({
      where,
      include: [{ model: Zone, as: 'zone' }],
      order: [['name', 'ASC']],
    });
  },

  async getCountryById(id: number) {
    const country = await Country.findByPk(id, {
      include: [
        { model: Zone, as: 'zone' },
        { model: State, as: 'states' },
      ],
    });
    if (!country) {
      throw AppError.notFound('País no encontrado', ErrorCode.COUNTRY_NOT_FOUND);
    }
    return country;
  },

  async createCountry(input: CreateCountryInput) {
    return Country.create({
      id_zone: input.idZone,
      iso_code: input.isoCode,
      name: input.name,
      active: input.active ?? true,
      contains_states: input.containsStates ?? false,
    });
  },

  async updateCountry(id: number, input: UpdateCountryInput) {
    const country = await Country.findByPk(id);
    if (!country) {
      throw AppError.notFound('País no encontrado', ErrorCode.COUNTRY_NOT_FOUND);
    }
    await country.update({
      ...(input.idZone !== undefined && { id_zone: input.idZone }),
      ...(input.isoCode !== undefined && { iso_code: input.isoCode }),
      ...(input.name !== undefined && { name: input.name }),
      ...(input.active !== undefined && { active: input.active }),
      ...(input.containsStates !== undefined && { contains_states: input.containsStates }),
    });
    return country;
  },

  async removeCountry(id: number) {
    const country = await Country.findByPk(id);
    if (!country) {
      throw AppError.notFound('País no encontrado', ErrorCode.COUNTRY_NOT_FOUND);
    }
    await country.destroy();
  },

  // States
  async listStates(query: Record<string, unknown>) {
    const where: Record<string, unknown> = {};
    if (query.active !== undefined) where.active = query.active === 'true';
    if (query.idCountry) where.id_country = Number(query.idCountry);

    return State.findAll({
      where,
      include: [{ model: Country, as: 'country' }],
      order: [['name', 'ASC']],
    });
  },

  async createState(input: CreateStateInput) {
    return State.create({
      id_country: input.idCountry,
      iso_code: input.isoCode,
      name: input.name,
      active: input.active ?? true,
    });
  },

  async updateState(id: number, input: UpdateStateInput) {
    const state = await State.findByPk(id);
    if (!state) {
      throw AppError.notFound('Provincia/Estado no encontrado', ErrorCode.STATE_NOT_FOUND);
    }
    await state.update({
      ...(input.idCountry !== undefined && { id_country: input.idCountry }),
      ...(input.isoCode !== undefined && { iso_code: input.isoCode }),
      ...(input.name !== undefined && { name: input.name }),
      ...(input.active !== undefined && { active: input.active }),
    });
    return state;
  },

  async removeState(id: number) {
    const state = await State.findByPk(id);
    if (!state) {
      throw AppError.notFound('Provincia/Estado no encontrado', ErrorCode.STATE_NOT_FOUND);
    }
    await state.destroy();
  },
};
