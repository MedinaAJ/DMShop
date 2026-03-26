import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface ProductListItem {
  id: number;
  reference: string | null;
  price: number;
  quantity: number;
  active: boolean;
  name: string;
  slug: string;
  descriptionShort: string | null;
  coverImage: string | null;
  manufacturerName: string | null;
  categoryName: string | null;
}

interface ProductDetail {
  id: number;
  idCategoryDefault: number;
  idManufacturer: number | null;
  reference: string | null;
  ean13: string | null;
  price: number;
  weight: number;
  quantity: number;
  active: boolean;
  availableForOrder: boolean;
  showPrice: boolean;
  translations: Record<
    string,
    { name: string; description: string | null; descriptionShort: string | null; slug: string }
  >;
  images: Array<{ id: number; path: string; position: number; cover: boolean }>;
  categoryName: string | null;
  manufacturerName: string | null;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: { page: number; perPage: number; total: number; totalPages: number };
}

interface SingleResponse<T> {
  success: boolean;
  data: T;
}

export interface ProductFilters {
  page?: number;
  perPage?: number;
  search?: string;
  idCategory?: number;
  id_manufacturer?: number;
  min_price?: number;
  max_price?: number;
  in_stock?: boolean;
  attributes?: string;
  sort?: 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'bestseller' | 'name_asc';
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly api = inject(ApiService);

  list(
    params?: ProductFilters,
  ): Observable<PaginatedResponse<ProductListItem>> {
    const cleanParams: Record<string, string | number | boolean> = {};
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== '') {
          cleanParams[key] = value as string | number | boolean;
        }
      }
    }
    return this.api.get<PaginatedResponse<ProductListItem>>('/products', cleanParams);
  }

  getById(id: number): Observable<ProductDetail> {
    return this.api
      .get<SingleResponse<any>>(`/products/${id}`)
      .pipe(map((res) => this.transformProduct(res.data)));
  }

  private transformProduct(p: any): ProductDetail {
    const translations: Record<string, { name: string; description: string | null; descriptionShort: string | null; slug: string }> = {};
    if (Array.isArray(p.translations)) {
      const langMap: Record<number, string> = { 1: 'es', 2: 'en' };
      for (const t of p.translations) {
        const key = langMap[t.id_lang] || `lang_${t.id_lang}`;
        translations[key] = {
          name: t.name || '',
          description: t.description || null,
          descriptionShort: t.description_short || null,
          slug: t.slug || '',
        };
      }
    }
    return {
      id: p.id,
      idCategoryDefault: p.id_category_default ?? p.idCategoryDefault,
      idManufacturer: p.id_manufacturer ?? p.idManufacturer ?? null,
      reference: p.reference || null,
      ean13: p.ean13 || null,
      price: Number(p.price),
      weight: Number(p.weight || 0),
      quantity: p.quantity,
      active: p.active,
      availableForOrder: p.available_for_order ?? p.availableForOrder ?? true,
      showPrice: p.show_price ?? p.showPrice ?? true,
      translations,
      images: p.images || [],
      categoryName: p.categoryName || null,
      manufacturerName: p.manufacturer?.name ?? p.manufacturerName ?? null,
      specificPrices: p.specificPrices || [],
    } as any;
  }

  getByCategory(
    categoryId: number,
    params?: ProductFilters,
  ): Observable<PaginatedResponse<ProductListItem>> {
    return this.list({ ...params, idCategory: categoryId });
  }

  quickSearch(
    query: string,
    limit = 8,
  ): Observable<{ success: boolean; data: ProductListItem[] }> {
    return this.api.get<{ success: boolean; data: ProductListItem[] }>('/search', {
      q: query,
      limit,
    });
  }
}
