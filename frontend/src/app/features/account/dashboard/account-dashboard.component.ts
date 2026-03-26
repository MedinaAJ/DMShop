import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { firstValueFrom } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';

interface CustomerGroup {
  id: number;
  reduction: number;
  show_prices: boolean;
  translations: Array<{ id_customer_group: number; id_lang: number; name: string }>;
}

interface RecentOrder {
  id: number;
  reference: string;
  total_paid: number;
  created_at: string;
  stateName: string;
  stateColor: string;
}

interface LoyaltyBalance {
  balance: number;
  value: number;
}

@Component({
  selector: 'app-account-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinner,
    MatButtonModule,
    MatDividerModule,
  ],
  template: `
    <h2 class="text-xl font-semibold mb-4">
      Hola, {{ authService.user()?.firstName }}! 👋
    </h2>

    <!-- Quick access cards -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      <a routerLink="/account/orders" class="group bg-blue-50 hover:bg-blue-100 rounded-xl p-4 text-center transition-colors">
        <mat-icon class="!text-3xl text-blue-600 mb-1">receipt_long</mat-icon>
        <p class="text-sm font-medium text-blue-700">Mis pedidos</p>
      </a>
      <a routerLink="/account/addresses" class="group bg-green-50 hover:bg-green-100 rounded-xl p-4 text-center transition-colors">
        <mat-icon class="!text-3xl text-green-600 mb-1">location_on</mat-icon>
        <p class="text-sm font-medium text-green-700">Direcciones</p>
      </a>
      <a routerLink="/account/wishlist" class="group bg-pink-50 hover:bg-pink-100 rounded-xl p-4 text-center transition-colors">
        <mat-icon class="!text-3xl text-pink-600 mb-1">favorite</mat-icon>
        <p class="text-sm font-medium text-pink-700">Lista de deseos</p>
      </a>
      <a routerLink="/account/loyalty" class="group bg-yellow-50 hover:bg-yellow-100 rounded-xl p-4 text-center transition-colors">
        <mat-icon class="!text-3xl text-yellow-600 mb-1">star</mat-icon>
        <p class="text-sm font-medium text-yellow-700">
          @if (loyaltyBalance()) {
            {{ loyaltyBalance()!.balance }} puntos
          } @else {
            Fidelidad
          }
        </p>
      </a>
    </div>

    <div class="grid md:grid-cols-2 gap-6">
      <!-- Profile summary -->
      <mat-card>
        <mat-card-header>
          <mat-icon mat-card-avatar class="!text-blue-600">person</mat-icon>
          <mat-card-title>Datos personales</mat-card-title>
        </mat-card-header>
        <mat-card-content class="mt-2">
          <p class="font-medium">{{ authService.user()?.firstName }} {{ authService.user()?.lastName }}</p>
          <p class="text-gray-500 text-sm">{{ authService.user()?.email }}</p>

          @if (userGroups().length > 0) {
            <div class="mt-3 flex items-center gap-2 flex-wrap">
              @for (group of userGroups(); track group.id) {
                <mat-chip class="text-xs">
                  {{ getGroupName(group) }}
                  @if (group.reduction > 0) {
                    — {{ group.reduction }}% dto.
                  }
                </mat-chip>
              }
            </div>
          }

          <a routerLink="/account/profile" mat-button color="primary" class="mt-3 !px-0">
            Editar perfil <mat-icon>edit</mat-icon>
          </a>
        </mat-card-content>
      </mat-card>

      <!-- Loyalty points summary -->
      @if (loyaltyBalance()) {
        <mat-card class="!bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200">
          <mat-card-header>
            <mat-icon mat-card-avatar class="!text-yellow-600">star</mat-icon>
            <mat-card-title>Puntos de fidelidad</mat-card-title>
          </mat-card-header>
          <mat-card-content class="mt-2">
            <p class="text-3xl font-bold text-yellow-700">{{ loyaltyBalance()!.balance }}</p>
            <p class="text-sm text-gray-500">
              Valor aproximado: {{ loyaltyBalance()!.value | currency:'EUR':'symbol':'1.2-2' }}
            </p>
            <a routerLink="/account/loyalty" mat-button color="accent" class="mt-2 !px-0">
              Ver historial <mat-icon>arrow_forward</mat-icon>
            </a>
          </mat-card-content>
        </mat-card>
      }
    </div>

    <!-- Recent orders -->
    <mat-card class="mt-6">
      <mat-card-header>
        <mat-icon mat-card-avatar class="!text-blue-600">receipt_long</mat-icon>
        <mat-card-title>Últimos pedidos</mat-card-title>
        <div class="ml-auto">
          <a routerLink="/account/orders" mat-button color="primary">Ver todos</a>
        </div>
      </mat-card-header>
      <mat-card-content>
        @if (loadingOrders()) {
          <mat-spinner diameter="30" class="mx-auto my-4" />
        } @else if (recentOrders().length === 0) {
          <div class="py-8 text-center text-gray-400">
            <mat-icon class="!text-5xl mb-2">receipt_long</mat-icon>
            <p>Aún no has realizado ningún pedido.</p>
            <a routerLink="/catalog" mat-flat-button color="primary" class="mt-4">
              Ir al catálogo
            </a>
          </div>
        } @else {
          <div class="divide-y">
            @for (order of recentOrders(); track order.id) {
              <a
                [routerLink]="['/account/orders', order.id]"
                class="flex items-center justify-between py-3 hover:bg-gray-50 transition-colors px-2 rounded -mx-2"
              >
                <div class="flex items-center gap-3">
                  <div>
                    <p class="font-medium text-sm">#{{ order.reference }}</p>
                    <p class="text-xs text-gray-400">{{ order.created_at | date:'dd/MM/yyyy' }}</p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="font-semibold text-sm">{{ order.total_paid | currency:'EUR':'symbol':'1.2-2' }}</p>
                  <span
                    class="text-xs px-2 py-0.5 rounded-full"
                    [style.background-color]="order.stateColor + '22'"
                    [style.color]="order.stateColor"
                  >
                    {{ order.stateName }}
                  </span>
                </div>
                <mat-icon class="text-gray-400 ml-2">chevron_right</mat-icon>
              </a>
            }
          </div>
        }
      </mat-card-content>
    </mat-card>
  `,
})
export class AccountDashboardComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly api = inject(ApiService);

  readonly userGroups = signal<CustomerGroup[]>([]);
  readonly recentOrders = signal<RecentOrder[]>([]);
  readonly loyaltyBalance = signal<LoyaltyBalance | null>(null);
  readonly loadingOrders = signal(true);

  ngOnInit() {
    this.fetchUserGroups();
    this.fetchRecentOrders();
    this.fetchLoyaltyBalance();
  }

  private async fetchUserGroups(): Promise<void> {
    try {
      const res = await firstValueFrom(this.api.get<{ success: boolean; data: any }>('/auth/me'));
      this.userGroups.set(res.data.groups ?? []);
    } catch {
      // Non-critical
    }
  }

  private fetchRecentOrders(): void {
    this.api
      .get<{ success: boolean; data: any[]; meta: any }>('/orders', { perPage: 5 })
      .pipe(catchError(() => of({ success: false, data: [], meta: {} })))
      .subscribe((res) => {
        this.recentOrders.set(
          (res.data ?? []).map((o: any) => ({
            id: o.id,
            reference: o.reference,
            total_paid: Number(o.totalPaid ?? o.total_paid ?? 0),
            created_at: o.createdAt ?? o.created_at,
            stateName: o.stateName ?? o.state?.name ?? 'Desconocido',
            stateColor: o.stateColor ?? o.state?.color ?? '#666666',
          })),
        );
        this.loadingOrders.set(false);
      });
  }

  private fetchLoyaltyBalance(): void {
    this.api
      .get<{ success: boolean; data: any }>('/account/loyalty/balance')
      .pipe(catchError(() => of({ success: false, data: null })))
      .subscribe((res) => {
        if (res.data) {
          this.loyaltyBalance.set({
            balance: res.data.balance ?? 0,
            value: Number(res.data.value ?? 0),
          });
        }
      });
  }

  getGroupName(group: CustomerGroup): string {
    const t = group.translations?.find((t) => t.id_lang === 1) ?? group.translations?.[0];
    return t?.name ?? `Grupo #${group.id}`;
  }
}
