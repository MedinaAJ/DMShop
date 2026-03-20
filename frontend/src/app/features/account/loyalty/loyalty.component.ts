import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { firstValueFrom } from 'rxjs';

interface LoyaltyTransaction {
  id: number;
  points: number;
  source: string;
  created_at: string;
}

@Component({
  selector: 'app-loyalty',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatSnackBarModule,
    MatInputModule,
    MatFormFieldModule,
    CurrencyPipe,
    DatePipe,
  ],
  template: `
    <div class="max-w-2xl">
      <h2 class="text-xl font-bold mb-6">Mis puntos de fidelidad</h2>

      @if (loading()) {
        <div class="flex justify-center py-12"><mat-spinner diameter="40" /></div>
      } @else {
        <!-- Balance card -->
        <mat-card class="mb-6">
          <mat-card-content class="pt-4">
            <div class="flex items-center gap-6">
              <div class="text-center">
                <p class="text-4xl font-bold text-blue-600">{{ balance() }}</p>
                <p class="text-sm text-gray-500">puntos</p>
              </div>
              <div class="text-center">
                <p class="text-4xl font-bold text-green-600">{{ valueInEuros() | currency:'EUR' }}</p>
                <p class="text-sm text-gray-500">valor aproximado</p>
              </div>
              <div class="flex-1">
                <p class="text-sm text-gray-600">
                  Acumula puntos con cada compra y canjéalos como descuento en tu próximo pedido.
                </p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Redeem form -->
        @if (balance() > 0) {
          <mat-card class="mb-6">
            <mat-card-header>
              <mat-card-title>Canjear puntos</mat-card-title>
            </mat-card-header>
            <mat-card-content class="pt-4">
              <div class="flex gap-3">
                <mat-form-field class="flex-1">
                  <mat-label>Puntos a canjear</mat-label>
                  <input matInput type="number" [(ngModel)]="pointsToRedeem" min="1" [max]="balance()" />
                  <mat-hint>Máximo {{ balance() }} puntos = {{ balance() * (euroPerPoint() ?? 0.01) | currency:'EUR' }}</mat-hint>
                </mat-form-field>
                <button mat-flat-button color="primary" (click)="redeem()" [disabled]="redeeming() || !pointsToRedeem || pointsToRedeem > balance()">
                  {{ redeeming() ? '...' : 'Canjear' }}
                </button>
              </div>
            </mat-card-content>
          </mat-card>
        }

        <!-- History -->
        <h3 class="text-lg font-semibold mb-3">Historial de puntos</h3>
        @if (history().length === 0) {
          <p class="text-gray-400 text-sm">Aún no tienes movimientos de puntos.</p>
        } @else {
          <div class="space-y-2">
            @for (tx of history(); track tx.id) {
              <div class="flex items-center justify-between bg-white border rounded-lg p-3">
                <div class="flex items-center gap-3">
                  <mat-icon [class]="tx.points > 0 ? 'text-green-500' : 'text-red-400'">
                    {{ tx.points > 0 ? 'add_circle' : 'remove_circle' }}
                  </mat-icon>
                  <div>
                    <p class="font-medium text-sm">
                      {{ sourceLabels[tx.source] ?? tx.source }}
                    </p>
                    <p class="text-xs text-gray-400">{{ tx.created_at | date:'dd/MM/yyyy HH:mm' }}</p>
                  </div>
                </div>
                <span [class]="tx.points > 0 ? 'text-green-600 font-bold' : 'text-red-500 font-bold'">
                  {{ tx.points > 0 ? '+' : '' }}{{ tx.points }} pts
                </span>
              </div>
            }
          </div>
        }
      }
    </div>
  `,
})
export class LoyaltyComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly snack = inject(MatSnackBar);

  readonly loading = signal(true);
  readonly redeeming = signal(false);
  readonly balance = signal(0);
  readonly valueInEuros = signal(0);
  readonly euroPerPoint = signal<number | null>(null);
  readonly history = signal<LoyaltyTransaction[]>([]);
  pointsToRedeem = 0;

  readonly sourceLabels: Record<string, string> = {
    order: '🎁 Puntos por compra',
    refund: '↩️ Devolución de puntos',
    redemption: '💳 Puntos canjeados',
    manual: '✏️ Ajuste manual',
  };

  async ngOnInit(): Promise<void> {
    await this.loadData();
  }

  async loadData(): Promise<void> {
    this.loading.set(true);
    try {
      const [loyaltyRes, configRes] = await Promise.all([
        firstValueFrom(this.api.get<any>('/account/loyalty')),
        firstValueFrom(this.api.get<any>('/admin/loyalty/config')).catch(() => ({ data: { euroPerPoint: 0.01 } })),
      ]);
      this.balance.set(loyaltyRes.data?.balance ?? 0);
      this.history.set(loyaltyRes.data?.history ?? []);
      this.euroPerPoint.set(configRes.data?.euroPerPoint ?? 0.01);
      this.valueInEuros.set(Math.round(this.balance() * (this.euroPerPoint() ?? 0.01) * 100) / 100);
    } catch {
      this.snack.open('Error al cargar puntos', 'Cerrar', { duration: 3000 });
    } finally {
      this.loading.set(false);
    }
  }

  async redeem(): Promise<void> {
    if (!this.pointsToRedeem || this.pointsToRedeem <= 0) return;
    this.redeeming.set(true);
    try {
      const res = await firstValueFrom(
        this.api.post<any>('/cart/apply-loyalty', { points: this.pointsToRedeem }),
      );
      this.snack.open(
        `Canjeados ${this.pointsToRedeem} puntos (descuento: ${res.data?.discount}€)`,
        'OK',
        { duration: 4000 },
      );
      this.pointsToRedeem = 0;
      await this.loadData();
    } catch (err: any) {
      this.snack.open(err?.error?.message ?? 'Error al canjear', 'Cerrar', { duration: 3000 });
    } finally {
      this.redeeming.set(false);
    }
  }
}
