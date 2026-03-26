import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';

export type Period = 'today' | 'week' | 'month' | 'year';

export interface AnalyticsSummary {
  revenue: { total: number; previous: number; change_pct: number | null };
  orders: { total: number; previous: number; change_pct: number | null };
  customers: { total: number; new: number; returning: number };
  avg_order_value: { current: number; previous: number };
  conversion_rate: null;
}

export interface RevenuePoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  id: number;
  name: string;
  quantity_sold: number;
  revenue: number;
  cover_image: string | null;
}

export interface TopCategory {
  id: number;
  name: string;
  revenue: number;
  orders_count: number;
}

export interface CustomerPoint {
  date: string;
  new_customers: number;
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly api = inject(ApiService);

  getSummary(params: { period?: Period; startDate?: string; endDate?: string } = {}): Observable<AnalyticsSummary> {
    return this.api
      .get<{ success: boolean; data: AnalyticsSummary }>('/analytics/summary', params as any)
      .pipe(map((r) => r.data));
  }

  getRevenueChart(params: { period?: Period; startDate?: string; endDate?: string } = {}): Observable<RevenuePoint[]> {
    return this.api
      .get<{ success: boolean; data: RevenuePoint[] }>('/analytics/revenue-chart', params as any)
      .pipe(map((r) => r.data));
  }

  getTopProducts(params: { period?: Period; startDate?: string; endDate?: string; limit?: number } = {}): Observable<TopProduct[]> {
    return this.api
      .get<{ success: boolean; data: TopProduct[] }>('/analytics/top-products', params as any)
      .pipe(map((r) => r.data));
  }

  getTopCategories(params: { period?: Period; startDate?: string; endDate?: string } = {}): Observable<TopCategory[]> {
    return this.api
      .get<{ success: boolean; data: TopCategory[] }>('/analytics/top-categories', params as any)
      .pipe(map((r) => r.data));
  }

  getCustomersChart(params: { period?: Period; startDate?: string; endDate?: string } = {}): Observable<CustomerPoint[]> {
    return this.api
      .get<{ success: boolean; data: CustomerPoint[] }>('/analytics/customers-chart', params as any)
      .pipe(map((r) => r.data));
  }

  getDashboardStats(): Observable<DashboardStats> {
    return this.api
      .get<{ success: boolean; data: DashboardStats }>('/analytics/dashboard/stats')
      .pipe(map((r) => r.data));
  }
}

export interface DashboardKPIs {
  salesToday: number;
  salesMonth: number;
  pendingOrders: number;
  newCustomersMonth: number;
}

export interface DashboardStats {
  kpis: DashboardKPIs;
  revenueChart: { date: string; revenue: number }[];
  recentOrders: {
    id: number;
    reference: string;
    customer: string;
    total: number;
    status: number;
    date: string;
  }[];
  lowStockProducts: {
    id: number;
    name: string;
    quantity: number;
    reference: string | null;
  }[];
}
