import { Injectable, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);

  private translations: Record<string, unknown> = {};
  private readonly _currentLang = signal<string>('es');
  readonly currentLang = computed(() => this._currentLang());

  /** Observable so components can react to language changes */
  readonly lang$ = new BehaviorSubject<string>('es');
  readonly lang = computed(() => this._currentLang());

  /** Supported languages (loaded from API or defaults) */
  availableLanguages = signal<{ iso_code: string; name: string; flag?: string }[]>([
    { iso_code: 'es', name: 'Español', flag: '🇪🇸' },
    { iso_code: 'en', name: 'English', flag: '🇬🇧' },
  ]);

  // Embedded minimal fallback
  private readonly fallback: Record<string, Record<string, string>> = {
    es: {
      'nav.home': 'Inicio',
      'nav.catalog': 'Catálogo',
      'nav.cart': 'Carrito',
      'nav.account': 'Mi cuenta',
      'nav.login': 'Iniciar sesión',
      'nav.logout': 'Cerrar sesión',
      'nav.register': 'Registrarse',
      'product.addToCart': 'Añadir al carrito',
      'product.inStock': 'En stock',
      'product.outOfStock': 'Sin stock',
      'cart.title': 'Tu carrito',
      'cart.empty': 'Tu carrito está vacío',
      'common.loading': 'Cargando...',
      'common.error': 'Se ha producido un error',
      'common.save': 'Guardar',
      'common.cancel': 'Cancelar',
    },
    en: {
      'nav.home': 'Home',
      'nav.catalog': 'Catalog',
      'nav.cart': 'Cart',
      'nav.account': 'My Account',
      'nav.login': 'Login',
      'nav.logout': 'Logout',
      'nav.register': 'Register',
      'product.addToCart': 'Add to cart',
      'product.inStock': 'In stock',
      'product.outOfStock': 'Out of stock',
      'cart.title': 'Your cart',
      'cart.empty': 'Your cart is empty',
      'common.loading': 'Loading...',
      'common.error': 'An error occurred',
      'common.save': 'Save',
      'common.cancel': 'Cancel',
    },
  };

  /** Initialize: load default language. Called by app.config.ts APP_INITIALIZER */
  async init(): Promise<void> {
    const savedLang = isPlatformBrowser(this.platformId)
      ? localStorage.getItem('lang') ?? 'es'
      : 'es';
    await this.setLanguage(savedLang);
  }

  /** Load translations for a given language from a local JSON file */
  async setLanguage(lang: string): Promise<void> {
    this._currentLang.set(lang);
    this.lang$.next(lang);

    if (isPlatformBrowser(this.platformId)) {
      try {
        // Try to load from API first
        const res = await firstValueFrom(
          this.http
            .get<{ success: boolean; data: Record<string, string> }>(
              `${environment.apiUrl}/translations/${lang}`,
            )
            .pipe(catchError(() => of({ success: false, data: {} }))),
        );
        const data = res.data ?? {};
        if (Object.keys(data).length > 0) {
          // Convert flat keys to nested object for backward compatibility
          this.translations = this.flatToNested(data);
          return;
        }
      } catch { /* ignore - fall through to JSON */ }

      try {
        const json = await firstValueFrom(
          this.http
            .get<Record<string, unknown>>(`/assets/i18n/${lang}.json`)
            .pipe(catchError(() => of({}))),
        );
        this.translations = json;
      } catch {
        this.translations = this.fallback[lang] ?? this.fallback['es'] ?? {};
      }
    }
  }

  /** Load translations from API (new API-first method) */
  loadLanguage(lang: string): void {
    this._currentLang.set(lang);
    this.lang$.next(lang);
    this.http
      .get<{ success: boolean; data: Record<string, string> }>(
        `${environment.apiUrl}/translations/${lang}`,
      )
      .pipe(catchError(() => of({ success: false, data: {} })))
      .subscribe((res) => {
        const data = res.data ?? {};
        if (Object.keys(data).length > 0) {
          this.translations = this.flatToNested(data);
        } else {
          this.translations = this.fallback[lang] ?? this.fallback['es'] ?? {};
        }
      });
  }

  /** Translate a dot-notation key with optional interpolation params */
  t(key: string, params?: Record<string, unknown>): string {
    const value = this.resolveNested(key, this.translations);
    if (value === null) {
      // Fallback to flat key lookup
      return this.fallback[this._currentLang()]?.[key] ?? key;
    }
    let result = value;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        result = result.replace(new RegExp(`{{\\s*${k}\\s*}}`, 'g'), String(v));
      }
    }
    return result;
  }

  /** Alias for t() for backward compatibility */
  translate(key: string, params?: Record<string, string | number>): string {
    return this.t(key, params);
  }

  /** Resolve dot-notation path in the translations object */
  private resolveNested(key: string, obj: Record<string, unknown>): string | null {
    const parts = key.split('.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let current: any = obj;
    for (const part of parts) {
      if (current == null || typeof current !== 'object') return null;
      current = (current as Record<string, unknown>)[part];
    }
    return typeof current === 'string' ? current : null;
  }

  /** Convert flat key-value object to nested object */
  private flatToNested(flat: Record<string, string>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(flat)) {
      const parts = key.split('.');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let current: any = result;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]] || typeof current[parts[i]] !== 'object') {
          current[parts[i]] = {};
        }
        current = current[parts[i]];
      }
      current[parts[parts.length - 1]] = value;
    }
    return result;
  }
}
