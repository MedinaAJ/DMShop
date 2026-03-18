import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { OrderService } from '../../../core/services/order.service';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule, CurrencyPipe, DatePipe],
  template: `
    @if (loading) {
      <div class="flex justify-center py-8"><mat-spinner diameter="40" /></div>
    } @else if (!order) {
      <p class="text-center text-gray-500">Pedido no encontrado.</p>
    } @else {
      <div class="mb-4">
        <a mat-button routerLink="/account/orders"><mat-icon>arrow_back</mat-icon> Mis pedidos</a>
      </div>

      <div class="bg-white rounded-lg shadow p-6 mb-4">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-xl font-semibold">Pedido #{{ order.reference }}</h2>
            <p class="text-sm text-gray-500">{{ order.createdAt | date:'dd/MM/yyyy HH:mm' }}</p>
          </div>
          <div class="flex items-center gap-3">
            <span class="px-3 py-1 rounded text-white text-sm font-semibold" [style.backgroundColor]="order.stateColor">
              {{ order.stateName }}
            </span>
            <button mat-stroked-button (click)="downloadInvoice()" [disabled]="downloadingInvoice" class="text-sm">
              <mat-icon>picture_as_pdf</mat-icon>
              {{ downloadingInvoice ? 'Generando...' : 'Factura PDF' }}
            </button>
          </div>
        </div>

        <!-- Items -->
        <h3 class="font-semibold mb-2">Artículos</h3>
        <div class="overflow-x-auto mb-4">
          <table class="w-full text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th class="text-left p-2">Producto</th>
                <th class="text-right p-2">Precio</th>
                <th class="text-center p-2">Cant.</th>
                <th class="text-right p-2">Total</th>
              </tr>
            </thead>
            <tbody>
              @for (item of order.items; track item.id) {
                <tr class="border-t">
                  <td class="p-2">{{ item.productName }}</td>
                  <td class="text-right p-2">{{ item.unitPrice | currency:'EUR' }}</td>
                  <td class="text-center p-2">{{ item.quantity }}</td>
                  <td class="text-right p-2">{{ item.totalPrice | currency:'EUR' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Totals -->
        <div class="flex justify-end">
          <div class="w-64 space-y-1 text-sm">
            <div class="flex justify-between"><span>Subtotal:</span><span>{{ order.totalProducts | currency:'EUR' }}</span></div>
            <div class="flex justify-between"><span>Envío:</span><span>{{ order.totalShipping | currency:'EUR' }}</span></div>
            @if (order.totalDiscounts > 0) {
              <div class="flex justify-between text-green-600"><span>Descuentos:</span><span>-{{ order.totalDiscounts | currency:'EUR' }}</span></div>
            }
            <div class="flex justify-between"><span>Impuestos:</span><span>{{ order.totalTax | currency:'EUR' }}</span></div>
            <div class="flex justify-between font-bold border-t pt-1"><span>Total:</span><span>{{ order.totalPaid | currency:'EUR' }}</span></div>
          </div>
        </div>
      </div>

      <!-- Addresses and carrier -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        @if (order.deliveryAddress) {
          <div class="bg-white rounded-lg shadow p-4">
            <h3 class="font-semibold mb-2"><mat-icon class="!text-base align-middle mr-1">local_shipping</mat-icon>Dirección de envío</h3>
            <p class="text-sm text-gray-600">
              {{ order.deliveryAddress.firstname }} {{ order.deliveryAddress.lastname }}<br>
              {{ order.deliveryAddress.address1 }}<br>
              @if (order.deliveryAddress.address2) { {{ order.deliveryAddress.address2 }}<br> }
              {{ order.deliveryAddress.postcode }} {{ order.deliveryAddress.city }}<br>
              {{ order.deliveryAddress.country }}
            </p>
          </div>
        }
        @if (order.invoiceAddress) {
          <div class="bg-white rounded-lg shadow p-4">
            <h3 class="font-semibold mb-2"><mat-icon class="!text-base align-middle mr-1">receipt</mat-icon>Dirección de facturación</h3>
            <p class="text-sm text-gray-600">
              {{ order.invoiceAddress.firstname }} {{ order.invoiceAddress.lastname }}<br>
              {{ order.invoiceAddress.address1 }}<br>
              @if (order.invoiceAddress.address2) { {{ order.invoiceAddress.address2 }}<br> }
              {{ order.invoiceAddress.postcode }} {{ order.invoiceAddress.city }}<br>
              {{ order.invoiceAddress.country }}
            </p>
          </div>
        }
        @if (order.carrier) {
          <div class="bg-white rounded-lg shadow p-4">
            <h3 class="font-semibold mb-2"><mat-icon class="!text-base align-middle mr-1">local_shipping</mat-icon>Transportista</h3>
            <p class="text-sm text-gray-600">{{ order.carrier.name }}</p>
            @if (order.trackingNumber) {
              <p class="text-sm mt-1"><strong>Seguimiento:</strong> {{ order.trackingNumber }}</p>
            }
          </div>
        }
      </div>

      <!-- History -->
      @if (order.history && order.history.length > 0) {
        <div class="bg-white rounded-lg shadow p-4">
          <h3 class="font-semibold mb-2">Historial</h3>
          <div class="space-y-2">
            @for (entry of order.history; track entry.id) {
              <div class="flex items-start text-sm border-l-2 border-blue-300 pl-3 py-1">
                <div>
                  <span class="font-medium">{{ entry.stateName }}</span>
                  <span class="text-gray-400 ml-2">{{ entry.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
                  @if (entry.comment) {
                    <p class="text-gray-500 mt-0.5">{{ entry.comment }}</p>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      }
    }
  `,
})
export class OrderDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly orderService = inject(OrderService);

  order: any = null;
  loading = true;
  downloadingInvoice = false;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadOrder(id);
  }

  async loadOrder(id: number): Promise<void> {
    this.loading = true;
    try {
      const res = await this.orderService.getMyOrderDetail(id);
      this.order = res.data;
    } catch { /* empty */ }
    this.loading = false;
  }

  downloadInvoice(): void {
    if (!this.order) return;
    this.downloadingInvoice = true;
    this.orderService.downloadInvoice(this.order.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `factura-${this.order.reference}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        this.downloadingInvoice = false;
      },
      error: () => {
        this.downloadingInvoice = false;
      },
    });
  }
}
