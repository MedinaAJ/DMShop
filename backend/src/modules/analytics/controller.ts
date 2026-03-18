import { Request, Response } from 'express';
import { analyticsService } from './service.js';

export const analyticsController = {
  async getSummary(req: Request, res: Response) {
    const { period, startDate, endDate } = req.query as Record<string, string>;
    const data = await analyticsService.getSummary({ period: period as any, startDate, endDate });
    res.json({ success: true, data });
  },

  async getRevenueChart(req: Request, res: Response) {
    const { period, startDate, endDate } = req.query as Record<string, string>;
    const data = await analyticsService.getRevenueChart({ period: period as any, startDate, endDate });
    res.json({ success: true, data });
  },

  async getTopProducts(req: Request, res: Response) {
    const { period, startDate, endDate, limit } = req.query as Record<string, string>;
    const data = await analyticsService.getTopProducts({
      period: period as any,
      startDate,
      endDate,
      limit: limit ? Number(limit) : undefined,
    });
    res.json({ success: true, data });
  },

  async getTopCategories(req: Request, res: Response) {
    const { period, startDate, endDate, limit } = req.query as Record<string, string>;
    const data = await analyticsService.getTopCategories({
      period: period as any,
      startDate,
      endDate,
      limit: limit ? Number(limit) : undefined,
    });
    res.json({ success: true, data });
  },

  async getCustomersChart(req: Request, res: Response) {
    const { period, startDate, endDate } = req.query as Record<string, string>;
    const data = await analyticsService.getCustomersChart({ period: period as any, startDate, endDate });
    res.json({ success: true, data });
  },
};
