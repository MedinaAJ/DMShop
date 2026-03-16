import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface CategoryTree {
  id: number;
  name: string;
  slug: string;
  active: boolean;
  children: CategoryTree[];
}

interface CategoryDetail {
  id: number;
  idParent: number | null;
  position: number;
  active: boolean;
  translations: Record<string, { name: string; description: string | null; slug: string }>;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly api = inject(ApiService);

  getTree(): Observable<CategoryTree[]> {
    return this.api
      .get<ApiResponse<CategoryTree[]>>('/categories/tree')
      .pipe(map((res) => res.data));
  }

  getById(id: number): Observable<CategoryDetail> {
    return this.api
      .get<ApiResponse<CategoryDetail>>(`/categories/${id}`)
      .pipe(map((res) => res.data));
  }
}
