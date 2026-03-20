import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCardModule } from '@angular/material/card';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { firstValueFrom } from 'rxjs';

interface AdminReview {
  id: number;
  rating: number;
  title: string;
  content: string;
  approved: boolean;
  created_at: string;
  user: { id: number; first_name: string; last_name: string; email: string } | null;
  product: { id: number; translations: Array<{ name: string }> } | null;
}

@Component({
  selector: 'app-reviews-list',
  standalone: true,
  imports: [
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTabsModule,
    MatChipsModule,
    MatSlideToggleModule,
    MatCardModule,
    DatePipe,
  ],
  template: `
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-bold">Moderación de reseñas</h1>
    </div>

    <!-- Settings card -->
    <mat-card class="mb-6">
      <mat-card-header>
        <mat-card-title>Configuración de reseñas</mat-card-title>
      </mat-card-header>
      <mat-card-content class="pt-4">
        <mat-slide-toggle [(ngModel)]="requirePurchase" (change)="saveReviewSettings()">
          Solo los compradores pueden dejar reseñas
        </mat-slide-toggle>
        <p class="text-sm text-gray-500 mt-1">
          Si está activo, el cliente debe haber comprado el producto para poder valorarlo.
        </p>
      </mat-card-content>
    </mat-card>

    <mat-tab-group (selectedIndexChange)="onTabChange($event)">
      <mat-tab label="Pendientes"></mat-tab>
      <mat-tab label="Aprobadas"></mat-tab>
    </mat-tab-group>

    @if (loading()) {
      <div class="flex justify-center py-12"><mat-spinner diameter="48" /></div>
    } @else if (reviews().length === 0) {
      <div class="text-center py-12 text-gray-500">
        No hay reseñas {{ showApproved() ? 'aprobadas' : 'pendientes' }}.
      </div>
    } @else {
      <div class="bg-white rounded-lg shadow overflow-hidden mt-4">
        <table mat-table [dataSource]="reviews()" class="w-full">
          <ng-container matColumnDef="product">
            <th mat-header-cell *matHeaderCellDef>Producto</th>
            <td mat-cell *matCellDef="let r">
              {{ r.product?.translations?.[0]?.name ?? '#' + r.id }}
            </td>
          </ng-container>

          <ng-container matColumnDef="user">
            <th mat-header-cell *matHeaderCellDef>Usuario</th>
            <td mat-cell *matCellDef="let r">
              {{ r.user?.first_name ?? '' }} {{ r.user?.last_name ?? '' }}
              <span class="block text-xs text-gray-400">{{ r.user?.email }}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="rating">
            <th mat-header-cell *matHeaderCellDef>Rating</th>
            <td mat-cell *matCellDef="let r">
              <div class="flex items-center gap-0.5">
                @for (star of [1,2,3,4,5]; track star) {
                  <span [class]="star <= r.rating ? 'text-yellow-400' : 'text-gray-200'" class="text-base">★</span>
                }
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="title">
            <th mat-header-cell *matHeaderCellDef>Título / Contenido</th>
            <td mat-cell *matCellDef="let r">
              <div class="font-medium">{{ r.title }}</div>
              <div class="text-sm text-gray-500 max-w-xs truncate">{{ r.content }}</div>
            </td>
          </ng-container>

          <ng-container matColumnDef="date">
            <th mat-header-cell *matHeaderCellDef>Fecha</th>
            <td mat-cell *matCellDef="let r">{{ r.created_at | date: 'dd/MM/yyyy' }}</td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let r">
              @if (!r.approved) {
                <button mat-icon-button color="primary" title="Aprobar" (click)="approve(r.id)">
                  <mat-icon>check_circle</mat-icon>
                </button>
              }
              <button mat-icon-button color="warn" title="Eliminar" (click)="remove(r.id)">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns"></tr>
        </table>
      </div>
    }
  `,
})
export class ReviewsListComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly snackBar = inject(MatSnackBar);

  readonly reviews = signal<AdminReview[]>([]);
  readonly loading = signal(false);
  readonly showApproved = signal(false);
  requirePurchase = false;

  readonly columns = ['product', 'user', 'rating', 'title', 'date', 'actions'];

  async ngOnInit() {
    // Load review settings
    try {
      const res = await firstValueFrom(this.api.get<any>('/configurations', { prefix: 'REVIEW_' }));
      const map = new Map((res.data ?? []).map((c: any) => [c.key, c.value]));
      this.requirePurchase = map.get('REVIEW_REQUIRE_PURCHASE') === '1';
    } catch { /* ignore */ }
    await this.loadReviews();
  }

  async saveReviewSettings() {
    try {
      await firstValueFrom(
        this.api.put('/configurations', {
          configs: [{ key: 'REVIEW_REQUIRE_PURCHASE', value: this.requirePurchase ? '1' : '0' }],
        }),
      );
      this.snackBar.open('Configuración guardada', 'OK', { duration: 2000 });
    } catch {
      this.snackBar.open('Error al guardar', 'Cerrar', { duration: 3000 });
    }
  }

  onTabChange(index: number) {
    this.showApproved.set(index === 1);
    this.loadReviews();
  }

  async loadReviews() {
    this.loading.set(true);
    try {
      const res = await firstValueFrom(
        this.api.get<any>('/reviews', { approved: this.showApproved() }),
      );
      this.reviews.set(res.reviews ?? []);
    } catch {
      this.snackBar.open('Error al cargar reseñas', 'OK', { duration: 3000 });
    } finally {
      this.loading.set(false);
    }
  }

  async approve(id: number) {
    try {
      await firstValueFrom(this.api.put(`/reviews/${id}/approve`));
      this.snackBar.open('Reseña aprobada', 'OK', { duration: 2000 });
      await this.loadReviews();
    } catch {
      this.snackBar.open('Error al aprobar reseña', 'OK', { duration: 3000 });
    }
  }

  async remove(id: number) {
    if (!confirm('¿Eliminar esta reseña?')) return;
    try {
      await firstValueFrom(this.api.delete(`/reviews/${id}`));
      this.snackBar.open('Reseña eliminada', 'OK', { duration: 2000 });
      await this.loadReviews();
    } catch {
      this.snackBar.open('Error al eliminar reseña', 'OK', { duration: 3000 });
    }
  }
}
