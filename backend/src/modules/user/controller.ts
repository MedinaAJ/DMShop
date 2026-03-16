import { Request, Response } from 'express';
import { User } from '../../models/user.model.js';
import { sendSuccess, sendPaginated } from '../../utils/response.js';
import { AppError } from '../../utils/app-error.js';
import { ErrorCode } from '@dmshop/shared';

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
};
