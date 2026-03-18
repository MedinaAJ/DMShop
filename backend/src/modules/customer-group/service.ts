import { Op } from 'sequelize';
import { CustomerGroup } from '../../models/customer-group.model.js';
import { CustomerGroupLang } from '../../models/customer-group-lang.model.js';
import { UserGroup } from '../../models/user-group.model.js';
import { User } from '../../models/user.model.js';
import { AppError } from '../../utils/app-error.js';
import { ErrorCode } from '@dmshop/shared';

const PROTECTED_GROUP_IDS = [1, 2, 3];

export const customerGroupService = {
  /**
   * List all customer groups (non-deleted) with translations
   */
  async list() {
    const groups = await CustomerGroup.findAll({
      where: { deleted: false },
      include: [{ model: CustomerGroupLang, as: 'translations' }],
      order: [['id', 'ASC']],
    });
    return groups;
  },

  /**
   * Get a group by ID with translations
   */
  async getById(id: number) {
    const group = await CustomerGroup.findOne({
      where: { id, deleted: false },
      include: [{ model: CustomerGroupLang, as: 'translations' }],
    });
    if (!group) {
      throw AppError.notFound('Grupo de clientes no encontrado', ErrorCode.NOT_FOUND);
    }
    return group;
  },

  /**
   * Create a new group with optional translations
   */
  async create(data: {
    reduction?: number;
    price_display_method?: number;
    show_prices?: boolean;
    translations?: Array<{ id_lang: number; name: string }>;
  }) {
    const group = await CustomerGroup.create({
      reduction: data.reduction ?? 0,
      price_display_method: data.price_display_method ?? 0,
      show_prices: data.show_prices ?? true,
      deleted: false,
    });

    if (data.translations?.length) {
      for (const t of data.translations) {
        await CustomerGroupLang.create({
          id_customer_group: group.id,
          id_lang: t.id_lang,
          name: t.name,
        });
      }
    }

    return this.getById(group.id);
  },

  /**
   * Update a group and its translations
   */
  async update(
    id: number,
    data: {
      reduction?: number;
      price_display_method?: number;
      show_prices?: boolean;
      translations?: Array<{ id_lang: number; name: string }>;
    },
  ) {
    const group = await CustomerGroup.findOne({ where: { id, deleted: false } });
    if (!group) {
      throw AppError.notFound('Grupo de clientes no encontrado', ErrorCode.NOT_FOUND);
    }

    await group.update({
      ...(data.reduction !== undefined && { reduction: data.reduction }),
      ...(data.price_display_method !== undefined && {
        price_display_method: data.price_display_method,
      }),
      ...(data.show_prices !== undefined && { show_prices: data.show_prices }),
    });

    if (data.translations?.length) {
      for (const t of data.translations) {
        await CustomerGroupLang.upsert({
          id_customer_group: id,
          id_lang: t.id_lang,
          name: t.name,
        });
      }
    }

    return this.getById(id);
  },

  /**
   * Soft-delete a group (protected groups 1,2,3 cannot be deleted)
   */
  async delete(id: number) {
    if (PROTECTED_GROUP_IDS.includes(id)) {
      throw AppError.forbidden(
        'No se pueden eliminar los grupos de clientes predefinidos (Visitante, Invitado, Cliente)',
      );
    }

    const group = await CustomerGroup.findOne({ where: { id, deleted: false } });
    if (!group) {
      throw AppError.notFound('Grupo de clientes no encontrado', ErrorCode.NOT_FOUND);
    }

    await group.update({ deleted: true });
  },

  /**
   * Get users belonging to a group
   */
  async getUsers(groupId: number) {
    const group = await CustomerGroup.findOne({ where: { id: groupId, deleted: false } });
    if (!group) {
      throw AppError.notFound('Grupo de clientes no encontrado', ErrorCode.NOT_FOUND);
    }

    const userGroups = await UserGroup.findAll({ where: { id_customer_group: groupId } });
    const userIds = userGroups.map((ug) => ug.id_user);

    if (userIds.length === 0) return [];

    return User.findAll({
      where: { id: { [Op.in]: userIds } },
      attributes: { exclude: ['password'] },
    });
  },

  /**
   * Assign a user to a group
   */
  async assignUser(groupId: number, userId: number) {
    const group = await CustomerGroup.findOne({ where: { id: groupId, deleted: false } });
    if (!group) {
      throw AppError.notFound('Grupo de clientes no encontrado', ErrorCode.NOT_FOUND);
    }

    const user = await User.findByPk(userId);
    if (!user) {
      throw AppError.notFound('Usuario no encontrado', ErrorCode.USER_NOT_FOUND);
    }

    const [record] = await UserGroup.findOrCreate({
      where: { id_user: userId, id_customer_group: groupId },
      defaults: { id_user: userId, id_customer_group: groupId },
    });

    return record;
  },

  /**
   * Remove a user from a group
   */
  async removeUser(groupId: number, userId: number) {
    const deleted = await UserGroup.destroy({
      where: { id_customer_group: groupId, id_user: userId },
    });

    if (!deleted) {
      throw AppError.notFound(
        'El usuario no pertenece a este grupo',
        ErrorCode.NOT_FOUND,
      );
    }
  },
};
