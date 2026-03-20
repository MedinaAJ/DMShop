import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { OrderService } from '../../../core/services/order.service';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinner,
    MatCheckboxModule,
    MatSnackBarModule,
    CurrencyPipe,
    DatePipe,
  ],
  template: `
    @if (loading()) {
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
            @if (canRequestReturn()) {
              <button mat-stroked-button color="warn" (click)="showReturnForm.set(!showReturnForm())">
                <mat-icon>assignment_return</mat-icon>
                Solicitar devolución
              </button>
            }
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

      <!-- Return Request Form -->
      @if (showReturnForm()) {
        <div class="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-4">
          <h3 class="text-lg font-semibold text-orange-800 mb-4">
            <mat-icon class="align-middle mr-2 text-orange-600">assignment_return</mat-icon>
            Solicitud de devolución
          </h3>
          <div class="mb-3">
            <label class="block text-sm font-medium text-gray-700 mb-1">Motivo general de la devolución</label>
            <input
              [(ngModel)]="returnReason"
              name="returnReason"
              required
              placeholder="Motivo general de la devolución"
              class="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Nota adicional (opcional)</label>
            <textarea
              [(ngModel)]="returnNote"
              rows="2"
              name="returnNote"
              placeholder="Nota adicional (opcional)"
              class="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-y"
            ></textarea>
          </div>

          <h4 class="font-semibold mb-2 text-sm text-gray-700">Selecciona los artículos a devolver:</h4>
          @for (item of order.items; track item.id) {
            <div class="flex items-center gap-3 py-2 border-b border-orange-100">
              <mat-checkbox [(ngModel)]="returnItemsSelected[item.id]" [name]="'ri_' + item.id">
                {{ item.productName }} ({{ item.quantity }} ud.)
              </mat-checkbox>
            </div>
          }

          <div class="flex gap-3 mt-4">
            <button mat-flat-button color="warn" (click)="submitReturn()" [disabled]="submittingReturn() || !returnReason.trim()">
              @if (submittingReturn()) { <mat-spinner diameter="18" class="inline-block mr-1" /> }
              Enviar solicitud
            </button>
            <button mat-button (click)="showReturnForm.set(false)">Cancelar</button>
          </div>
        </div>
      }

      <!-- Addresses and carrier -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        @if (order.deliveryAddress) {
          <div class="bg-white rounded-lg shadow p-4">
            <h3 class="font-semibold mb-2"><mat-icon class="!text-base align-middle mr-1">location_on</mat-icon>Dirección de envío</h3>
            <p class="text-sm text-gray-600">
              {{ order.deliveryAddress.firstName }} {{ order.deliveryAddress.lastName }}<br>
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
              {{ order.invoiceAddress.firstName }} {{ order.invoiceAddress.lastName }}<br>
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
            <p class="text-sm text-gray-600">{{ order.carrier.carrierName }}</p>
            @if (order.carrier.trackingNumber) {
              <p class="text-sm mt-1">
                <strong>Seguimiento:</strong> {{ order.carrier.trackingNumber }}
              </p>
              @if (buildTrackingUrl(order.carrier); as trackingUrl) {
                <a [href]="trackingUrl" target="_blank" rel="noopener noreferrer"
                   mat-stroked-button class="mt-2 text-sm w-full">
                  <mat-icon>open_in_new</mat-icon>
                  Seguir mi pedido
                </a>
              }
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
  private readonly api = inject(ApiService);
  private readonly snackBar = inject(MatSnackBar);

  order: any = null;
  readonly loading = signal(true);
  downloadingInvoice = false;

  // Return form
  readonly showReturnForm = signal(false);
  readonly submittingReturn = signal(false);
  returnReason = '';
  returnNote = '';
  returnItemsSelected: Record<number, boolean> = {};

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadOrder(id);
  }

  async loadOrder(id: number): Promise<void> {
    this.loading.set(true);
    try {
      const res = await this.orderService.getMyOrderDetail(id);
      this.order = res.data;
      // Init return items selection
      if (this.order?.items) {
        for (const item of this.order.items) {
          this.returnItemsSelected[item.id] = false;
        }
      }
    } catch { /* empty */ }
    this.loading.set(false);
  }

  canRequestReturn(): boolean {
    if (!this.order) return false;
    const stateName = (this.order.stateName ?? '').toLowerCase();
    return /entr|enviad|deliver|ship/.test(stateName);
  }

  /**
   * Build the tracking URL by replacing @ with the tracking number.
   * Returns null if no URL or no tracking number available.
   */
  buildTrackingUrl(carrier: any): string | null {
    if (!carrier?.trackingNumber) return null;
    const url: string | null = carrier.carrierUrl ?? carrier.url ?? null;
    if (!url || !url.includes('@')) return null;
    return url.replace('@', encodeURIComponent(carrier.trackingNumber));
  }

  async submitReturn(): Promise<void> {
    if (!this.order) return;
    const selectedItems = this.order.items
      .filter((item: any) => this.returnItemsSelected[item.id])
      .map((item: any) => ({ id_order_item: item.id, quantity: item.quantity }));

    this.submittingReturn.set(true);
    try {
      await this.api.post(`/orders/${this.order.id}/returns`, {
        reason: this.returnReason,
        customer_note: this.returnNote || undefined,
        items: selectedItems,
      }).toPromise();
      this.snackBar.open('Solicitud de devolución enviada', 'OK', { duration: 3000 });
      this.showReturnForm.set(false);
      this.returnReason = '';
      this.returnNote = '';
    } catch {
      this.snackBar.open('Error al enviar la solicitud', 'Cerrar', { duration: 3000 });
    } finally {
      this.submittingReturn.set(false);
    }
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
