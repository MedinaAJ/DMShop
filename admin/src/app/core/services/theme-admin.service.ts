import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';

export interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  font: string;
  logoUrl?: string;
  faviconUrl?: string;
  showPricesWithoutTax?: boolean;
  productsPerPage?: number;
  bannerText?: string;
  bannerSubtitle?: string;
  bannerImageUrl?: string;
  headerStyle?: 'light' | 'dark' | 'transparent';
  productCardStyle?: 'classic' | 'minimal' | 'detailed';
  borderRadius?: 'none' | 'small' | 'medium' | 'large';
  buttonStyle?: 'filled' | 'outlined' | 'soft';
  colorScheme?: 'light' | 'dark';
}

export interface Theme {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  preview_image: string | null;
  is_active: number;
  is_builtin: number;
  config: ThemeConfig;
}

export interface CreateThemeDto {
  name: string;
  slug: string;
  description?: string;
  preview_image?: string;
  config: ThemeConfig;
}

export interface ThemeFileImport {
  dmshop_theme_version: string;
  name: string;
  slug: string;
  description?: string;
  preview_image?: string;
  config: ThemeConfig;
}

@Injectable({ providedIn: 'root' })
export class ThemeAdminService {
  private readonly api = inject(ApiService);

  getAll(): Observable<Theme[]> {
    return this.api.get<{ success: boolean; data: Theme[] }>('/themes').pipe(
      map((r) => r.data),
    );
  }

  activate(id: number): Observable<void> {
    return this.api.post<void>(`/themes/${id}/activate`, {});
  }

  update(id: number, config: Partial<ThemeConfig>): Observable<Theme> {
    return this.api.put<{ success: boolean; data: Theme }>(`/themes/${id}`, config).pipe(
      map((r) => r.data),
    );
  }

  create(data: CreateThemeDto): Observable<Theme> {
    return this.api.post<{ success: boolean; data: Theme }>('/themes', data).pipe(
      map((r) => r.data),
    );
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(`/themes/${id}`);
  }

  duplicate(id: number): Observable<Theme> {
    return this.api.post<{ success: boolean; data: Theme }>(`/themes/${id}/duplicate`, {}).pipe(
      map((r) => r.data),
    );
  }

  importTheme(data: ThemeFileImport): Observable<Theme> {
    return this.api.post<{ success: boolean; data: Theme }>('/themes/import', data).pipe(
      map((r) => r.data),
    );
  }

  exportTheme(id: number, slug: string): void {
    this.api.getBlob(`/themes/${id}/export`).subscribe((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${slug}.dmshop-theme.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }
}
