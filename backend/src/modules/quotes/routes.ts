import { Router } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { AppError } from '../../utils/app-error.js';
import { sendSuccess } from '../../utils/response.js';
import { Quote } from '../../models/quote.model.js';
import { QuoteItem } from '../../models/quote-item.model.js';
import { Cart } from '../../models/cart.model.js';
import { CartItem } from '../../models/cart-item.model.js';
import { User } from '../../models/user.model.js';
import { Product } from '../../models/product.model.js';
import { ProductLang } from '../../models/product-lang.model.js';
import { mailService } from '../mail/mail.service.js';

export const quotesRouter = Router();
export const adminQuotesRouter = Router();

const QUOTE_INCLUDES = [
  {
    model: QuoteItem,
    as: 'items',
    include: [
      { model: Product, as: 'product', include: [{ model: ProductLang, as: 'translations', where: { id_lang: 1 }, required: false }] },
    ],
  },
];

// ─── Customer routes ─────────────────────────────────────────────────────────

/** POST /quotes — create quote from current cart */
quotesRouter.post('/', authenticate, asyncHandler(async (req, res) => {
  const userId = req.user!.userId;
  const { notes } = req.body;

  const cart = await Cart.findOne({
    where: { id_user: userId },
    include: [{ model: CartItem, as: 'items' }],
  });

  if (!cart || !cart.items?.length) {
    throw AppError.badRequest('El carrito está vacío');
  }

  let total = 0;
  const itemData = cart.items.map((item: any) => {
    const unitPrice = Number(item.price ?? 0);
    const itemTotal = unitPrice * item.quantity;
    total += itemTotal;
    return { id_product: item.id_product, id_combination: item.id_combination ?? null, quantity: item.quantity, unit_price: unitPrice, total: itemTotal };
  });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const quote = await Quote.create({ id_user: userId, status: 'pending', expires_at: expiresAt, notes: notes ?? null, total });
  for (const item of itemData) {
    await QuoteItem.create({ id_quote: quote.id, ...item });
  }

  sendSuccess(res, quote, 201);
}));

/** GET /quotes — list my quotes */
quotesRouter.get('/', authenticate, asyncHandler(async (req, res) => {
  const quotes = await Quote.findAll({
    where: { id_user: req.user!.userId },
    order: [['created_at', 'DESC']],
  });
  sendSuccess(res, quotes);
}));

/** GET /quotes/:id */
quotesRouter.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const quote = await Quote.findOne({
    where: { id: Number(req.params.id), id_user: req.user!.userId },
    include: QUOTE_INCLUDES as any,
  });
  if (!quote) throw AppError.notFound('Presupuesto no encontrado');
  sendSuccess(res, quote);
}));

/** POST /quotes/:id/accept */
quotesRouter.post('/:id/accept', authenticate, asyncHandler(async (req, res) => {
  const quote = await Quote.findOne({ where: { id: Number(req.params.id), id_user: req.user!.userId } });
  if (!quote) throw AppError.notFound('Presupuesto no encontrado');
  if (quote.status !== 'sent') throw AppError.badRequest('Solo se pueden aceptar presupuestos en estado "enviado"');
  if (quote.expires_at && new Date() > quote.expires_at) throw AppError.badRequest('El presupuesto ha expirado');
  await quote.update({ status: 'accepted' });
  sendSuccess(res, quote);
}));

// ─── Admin routes ─────────────────────────────────────────────────────────────

/** GET /admin/quotes */
adminQuotesRouter.get('/', authenticate, authorize('admin', 'employee'), asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const perPage = Number(req.query.perPage) || 20;
  const offset = (page - 1) * perPage;
  const where: Record<string, any> = {};
  if (req.query.status) where.status = req.query.status;

  const { count, rows } = await Quote.findAndCountAll({
    where,
    include: [{ model: User, as: 'user', attributes: ['first_name', 'last_name', 'email'] }],
    order: [['created_at', 'DESC']],
    limit: perPage,
    offset,
  });

  res.json({ success: true, data: rows, meta: { page, perPage, total: count, totalPages: Math.ceil(count / perPage) } });
}));

/** GET /admin/quotes/:id */
adminQuotesRouter.get('/:id', authenticate, authorize('admin', 'employee'), asyncHandler(async (req, res) => {
  const quote = await Quote.findByPk(Number(req.params.id), {
    include: [
      { model: User, as: 'user', attributes: ['first_name', 'last_name', 'email'] },
      ...QUOTE_INCLUDES as any,
    ],
  });
  if (!quote) throw AppError.notFound('Presupuesto no encontrado');
  sendSuccess(res, quote);
}));

/** PUT /admin/quotes/:id */
adminQuotesRouter.put('/:id', authenticate, authorize('admin', 'employee'), asyncHandler(async (req, res) => {
  const quote = await Quote.findByPk(Number(req.params.id), {
    include: [{ model: User, as: 'user', attributes: ['email', 'first_name', 'last_name'] }],
  });
  if (!quote) throw AppError.notFound('Presupuesto no encontrado');

  const wasNotSent = quote.status !== 'sent';
  await quote.update(req.body);

  const customer = (quote as any).user;
  if (req.body.status === 'sent' && wasNotSent && customer?.email) {
    try {
      await mailService.send(
        customer.email,
        `Tu presupuesto #${quote.id} está listo`,
        `<p>Hola ${customer.first_name},</p><p>Tu presupuesto <strong>#${quote.id}</strong> por <strong>€${Number(quote.total).toFixed(2)}</strong> está listo. Accede a tu cuenta para verlo y aceptarlo.</p>`,
      );
    } catch { /* non-critical */ }
  }

  sendSuccess(res, quote);
}));

/** POST /admin/quotes/:id/convert-to-order */
adminQuotesRouter.post('/:id/convert-to-order', authenticate, authorize('admin', 'employee'), asyncHandler(async (req, res) => {
  const quote = await Quote.findByPk(Number(req.params.id));
  if (!quote) throw AppError.notFound('Presupuesto no encontrado');
  if (quote.status !== 'accepted') throw AppError.badRequest('Solo se pueden convertir presupuestos aceptados');
  await quote.update({ status: 'expired', notes: (quote.notes ?? '') + ' [Convertido a pedido]' });
  sendSuccess(res, { message: 'Presupuesto convertido.', quoteId: quote.id });
}));
