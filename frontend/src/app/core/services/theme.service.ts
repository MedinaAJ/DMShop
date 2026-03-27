import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

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

const DEFAULTS: ThemeConfig = {
  primaryColor: '#1a56db',
  secondaryColor: '#7e3af2',
  font: 'Inter',
  logoUrl: '',
  faviconUrl: '',
  showPricesWithoutTax: false,
  productsPerPage: 12,
  bannerText: 'Bienvenido a DMShop',
  bannerSubtitle: 'Descubre nuestra colección',
  bannerImageUrl: '',
  headerStyle: 'light',
  productCardStyle: 'classic',
  borderRadius: 'medium',
  buttonStyle: 'filled',
  colorScheme: 'light',
};

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);

  readonly config = signal<ThemeConfig>({ ...DEFAULTS });
  readonly config$ = new BehaviorSubject<ThemeConfig>({ ...DEFAULTS });

  async init(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ success: boolean; data: Theme }>(`${environment.apiUrl}/themes/active`)
      );
      const themeConfig = response?.data?.config ?? (response as unknown as ThemeConfig);
      const merged = { ...DEFAULTS, ...themeConfig };
      this.config.set(merged);
      this.config$.next(merged);
      this.applyTheme(merged);
    } catch {
      // Apply defaults even if API fails
      this.applyTheme(DEFAULTS);
    }
  }

  applyTheme(config: ThemeConfig): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const root = document.documentElement;

    // Colors
    if (config.primaryColor) {
      root.style.setProperty('--color-primary', config.primaryColor);
      root.style.setProperty('--color-primary-rgb', this.hexToRgb(config.primaryColor));
    }
    if (config.secondaryColor) {
      root.style.setProperty('--color-secondary', config.secondaryColor);
    }

    // Font
    if (config.font) {
      this.loadGoogleFont(config.font);
      root.style.setProperty('--font-family', `'${config.font}', sans-serif`);
    }

    // Border radius preset
    const radii: Record<string, string> = {
      none: '0',
      small: '4px',
      medium: '8px',
      large: '16px',
    };
    if (config.borderRadius) {
      root.style.setProperty('--border-radius', radii[config.borderRadius] ?? '8px');
    }

    // Color scheme (dark mode)
    root.setAttribute('data-theme', config.colorScheme ?? 'light');

    // Favicon
    if (config.faviconUrl) {
      let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = config.faviconUrl;
    }
  }

  private loadGoogleFont(fontName: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const safeFont = fontName.replace(/ /g, '+');
    const id = `gfont-${safeFont}`;
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${safeFont}:wght@400;500;600;700&display=swap`;
    document.head.appendChild(link);
  }

  private hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : '26, 86, 219';
  }
}
