import { Address } from '../../models/address.model.js';
import { Country } from '../../models/country.model.js';
import { State } from '../../models/state.model.js';
import { AppError } from '../../utils/app-error.js';
import { ErrorCode } from '@dmshop/shared';
import type { CreateAddressInput, UpdateAddressInput } from '@dmshop/shared';

export const addressService = {
  async listByUser(userId: number) {
    return Address.findAll({
      where: { id_user: userId },
      include: [
        { model: Country, as: 'country' },
        { model: State, as: 'state' },
      ],
      order: [['created_at', 'DESC']],
    });
  },

  async getById(id: number, userId: number, role: string) {
    const address = await Address.findByPk(id, {
      include: [
        { model: Country, as: 'country' },
        { model: State, as: 'state' },
      ],
    });

    if (!address) {
      throw AppError.notFound('Dirección no encontrada', ErrorCode.ADDRESS_NOT_FOUND);
    }

    if (address.id_user !== userId && role !== 'admin') {
      throw AppError.forbidden('No tienes acceso a esta dirección');
    }

    return address;
  },

  async create(userId: number, input: CreateAddressInput) {
    const address = await Address.create({
      id_user: userId,
      id_country: input.idCountry,
      id_state: input.idState ?? null,
      alias: input.alias,
      first_name: input.firstName,
      last_name: input.lastName,
      company: input.company ?? null,
      address1: input.address1,
      address2: input.address2 ?? null,
      city: input.city,
      postcode: input.postcode,
      phone: input.phone ?? null,
      phone_mobile: input.phoneMobile ?? null,
      vat_number: input.vatNumber ?? null,
    });

    return this.getById(address.id, userId, 'admin');
  },

  async update(id: number, userId: number, role: string, input: UpdateAddressInput) {
    const address = await Address.findByPk(id);
    if (!address) {
      throw AppError.notFound('Dirección no encontrada', ErrorCode.ADDRESS_NOT_FOUND);
    }

    if (address.id_user !== userId && role !== 'admin') {
      throw AppError.forbidden('No tienes acceso a esta dirección');
    }

    await address.update({
      ...(input.idCountry !== undefined && { id_country: input.idCountry }),
      ...(input.idState !== undefined && { id_state: input.idState }),
      ...(input.alias !== undefined && { alias: input.alias }),
      ...(input.firstName !== undefined && { first_name: input.firstName }),
      ...(input.lastName !== undefined && { last_name: input.lastName }),
      ...(input.company !== undefined && { company: input.company }),
      ...(input.address1 !== undefined && { address1: input.address1 }),
      ...(input.address2 !== undefined && { address2: input.address2 }),
      ...(input.city !== undefined && { city: input.city }),
      ...(input.postcode !== undefined && { postcode: input.postcode }),
      ...(input.phone !== undefined && { phone: input.phone }),
      ...(input.phoneMobile !== undefined && { phone_mobile: input.phoneMobile }),
      ...(input.vatNumber !== undefined && { vat_number: input.vatNumber }),
    });

    return this.getById(id, userId, role);
  },

  async remove(id: number, userId: number, role: string) {
    const address = await Address.findByPk(id);
    if (!address) {
      throw AppError.notFound('Dirección no encontrada', ErrorCode.ADDRESS_NOT_FOUND);
    }

    if (address.id_user !== userId && role !== 'admin') {
      throw AppError.forbidden('No tienes acceso a esta dirección');
    }

    await address.destroy();
  },
};
