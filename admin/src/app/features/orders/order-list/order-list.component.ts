import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';

interface OrderListItem {
  id: number;
  reference: string;
  customerName: string;
  customerEmail: string;
  stateName: string;
  stateColor: string;
  paymentMethod: string;
  totalPaid: number;
  itemCount: number;
  createdAt: string;
}

interface OrderState {
  id: number;
  name: string;
  color: string;
}

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [
    MatTableModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    MatSelectModule, MatFormFieldModule, MatInputModule, MatPaginatorModule,
    MatChipsModule, MatCheckboxModule, MatSnackBarModule, FormsModule, CurrencyPipe, DatePipe,
  ],
  template: `
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Pedidos</h1>
    </div>

    <div class="flex gap-4 mb-4 items-end flex-wrap">
      <mat-form-field class="w-48">
        <mat-label>Buscar referencia</mat-label>
        <input matInput [(ngModel)]="searchQuery" (keyup.enter)="loadOrders()">
      </mat-form-field>
      <mat-form-field class="w-48">
        <mat-label>Estado</mat-label>
        <mat-select [(ngModel)]="filterState" (selectionChange)="loadOrders()">
          <mat-option [value]="null">Todos</mat-option>
          @for (state of states; track state.id) {
            <mat-option [value]="state.id">{{ state.name }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
      <button mat-stroked-button (click)="resetFilters()">
        <mat-icon>clear</mat-icon> Limpiar
      </button>
    </div>

    <!-- Bulk action toolbar — shown when orders are selected -->
    @if (selectedIds.size > 0) {
      <div class="flex items-center gap-4 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <span class="text-sm font-medium text-blue-800">{{ selectedIds.size }} pedido(s) seleccionado(s)</span>
        <mat-form-field class="w-52" subscriptSizing="dynamic">
          <mat-label>Cambiar estado a...</mat-label>
          <mat-select [(ngModel)]="bulkStateId">
            @for (state of states; track state.id) {
              <mat-option [value]="state.id">{{ state.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <button mat-flat-button color="primary" (click)="applyBulkState()" [disabled]="!bulkStateId || bulkUpdating">
          @if (bulkUpdating) { <mat-spinner diameter="18" class="inline-block mr-2" /> }
          Aplicar
        </button>
        <button mat-button (click)="clearSelection()">
          <mat-icon>close</mat-icon> Cancelar selección
        </button>
      </div>
    }

    @if (loading) {
      <div class="flex justify-center py-12">
        <mat-spinner diameter="48" />
      </div>
    } @else if (orders.length === 0) {
      <div class="text-center py-16">
        <mat-icon class="!text-6xl text-gray-300 mb-4">receipt_long</mat-icon>
        <p class="text-gray-500">No hay pedidos que coincidan con los filtros.</p>
      </div>
    } @else {
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table mat-table [dataSource]="orders" class="w-full">
          <ng-container matColumnDef="select">
            <th mat-header-cell *matHeaderCellDef>
              <mat-checkbox
                [checked]="isAllSelected()"
                [indeterminate]="isSomeSelected()"
                (change)="toggleAll($event.checked)">
              </mat-checkbox>
            </th>
            <td mat-cell *matCellDef="let o" (click)="$event.stopPropagation()">
              <mat-checkbox
                [checked]="selectedIds.has(o.id)"
                (change)="toggleSelection(o.id, $event.checked)">
              </mat-checkbox>
            </td>
          </ng-container>
          <ng-container matColumnDef="id">
            <th mat-header-cell *matHeaderCellDef>ID</th>
            <td mat-cell *matCellDef="let o">{{ o.id }}</td>
          </ng-container>
          <ng-container matColumnDef="reference">
            <th mat-header-cell *matHeaderCellDef>Referencia</th>
            <td mat-cell *matCellDef="let o" class="font-mono">{{ o.reference }}</td>
          </ng-container>
          <ng-container matColumnDef="customer">
            <th mat-header-cell *matHeaderCellDef>Cliente</th>
            <td mat-cell *matCellDef="let o">
              <div>{{ o.customerName }}</div>
              <div class="text-xs text-gray-500">{{ o.customerEmail }}</div>
            </td>
          </ng-container>
          <ng-container matColumnDef="state">
            <th mat-header-cell *matHeaderCellDef>Estado</th>
            <td mat-cell *matCellDef="let o">
              <span class="inline-block px-2 py-1 rounded text-white text-xs font-semibold"
                    [style.backgroundColor]="o.stateColor">
                {{ o.stateName }}
              </span>
            </td>
          </ng-container>
          <ng-container matColumnDef="total">
            <th mat-header-cell *matHeaderCellDef>Total</th>
            <td mat-cell *matCellDef="let o" class="font-semibold">{{ o.totalPaid | currency:'EUR' }}</td>
          </ng-container>
          <ng-container matColumnDef="date">
            <th mat-header-cell *matHeaderCellDef>Fecha</th>
            <td mat-cell *matCellDef="let o">{{ o.createdAt | date:'dd/MM/yyyy HH:mm' }}</td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let o">
              <button mat-icon-button (click)="viewOrder(o.id)">
                <mat-icon>visibility</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns" class="cursor-pointer hover:bg-gray-50" (click)="viewOrder(row.id)"></tr>
        </table>
        <mat-paginator
          [length]="totalOrders"
          [pageSize]="pageSize"
          [pageIndex]="page - 1"
          [pageSizeOptions]="[10, 20, 50]"
          (page)="onPage($event)"
          showFirstLastButtons />
      </div>
    }
  `,
})
export class OrderListComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);

  orders: OrderListItem[] = [];
  states: OrderState[] = [];
  displayedColumns = ['select', 'id', 'reference', 'customer', 'state', 'total', 'date', 'actions'];
  loading = true;
  totalOrders = 0;
  page = 1;
  pageSize = 20;
  searchQuery = '';
  filterState: number | null = null;

  // Bulk selection
  selectedIds = new Set<number>();
  bulkStateId: number | null = null;
  bulkUpdating = false;

  ngOnInit(): void {
    this.api.get<{ success: boolean; data: OrderState[] }>('/orders/states').subscribe((res) => {
      this.states = res.data;
    });
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading = true;
    this.clearSelection();
    const params: Record<string, string | number> = { page: this.page, limit: this.pageSize };
    if (this.searchQuery) params['q'] = this.searchQuery;
    if (this.filterState) params['state'] = this.filterState;

    this.api.get<{ success: boolean; data: OrderListItem[]; meta: { total: number } }>('/orders/admin/list', params).subscribe((res) => {
      this.orders = res.data;
      this.totalOrders = res.meta.total;
      this.loading = false;
    });
  }

  onPage(event: PageEvent): void {
    this.page = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadOrders();
  }

  viewOrder(id: number): void {
    this.router.navigate(['/orders', id]);
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.filterState = null;
    this.page = 1;
    this.loadOrders();
  }

  // --- Bulk selection ---
  toggleSelection(id: number, checked: boolean): void {
    if (checked) this.selectedIds.add(id);
    else this.selectedIds.delete(id);
  }

  toggleAll(checked: boolean): void {
    if (checked) this.orders.forEach((o) => this.selectedIds.add(o.id));
    else this.clearSelection();
  }

  isAllSelected(): boolean {
    return this.orders.length > 0 && this.orders.every((o) => this.selectedIds.has(o.id));
  }

  isSomeSelected(): boolean {
    return this.selectedIds.size > 0 && !this.isAllSelected();
  }

  clearSelection(): void {
    this.selectedIds.clear();
    this.bulkStateId = null;
  }

  applyBulkState(): void {
    if (!this.bulkStateId || this.selectedIds.size === 0) return;
    this.bulkUpdating = true;
    this.api.patch('/orders/admin/bulk-state', {
      orderIds: Array.from(this.selectedIds),
      stateId: this.bulkStateId,
    }).subscribe({
      next: () => {
        this.snack.open(`Estado actualizado en ${this.selectedIds.size} pedido(s)`, 'OK', { duration: 3000 });
        this.bulkUpdating = false;
        this.loadOrders();
      },
      error: () => {
        this.snack.open('Error al actualizar estados', 'Cerrar', { duration: 3000 });
        this.bulkUpdating = false;
      },
    });
  }
}

interface OrderListItem {
  id: number;
  reference: string;
  customerName: string;
  customerEmail: string;
  stateName: string;
  stateColor: string;
  paymentMethod: string;
  totalPaid: number;
  itemCount: number;
  createdAt: string;
}

interface OrderState {
  id: number;
  name: string;
  color: string;
}

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [
    MatTableModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    MatSelectModule, MatFormFieldModule, MatInputModule, MatPaginatorModule,
    MatChipsModule, FormsModule, CurrencyPipe, DatePipe,
  ],
  template: `
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Pedidos</h1>
    </div>

    <div class="flex gap-4 mb-4 items-end flex-wrap">
      <mat-form-field class="w-48">
        <mat-label>Buscar referencia</mat-label>
        <input matInput [(ngModel)]="searchQuery" (keyup.enter)="loadOrders()">
      </mat-form-field>
      <mat-form-field class="w-48">
        <mat-label>Estado</mat-label>
        <mat-select [(ngModel)]="filterState" (selectionChange)="loadOrders()">
          <mat-option [value]="null">Todos</mat-option>
          @for (state of states; track state.id) {
            <mat-option [value]="state.id">{{ state.name }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
      <button mat-stroked-button (click)="resetFilters()">
        <mat-icon>clear</mat-icon> Limpiar
      </button>
    </div>

    @if (loading) {
      <div class="flex justify-center py-12">
        <mat-spinner diameter="48" />
      </div>
    } @else if (orders.length === 0) {
      <div class="text-center py-16">
        <mat-icon class="!text-6xl text-gray-300 mb-4">receipt_long</mat-icon>
        <p class="text-gray-500">No hay pedidos que coincidan con los filtros.</p>
      </div>
    } @else {
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table mat-table [dataSource]="orders" class="w-full">
          <ng-container matColumnDef="id">
            <th mat-header-cell *matHeaderCellDef>ID</th>
            <td mat-cell *matCellDef="let o">{{ o.id }}</td>
          </ng-container>
          <ng-container matColumnDef="reference">
            <th mat-header-cell *matHeaderCellDef>Referencia</th>
            <td mat-cell *matCellDef="let o" class="font-mono">{{ o.reference }}</td>
          </ng-container>
          <ng-container matColumnDef="customer">
            <th mat-header-cell *matHeaderCellDef>Cliente</th>
            <td mat-cell *matCellDef="let o">
              <div>{{ o.customerName }}</div>
              <div class="text-xs text-gray-500">{{ o.customerEmail }}</div>
            </td>
          </ng-container>
          <ng-container matColumnDef="state">
            <th mat-header-cell *matHeaderCellDef>Estado</th>
            <td mat-cell *matCellDef="let o">
              <span class="inline-block px-2 py-1 rounded text-white text-xs font-semibold"
                    [style.backgroundColor]="o.stateColor">
                {{ o.stateName }}
              </span>
            </td>
          </ng-container>
          <ng-container matColumnDef="total">
            <th mat-header-cell *matHeaderCellDef>Total</th>
            <td mat-cell *matCellDef="let o" class="font-semibold">{{ o.totalPaid | currency:'EUR' }}</td>
          </ng-container>
          <ng-container matColumnDef="date">
            <th mat-header-cell *matHeaderCellDef>Fecha</th>
            <td mat-cell *matCellDef="let o">{{ o.createdAt | date:'dd/MM/yyyy HH:mm' }}</td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let o">
              <button mat-icon-button (click)="viewOrder(o.id)">
                <mat-icon>visibility</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns" class="cursor-pointer hover:bg-gray-50" (click)="viewOrder(row.id)"></tr>
        </table>
        <mat-paginator
          [length]="totalOrders"
          [pageSize]="pageSize"
          [pageIndex]="page - 1"
          [pageSizeOptions]="[10, 20, 50]"
          (page)="onPage($event)"
          showFirstLastButtons />
      </div>
    }
  `,
})
export class OrderListComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  orders: OrderListItem[] = [];
  states: OrderState[] = [];
  displayedColumns = ['id', 'reference', 'customer', 'state', 'total', 'date', 'actions'];
  loading = true;
  totalOrders = 0;
  page = 1;
  pageSize = 20;
  searchQuery = '';
  filterState: number | null = null;

  ngOnInit(): void {
    this.api.get<{ success: boolean; data: OrderState[] }>('/orders/states').subscribe((res) => {
      this.states = res.data;
    });
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading = true;
    const params: Record<string, string | number> = { page: this.page, limit: this.pageSize };
    if (this.searchQuery) params['q'] = this.searchQuery;
    if (this.filterState) params['state'] = this.filterState;

    this.api.get<{ success: boolean; data: OrderListItem[]; meta: { total: number } }>('/orders/admin/list', params).subscribe((res) => {
      this.orders = res.data;
      this.totalOrders = res.meta.total;
      this.loading = false;
    });
  }

  onPage(event: PageEvent): void {
    this.page = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadOrders();
  }

  viewOrder(id: number): void {
    this.router.navigate(['/orders', id]);
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.filterState = null;
    this.page = 1;
    this.loadOrders();
  }
}
