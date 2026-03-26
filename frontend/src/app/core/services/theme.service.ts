import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ThemeConfig {
  THEME_NAME: string;
  THEME_PRIMARY_COLOR: string;
  THEME_SECONDARY_COLOR: string;
  THEME_FONT: string;
  THEME_LOGO_URL: string;
  THEME_FAVICON_URL: string;
  THEME_SHOW_PRICES_WITHOUT_TAX: string;
  THEME_PRODUCTS_PER_PAGE: string;
  THEME_BANNER_TEXT: string;
  THEME_BANNER_SUBTITLE: string;
  THEME_BANNER_IMAGE_URL: string;
}

const DEFAULTS: ThemeConfig = {
  THEME_NAME: 'default',
  THEME_PRIMARY_COLOR: '#1a56db',
  THEME_SECONDARY_COLOR: '#7e3af2',
  THEME_FONT: 'Inter',
  THEME_LOGO_URL: '',
  THEME_FAVICON_URL: '',
  THEME_SHOW_PRICES_WITHOUT_TAX: 'false',
  THEME_PRODUCTS_PER_PAGE: '12',
  THEME_BANNER_TEXT: 'Bienvenido a DMShop',
  THEME_BANNER_SUBTITLE: 'Descubre nuestra colección',
  THEME_BANNER_IMAGE_URL: '',
};

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);

  readonly config = signal<ThemeConfig>({ ...DEFAULTS });
  readonly config$ = new BehaviorSubject<ThemeConfig>({ ...DEFAULTS });

  async init(): Promise<void> {
    try {
      const data = await firstValueFrom(
        this.http.get<ThemeConfig>(`${environment.apiUrl}/theme/config`)
      );
      const merged = { ...DEFAULTS, ...data };
      this.config.set(merged);
      this.config$.next(merged);
      this.applyTheme(merged);
    } catch {
      // Apply defaults even if API fails
      this.applyTheme(DEFAULTS);
    }
  }

  private applyTheme(config: ThemeConfig): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const root = document.documentElement;

    // Apply CSS custom properties
    if (config.THEME_PRIMARY_COLOR) {
      root.style.setProperty('--color-primary', config.THEME_PRIMARY_COLOR);
      root.style.setProperty('--color-primary-rgb', this.hexToRgb(config.THEME_PRIMARY_COLOR));
    }
    if (config.THEME_SECONDARY_COLOR) {
      root.style.setProperty('--color-secondary', config.THEME_SECONDARY_COLOR);
    }

    // Apply font
    if (config.THEME_FONT) {
      this.loadGoogleFont(config.THEME_FONT);
      root.style.setProperty('--font-family', `'${config.THEME_FONT}', sans-serif`);
    }

    // Apply favicon
    if (config.THEME_FAVICON_URL) {
      let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = config.THEME_FAVICON_URL;
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
