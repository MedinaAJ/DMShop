import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CurrencyPipe } from '@angular/common';
import { ApiService } from '../../core/services/api.service';

interface CartRuleItem {
  id: number; code: string | null; name: string; dateFrom: string | null; dateTo: string | null;
  quantity: number; freeShipping: boolean; reductionPercent: number; reductionAmount: number;
  active: boolean; createdAt: string;
}

@Component({
  selector: 'app-cart-rule-list',
  standalone: true,
  imports: [MatTableModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatPaginatorModule, MatChipsModule, MatSnackBarModule, CurrencyPipe],
  template: `
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Cupones y descuentos</h1>
      <button mat-flat-button color="primary" (click)="router.navigate(['/cart-rules', 'new'])">
        <mat-icon>add</mat-icon> Nuevo cupón
      </button>
    </div>

    @if (loading) {
      <div class="flex justify-center py-12"><mat-spinner diameter="48" /></div>
    } @else if (rules.length === 0) {
      <div class="text-center py-16">
        <mat-icon class="!text-6xl text-gray-300 mb-4">local_offer</mat-icon>
        <p class="text-gray-500">No hay cupones creados.</p>
      </div>
    } @else {
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table mat-table [dataSource]="rules" class="w-full">
          <ng-container matColumnDef="id">
            <th mat-header-cell *matHeaderCellDef>ID</th>
            <td mat-cell *matCellDef="let r">{{ r.id }}</td>
          </ng-container>
          <ng-container matColumnDef="code">
            <th mat-header-cell *matHeaderCellDef>Código</th>
            <td mat-cell *matCellDef="let r" class="font-mono">{{ r.code || '—' }}</td>
          </ng-container>
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Nombre</th>
            <td mat-cell *matCellDef="let r">{{ r.name }}</td>
          </ng-container>
          <ng-container matColumnDef="discount">
            <th mat-header-cell *matHeaderCellDef>Descuento</th>
            <td mat-cell *matCellDef="let r">
              @if (r.reductionPercent > 0) { {{ r.reductionPercent }}% }
              @else if (r.reductionAmount > 0) { {{ r.reductionAmount | currency:'EUR' }} }
              @if (r.freeShipping) { <span class="ml-1 text-green-600 text-xs">+ envío gratis</span> }
            </td>
          </ng-container>
          <ng-container matColumnDef="quantity">
            <th mat-header-cell *matHeaderCellDef>Usos restantes</th>
            <td mat-cell *matCellDef="let r">{{ r.quantity }}</td>
          </ng-container>
          <ng-container matColumnDef="active">
            <th mat-header-cell *matHeaderCellDef>Activo</th>
            <td mat-cell *matCellDef="let r">
              <mat-icon [class]="r.active ? 'text-green-600' : 'text-red-400'">
                {{ r.active ? 'check_circle' : 'cancel' }}
              </mat-icon>
            </td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let r">
              <button mat-icon-button (click)="edit(r.id); $event.stopPropagation()"><mat-icon>edit</mat-icon></button>
              <button mat-icon-button color="warn" (click)="deleteRule(r.id); $event.stopPropagation()"><mat-icon>delete</mat-icon></button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns" class="cursor-pointer hover:bg-gray-50" (click)="edit(row.id)"></tr>
        </table>
        <mat-paginator [length]="total" [pageSize]="pageSize" [pageIndex]="page - 1" [pageSizeOptions]="[10,20,50]"
          (page)="onPage($event)" showFirstLastButtons />
      </div>
    }
  `,
})
export class CartRuleListComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);

  rules: CartRuleItem[] = [];
  loading = true;
  total = 0;
  page = 1;
  pageSize = 20;
  columns = ['id', 'code', 'name', 'discount', 'quantity', 'active', 'actions'];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.api.get<any>('/discounts/cart-rules', { page: this.page, limit: this.pageSize }).subscribe((res: any) => {
      this.rules = res.data;
      this.total = res.meta.total;
      this.loading = false;
    });
  }

  edit(id: number): void { this.router.navigate(['/cart-rules', id]); }

  deleteRule(id: number): void {
    if (!confirm('¿Eliminar este cupón?')) return;
    this.api.delete<any>(`/discounts/cart-rules/${id}`).subscribe(() => {
      this.snack.open('Cupón eliminado', 'OK', { duration: 2000 });
      this.load();
    });
  }

  onPage(event: PageEvent): void {
    this.page = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.load();
  }
}
