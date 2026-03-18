import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';

interface GroupTranslation {
  id_customer_group: number;
  id_lang: number;
  name: string;
}

interface CustomerGroup {
  id: number;
  reduction: number;
  show_prices: boolean;
  translations: GroupTranslation[];
}

interface MeWithGroups {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  groups?: CustomerGroup[];
}

interface MeResponse {
  success: boolean;
  data: MeWithGroups;
}

@Component({
  selector: 'app-account-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatChipsModule, MatProgressSpinnerModule],
  template: `
    <h2 class="text-xl font-semibold mb-4">Hola, {{ authService.user()?.firstName }}!</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <mat-card>
        <mat-card-header>
          <mat-icon mat-card-avatar class="!text-blue-600">person</mat-icon>
          <mat-card-title>Datos personales</mat-card-title>
        </mat-card-header>
        <mat-card-content class="mt-2">
          <p>{{ authService.user()?.firstName }} {{ authService.user()?.lastName }}</p>
          <p class="text-gray-500">{{ authService.user()?.email }}</p>

          @if (loadingGroup()) {
            <mat-spinner diameter="20" class="mt-2"></mat-spinner>
          } @else if (userGroups().length > 0) {
            <div class="mt-3 flex items-center gap-2 flex-wrap">
              <span class="text-sm text-gray-500">Grupo:</span>
              @for (group of userGroups(); track group.id) {
                <mat-chip color="primary" highlighted class="text-sm">
                  <mat-icon matChipTrailingIcon>group_work</mat-icon>
                  {{ getGroupName(group) }}
                  @if (group.reduction > 0) {
                    <span class="ml-1 text-xs">({{ group.reduction }}% dto.)</span>
                  }
                </mat-chip>
              }
            </div>
          }
        </mat-card-content>
      </mat-card>
      <mat-card>
        <mat-card-header>
          <mat-icon mat-card-avatar class="!text-blue-600">receipt_long</mat-icon>
          <mat-card-title>Pedidos recientes</mat-card-title>
        </mat-card-header>
        <mat-card-content class="mt-2">
          <p class="text-gray-500">No tienes pedidos recientes.</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
})
export class AccountDashboardComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly api = inject(ApiService);

  readonly userGroups = signal<CustomerGroup[]>([]);
  readonly loadingGroup = signal(false);

  ngOnInit() {
    this.fetchUserGroups();
  }

  async fetchUserGroups() {
    this.loadingGroup.set(true);
    try {
      const res = await firstValueFrom(this.api.get<MeResponse>('/auth/me'));
      this.userGroups.set(res.data.groups ?? []);
    } catch {
      // Non-critical — don't show error
    } finally {
      this.loadingGroup.set(false);
    }
  }

  getGroupName(group: CustomerGroup): string {
    const t = group.translations?.find((t) => t.id_lang === 1) ?? group.translations?.[0];
    return t?.name ?? `Grupo #${group.id}`;
  }
}
