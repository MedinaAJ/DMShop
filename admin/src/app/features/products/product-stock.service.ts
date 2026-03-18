import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';

export interface StockMovement {
  id: number;
  id_product: number;
  id_combination: number | null;
  movement_type: 'in' | 'out' | 'adjustment' | 'order_reserved' | 'order_cancelled';
  quantity: number;
  stock_before: number;
  stock_after: number;
  id_order: number | null;
  reason: string | null;
  created_at: string;
}

export interface StockAlert {
  id: number;
  reference: string | null;
  name: string;
  quantity: number;
  lowStockAlert: number;
}

@Injectable({ providedIn: 'root' })
export class ProductStockService {
  private readonly api = inject(ApiService);

  getMovements(idProduct: number, page = 1, limit = 10): Observable<{ data: StockMovement[]; meta: any }> {
    return this.api
      .get<any>('/stock/movements', { id_product: idProduct, page, limit })
      .pipe(map((r) => ({ data: r.data ?? [], meta: r.meta })));
  }

  createMovement(params: {
    id_product: number;
    id_combination?: number | null;
    movement_type: string;
    quantity: number;
    reason?: string;
  }): Observable<StockMovement> {
    return this.api.post<any>('/stock/movements', params).pipe(map((r) => r.data));
  }

  getAlerts(): Observable<StockAlert[]> {
    return this.api.get<any>('/stock/alerts').pipe(map((r) => r.data ?? []));
  }

  adjustProductStock(idProduct: number, quantity: number, reason?: string): Observable<StockMovement> {
    return this.api
      .put<any>(`/products/${idProduct}/stock`, { quantity, reason })
      .pipe(map((r) => r.data));
  }

  adjustCombinationStock(
    idProduct: number,
    idCombination: number,
    quantity: number,
    reason?: string,
  ): Observable<StockMovement> {
    return this.api
      .put<any>(`/products/${idProduct}/combinations/${idCombination}/stock`, { quantity, reason })
      .pipe(map((r) => r.data));
  }
}
