import { LoyaltyPoint } from '../../models/loyalty-point.model.js';
import { Configuration } from '../../models/configuration.model.js';

/** Get loyalty config from database */
async function getLoyaltyConfig(): Promise<{ pointsPerEuro: number; euroPerPoint: number }> {
  const [ppeRow, eppRow] = await Promise.all([
    Configuration.findOne({ where: { key: 'LOYALTY_POINTS_PER_EURO' } }),
    Configuration.findOne({ where: { key: 'LOYALTY_EURO_PER_POINT' } }),
  ]);
  return {
    pointsPerEuro: parseFloat(ppeRow?.value ?? '1'),
    euroPerPoint: parseFloat(eppRow?.value ?? '0.01'),
  };
}

export const loyaltyService = {
  async getBalance(idUser: number): Promise<number> {
    const rows = await LoyaltyPoint.findAll({ where: { id_user: idUser } });
    return rows.reduce((sum, r) => sum + r.points, 0);
  },

  async getHistory(idUser: number, page = 1, perPage = 20) {
    const offset = (page - 1) * perPage;
    const { count, rows } = await LoyaltyPoint.findAndCountAll({
      where: { id_user: idUser },
      order: [['created_at', 'DESC']],
      limit: perPage,
      offset,
    });
    return {
      data: rows,
      balance: await this.getBalance(idUser),
      meta: { page, perPage, total: count, totalPages: Math.ceil(count / perPage) },
    };
  },

  /** Called when an order is delivered — award loyalty points */
  async awardForOrder(idUser: number, idOrder: number, orderTotal: number): Promise<LoyaltyPoint> {
    const { pointsPerEuro } = await getLoyaltyConfig();
    const points = Math.floor(orderTotal * pointsPerEuro);
    if (points <= 0) return null as any;

    // Don't double-award
    const existing = await LoyaltyPoint.findOne({ where: { id_user: idUser, id_order: idOrder, source: 'order' } });
    if (existing) return existing;

    return LoyaltyPoint.create({ id_user: idUser, points, source: 'order', id_order: idOrder });
  },

  /** Called when an order is cancelled — reverse points if order was rewarded */
  async reverseForOrder(idUser: number, idOrder: number): Promise<void> {
    const reward = await LoyaltyPoint.findOne({ where: { id_user: idUser, id_order: idOrder, source: 'order' } });
    if (!reward) return;

    await LoyaltyPoint.create({
      id_user: idUser,
      points: -reward.points,
      source: 'refund',
      id_order: idOrder,
    });
  },

  /** Apply loyalty points as discount — returns the discount amount in euros */
  async applyPoints(idUser: number, points: number): Promise<{ discount: number; transactionId: number }> {
    const balance = await this.getBalance(idUser);
    if (points > balance) throw new Error(`Puntos insuficientes. Saldo: ${balance}`);

    const { euroPerPoint } = await getLoyaltyConfig();
    const discount = Math.round(points * euroPerPoint * 100) / 100;

    const record = await LoyaltyPoint.create({
      id_user: idUser,
      points: -points,
      source: 'redemption',
      id_order: null,
    });

    return { discount, transactionId: record.id };
  },

  async getConfig() {
    return getLoyaltyConfig();
  },

  async saveConfig(pointsPerEuro: number, euroPerPoint: number): Promise<void> {
    await Promise.all([
      Configuration.upsert({ key: 'LOYALTY_POINTS_PER_EURO', value: String(pointsPerEuro) }),
      Configuration.upsert({ key: 'LOYALTY_EURO_PER_POINT', value: String(euroPerPoint) }),
    ]);
  },

  async adminGetUserPoints(idUser: number) {
    const balance = await this.getBalance(idUser);
    const { euroPerPoint } = await getLoyaltyConfig();
    return {
      balance,
      valueInEuros: Math.round(balance * euroPerPoint * 100) / 100,
    };
  },

  async adminAdjustPoints(idUser: number, points: number, _reason?: string) {
    return LoyaltyPoint.create({
      id_user: idUser,
      points,
      source: 'manual',
      id_order: null,
    });
  },
};
