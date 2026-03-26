import {
  ApplicationConfig,
  provideZoneChangeDetection,
  APP_INITIALIZER,
  inject,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { AuthService } from './core/services/auth.service';
import { I18nService } from './core/services/i18n.service';
import { ThemeService } from './core/services/theme.service';
import { CurrencyService } from './core/services/currency.service';

function initializeAuth(): () => Promise<void> {
  const authService = inject(AuthService);
  return () => authService.init();
}

function initializeI18n(): () => Promise<void> {
  const i18nService = inject(I18nService);
  return () => i18nService.init();
}

function initializeTheme(): () => Promise<void> {
  const themeService = inject(ThemeService);
  return () => themeService.init();
}

function initializeCurrencies(): () => Promise<void> {
  const currencyService = inject(CurrencyService);
  return () => currencyService.loadCurrencies();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, errorInterceptor])),
    provideAnimationsAsync(),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAuth,
      multi: true,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeI18n,
      multi: true,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeTheme,
      multi: true,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeCurrencies,
      multi: true,
    },
  ],
};
