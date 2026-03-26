import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { CurrencyPipe } from '@angular/common';
import { PaymentService } from '../../core/services/payment.service';
import { OrderService } from '../../core/services/order.service';

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinner,
    MatCardModule,
    MatDividerModule,
    CurrencyPipe,
  ],
  template: `
    <div class="max-w-2xl mx-auto px-4 py-12">
      @if (loading()) {
        <div class="flex justify-center py-20">
          <mat-spinner diameter="48" />
        </div>
      } @else if (error()) {
        <div class="text-center">
          <mat-icon class="!text-6xl text-red-400 mb-4">error_outline</mat-icon>
          <h1 class="text-2xl font-bold mb-2">Error al cargar el pedido</h1>
          <p class="text-gray-500 mb-6">No pudimos obtener los detalles de tu pedido.</p>
          <a mat-flat-button color="primary" routerLink="/account/orders">Ver mis pedidos</a>
        </div>
      } @else if (order) {
        <div class="text-center mb-8">
          <mat-icon class="!text-7xl text-green-500 mb-4">check_circle</mat-icon>
          <h1 class="text-3xl font-bold mb-2">¡Gracias por tu pedido!</h1>
          <p class="text-gray-600 text-lg mb-1">
            Tu pedido <strong>#{{ order.reference }}</strong> ha sido confirmado.
          </p>
          <p class="text-gray-500">Recibirás un email de confirmación en breve.</p>
        </div>

        <!-- Payment info -->
        @if (isBankTransfer()) {
          <mat-card class="mb-6 !bg-blue-50 !border-blue-200">
            <mat-card-header>
              <mat-icon mat-card-avatar class="text-blue-600">account_balance</mat-icon>
              <mat-card-title class="text-blue-800">Instrucciones de transferencia bancaria</mat-card-title>
            </mat-card-header>
            <mat-card-content class="mt-4">
              <p class="text-gray-700 mb-4">
                Para completar tu pedido, realiza una transferencia bancaria con los siguientes datos:
              </p>
              <div class="bg-white rounded-lg p-4 space-y-3 border border-blue-200">
                <div class="flex justify-between">
                  <span class="text-gray-500 font-medium">IBAN:</span>
                  <span class="font-mono font-semibold">{{ bankIban }}</span>
                </div>
                <mat-divider />
                <div class="flex justify-between">
                  <span class="text-gray-500 font-medium">Titular:</span>
                  <span class="font-semibold">{{ bankHolder }}</span>
                </div>
                <mat-divider />
                <div class="flex justify-between">
                  <span class="text-gray-500 font-medium">Importe:</span>
                  <span class="font-semibold text-green-700">{{ order.totalPaid | currency: 'EUR' }}</span>
                </div>
                <mat-divider />
                <div class="flex justify-between">
                  <span class="text-gray-500 font-medium">Concepto / Referencia:</span>
                  <span class="font-mono font-semibold text-blue-700">{{ order.reference }}</span>
                </div>
              </div>
              <p class="text-sm text-gray-500 mt-3">
                <mat-icon class="!text-base align-middle">info</mat-icon>
                Incluye siempre la referencia del pedido en el concepto de la transferencia.
                Tu pedido será procesado una vez confirmemos el pago.
              </p>
            </mat-card-content>
          </mat-card>
        } @else {
          <div class="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <mat-icon class="text-green-600">verified</mat-icon>
            <p class="text-green-800 font-medium">Tu pago ha sido procesado correctamente.</p>
          </div>
        }

        <!-- Order summary -->
        <mat-card class="mb-6">
          <mat-card-header>
            <mat-card-title>Resumen del pedido</mat-card-title>
          </mat-card-header>
          <mat-card-content class="mt-4">
            @for (item of order.items; track item.id) {
              <div class="flex justify-between items-center py-3 border-b last:border-b-0">
                <div class="flex-1">
                  <p class="font-medium">{{ item.productName }}</p>
                  @if (item.combinationName) {
                    <p class="text-sm text-gray-500">{{ item.combinationName }}</p>
                  }
                  <p class="text-sm text-gray-500">Cantidad: {{ item.quantity }}</p>
                </div>
                <span class="font-semibold">{{ item.totalPrice | currency: 'EUR' }}</span>
              </div>
            }
            <div class="pt-4 space-y-2">
              @if (order.totalShipping > 0) {
                <div class="flex justify-between text-gray-600">
                  <span>Envío</span>
                  <span>{{ order.totalShipping | currency: 'EUR' }}</span>
                </div>
              } @else {
                <div class="flex justify-between text-gray-600">
                  <span>Envío</span>
                  <span class="text-green-600">Gratis</span>
                </div>
              }
              @if (order.totalDiscounts > 0) {
                <div class="flex justify-between text-green-600">
                  <span>Descuentos</span>
                  <span>-{{ order.totalDiscounts | currency: 'EUR' }}</span>
                </div>
              }
              <mat-divider />
              <div class="flex justify-between font-bold text-lg pt-1">
                <span>Total</span>
                <span>{{ order.totalPaid | currency: 'EUR' }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Delivery address -->
        @if (order.deliveryAddress) {
          <mat-card class="mb-6">
            <mat-card-header>
              <mat-icon mat-card-avatar>local_shipping</mat-icon>
              <mat-card-title>Dirección de entrega</mat-card-title>
            </mat-card-header>
            <mat-card-content class="mt-2">
              <p>{{ order.deliveryAddress.firstName }} {{ order.deliveryAddress.lastName }}</p>
              <p>{{ order.deliveryAddress.address1 }}</p>
              @if (order.deliveryAddress.address2) {
                <p>{{ order.deliveryAddress.address2 }}</p>
              }
              <p>{{ order.deliveryAddress.postcode }} {{ order.deliveryAddress.city }}</p>
              <p>{{ order.deliveryAddress.country?.name }}</p>
            </mat-card-content>
          </mat-card>
        }

        <!-- CTAs -->
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <a mat-flat-button color="primary" [routerLink]="['/account/orders', order.id]">
            <mat-icon>receipt_long</mat-icon>
            Ver mi pedido
          </a>
          <a mat-stroked-button routerLink="/catalog">
            <mat-icon>shopping_bag</mat-icon>
            Seguir comprando
          </a>
        </div>
      }
    </div>
  `,
})
export class OrderConfirmationComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly orderService = inject(OrderService);

  loading = signal(true);
  error = signal(false);
  order: any = null;

  // Bank transfer config — ideally loaded from backend config
  bankIban = 'ES00 0000 0000 0000 0000 0000';
  bankHolder = 'Desarrollos Medina S.L.';

  async ngOnInit(): Promise<void> {
    // Support both /checkout/success?orderId=X and /checkout/success/:orderId
    const orderId =
      Number(this.route.snapshot.params['orderId']) ||
      Number(this.route.snapshot.queryParams['orderId']);

    if (!orderId) {
      this.error.set(true);
      this.loading.set(false);
      return;
    }

    try {
      const res = await this.orderService.getMyOrderDetail(orderId);
      this.order = res.data;
    } catch {
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  isBankTransfer(): boolean {
    return this.order?.paymentMethod?.toLowerCase().includes('bank') ||
      this.order?.paymentMethod?.toLowerCase().includes('transfer') ||
      this.order?.paymentMethod === 'bank_transfer';
  }
}
