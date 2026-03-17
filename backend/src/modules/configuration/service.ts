import { Configuration } from '../../models/configuration.model.js';

export const configurationService = {
  async getAll(): Promise<{ key: string; value: string }[]> {
    const items = await Configuration.findAll({ order: [['key', 'ASC']] });
    return items.map((c) => ({ key: c.key, value: c.value }));
  },

  async getByPrefix(prefix: string): Promise<{ key: string; value: string }[]> {
    const { Op } = await import('sequelize');
    const prefixes = prefix.split(',').map((p) => p.trim()).filter(Boolean);
    const items = await Configuration.findAll({
      where: {
        key: { [Op.or]: prefixes.map((p) => ({ [Op.like]: `${p}%` })) },
      },
      order: [['key', 'ASC']],
    });
    return items.map((c) => ({ key: c.key, value: c.value }));
  },

  async bulkUpdate(configs: { key: string; value: string }[]): Promise<void> {
    for (const { key, value } of configs) {
      await Configuration.upsert({ key, value });
    }
  },
};
