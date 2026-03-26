import { Router } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { Currency } from '../../models/currency.model.js';
import { sendSuccess } from '../../utils/response.js';
import { AppError } from '../../utils/app-error.js';

export const currencyRouter = Router();

/** GET /currencies/active — list active currencies (public) */
currencyRouter.get('/active', asyncHandler(async (_req, res) => {
  const currencies = await Currency.findAll({
    where: { active: true },
    order: [['is_default', 'DESC'], ['name', 'ASC']],
  });
  sendSuccess(res, currencies);
}));

/** GET /currencies — list all currencies (admin) */
currencyRouter.get('/', authenticate, authorize('admin', 'employee'), asyncHandler(async (_req, res) => {
  const currencies = await Currency.findAll({ order: [['id', 'ASC']] });
  sendSuccess(res, currencies);
}));

/** POST /currencies — create currency (admin) */
currencyRouter.post('/', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const { name, iso_code, symbol, conversion_rate, decimals, active, is_default } = req.body;
  if (!name || !iso_code || !symbol) {
    throw AppError.badRequest('name, iso_code y symbol son obligatorios');
  }
  if (is_default) {
    await Currency.update({ is_default: false }, { where: {} });
  }
  const currency = await Currency.create({ name, iso_code, symbol, conversion_rate: conversion_rate ?? 1, decimals: decimals ?? 2, active: active ?? true, is_default: is_default ?? false });
  sendSuccess(res, currency, 201);
}));

/** PUT /currencies/:id — update currency (admin) */
currencyRouter.put('/:id', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const currency = await Currency.findByPk(Number(req.params.id));
  if (!currency) throw AppError.notFound('Divisa no encontrada');
  if (req.body.is_default) {
    await Currency.update({ is_default: false }, { where: {} });
  }
  await currency.update(req.body);
  sendSuccess(res, currency);
}));

/** DELETE /currencies/:id — delete currency (admin) */
currencyRouter.delete('/:id', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const currency = await Currency.findByPk(Number(req.params.id));
  if (!currency) throw AppError.notFound('Divisa no encontrada');
  if (currency.is_default) throw AppError.badRequest('No se puede eliminar la divisa predeterminada');
  await currency.destroy();
  sendSuccess(res, null, 204);
}));
