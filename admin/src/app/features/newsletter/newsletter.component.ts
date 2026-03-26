import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../core/services/api.service';
import { catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';

interface Subscriber {
  id: number;
  email: string;
  source: string;
  subscribed_at: string;
  active: boolean;
}

@Component({
  selector: 'app-newsletter',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">Newsletter — Suscriptores</h1>
      <button mat-flat-button color="primary" (click)="exportCsv()">
        <mat-icon>download</mat-icon>
        Exportar CSV
      </button>
    </div>

    <mat-card>
      <mat-card-content>
        @if (loading()) {
          <div class="flex justify-center py-8">
            <mat-spinner diameter="40" />
          </div>
        } @else {
          <div class="text-sm text-gray-500 mb-4">
            Total suscriptores activos: <strong>{{ meta().total }}</strong>
          </div>
          <table mat-table [dataSource]="subscribers()" class="w-full">
            <ng-container matColumnDef="email">
              <th mat-header-cell *matHeaderCellDef>Email</th>
              <td mat-cell *matCellDef="let s">{{ s.email }}</td>
            </ng-container>
            <ng-container matColumnDef="source">
              <th mat-header-cell *matHeaderCellDef>Fuente</th>
              <td mat-cell *matCellDef="let s">{{ s.source }}</td>
            </ng-container>
            <ng-container matColumnDef="subscribed_at">
              <th mat-header-cell *matHeaderCellDef>Suscrito</th>
              <td mat-cell *matCellDef="let s">{{ s.subscribed_at | date:'dd/MM/yyyy HH:mm' }}</td>
            </ng-container>
            <ng-container matColumnDef="active">
              <th mat-header-cell *matHeaderCellDef>Estado</th>
              <td mat-cell *matCellDef="let s">
                <span
                  class="px-2 py-0.5 rounded text-xs font-medium"
                  [class.bg-green-100]="s.active"
                  [class.text-green-700]="s.active"
                  [class.bg-red-100]="!s.active"
                  [class.text-red-700]="!s.active"
                >
                  {{ s.active ? 'Activo' : 'Desuscrito' }}
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
            [pageSizeOptions]="[25, 50, 100]"
            (page)="onPageChange($event)"
          />
        }
      </mat-card-content>
    </mat-card>
  `,
})
export class NewsletterComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly snackBar = inject(MatSnackBar);

  readonly subscribers = signal<Subscriber[]>([]);
  readonly loading = signal(true);
  readonly meta = signal({ page: 1, perPage: 50, total: 0, totalPages: 0 });

  readonly displayedColumns = ['email', 'source', 'subscribed_at', 'active'];

  ngOnInit(): void {
    this.loadSubscribers(1, 50);
  }

  private loadSubscribers(page: number, perPage: number): void {
    this.loading.set(true);
    this.api
      .get<{ success: boolean; data: Subscriber[]; meta: any }>('/admin/newsletter/subscribers', { page, perPage })
      .pipe(catchError(() => of({ success: false, data: [], meta: this.meta() })))
      .subscribe((res) => {
        this.subscribers.set(res.data);
        this.meta.set(res.meta);
        this.loading.set(false);
      });
  }

  onPageChange(event: PageEvent): void {
    this.loadSubscribers(event.pageIndex + 1, event.pageSize);
  }

  exportCsv(): void {
    const url = `${environment.apiUrl}/admin/newsletter/export`;
    window.open(url, '_blank');
    this.snackBar.open('Descargando CSV...', 'OK', { duration: 2000 });
  }
}
