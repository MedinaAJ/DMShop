import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../../core/services/api.service';
import { catchError, of } from 'rxjs';

interface AffiliateData {
  affiliate: {
    id: number;
    code: string;
    commission_rate: number;
    total_earned: number;
    active: boolean;
  };
  referrals: Array<{
    id: number;
    id_order: number;
    commission: number;
    created_at: string;
  }>;
  totalReferrals: number;
}

@Component({
  selector: 'app-affiliate-page',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="max-w-3xl mx-auto px-4 py-8">
      <h1 class="text-2xl font-bold mb-6">
        <mat-icon class="align-middle mr-2">share</mat-icon>
        Programa de Afiliados
      </h1>

      @if (loading()) {
        <div class="flex justify-center py-12">
          <mat-spinner diameter="40" />
        </div>
      } @else if (data()) {
        <div class="grid md:grid-cols-3 gap-4 mb-8">
          <mat-card class="text-center !bg-blue-50">
            <mat-card-content class="!pt-4">
              <mat-icon class="!text-4xl text-blue-600 mb-2">code</mat-icon>
              <p class="text-xs text-gray-500 mb-1">Tu código de afiliado</p>
              <p class="text-2xl font-bold text-blue-700 font-mono">{{ data()!.affiliate.code }}</p>
            </mat-card-content>
          </mat-card>
          <mat-card class="text-center !bg-green-50">
            <mat-card-content class="!pt-4">
              <mat-icon class="!text-4xl text-green-600 mb-2">euro</mat-icon>
              <p class="text-xs text-gray-500 mb-1">Total ganado</p>
              <p class="text-2xl font-bold text-green-700">{{ data()!.affiliate.total_earned | currency:'EUR':'symbol':'1.2-2' }}</p>
            </mat-card-content>
          </mat-card>
          <mat-card class="text-center !bg-purple-50">
            <mat-card-content class="!pt-4">
              <mat-icon class="!text-4xl text-purple-600 mb-2">people</mat-icon>
              <p class="text-xs text-gray-500 mb-1">Referidos</p>
              <p class="text-2xl font-bold text-purple-700">{{ data()!.totalReferrals }}</p>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Referral link -->
        <mat-card class="mb-6">
          <mat-card-content class="!pt-4">
            <h2 class="font-semibold mb-3">Tu enlace de referido</h2>
            <div class="flex items-center gap-2 bg-gray-50 border rounded-lg px-4 py-3">
              <span class="text-sm text-gray-600 flex-1 truncate">{{ referralLink() }}</span>
              <button mat-flat-button color="primary" (click)="copyLink()">
                <mat-icon>copy_all</mat-icon>
                Copiar
              </button>
            </div>
            <p class="text-xs text-gray-400 mt-2">
              Comparte este enlace con tus amigos. Cuando realicen su primera compra,
              recibirás una comisión del {{ data()!.affiliate.commission_rate }}%.
            </p>
          </mat-card-content>
        </mat-card>

        <!-- Referral history -->
        <mat-card>
          <mat-card-content class="!pt-4">
            <h2 class="font-semibold mb-3">Historial de referidos</h2>
            @if (data()!.referrals.length === 0) {
              <p class="text-gray-400 text-center py-6">Aún no tienes referidos. ¡Comparte tu enlace!</p>
            } @else {
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b">
                    <th class="text-left pb-2 font-medium text-gray-500">Pedido</th>
                    <th class="text-right pb-2 font-medium text-gray-500">Comisión</th>
                    <th class="text-right pb-2 font-medium text-gray-500">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  @for (r of data()!.referrals; track r.id) {
                    <tr class="border-b">
                      <td class="py-2 font-mono text-xs">#{{ r.id_order }}</td>
                      <td class="py-2 text-right text-green-600 font-medium">+{{ r.commission | currency:'EUR':'symbol':'1.2-2' }}</td>
                      <td class="py-2 text-right text-gray-400">{{ r.created_at | date:'dd/MM/yyyy' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </mat-card-content>
        </mat-card>
      } @else {
        <div class="text-center py-12 text-gray-500">
          <mat-icon class="!text-6xl mb-4">share</mat-icon>
          <p>No se pudo cargar la información del programa de afiliados.</p>
        </div>
      }
    </div>
  `,
})
export class AffiliatePageComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly snackBar = inject(MatSnackBar);

  readonly loading = signal(true);
  readonly data = signal<AffiliateData | null>(null);

  referralLink(): string {
    const code = this.data()?.affiliate.code ?? '';
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://your-shop.com';
    return `${origin}/?ref=${code}`;
  }

  ngOnInit(): void {
    this.api
      .get<{ success: boolean; data: AffiliateData }>('/account/affiliate')
      .pipe(catchError(() => of({ success: false, data: null })))
      .subscribe((res) => {
        this.data.set(res.data);
        this.loading.set(false);
      });
  }

  copyLink(): void {
    navigator.clipboard.writeText(this.referralLink()).then(() => {
      this.snackBar.open('Enlace copiado al portapapeles', 'OK', { duration: 2000 });
    });
  }
}
