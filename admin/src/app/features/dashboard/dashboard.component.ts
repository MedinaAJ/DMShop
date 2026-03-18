import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { ProductStockService, StockAlert } from '../products/product-stock.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, MatCardModule, MatIconModule, MatProgressSpinnerModule, MatButtonModule],
  template: `
    <h1 class="text-2xl font-bold mb-6">Dashboard</h1>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <mat-card>
        <mat-card-content class="flex items-center gap-4 !pt-4">
          <mat-icon class="!text-4xl text-blue-500">shopping_cart</mat-icon>
          <div>
            <p class="text-2xl font-bold">0</p>
            <p class="text-gray-500">Pedidos hoy</p>
          </div>
        </mat-card-content>
      </mat-card>
      <mat-card>
        <mat-card-content class="flex items-center gap-4 !pt-4">
          <mat-icon class="!text-4xl text-green-500">euro</mat-icon>
          <div>
            <p class="text-2xl font-bold">0,00 €</p>
            <p class="text-gray-500">Ventas hoy</p>
          </div>
        </mat-card-content>
      </mat-card>
      <mat-card>
        <mat-card-content class="flex items-center gap-4 !pt-4">
          <mat-icon class="!text-4xl text-orange-500">inventory_2</mat-icon>
          <div>
            <p class="text-2xl font-bold">0</p>
            <p class="text-gray-500">Productos</p>
          </div>
        </mat-card-content>
      </mat-card>
      <mat-card>
        <mat-card-content class="flex items-center gap-4 !pt-4">
          <mat-icon class="!text-4xl text-purple-500">people</mat-icon>
          <div>
            <p class="text-2xl font-bold">0</p>
            <p class="text-gray-500">Clientes</p>
          </div>
        </mat-card-content>
      </mat-card>
    </div>

    <!-- Widget: Stock bajo -->
    <mat-card>
      <mat-card-header>
        <mat-card-title class="flex items-center gap-2">
          <mat-icon class="text-orange-500">warning</mat-icon>
          Stock bajo
        </mat-card-title>
      </mat-card-header>
      <mat-card-content class="!pt-4">
        @if (loadingAlerts()) {
          <div class="flex justify-center py-4">
            <mat-spinner diameter="32" />
          </div>
        } @else if (stockAlerts().length === 0) {
          <div class="flex items-center gap-2 text-green-600 py-4">
            <mat-icon>check_circle</mat-icon>
            <span>Todo el stock está bien ✓</span>
          </div>
        } @else {
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b text-left text-gray-500">
                <th class="pb-2 pr-4">Producto</th>
                <th class="pb-2 pr-4">Referencia</th>
                <th class="pb-2 pr-4">Stock actual</th>
                <th class="pb-2 pr-4">Alerta en</th>
                <th class="pb-2">Acción</th>
              </tr>
            </thead>
            <tbody>
              @for (alert of stockAlerts(); track alert.id) {
                <tr class="border-b even:bg-gray-50">
                  <td class="py-2 pr-4 font-medium">{{ alert.name }}</td>
                  <td class="py-2 pr-4 text-gray-400">{{ alert.reference || '—' }}</td>
                  <td class="py-2 pr-4">
                    <span
                      class="px-2 py-0.5 rounded font-semibold"
                      [class.bg-red-100]="alert.quantity === 0"
                      [class.text-red-700]="alert.quantity === 0"
                      [class.bg-orange-100]="alert.quantity > 0"
                      [class.text-orange-700]="alert.quantity > 0"
                    >{{ alert.quantity }}</span>
                  </td>
                  <td class="py-2 pr-4 text-gray-500">≤ {{ alert.lowStockAlert }}</td>
                  <td class="py-2">
                    <a mat-button color="primary" [routerLink]="['/products', alert.id]">
                      <mat-icon class="!text-sm">edit</mat-icon> Editar
                    </a>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </mat-card-content>
    </mat-card>
  `,
})
export class DashboardComponent implements OnInit {
  private readonly stockService = inject(ProductStockService);

  loadingAlerts = signal(true);
  stockAlerts = signal<StockAlert[]>([]);

  ngOnInit(): void {
    this.stockService.getAlerts().subscribe({
      next: (alerts: StockAlert[]) => {
        this.stockAlerts.set(alerts);
        this.loadingAlerts.set(false);
      },
      error: () => {
        this.loadingAlerts.set(false);
      },
    });
  }
}
