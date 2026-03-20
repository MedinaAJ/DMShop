import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { CurrencyPipe } from '@angular/common';
import { PaymentService } from '../../core/services/payment.service';

@Component({
  selector: 'app-payment-confirmation',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, MatProgressSpinner, MatCardModule, CurrencyPipe],
  template: `
    <div class="max-w-xl mx-auto px-4 py-12 text-center">
      @if (loading()) {
        <mat-spinner diameter="48" class="mx-auto" />
      } @else if (error()) {
        <mat-icon class="!text-6xl text-red-400 mb-4">error_outline</mat-icon>
        <h1 class="text-2xl font-bold mb-2">Error al verificar el pago</h1>
        <p class="text-gray-500 mb-6">No pudimos verificar el estado de tu pago.</p>
        <a mat-flat-button color="primary" routerLink="/account/orders">Ver mis pedidos</a>
      } @else {
        <mat-icon class="!text-6xl text-green-500 mb-4">check_circle</mat-icon>
        <h1 class="text-2xl font-bold mb-2">¡Pedido confirmado!</h1>
        <p class="text-gray-500 mb-2">Referencia: <strong>{{ confirmation?.reference }}</strong></p>
        <p class="text-gray-500 mb-2">Estado: <strong>{{ confirmation?.status }}</strong></p>
        <p class="text-gray-500 mb-6">Total: <strong>{{ confirmation?.totalPaid | currency:'EUR' }}</strong></p>
        <div class="flex justify-center gap-4">
          <a mat-flat-button color="primary" [routerLink]="['/account/orders', orderId]">Ver pedido</a>
          <a mat-stroked-button routerLink="/">Seguir comprando</a>
        </div>
      }
    </div>
  `,
})
export class PaymentConfirmationComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly paymentService = inject(PaymentService);

  loading = signal(true);
  error = signal(false);
  confirmation: any = null;
  orderId = 0;

  async ngOnInit(): Promise<void> {
    this.orderId = Number(this.route.snapshot.params['orderId']);
    try {
      const res = await this.paymentService.getConfirmation(this.orderId);
      this.confirmation = res.data;
    } catch {
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }
}
