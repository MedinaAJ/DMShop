import { Op } from 'sequelize';
import { sequelize } from '../../config/database.js';
import { Order } from '../../models/order.model.js';
import { OrderState } from '../../models/order-state.model.js';
import { User } from '../../models/user.model.js';
import { Lang } from '../../models/lang.model.js';

export type Period = 'today' | 'week' | 'month' | 'year';

function getDateRange(period: Period): { start: Date; end: Date; prevStart: Date; prevEnd: Date } {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  let start: Date;
  let prevStart: Date;
  let prevEnd: Date;

  switch (period) {
    case 'today': {
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
      prevStart = new Date(start);
      prevStart.setDate(prevStart.getDate() - 1);
      prevEnd = new Date(end);
      prevEnd.setDate(prevEnd.getDate() - 1);
      break;
    }
    case 'week': {
      const dayOfWeek = now.getDay(); // 0=Sun
      start = new Date(now);
      start.setDate(now.getDate() - dayOfWeek);
      start.setHours(0, 0, 0, 0);
      prevStart = new Date(start);
      prevStart.setDate(prevStart.getDate() - 7);
      prevEnd = new Date(start);
      prevEnd.setMilliseconds(-1);
      break;
    }
    case 'month': {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;
    }
    case 'year': {
      start = new Date(now.getFullYear(), 0, 1);
      prevStart = new Date(now.getFullYear() - 1, 0, 1);
      prevEnd = new Date(now.getFullYear(), 0, 0, 23, 59, 59, 999);
      break;
    }
  }

  return { start, end, prevStart, prevEnd };
}

function getCustomRange(startDate: string, endDate: string): { start: Date; end: Date; prevStart: Date; prevEnd: Date } {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  const duration = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - duration);
  return { start, end, prevStart, prevEnd };
}

async function getPaidOrderStateIds(): Promise<number[]> {
  const paidStates = await OrderState.findAll({ where: { paid: true } });
  return paidStates.map((s) => s.id);
}

async function getDefaultLangId(): Promise<number> {
  const lang = await Lang.findOne({ where: { is_default: true } });
  return lang?.id ?? 1;
}

export const analyticsService = {
  async getSummary(params: { period?: Period; startDate?: string; endDate?: string }) {
    const paidStateIds = await getPaidOrderStateIds();

    let start: Date, end: Date, prevStart: Date, prevEnd: Date;

    if (params.startDate && params.endDate) {
      ({ start, end, prevStart, prevEnd } = getCustomRange(params.startDate, params.endDate));
    } else {
      ({ start, end, prevStart, prevEnd } = getDateRange((params.period as Period) ?? 'month'));
    }

    const dateFilter = { [Op.between]: [start, end] as [Date, Date] };
    const prevDateFilter = { [Op.between]: [prevStart, prevEnd] as [Date, Date] };
    const paidFilter = { id_order_state: { [Op.in]: paidStateIds } };

    // Current period revenue & orders
    const currentOrders = await Order.findAll({
      where: { ...paidFilter, created_at: dateFilter },
      attributes: ['total_paid'],
    });

    const prevOrders = await Order.findAll({
      where: { ...paidFilter, created_at: prevDateFilter },
      attributes: ['total_paid'],
    });

    const totalRevenue = currentOrders.reduce((sum, o) => sum + Number(o.total_paid), 0);
    const prevRevenue = prevOrders.reduce((sum, o) => sum + Number(o.total_paid), 0);

    const totalOrders = currentOrders.length;
    const prevTotalOrders = prevOrders.length;

    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const prevAvgOrderValue = prevTotalOrders > 0 ? prevRevenue / prevTotalOrders : 0;

    // Customers in period
    const allOrdersInPeriod = await Order.findAll({
      where: { created_at: dateFilter },
      attributes: ['id_user', 'created_at'],
    });
    const uniqueUserIds = [...new Set(allOrdersInPeriod.map((o) => o.id_user))];

    // New customers: registered in this period
    const newCustomers = await User.count({
      where: {
        created_at: dateFilter,
        role: 'customer',
      },
    });

    const totalCustomers = uniqueUserIds.length;
    const returningCustomers = Math.max(0, totalCustomers - newCustomers);

    function changePct(current: number, previous: number): number | null {
      if (previous === 0) return current > 0 ? 100 : null;
      return Math.round(((current - previous) / previous) * 1000) / 10;
    }

    return {
      revenue: {
        total: Math.round(totalRevenue * 100) / 100,
        previous: Math.round(prevRevenue * 100) / 100,
        change_pct: changePct(totalRevenue, prevRevenue),
      },
      orders: {
        total: totalOrders,
        previous: prevTotalOrders,
        change_pct: changePct(totalOrders, prevTotalOrders),
      },
      customers: {
        total: totalCustomers,
        new: newCustomers,
        returning: returningCustomers,
      },
      avg_order_value: {
        current: Math.round(avgOrderValue * 100) / 100,
        previous: Math.round(prevAvgOrderValue * 100) / 100,
      },
      conversion_rate: null,
    };
  },

  async getRevenueChart(params: { period?: Period; startDate?: string; endDate?: string }) {
    const paidStateIds = await getPaidOrderStateIds();

    let start: Date, end: Date;
    const period = (params.period as Period) ?? 'month';

    if (params.startDate && params.endDate) {
      ({ start, end } = getCustomRange(params.startDate, params.endDate));
    } else {
      ({ start, end } = getDateRange(period));
    }

    const groupByMonth = period === 'year' || (params.startDate && params.endDate &&
      (new Date(params.endDate).getTime() - new Date(params.startDate).getTime()) > 60 * 24 * 3600 * 1000);

    const orders = await Order.findAll({
      where: {
        id_order_state: { [Op.in]: paidStateIds },
        created_at: { [Op.between]: [start, end] as [Date, Date] },
      },
      attributes: ['created_at', 'total_paid'],
    });

    // Group manually for better DB compatibility
    const grouped: Record<string, { revenue: number; orders: number }> = {};

    for (const order of orders) {
      const d = new Date(order.created_at);
      const key = groupByMonth
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
        : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      if (!grouped[key]) grouped[key] = { revenue: 0, orders: 0 };
      grouped[key].revenue += Number(order.total_paid);
      grouped[key].orders += 1;
    }

    // Fill gaps
    const result: { date: string; revenue: number; orders: number }[] = [];
    const current = new Date(start);

    while (current <= end) {
      const key = groupByMonth
        ? `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-01`
        : `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;

      if (!result.find((r) => r.date === key)) {
        result.push({
          date: key,
          revenue: Math.round((grouped[key]?.revenue ?? 0) * 100) / 100,
          orders: grouped[key]?.orders ?? 0,
        });
      }

      if (groupByMonth) {
        current.setMonth(current.getMonth() + 1);
      } else {
        current.setDate(current.getDate() + 1);
      }
    }

    return result;
  },

  async getTopProducts(params: { period?: Period; startDate?: string; endDate?: string; limit?: number }) {
    const paidStateIds = await getPaidOrderStateIds();
    const defaultLangId = await getDefaultLangId();

    let start: Date, end: Date;

    if (params.startDate && params.endDate) {
      ({ start, end } = getCustomRange(params.startDate, params.endDate));
    } else {
      ({ start, end } = getDateRange((params.period as Period) ?? 'month'));
    }

    const limit = params.limit ?? 10;

    // Raw query for better control
    const results = await sequelize.query<{
      id: number;
      name: string;
      quantity_sold: string;
      revenue: string;
      cover_image: string | null;
    }>(
      `SELECT
        p.id,
        COALESCE(pl.name, oi.product_name) as name,
        SUM(oi.quantity) as quantity_sold,
        SUM(oi.total_price) as revenue,
        pi2.path as cover_image
      FROM order_items oi
      JOIN orders o ON o.id = oi.id_order
      LEFT JOIN products p ON p.id = oi.id_product
      LEFT JOIN product_lang pl ON pl.id_product = p.id AND pl.id_lang = :langId
      LEFT JOIN product_images pi2 ON pi2.id_product = p.id AND pi2.cover = 1
      WHERE o.id_order_state IN (:stateIds)
        AND o.created_at BETWEEN :start AND :end
      GROUP BY p.id, COALESCE(pl.name, oi.product_name), pi2.path
      ORDER BY quantity_sold DESC
      LIMIT :limit`,
      {
        replacements: {
          langId: defaultLangId,
          stateIds: paidStateIds.length > 0 ? paidStateIds : [0],
          start: start.toISOString().slice(0, 19).replace('T', ' '),
          end: end.toISOString().slice(0, 19).replace('T', ' '),
          limit,
        },
        type: 'SELECT' as any,
      },
    );

    return results.map((r) => ({
      id: r.id,
      name: r.name,
      quantity_sold: Number(r.quantity_sold),
      revenue: Math.round(Number(r.revenue) * 100) / 100,
      cover_image: r.cover_image ?? null,
    }));
  },

  async getTopCategories(params: { period?: Period; startDate?: string; endDate?: string; limit?: number }) {
    const paidStateIds = await getPaidOrderStateIds();
    const defaultLangId = await getDefaultLangId();

    let start: Date, end: Date;

    if (params.startDate && params.endDate) {
      ({ start, end } = getCustomRange(params.startDate, params.endDate));
    } else {
      ({ start, end } = getDateRange((params.period as Period) ?? 'month'));
    }

    const limit = params.limit ?? 5;

    const results = await sequelize.query<{
      id: number;
      name: string;
      revenue: string;
      orders_count: string;
    }>(
      `SELECT
        c.id,
        COALESCE(cl.name, 'Sin categoría') as name,
        SUM(oi.total_price) as revenue,
        COUNT(DISTINCT o.id) as orders_count
      FROM order_items oi
      JOIN orders o ON o.id = oi.id_order
      JOIN products p ON p.id = oi.id_product
      JOIN categories c ON c.id = p.id_category_default
      LEFT JOIN category_lang cl ON cl.id_category = c.id AND cl.id_lang = :langId
      WHERE o.id_order_state IN (:stateIds)
        AND o.created_at BETWEEN :start AND :end
      GROUP BY c.id, COALESCE(cl.name, 'Sin categoría')
      ORDER BY revenue DESC
      LIMIT :limit`,
      {
        replacements: {
          langId: defaultLangId,
          stateIds: paidStateIds.length > 0 ? paidStateIds : [0],
          start: start.toISOString().slice(0, 19).replace('T', ' '),
          end: end.toISOString().slice(0, 19).replace('T', ' '),
          limit,
        },
        type: 'SELECT' as any,
      },
    );

    return results.map((r) => ({
      id: r.id,
      name: r.name,
      revenue: Math.round(Number(r.revenue) * 100) / 100,
      orders_count: Number(r.orders_count),
    }));
  },

  async getCustomersChart(params: { period?: Period; startDate?: string; endDate?: string }) {
    let start: Date, end: Date;
    const period = (params.period as Period) ?? 'month';

    if (params.startDate && params.endDate) {
      ({ start, end } = getCustomRange(params.startDate, params.endDate));
    } else {
      ({ start, end } = getDateRange(period));
    }

    const groupByMonth = period === 'year' || (params.startDate && params.endDate &&
      (new Date(params.endDate).getTime() - new Date(params.startDate).getTime()) > 60 * 24 * 3600 * 1000);

    const customers = await User.findAll({
      where: {
        created_at: { [Op.between]: [start, end] as [Date, Date] },
        role: 'customer',
      },
      attributes: ['created_at'],
    });

    const grouped: Record<string, number> = {};

    for (const customer of customers) {
      const d = new Date(customer.created_at);
      const key = groupByMonth
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
        : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      grouped[key] = (grouped[key] ?? 0) + 1;
    }

    const result: { date: string; new_customers: number }[] = [];
    const current = new Date(start);

    while (current <= end) {
      const key = groupByMonth
        ? `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-01`
        : `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;

      if (!result.find((r) => r.date === key)) {
        result.push({
          date: key,
          new_customers: grouped[key] ?? 0,
        });
      }

      if (groupByMonth) {
        current.setMonth(current.getMonth() + 1);
      } else {
        current.setDate(current.getDate() + 1);
      }
    }

    return result;
  },

  async getDashboardStats() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Import Product model inline to avoid circular deps
    const { Product } = await import('../../models/product.model.js');
    const { User } = await import('../../models/user.model.js');
    const { Order } = await import('../../models/order.model.js');
    const { ProductLang } = await import('../../models/product-lang.model.js');

    // Sales today
    const salesTodayResult = await sequelize.query<{ total: string }>(
      `SELECT COALESCE(SUM(total_paid), 0) AS total FROM orders
       WHERE created_at >= :start AND paid = 1`,
      { replacements: { start: todayStart }, type: (await import('sequelize')).QueryTypes.SELECT },
    );
    const salesToday = Number(salesTodayResult[0]?.total ?? 0);

    // Sales this month
    const salesMonthResult = await sequelize.query<{ total: string }>(
      `SELECT COALESCE(SUM(total_paid), 0) AS total FROM orders
       WHERE created_at >= :start AND paid = 1`,
      { replacements: { start: monthStart }, type: (await import('sequelize')).QueryTypes.SELECT },
    );
    const salesMonth = Number(salesMonthResult[0]?.total ?? 0);

    // Pending orders (state id 1 = Awaiting payment or similar)
    const pendingOrders = await Order.count({
      where: {
        id_order_state: { [Op.in]: [1, 2, 10] }, // pending/awaiting states
      },
    });

    // New customers this month
    const newCustomersMonth = await User.count({
      where: {
        created_at: { [Op.gte]: monthStart },
        role: 'customer',
      },
    });

    // Revenue last 30 days (chart)
    const revenueChart = await sequelize.query<{ date: string; revenue: string }>(
      `SELECT DATE(created_at) AS date, COALESCE(SUM(total_paid), 0) AS revenue
       FROM orders
       WHERE created_at >= :start AND paid = 1
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      {
        replacements: { start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
        type: (await import('sequelize')).QueryTypes.SELECT,
      },
    );

    // Recent orders (last 10)
    const recentOrders = await Order.findAll({
      include: [
        { model: User, as: 'user', attributes: ['id', 'email', 'first_name', 'last_name'] },
      ],
      order: [['created_at', 'DESC']],
      limit: 10,
    });

    // Low stock products (quantity < 5)
    const lowStockProducts = await Product.findAll({
      where: { quantity: { [Op.lt]: 5 }, active: true },
      include: [
        {
          model: ProductLang,
          as: 'translations',
          where: { id_lang: 1 },
          required: false,
          limit: 1,
        },
      ],
      order: [['quantity', 'ASC']],
      limit: 20,
    });

    return {
      kpis: {
        salesToday,
        salesMonth,
        pendingOrders,
        newCustomersMonth,
      },
      revenueChart: revenueChart.map((r) => ({
        date: r.date,
        revenue: Number(r.revenue),
      })),
      recentOrders: recentOrders.map((o: any) => ({
        id: o.id,
        reference: o.reference,
        customer: o.user
          ? `${o.user.first_name ?? ''} ${o.user.last_name ?? ''}`.trim() || o.user.email
          : 'Invitado',
        total: Number(o.total_paid),
        status: o.id_order_state,
        date: o.created_at,
      })),
      lowStockProducts: lowStockProducts.map((p: any) => ({
        id: p.id,
        name: p.translations?.[0]?.name ?? `Producto #${p.id}`,
        quantity: p.quantity,
        reference: p.reference,
      })),
    };
  },
};
