import { Pipe, PipeTransform, inject, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { I18nService } from '../../core/services/i18n.service';

/**
 * Translate pipe
 * Usage: {{ 'product.add_to_cart' | translate }}
 *        {{ 'cart.items' | translate: { count: 3 } }}
 *
 * The pipe is *impure* so it re-renders whenever the language changes.
 * To avoid excessive CD cycles we subscribe to lang$ and manually mark for check.
 */
@Pipe({
  name: 'translate',
  standalone: true,
  pure: false,
})
export class TranslatePipe implements PipeTransform, OnDestroy {
  private readonly i18n = inject(I18nService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly sub: Subscription;

  constructor() {
    this.sub = this.i18n.lang$.subscribe(() => this.cdr.markForCheck());
  }

  transform(key: string, params?: Record<string, unknown>): string {
    return this.i18n.t(key, params);
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
