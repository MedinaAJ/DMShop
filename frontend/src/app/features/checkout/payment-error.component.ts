import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../core/services/cart.service';
import { PaymentService, PaymentMethodOption } from '../../core/services/payment.service';

@Component({
  selector: 'app-payment-error',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatRadioModule,
    MatProgressSpinner,
    FormsModule,
  ],
  template: `
    <div class="max-w-xl mx-auto px-4 py-12">
      <div class="text-center mb-8">
        <mat-icon class="!text-7xl text-red-500 mb-4">cancel</mat-icon>
        <h1 class="text-3xl font-bold mb-2">Error en el pago</h1>
        <p class="text-gray-600 mb-1">{{ errorMessage() }}</p>
        @if (orderId()) {
          <p class="text-sm text-gray-500">Referencia de pedido: <strong>#{{ orderId() }}</strong></p>
        }
      </div>

      <!-- Cart is preserved notice -->
      <div class="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <mat-icon class="text-amber-600 mt-0.5 shrink-0">info</mat-icon>
        <div>
          <p class="font-medium text-amber-800">Tu carrito está intacto</p>
          <p class="text-sm text-amber-700">
            Los productos que seleccionaste siguen guardados. Puedes volver a intentarlo cuando quieras.
          </p>
        </div>
      </div>

      @if (loadingMethods()) {
        <div class="flex justify-center py-6"><mat-spinner diameter="36" /></div>
      } @else if (paymentMethods().length > 0 && orderId()) {
        <!-- Retry with same or different method -->
        <mat-card class="mb-6">
          <mat-card-header>
            <mat-card-title>¿Qué deseas hacer?</mat-card-title>
          </mat-card-header>
          <mat-card-content class="mt-4 space-y-3">
            <label class="flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition hover:bg-gray-50"
                   [class.border-blue-500]="retryOption === 'same'"
                   [class.bg-blue-50]="retryOption === 'same'">
              <input type="radio" name="retryOption" value="same" [(ngModel)]="retryOption" class="accent-blue-600">
              <div>
                <p class="font-medium">Reintentar con {{ lastMethod() || 'el mismo método' }}</p>
                <p class="text-sm text-gray-500">Intentar el pago de nuevo con el mismo método</p>
              </div>
            </label>
            <label class="flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition hover:bg-gray-50"
                   [class.border-blue-500]="retryOption === 'other'"
                   [class.bg-blue-50]="retryOption === 'other'">
              <input type="radio" name="retryOption" value="other" [(ngModel)]="retryOption" class="accent-blue-600">
              <div>
                <p class="font-medium">Elegir otro método de pago</p>
                <p class="text-sm text-gray-500">Selecciona un método de pago diferente</p>
              </div>
            </label>

            @if (retryOption === 'other') {
              <div class="ml-6 mt-2 space-y-2">
                @for (method of paymentMethods(); track method.name) {
                  @if (method.name !== lastMethod()) {
                    <label class="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                           [class.border-blue-500]="selectedMethod === method.name"
                           [class.bg-blue-50]="selectedMethod === method.name">
                      <input type="radio" name="method" [value]="method.name" [(ngModel)]="selectedMethod" class="accent-blue-600">
                      <div>
                        <p class="font-medium">{{ method.displayName }}</p>
                        <p class="text-sm text-gray-500">{{ method.description }}</p>
                      </div>
                    </label>
                  }
                }
              </div>
            }

            <div class="pt-2">
              <button mat-flat-button color="primary" class="w-full"
                      [disabled]="retrying() || (retryOption === 'other' && !selectedMethod)"
                      (click)="retryPayment()">
                @if (retrying()) {
                  <mat-spinner diameter="20" class="inline-block mr-2" />
                  Procesando...
                } @else {
                  <mat-icon>refresh</mat-icon>
                  Reintentar pago
                }
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      }

      <!-- Alternative actions -->
      <div class="flex flex-col sm:flex-row gap-3">
        <a mat-stroked-button routerLink="/checkout" class="flex-1 text-center">
          <mat-icon>shopping_cart</mat-icon>
          Volver al checkout
        </a>
        <a mat-button routerLink="/catalog" class="flex-1 text-center">
          <mat-icon>store</mat-icon>
          Seguir comprando
        </a>
      </div>

      @if (retryError()) {
        <div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <mat-icon class="!text-base align-middle mr-1">error</mat-icon>
          {{ retryError() }}
        </div>
      }
    </div>
  `,
})
export class PaymentErrorComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly paymentService = inject(PaymentService);
  private readonly cartService = inject(CartService);

  loading = signal(true);
  loadingMethods = signal(false);
  retrying = signal(false);
  errorMessage = signal('El pago no pudo completarse. Por favor, inténtalo de nuevo.');
  retryError = signal('');
  orderId = signal<number | null>(null);
  lastMethod = signal('');
  paymentMethods = signal<PaymentMethodOption[]>([]);

  retryOption: 'same' | 'other' = 'same';
  selectedMethod = '';

  async ngOnInit(): Promise<void> {
    const params = this.route.snapshot.queryParams;
    const routeParams = this.route.snapshot.params;

    const orderId = Number(routeParams['orderId']) || Number(params['orderId']) || null;
    if (orderId) this.orderId.set(orderId);

    const reason = params['reason'];
    if (reason) {
      this.errorMessage.set(this.mapErrorReason(reason));
    }

    const method = params['method'];
    if (method) this.lastMethod.set(method);

    // Load payment methods for retry
    if (orderId) {
      this.loadingMethods.set(true);
      try {
        const methods = await this.paymentService.getAvailableMethods();
        this.paymentMethods.set(methods);
        if (method) {
          this.retryOption = 'same';
        }
      } catch {
        // Non-critical, just hide retry options
      } finally {
        this.loadingMethods.set(false);
      }
    }
  }

  async retryPayment(): Promise<void> {
    const orderId = this.orderId();
    if (!orderId) return;

    const method = this.retryOption === 'same'
      ? this.lastMethod()
      : this.selectedMethod;

    if (!method) return;

    this.retrying.set(true);
    this.retryError.set('');

    try {
      const result = await this.paymentService.processPayment(orderId, method);
      if (result.status === 'redirect' && result.redirectUrl) {
        window.location.href = result.redirectUrl;
      } else if (result.status === 'completed') {
        this.router.navigate(['/checkout/success'], { queryParams: { orderId } });
      } else if (result.status === 'pending') {
        this.router.navigate(['/checkout/success'], { queryParams: { orderId } });
      }
    } catch (err: any) {
      this.retryError.set(
        err?.error?.message || 'No se pudo procesar el pago. Inténtalo de nuevo.'
      );
    } finally {
      this.retrying.set(false);
    }
  }

  private mapErrorReason(reason: string): string {
    const messages: Record<string, string> = {
      cancelled: 'Has cancelado el pago. Tu carrito sigue guardado.',
      declined: 'Tu tarjeta ha sido rechazada. Verifica los datos o usa otro método.',
      expired: 'La sesión de pago ha expirado. Por favor, inténtalo de nuevo.',
      insufficient_funds: 'Fondos insuficientes. Por favor, usa otro método de pago.',
      invalid_card: 'Los datos de la tarjeta no son válidos.',
      error: 'Se ha producido un error técnico. Por favor, inténtalo de nuevo.',
    };
    return messages[reason] || 'El pago no pudo completarse. Por favor, inténtalo de nuevo.';
  }
}
