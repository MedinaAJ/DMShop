import { Injectable, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);

  private translations: Record<string, unknown> = {};
  private readonly currentLang = signal<string>('es');

  /** Observable so components can react to language changes */
  readonly lang$ = new BehaviorSubject<string>('es');
  readonly lang = computed(() => this.currentLang());

  /** Supported languages (loaded from API or defaults) */
  availableLanguages = signal<{ iso_code: string; name: string; flag?: string }[]>([
    { iso_code: 'es', name: 'Español', flag: '🇪🇸' },
    { iso_code: 'en', name: 'English', flag: '🇬🇧' },
  ]);

  /** Detect preferred language */
  private detectLanguage(): string {
    if (isPlatformBrowser(this.platformId)) {
      const stored = localStorage.getItem('dmshop_lang');
      if (stored) return stored;
      // Accept-Language fallback
      const browser = navigator.language?.split('-')[0];
      if (browser === 'en') return 'en';
    }
    return 'es';
  }

  /** Load translations for a given language (API first, JSON fallback) */
  private async loadTranslations(lang: string): Promise<Record<string, unknown>> {
    // Try API first
    try {
      const data = await firstValueFrom(
        this.http.get<Record<string, unknown>>(`${environment.apiUrl}/translations/${lang}`)
      );
      if (data && Object.keys(data).length > 0) return data;
    } catch {
      // fallback to local JSON
    }
    // Load from local assets
    try {
      const data = await firstValueFrom(
        this.http.get<Record<string, unknown>>(`/assets/i18n/${lang}.json`)
      );
      return data ?? {};
    } catch {
      return {};
    }
  }

  /** Load available languages from API */
  private async loadAvailableLangs(): Promise<void> {
    try {
      const data = await firstValueFrom(
        this.http.get<{ iso_code: string; name: string; flag?: string }[]>(
          `${environment.apiUrl}/langs/active`
        )
      );
      if (Array.isArray(data) && data.length > 0) {
        this.availableLanguages.set(data);
      }
    } catch {
      // keep defaults
    }
  }

  /** Initialize the service — call from APP_INITIALIZER */
  async init(): Promise<void> {
    await this.loadAvailableLangs();
    const lang = this.detectLanguage();
    await this.setLanguage(lang);
  }

  /** Change the active language */
  async setLanguage(lang: string): Promise<void> {
    this.translations = await this.loadTranslations(lang);
    this.currentLang.set(lang);
    this.lang$.next(lang);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('dmshop_lang', lang);
      document.documentElement.lang = lang;
    }
  }

  /** Translate a dot-notation key with optional interpolation params */
  t(key: string, params?: Record<string, unknown>): string {
    const value = this.resolve(key, this.translations);
    if (value === null) return key; // fallback: show key
    let result = value;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        result = result.replace(new RegExp(`{{\\s*${k}\\s*}}`, 'g'), String(v));
      }
    }
    return result;
  }

  /** Resolve dot-notation path in the translations object */
  private resolve(key: string, obj: Record<string, unknown>): string {
    const parts = key.split('.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let current: any = obj;
    for (const part of parts) {
      if (current == null || typeof current !== 'object') return key;
      current = (current as Record<string, unknown>)[part];
    }
    return typeof current === 'string' ? current : key;
  }
}
