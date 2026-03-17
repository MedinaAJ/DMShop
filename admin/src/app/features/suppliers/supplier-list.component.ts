import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-supplier-list',
  standalone: true,
  imports: [
    RouterLink,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Proveedores</h1>
      <a mat-flat-button color="primary" routerLink="/suppliers/new">
        <mat-icon>add</mat-icon> Nuevo proveedor
      </a>
    </div>

    @if (loading) {
      <div class="flex justify-center py-12"><mat-spinner diameter="48" /></div>
    } @else {
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table mat-table [dataSource]="items" class="w-full">
          <ng-container matColumnDef="id">
            <th mat-header-cell *matHeaderCellDef>ID</th>
            <td mat-cell *matCellDef="let s">{{ s.id }}</td>
          </ng-container>
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Nombre</th>
            <td mat-cell *matCellDef="let s">{{ s.name }}</td>
          </ng-container>
          <ng-container matColumnDef="active">
            <th mat-header-cell *matHeaderCellDef>Estado</th>
            <td mat-cell *matCellDef="let s">
              <span [class]="s.active ? 'text-green-600' : 'text-red-500'">
                {{ s.active ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let s">
              <a mat-icon-button [routerLink]="['/suppliers', s.id]">
                <mat-icon>edit</mat-icon>
              </a>
              <button mat-icon-button color="warn" (click)="remove(s.id)">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns"></tr>
        </table>
        <mat-paginator
          [length]="total"
          [pageSize]="perPage"
          [pageIndex]="page - 1"
          [pageSizeOptions]="[10, 25, 50]"
          (page)="onPage($event)"
        />
      </div>
    }
  `,
})
export class SupplierListComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly snackBar = inject(MatSnackBar);

  items: any[] = [];
  columns = ['id', 'name', 'active', 'actions'];
  loading = true;
  page = 1;
  perPage = 10;
  total = 0;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.api.get<any>('/suppliers', { page: this.page, perPage: this.perPage }).subscribe((res) => {
      this.items = res.data;
      this.total = res.meta.total;
      this.loading = false;
    });
  }

  onPage(e: PageEvent): void {
    this.page = e.pageIndex + 1;
    this.perPage = e.pageSize;
    this.load();
  }

  remove(id: number): void {
    if (!confirm('¿Eliminar este proveedor?')) return;
    this.api.delete(`/suppliers/${id}`).subscribe(() => {
      this.snackBar.open('Proveedor eliminado', 'OK', { duration: 3000 });
      this.load();
    });
  }
}
