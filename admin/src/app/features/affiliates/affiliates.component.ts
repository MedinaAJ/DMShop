import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { ApiService } from '../../core/services/api.service';
import { catchError, of } from 'rxjs';

interface AffiliateItem {
  id: number;
  code: string;
  commission_rate: number;
  total_earned: number;
  active: boolean;
  user: { id: number; email: string; first_name: string; last_name: string };
}

@Component({
  selector: 'app-affiliates',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
  ],
  template: `
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">Programa de Afiliados</h1>
    </div>

    <mat-card>
      <mat-card-content>
        @if (loading()) {
          <div class="flex justify-center py-8">
            <mat-spinner diameter="40" />
          </div>
        } @else {
          <div class="text-sm text-gray-500 mb-4">
            Total afiliados: <strong>{{ meta().total }}</strong>
          </div>
          <table mat-table [dataSource]="affiliates()" class="w-full">
            <ng-container matColumnDef="code">
              <th mat-header-cell *matHeaderCellDef>Código</th>
              <td mat-cell *matCellDef="let a"><code class="bg-gray-100 px-2 py-0.5 rounded">{{ a.code }}</code></td>
            </ng-container>
            <ng-container matColumnDef="user">
              <th mat-header-cell *matHeaderCellDef>Afiliado</th>
              <td mat-cell *matCellDef="let a">
                {{ a.user?.first_name }} {{ a.user?.last_name }}
                <span class="text-xs text-gray-400 block">{{ a.user?.email }}</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="commission_rate">
              <th mat-header-cell *matHeaderCellDef>Comisión</th>
              <td mat-cell *matCellDef="let a">{{ a.commission_rate }}%</td>
            </ng-container>
            <ng-container matColumnDef="total_earned">
              <th mat-header-cell *matHeaderCellDef>Total ganado</th>
              <td mat-cell *matCellDef="let a">{{ a.total_earned | currency:'EUR':'symbol':'1.2-2' }}</td>
            </ng-container>
            <ng-container matColumnDef="active">
              <th mat-header-cell *matHeaderCellDef>Estado</th>
              <td mat-cell *matCellDef="let a">
                <span
                  class="px-2 py-0.5 rounded text-xs font-medium"
                  [class.bg-green-100]="a.active"
                  [class.text-green-700]="a.active"
                  [class.bg-red-100]="!a.active"
                  [class.text-red-700]="!a.active"
                >
                  {{ a.active ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns" />
            <tr mat-row *matRowDef="let row; columns: displayedColumns" />
          </table>

          <mat-paginator
            [length]="meta().total"
            [pageSize]="meta().perPage"
            [pageIndex]="meta().page - 1"
            [pageSizeOptions]="[20, 50, 100]"
            (page)="onPageChange($event)"
          />
        }
      </mat-card-content>
    </mat-card>
  `,
})
export class AffiliatesComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly affiliates = signal<AffiliateItem[]>([]);
  readonly loading = signal(true);
  readonly meta = signal({ page: 1, perPage: 20, total: 0, totalPages: 0 });

  readonly displayedColumns = ['code', 'user', 'commission_rate', 'total_earned', 'active'];

  ngOnInit(): void {
    this.loadAffiliates(1, 20);
  }

  private loadAffiliates(page: number, perPage: number): void {
    this.loading.set(true);
    this.api
      .get<{ success: boolean; data: AffiliateItem[]; meta: any }>('/admin/affiliates', { page, perPage })
      .pipe(catchError(() => of({ success: false, data: [], meta: this.meta() })))
      .subscribe((res) => {
        this.affiliates.set(res.data);
        this.meta.set(res.meta);
        this.loading.set(false);
      });
  }

  onPageChange(event: PageEvent): void {
    this.loadAffiliates(event.pageIndex + 1, event.pageSize);
  }
}
