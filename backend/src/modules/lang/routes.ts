import { Router } from 'express';
import { Lang } from '../../models/lang.model.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/response.js';
import { AppError } from '../../utils/app-error.js';
import { ErrorCode } from '@dmshop/shared';

export const langRouter = Router();

/** GET /langs — list all languages (public, for resolving translations) */
langRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const langs = await Lang.findAll({
      order: [['is_default', 'DESC'], ['name', 'ASC']],
    });
    sendSuccess(res, langs);
  }),
);

/** GET /langs/active — list only active languages */
langRouter.get(
  '/active',
  asyncHandler(async (_req, res) => {
    const langs = await Lang.findAll({
      where: { active: true },
      order: [['is_default', 'DESC'], ['name', 'ASC']],
    });
    sendSuccess(res, langs);
  }),
);

/** GET /langs/:id — get single language */
langRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const lang = await Lang.findByPk(req.params.id);
    if (!lang) throw AppError.notFound('Idioma no encontrado');
    sendSuccess(res, lang);
  }),
);

/** POST /langs — create language (admin only) */
langRouter.post(
  '/',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const { name, iso_code, locale, active, is_default } = req.body;

    if (!name || !iso_code || !locale) {
      throw AppError.badRequest('name, iso_code y locale son obligatorios');
    }
    if (iso_code.length > 2) {
      throw AppError.badRequest('iso_code debe tener máximo 2 caracteres', ErrorCode.VALIDATION_ERROR, 'iso_code');
    }

    // If setting as default, unset previous default
    if (is_default) {
      await Lang.update({ is_default: false }, { where: {} });
    }

    const existing = await Lang.findOne({ where: { iso_code: iso_code.toLowerCase() } });
    if (existing) {
      throw AppError.conflict(`Ya existe un idioma con iso_code '${iso_code}'`, ErrorCode.VALIDATION_ERROR);
    }

    const lang = await Lang.create({
      name,
      iso_code: iso_code.toLowerCase(),
      locale,
      active: active ?? true,
      is_default: is_default ?? false,
    });

    sendCreated(res, lang);
  }),
);

/** PUT /langs/:id — update language (admin only) */
langRouter.put(
  '/:id',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const lang = await Lang.findByPk(req.params.id);
    if (!lang) throw AppError.notFound('Idioma no encontrado');

    const { name, iso_code, locale, active, is_default } = req.body;

    // Cannot deactivate the default language
    if (lang.is_default && active === false) {
      throw AppError.badRequest('No se puede desactivar el idioma por defecto');
    }

    // If setting as default, unset previous default
    if (is_default && !lang.is_default) {
      await Lang.update({ is_default: false }, { where: {} });
    }

    // Check iso_code uniqueness if changing it
    if (iso_code && iso_code.toLowerCase() !== lang.iso_code) {
      const existing = await Lang.findOne({ where: { iso_code: iso_code.toLowerCase() } });
      if (existing) {
        throw AppError.conflict(`Ya existe un idioma con iso_code '${iso_code}'`, ErrorCode.VALIDATION_ERROR);
      }
    }

    await lang.update({
      ...(name !== undefined && { name }),
      ...(iso_code !== undefined && { iso_code: iso_code.toLowerCase() }),
      ...(locale !== undefined && { locale }),
      ...(active !== undefined && { active }),
      ...(is_default !== undefined && { is_default }),
    });

    sendSuccess(res, lang);
  }),
);

/** DELETE /langs/:id — delete language (admin only, cannot delete default) */
langRouter.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const lang = await Lang.findByPk(req.params.id);
    if (!lang) throw AppError.notFound('Idioma no encontrado');

    if (lang.is_default) {
      throw AppError.badRequest('No se puede eliminar el idioma por defecto. Asigna otro idioma como predeterminado primero.');
    }

    await lang.destroy();
    sendNoContent(res);
  }),
);
