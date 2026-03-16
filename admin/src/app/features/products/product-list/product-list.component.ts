import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CurrencyPipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';

interface ProductListResponse {
  success: boolean;
  data: Array<{
    id: number;
    name: string;
    reference: string | null;
    price: number;
    quantity: number;
    active: boolean;
  }>;
  meta: { page: number; perPage: number; total: number; totalPages: number };
}

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    RouterLink,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    CurrencyPipe,
  ],
  template: `
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Productos</h1>
      <a mat-flat-button color="primary" routerLink="/products/new">
        <mat-icon>add</mat-icon> Nuevo producto
      </a>
    </div>

    @if (loading) {
      <div class="flex justify-center py-12">
        <mat-spinner diameter="48" />
      </div>
    } @else {
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table mat-table [dataSource]="products" class="w-full">
          <ng-container matColumnDef="id">
            <th mat-header-cell *matHeaderCellDef>ID</th>
            <td mat-cell *matCellDef="let p">{{ p.id }}</td>
          </ng-container>
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Nombre</th>
            <td mat-cell *matCellDef="let p">{{ p.name }}</td>
          </ng-container>
          <ng-container matColumnDef="reference">
            <th mat-header-cell *matHeaderCellDef>Referencia</th>
            <td mat-cell *matCellDef="let p">{{ p.reference || '—' }}</td>
          </ng-container>
          <ng-container matColumnDef="price">
            <th mat-header-cell *matHeaderCellDef>Precio</th>
            <td mat-cell *matCellDef="let p">{{ p.price | currency: 'EUR' }}</td>
          </ng-container>
          <ng-container matColumnDef="quantity">
            <th mat-header-cell *matHeaderCellDef>Stock</th>
            <td mat-cell *matCellDef="let p">{{ p.quantity }}</td>
          </ng-container>
          <ng-container matColumnDef="active">
            <th mat-header-cell *matHeaderCellDef>Estado</th>
            <td mat-cell *matCellDef="let p">
              <span [class]="p.active ? 'text-green-600' : 'text-red-500'">
                {{ p.active ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let p">
              <a mat-icon-button [routerLink]="['/products', p.id]">
                <mat-icon>edit</mat-icon>
              </a>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
        </table>
        <mat-paginator
          [length]="totalItems"
          [pageSize]="perPage"
          [pageIndex]="page - 1"
          [pageSizeOptions]="[10, 25, 50]"
          (page)="onPage($event)"
        />
      </div>
    }
  `,
})
export class ProductListComponent implements OnInit {
  private readonly api = inject(ApiService);

  products: any[] = [];
  displayedColumns = ['id', 'name', 'reference', 'price', 'quantity', 'active', 'actions'];
  loading = true;
  page = 1;
  perPage = 10;
  totalItems = 0;

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading = true;
    this.api
      .get<ProductListResponse>('/products', { page: this.page, perPage: this.perPage })
      .subscribe((res) => {
        this.products = res.data;
        this.totalItems = res.meta.total;
        this.loading = false;
      });
  }

  onPage(event: PageEvent): void {
    this.page = event.pageIndex + 1;
    this.perPage = event.pageSize;
    this.loadProducts();
  }
}
