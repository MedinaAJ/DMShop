import { Injectable, inject, signal, computed } from '@angular/core';
import { ApiService } from './api.service';
import { firstValueFrom } from 'rxjs';

export interface Currency {
  id: number;
  name: string;
  iso_code: string;
  symbol: string;
  conversion_rate: number;
  decimals: number;
  active: boolean;
  is_default: boolean;
}

const STORAGE_KEY = 'dmshop_currency';

@Injectable({ providedIn: 'root' })
export class CurrencyService {
  private readonly api = inject(ApiService);

  private readonly currencies = signal<Currency[]>([]);
  private readonly activeCurrency = signal<Currency | null>(null);

  readonly currentCurrency = computed(() => this.activeCurrency());
  readonly availableCurrencies = computed(() => this.currencies());

  async loadCurrencies(): Promise<void> {
    try {
      const res = await firstValueFrom(
        this.api.get<{ success: boolean; data: Currency[] }>('/currencies/active'),
      );
      this.currencies.set(res.data);

      // Restore persisted currency
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const found = res.data.find((c) => c.iso_code === saved);
        if (found) {
          this.activeCurrency.set(found);
          return;
        }
      }

      // Default currency
      const defaultCurrency = res.data.find((c) => c.is_default) ?? res.data[0] ?? null;
      this.activeCurrency.set(defaultCurrency);
    } catch {
      // Fail silently — use EUR as fallback
      this.activeCurrency.set({
        id: 1,
        name: 'Euro',
        iso_code: 'EUR',
        symbol: '€',
        conversion_rate: 1,
        decimals: 2,
        active: true,
        is_default: true,
      });
    }
  }

  setCurrency(currency: Currency): void {
    this.activeCurrency.set(currency);
    localStorage.setItem(STORAGE_KEY, currency.iso_code);
  }

  /**
   * Format an amount in the base currency (EUR) to the active currency.
   * Returns a formatted string like "12,99 €" or "$14.23"
   */
  format(amount: number): string {
    const currency = this.activeCurrency();
    if (!currency) return `${amount.toFixed(2)} €`;

    const converted = amount * currency.conversion_rate;
    const formatted = converted.toFixed(currency.decimals);

    // Use Intl.NumberFormat for proper locale formatting
    try {
      return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: currency.iso_code,
        minimumFractionDigits: currency.decimals,
        maximumFractionDigits: currency.decimals,
      }).format(converted);
    } catch {
      return `${formatted} ${currency.symbol}`;
    }
  }

  /**
   * Convert amount from base currency to active currency (numeric only)
   */
  convert(amount: number): number {
    const currency = this.activeCurrency();
    if (!currency) return amount;
    return amount * currency.conversion_rate;
  }

  /**
   * Get active currency ISO code (e.g. 'EUR', 'USD')
   */
  getIsoCode(): string {
    return this.activeCurrency()?.iso_code ?? 'EUR';
  }
}
