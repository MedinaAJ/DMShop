import { Router } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { AppError } from '../../utils/app-error.js';
import { sendSuccess } from '../../utils/response.js';
import { SupportTicket } from '../../models/support-ticket.model.js';
import { SupportMessage } from '../../models/support-message.model.js';
import { User } from '../../models/user.model.js';
import { mailService } from '../mail/mail.service.js';
import { Op } from 'sequelize';

export const supportRouter = Router();

// ─── Customer routes ─────────────────────────────────────────────────────────

/** POST /support/tickets — create a new ticket */
supportRouter.post('/tickets', authenticate, asyncHandler(async (req, res) => {
  const { subject, message } = req.body;
  if (!subject || !message) throw AppError.badRequest('subject y message son obligatorios');

  const ticket = await SupportTicket.create({
    id_user: req.user!.userId,
    subject,
    status: 'open',
  });

  await SupportMessage.create({
    id_ticket: ticket.id,
    id_user: req.user!.userId,
    message,
    is_admin: false,
  });

  sendSuccess(res, ticket, 201);
}));

/** GET /support/tickets — list my tickets */
supportRouter.get('/tickets', authenticate, asyncHandler(async (req, res) => {
  const tickets = await SupportTicket.findAll({
    where: { id_user: req.user!.userId },
    order: [['updated_at', 'DESC']],
  });
  sendSuccess(res, tickets);
}));

/** GET /support/tickets/:id — get ticket with messages */
supportRouter.get('/tickets/:id', authenticate, asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findOne({
    where: { id: Number(req.params.id), id_user: req.user!.userId },
    include: [{ model: SupportMessage, as: 'messages', include: [{ model: User, as: 'user', attributes: ['first_name', 'last_name'] }], order: [['created_at', 'ASC']] }],
  });
  if (!ticket) throw AppError.notFound('Ticket no encontrado');
  sendSuccess(res, ticket);
}));

/** POST /support/tickets/:id/messages — add message to ticket */
supportRouter.post('/tickets/:id/messages', authenticate, asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findOne({ where: { id: Number(req.params.id), id_user: req.user!.userId } });
  if (!ticket) throw AppError.notFound('Ticket no encontrado');
  if (ticket.status === 'closed') throw AppError.badRequest('El ticket está cerrado');

  const { message } = req.body;
  if (!message) throw AppError.badRequest('message es obligatorio');

  const msg = await SupportMessage.create({
    id_ticket: ticket.id,
    id_user: req.user!.userId,
    message,
    is_admin: false,
  });

  await ticket.update({ status: 'open', updated_at: new Date() });
  sendSuccess(res, msg, 201);
}));

// ─── Admin routes ─────────────────────────────────────────────────────────────

/** GET /admin/support/tickets — list all tickets with filters */
supportRouter.get('/admin/support/tickets', authenticate, authorize('admin', 'employee'), asyncHandler(async (req, res) => {
  const where: Record<string, any> = {};
  if (req.query.status) where.status = req.query.status;
  if (req.query.search) {
    where.subject = { [Op.like]: `%${req.query.search}%` };
  }

  const page = Number(req.query.page) || 1;
  const perPage = Number(req.query.perPage) || 20;
  const offset = (page - 1) * perPage;

  const { count, rows } = await SupportTicket.findAndCountAll({
    where,
    include: [{ model: User, as: 'user', attributes: ['first_name', 'last_name', 'email'] }],
    order: [['updated_at', 'DESC']],
    limit: perPage,
    offset,
  });

  res.json({ success: true, data: rows, meta: { page, perPage, total: count, totalPages: Math.ceil(count / perPage) } });
}));

/** GET /admin/support/tickets/:id — get ticket detail */
supportRouter.get('/admin/support/tickets/:id', authenticate, authorize('admin', 'employee'), asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findByPk(Number(req.params.id), {
    include: [
      { model: User, as: 'user', attributes: ['first_name', 'last_name', 'email'] },
      { model: SupportMessage, as: 'messages', include: [{ model: User, as: 'user', attributes: ['first_name', 'last_name'] }], order: [['created_at', 'ASC']] },
    ],
  });
  if (!ticket) throw AppError.notFound('Ticket no encontrado');
  sendSuccess(res, ticket);
}));

/** PUT /admin/support/tickets/:id/status — update ticket status */
supportRouter.put('/admin/support/tickets/:id/status', authenticate, authorize('admin', 'employee'), asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findByPk(Number(req.params.id));
  if (!ticket) throw AppError.notFound('Ticket no encontrado');
  await ticket.update({ status: req.body.status });
  sendSuccess(res, ticket);
}));

/** POST /admin/support/tickets/:id/messages — admin reply */
supportRouter.post('/admin/support/tickets/:id/messages', authenticate, authorize('admin', 'employee'), asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findByPk(Number(req.params.id), {
    include: [{ model: User, as: 'user', attributes: ['email', 'first_name', 'last_name'] }],
  });
  if (!ticket) throw AppError.notFound('Ticket no encontrado');

  const { message } = req.body;
  if (!message) throw AppError.badRequest('message es obligatorio');

  const msg = await SupportMessage.create({
    id_ticket: ticket.id,
    id_user: req.user!.userId,
    message,
    is_admin: true,
  });

  await ticket.update({ status: 'pending', updated_at: new Date() });

  // Send email notification to customer
  const customer = (ticket as any).user;
  if (customer?.email) {
    try {
      await mailService.send(
        customer.email,
        `Re: ${ticket.subject} [Ticket #${ticket.id}]`,
        `
          <p>Hola ${customer.first_name},</p>
          <p>Hemos respondido a tu ticket <strong>#${ticket.id}: ${ticket.subject}</strong>:</p>
          <blockquote style="border-left: 3px solid #3b82f6; padding-left: 12px; color: #374151;">${message}</blockquote>
          <p>Puedes ver y responder al ticket en tu cuenta.</p>
        `,
      );
    } catch { /* non-critical */ }
  }

  sendSuccess(res, msg, 201);
}));
