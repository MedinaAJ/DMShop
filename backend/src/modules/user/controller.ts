import { Request, Response } from 'express';
import { User } from '../../models/user.model.js';
import { Address } from '../../models/address.model.js';
import { Country } from '../../models/country.model.js';
import { State } from '../../models/state.model.js';
import { sendSuccess, sendPaginated, sendNoContent } from '../../utils/response.js';
import { AppError } from '../../utils/app-error.js';
import { ErrorCode } from '@dmshop/shared';
import bcrypt from 'bcrypt';

export const userController = {
  async list(req: Request, res: Response) {
    const page = Number(req.query.page) || 1;
    const perPage = Math.min(Number(req.query.perPage) || 20, 100);
    const offset = (page - 1) * perPage;

    const { count, rows } = await User.findAndCountAll({
      attributes: { exclude: ['password'] },
      limit: perPage,
      offset,
      order: [['created_at', 'DESC']],
    });

    sendPaginated(res, rows, {
      page,
      perPage,
      total: count,
      totalPages: Math.ceil(count / perPage),
    });
  },

  async getById(req: Request, res: Response) {
    const user = await User.findByPk(Number(req.params.id), {
      attributes: { exclude: ['password'] },
    });
    if (!user) {
      throw AppError.notFound('Usuario no encontrado', ErrorCode.USER_NOT_FOUND);
    }
    sendSuccess(res, user);
  },

  async update(req: Request, res: Response) {
    const user = await User.findByPk(Number(req.params.id));
    if (!user) {
      throw AppError.notFound('Usuario no encontrado', ErrorCode.USER_NOT_FOUND);
    }

    const { firstName, lastName, email, active, role, newsletter } = req.body;
    await user.update({
      ...(firstName !== undefined && { first_name: firstName }),
      ...(lastName !== undefined && { last_name: lastName }),
      ...(email !== undefined && { email }),
      ...(active !== undefined && { active }),
      ...(role !== undefined && { role }),
      ...(newsletter !== undefined && { newsletter }),
    });

    const result = await User.findByPk(user.id, { attributes: { exclude: ['password'] } });
    sendSuccess(res, result);
  },

  async remove(req: Request, res: Response) {
    const user = await User.findByPk(Number(req.params.id));
    if (!user) {
      throw AppError.notFound('Usuario no encontrado', ErrorCode.USER_NOT_FOUND);
    }
    await user.destroy();
    sendNoContent(res);
  },

  async toggleActive(req: Request, res: Response) {
    const user = await User.findByPk(Number(req.params.id));
    if (!user) {
      throw AppError.notFound('Usuario no encontrado', ErrorCode.USER_NOT_FOUND);
    }
    await user.update({ active: !user.active });
    const result = await User.findByPk(user.id, { attributes: { exclude: ['password'] } });
    sendSuccess(res, result);
  },

  async getAddresses(req: Request, res: Response) {
    const user = await User.findByPk(Number(req.params.id));
    if (!user) {
      throw AppError.notFound('Usuario no encontrado', ErrorCode.USER_NOT_FOUND);
    }

    const addresses = await Address.findAll({
      where: { id_user: user.id },
      include: [
        { model: Country, as: 'country' },
        { model: State, as: 'state' },
      ],
      order: [['created_at', 'DESC']],
    });

    sendSuccess(res, addresses);
  },

  /** PUT /users/me — update own profile */
  async updateMe(req: Request, res: Response) {
    const userId = (req as any).user.id;
    const user = await User.findByPk(userId);
    if (!user) {
      throw AppError.notFound('Usuario no encontrado', ErrorCode.USER_NOT_FOUND);
    }

    const { firstName, lastName, email } = req.body;
    await user.update({
      ...(firstName !== undefined && { first_name: firstName }),
      ...(lastName !== undefined && { last_name: lastName }),
      ...(email !== undefined && { email }),
    });

    const updated = await User.findByPk(userId, { attributes: { exclude: ['password'] } });
    sendSuccess(res, updated);
  },

  /** PUT /users/me/password — change own password */
  async changeMyPassword(req: Request, res: Response) {
    const userId = (req as any).user.id;
    const user = await User.findByPk(userId);
    if (!user) {
      throw AppError.notFound('Usuario no encontrado', ErrorCode.USER_NOT_FOUND);
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      throw AppError.badRequest('Se requieren currentPassword y newPassword', ErrorCode.VALIDATION_ERROR);
    }

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      throw AppError.badRequest('Contraseña actual incorrecta', ErrorCode.AUTH_INVALID_CREDENTIALS);
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashed });
    sendNoContent(res);
  },
};
