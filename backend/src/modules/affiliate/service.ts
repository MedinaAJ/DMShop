import crypto from 'crypto';
import { Affiliate } from '../../models/affiliate.model.js';
import { AffiliateReferral } from '../../models/affiliate-referral.model.js';
import { User } from '../../models/user.model.js';

function generateCode(userId: number): string {
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `AFF${userId}${random}`;
}

export const affiliateService = {
  /** Get or create affiliate account for a user */
  async getOrCreate(userId: number): Promise<Affiliate> {
    const existing = await Affiliate.findOne({ where: { id_user: userId } });
    if (existing) return existing;

    const code = generateCode(userId);
    return Affiliate.create({ id_user: userId, code, commission_rate: 5.0, total_earned: 0, active: true });
  },

  /** Get affiliate by code */
  async getByCode(code: string): Promise<Affiliate | null> {
    return Affiliate.findOne({ where: { code, active: true } });
  },

  /** Record a referral commission when an order is placed */
  async recordReferral(affiliateCode: string, orderId: number, orderTotal: number): Promise<void> {
    const affiliate = await this.getByCode(affiliateCode);
    if (!affiliate) return;

    const commission = Number(((orderTotal * affiliate.commission_rate) / 100).toFixed(2));

    await AffiliateReferral.create({
      id_affiliate: affiliate.id,
      id_order: orderId,
      commission,
    });

    await affiliate.increment('total_earned', { by: commission });
  },

  /** List all affiliates (admin) */
  async listAffiliates(page = 1, perPage = 20) {
    const offset = (page - 1) * perPage;
    const { count, rows } = await Affiliate.findAndCountAll({
      include: [{ model: User, as: 'user', attributes: ['id', 'email', 'first_name', 'last_name'] }],
      order: [['total_earned', 'DESC']],
      limit: perPage,
      offset,
    });
    return { data: rows, meta: { page, perPage, total: count, totalPages: Math.ceil(count / perPage) } };
  },

  /** Get referrals for an affiliate */
  async getReferrals(affiliateId: number) {
    return AffiliateReferral.findAll({
      where: { id_affiliate: affiliateId },
      order: [['created_at', 'DESC']],
      limit: 50,
    });
  },
};
