import crypto from 'crypto';
import { NewsletterSubscriber } from '../../models/newsletter-subscriber.model.js';
import { AppError } from '../../utils/app-error.js';

export const newsletterService = {
  async subscribe(email: string, userId?: number, source = 'website'): Promise<NewsletterSubscriber> {
    const existing = await NewsletterSubscriber.findOne({ where: { email } });

    if (existing) {
      if (existing.active) {
        throw new AppError(409, 'ALREADY_SUBSCRIBED', 'Ya estás suscrito a nuestra newsletter');
      }
      // Re-subscribe
      await existing.update({
        active: true,
        unsubscribed_at: null,
        token: crypto.randomBytes(32).toString('hex'),
        ...(userId != null ? { id_user: userId } : {}),
      });
      return existing;
    }

    const token = crypto.randomBytes(32).toString('hex');
    return NewsletterSubscriber.create({
      email,
      id_user: userId ?? null,
      active: true,
      token,
      source,
    } as any);
  },

  async unsubscribe(token: string): Promise<void> {
    const subscriber = await NewsletterSubscriber.findOne({ where: { token, active: true } });
    if (!subscriber) {
      throw new AppError(404, 'INVALID_TOKEN', 'Token inválido o ya desuscrito');
    }
    await subscriber.update({ active: false, unsubscribed_at: new Date() });
  },

  async listSubscribers(page = 1, perPage = 50) {
    const offset = (page - 1) * perPage;
    const { count, rows } = await NewsletterSubscriber.findAndCountAll({
      order: [['subscribed_at', 'DESC']],
      limit: perPage,
      offset,
    });
    return { data: rows, meta: { page, perPage, total: count, totalPages: Math.ceil(count / perPage) } };
  },

  async exportCsv(): Promise<string> {
    const rows = await NewsletterSubscriber.findAll({
      where: { active: true },
      order: [['subscribed_at', 'ASC']],
    });

    const lines = ['email,source,subscribed_at'];
    for (const r of rows) {
      lines.push(`"${r.email}","${r.source}","${(r as any).subscribed_at?.toISOString() ?? ''}"`);
    }
    return lines.join('\n');
  },
};


