import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';

interface OrderDetail {
  id: number;
  reference: string;
  idUser: number;
  customerName: string;
  customerEmail: string;
  idOrderState: number;
  stateName: string;
  stateColor: string;
  paymentMethod: string;
  totalProducts: number;
  totalProductsTax: number;
  totalShipping: number;
  totalShippingTax: number;
  totalDiscounts: number;
  totalDiscountsTax: number;
  totalPaid: number;
  note: string | null;
  deliveryAddress: OrderAddress | null;
  invoiceAddress: OrderAddress | null;
  carrier: OrderCarrier | null;
  items: OrderItem[];
  history: OrderHistoryEntry[];
  payments: OrderPayment[];
  createdAt: string;
  updatedAt: string;
}

interface OrderAddress {
  id: number; alias: string; firstName: string; lastName: string;
  company: string | null; address1: string; address2: string | null;
  city: string; postcode: string; country: string; state: string | null; phone: string | null;
}

interface OrderCarrier {
  id: number; carrierName: string; carrierUrl: string | null; trackingNumber: string | null;
  weight: number; shippingCost: number; shippingCostTax: number;
}

interface OrderItem {
  id: number; idProduct: number; idCombination: number | null;
  productName: string; productReference: string | null;
  productPrice: number; productPriceTax: number;
  quantity: number; taxRate: number; totalPrice: number;
}

interface OrderHistoryEntry {
  id: number; idOrderState: number; stateName: string; stateColor: string;
  userName: string | null; comment: string | null; createdAt: string;
}

interface OrderPayment {
  id: number; paymentMethod: string; transactionId: string | null;
  amount: number; currencyCode: string; createdAt: string;
}

interface OrderState { id: number; name: string; color: string; }

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [
    MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatCardModule,
    MatTableModule, MatSelectModule, MatFormFieldModule, MatInputModule,
    MatDividerModule, MatSnackBarModule, MatDialogModule, FormsModule,
    CurrencyPipe, DatePipe,
  ],
  template: `
    @if (loading) {
      <div class="flex justify-center py-12"><mat-spinner diameter="48" /></div>
    } @else if (order) {
      <div class="flex items-center gap-4 mb-6">
        <button mat-icon-button (click)="goBack()"><mat-icon>arrow_back</mat-icon></button>
        <h1 class="text-2xl font-bold">Pedido #{{ order.reference }}</h1>
        <span class="px-3 py-1 rounded text-white text-sm font-semibold" [style.backgroundColor]="order.stateColor">
          {{ order.stateName }}
        </span>
        <span class="flex-1"></span>
        <button mat-stroked-button (click)="downloadInvoice()" [disabled]="downloadingInvoice">
          <mat-icon>picture_as_pdf</mat-icon>
          {{ downloadingInvoice ? 'Generando...' : 'Descargar factura PDF' }}
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main content -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Items -->
          <mat-card>
            <mat-card-header><mat-card-title>Productos</mat-card-title></mat-card-header>
            <mat-card-content>
              <table mat-table [dataSource]="order.items" class="w-full">
                <ng-container matColumnDef="product">
                  <th mat-header-cell *matHeaderCellDef>Producto</th>
                  <td mat-cell *matCellDef="let i">
                    <div>{{ i.productName }}</div>
                    @if (i.productReference) { <div class="text-xs text-gray-500">{{ i.productReference }}</div> }
                  </td>
                </ng-container>
                <ng-container matColumnDef="price">
                  <th mat-header-cell *matHeaderCellDef>Precio</th>
                  <td mat-cell *matCellDef="let i">{{ i.productPriceTax | currency:'EUR' }}</td>
                </ng-container>
                <ng-container matColumnDef="quantity">
                  <th mat-header-cell *matHeaderCellDef>Cant.</th>
                  <td mat-cell *matCellDef="let i">{{ i.quantity }}</td>
                </ng-container>
                <ng-container matColumnDef="total">
                  <th mat-header-cell *matHeaderCellDef>Total</th>
                  <td mat-cell *matCellDef="let i" class="font-semibold">{{ i.totalPrice | currency:'EUR' }}</td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="['product','price','quantity','total']"></tr>
                <tr mat-row *matRowDef="let row; columns: ['product','price','quantity','total']"></tr>
              </table>
            </mat-card-content>
          </mat-card>

          <!-- Totals -->
          <mat-card>
            <mat-card-content>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between"><span>Subtotal productos</span><span>{{ order.totalProducts | currency:'EUR' }}</span></div>
                <div class="flex justify-between"><span>Productos (con IVA)</span><span>{{ order.totalProductsTax | currency:'EUR' }}</span></div>
                <div class="flex justify-between"><span>Envío</span><span>{{ order.totalShipping | currency:'EUR' }}</span></div>
                <div class="flex justify-between"><span>Envío (con IVA)</span><span>{{ order.totalShippingTax | currency:'EUR' }}</span></div>
                @if (order.totalDiscounts > 0) {
                  <div class="flex justify-between text-red-600"><span>Descuentos</span><span>-{{ order.totalDiscountsTax | currency:'EUR' }}</span></div>
                }
                <mat-divider />
                <div class="flex justify-between text-lg font-bold pt-2"><span>Total</span><span>{{ order.totalPaid | currency:'EUR' }}</span></div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- History -->
          <mat-card>
            <mat-card-header><mat-card-title>Historial</mat-card-title></mat-card-header>
            <mat-card-content>
              @for (h of order.history; track h.id) {
                <div class="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
                  <span class="inline-block w-3 h-3 rounded-full mt-1.5" [style.backgroundColor]="h.stateColor"></span>
                  <div class="flex-1">
                    <div class="font-medium">{{ h.stateName }}</div>
                    @if (h.comment) { <div class="text-sm text-gray-600">{{ h.comment }}</div> }
                    <div class="text-xs text-gray-400">{{ h.createdAt | date:'dd/MM/yyyy HH:mm' }} @if (h.userName) { · {{ h.userName }} }</div>
                  </div>
                </div>
              }
            </mat-card-content>
          </mat-card>

          <!-- Payments -->
          @if (order.payments.length > 0) {
            <mat-card>
              <mat-card-header><mat-card-title>Pagos</mat-card-title></mat-card-header>
              <mat-card-content>
                @for (p of order.payments; track p.id) {
                  <div class="flex justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <div class="font-medium">{{ p.paymentMethod }}</div>
                      @if (p.transactionId) { <div class="text-xs text-gray-500 font-mono">{{ p.transactionId }}</div> }
                      <div class="text-xs text-gray-400">{{ p.createdAt | date:'dd/MM/yyyy HH:mm' }}</div>
                    </div>
                    <div class="font-semibold">{{ p.amount | currency:p.currencyCode }}</div>
                  </div>
                }
              </mat-card-content>
            </mat-card>
          }
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Customer Info -->
          <mat-card>
            <mat-card-header><mat-card-title>Cliente</mat-card-title></mat-card-header>
            <mat-card-content>
              <p class="font-medium">{{ order.customerName }}</p>
              <p class="text-sm text-gray-600">{{ order.customerEmail }}</p>
              <p class="text-xs text-gray-400 mt-2">Método de pago: {{ order.paymentMethod }}</p>
              @if (order.note) {
                <p class="text-sm mt-2 p-2 bg-yellow-50 rounded">{{ order.note }}</p>
              }
            </mat-card-content>
          </mat-card>

          <!-- Delivery Address -->
          @if (order.deliveryAddress; as addr) {
            <mat-card>
              <mat-card-header><mat-card-title>Dirección de envío</mat-card-title></mat-card-header>
              <mat-card-content>
                <p>{{ addr.firstName }} {{ addr.lastName }}</p>
                @if (addr.company) { <p class="text-sm">{{ addr.company }}</p> }
                <p class="text-sm">{{ addr.address1 }}</p>
                @if (addr.address2) { <p class="text-sm">{{ addr.address2 }}</p> }
                <p class="text-sm">{{ addr.postcode }} {{ addr.city }}</p>
                <p class="text-sm">{{ addr.state ? addr.state + ', ' : '' }}{{ addr.country }}</p>
                @if (addr.phone) { <p class="text-sm mt-1"><mat-icon class="!text-sm align-middle">phone</mat-icon> {{ addr.phone }}</p> }
              </mat-card-content>
            </mat-card>
          }

          <!-- Carrier / Tracking -->
          @if (order.carrier) {
            <mat-card>
              <mat-card-header><mat-card-title>Envío</mat-card-title></mat-card-header>
              <mat-card-content>
                <p class="font-medium">{{ order.carrier.carrierName }}</p>
                <p class="text-sm">Coste: {{ order.carrier.shippingCostTax | currency:'EUR' }}</p>
                <div class="mt-3">
                  <mat-form-field class="w-full">
                    <mat-label>Nº seguimiento</mat-label>
                    <input matInput [(ngModel)]="trackingNumber" [value]="order.carrier.trackingNumber || ''">
                  </mat-form-field>
                  <button mat-stroked-button (click)="updateTracking()" class="w-full">
                    <mat-icon>local_shipping</mat-icon> Actualizar tracking
                  </button>
                </div>
              </mat-card-content>
            </mat-card>
          }

          <!-- Change State -->
          <mat-card>
            <mat-card-header><mat-card-title>Cambiar estado</mat-card-title></mat-card-header>
            <mat-card-content>
              <mat-form-field class="w-full">
                <mat-label>Nuevo estado</mat-label>
                <mat-select [(ngModel)]="newStateId">
                  @for (state of states; track state.id) {
                    <mat-option [value]="state.id">{{ state.name }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field class="w-full">
                <mat-label>Comentario (opcional)</mat-label>
                <textarea matInput [(ngModel)]="stateComment" rows="2"></textarea>
              </mat-form-field>
              <button mat-flat-button color="primary" (click)="updateState()" class="w-full" [disabled]="!newStateId">
                Actualizar estado
              </button>
            </mat-card-content>
          </mat-card>

          <!-- Register Payment -->
          <mat-card>
            <mat-card-header><mat-card-title>Registrar pago</mat-card-title></mat-card-header>
            <mat-card-content>
              <mat-form-field class="w-full">
                <mat-label>Método</mat-label>
                <input matInput [(ngModel)]="paymentMethod">
              </mat-form-field>
              <mat-form-field class="w-full">
                <mat-label>Importe</mat-label>
                <input matInput type="number" [(ngModel)]="paymentAmount">
              </mat-form-field>
              <mat-form-field class="w-full">
                <mat-label>ID transacción</mat-label>
                <input matInput [(ngModel)]="paymentTransactionId">
              </mat-form-field>
              <button mat-flat-button color="accent" (click)="registerPayment()" class="w-full"
                      [disabled]="!paymentMethod || !paymentAmount">
                Registrar pago
              </button>
            </mat-card-content>
          </mat-card>
        </div>
      </div>
    }
  `,
})
export class OrderDetailComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);

  order: OrderDetail | null = null;
  states: OrderState[] = [];
  loading = true;
  downloadingInvoice = false;

  newStateId: number | null = null;
  stateComment = '';
  trackingNumber = '';
  paymentMethod = '';
  paymentAmount: number | null = null;
  paymentTransactionId = '';

  ngOnInit(): void {
    this.api.get<{ success: boolean; data: OrderState[] }>('/orders/states').subscribe((res) => {
      this.states = res.data;
    });
    this.loadOrder();
  }

  loadOrder(): void {
    const id = this.route.snapshot.params['id'];
    this.loading = true;
    this.api.get<{ success: boolean; data: OrderDetail }>(`/orders/admin/${id}`).subscribe({
      next: (res) => {
        this.order = res.data;
        this.trackingNumber = res.data.carrier?.trackingNumber ?? '';
        this.loading = false;
      },
      error: () => {
        this.snack.open('Pedido no encontrado', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/orders']);
      },
    });
  }

  updateState(): void {
    if (!this.newStateId || !this.order) return;
    this.api.put<{ success: boolean }>(`/orders/admin/${this.order.id}/state`, {
      idOrderState: this.newStateId,
      comment: this.stateComment || undefined,
    }).subscribe(() => {
      this.snack.open('Estado actualizado', 'OK', { duration: 2000 });
      this.stateComment = '';
      this.newStateId = null;
      this.loadOrder();
    });
  }

  updateTracking(): void {
    if (!this.trackingNumber || !this.order) return;
    this.api.put<{ success: boolean }>(`/orders/admin/${this.order.id}/tracking`, {
      trackingNumber: this.trackingNumber,
    }).subscribe(() => {
      this.snack.open('Tracking actualizado', 'OK', { duration: 2000 });
      this.loadOrder();
    });
  }

  registerPayment(): void {
    if (!this.paymentMethod || !this.paymentAmount || !this.order) return;
    this.api.post<{ success: boolean }>(`/orders/admin/${this.order.id}/payment`, {
      paymentMethod: this.paymentMethod,
      amount: this.paymentAmount,
      transactionId: this.paymentTransactionId || undefined,
      idCurrency: 1,
    }).subscribe(() => {
      this.snack.open('Pago registrado', 'OK', { duration: 2000 });
      this.paymentMethod = '';
      this.paymentAmount = null;
      this.paymentTransactionId = '';
      this.loadOrder();
    });
  }

  goBack(): void {
    this.router.navigate(['/orders']);
  }

  downloadInvoice(): void {
    if (!this.order) return;
    this.downloadingInvoice = true;
    this.api.getBlob(`/orders/${this.order.id}/invoice`).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `factura-${this.order!.reference}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        this.downloadingInvoice = false;
      },
      error: () => {
        this.snack.open('Error al generar la factura', 'Cerrar', { duration: 3000 });
        this.downloadingInvoice = false;
      },
    });
  }
}
