import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { OrderService, OrderListItem } from '../../../core/services/order.service';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, MatProgressSpinner, MatPaginatorModule, CurrencyPipe, DatePipe],
  template: `
    <h2 class="text-xl font-semibold mb-4">Mis pedidos</h2>

    @if (loading) {
      <div class="flex justify-center py-8"><mat-spinner diameter="40" /></div>
    } @else if (orders.length === 0) {
      <div class="text-center py-12">
        <mat-icon class="!text-5xl text-gray-300 mb-3">receipt_long</mat-icon>
        <p class="text-gray-500">Aún no has realizado ningún pedido.</p>
        <a mat-flat-button color="primary" routerLink="/catalog" class="mt-4">Ver catálogo</a>
      </div>
    } @else {
      <div class="space-y-3">
        @for (order of orders; track order.id) {
          <a [routerLink]="['/account/orders', order.id]"
             class="block bg-white rounded-lg shadow p-4 hover:shadow-md transition no-underline text-inherit">
            <div class="flex items-center justify-between">
              <div>
                <span class="font-mono font-semibold text-blue-600">#{{ order.reference }}</span>
                <span class="text-sm text-gray-500 ml-2">{{ order.createdAt | date:'dd/MM/yyyy' }}</span>
              </div>
              <span class="px-2 py-1 rounded text-white text-xs font-semibold" [style.backgroundColor]="order.stateColor">
                {{ order.stateName }}
              </span>
            </div>
            <div class="flex justify-between mt-2 text-sm text-gray-600">
              <span>{{ order.itemCount }} artículo{{ order.itemCount !== 1 ? 's' : '' }}</span>
              <span class="font-semibold text-gray-900">{{ order.totalPaid | currency:'EUR' }}</span>
            </div>
          </a>
        }
      </div>
      @if (total > pageSize) {
        <mat-paginator
          [length]="total"
          [pageSize]="pageSize"
          [pageIndex]="page - 1"
          (page)="onPage($event)"
          showFirstLastButtons
          class="mt-4" />
      }
    }
  `,
})
export class OrderListComponent implements OnInit {
  private readonly orderService = inject(OrderService);

  orders: OrderListItem[] = [];
  loading = true;
  page = 1;
  pageSize = 10;
  total = 0;

  ngOnInit(): void {
    this.loadOrders();
  }

  async loadOrders(): Promise<void> {
    this.loading = true;
    try {
      const res = await this.orderService.getMyOrders(this.page, this.pageSize);
      this.orders = res.data;
      this.total = res.meta.total;
    } catch { /* empty */ }
    this.loading = false;
  }

  onPage(event: PageEvent): void {
    this.page = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadOrders();
  }
}
