import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-account-dashboard',
  standalone: true,
  imports: [MatCardModule, MatIconModule],
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
export class AccountDashboardComponent {
  readonly authService = inject(AuthService);
}
