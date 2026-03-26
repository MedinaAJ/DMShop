import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    MatButtonModule,
    MatIconModule,
    MatListModule,
  ],
  template: `
    <div class="max-w-5xl mx-auto px-4 py-8">
      <h1 class="text-2xl font-bold mb-6">Mi cuenta</h1>
      <div class="flex flex-col md:flex-row gap-8">
        <aside class="w-full md:w-56 shrink-0">
          <mat-nav-list>
            <a
              mat-list-item
              routerLink="/account"
              [routerLinkActiveOptions]="{ exact: true }"
              routerLinkActive="!bg-blue-50"
            >
              <mat-icon matListItemIcon>dashboard</mat-icon>
              <span>Panel</span>
            </a>
            <a mat-list-item routerLink="/account/orders" routerLinkActive="!bg-blue-50">
              <mat-icon matListItemIcon>receipt_long</mat-icon>
              <span>Pedidos</span>
            </a>
            <a mat-list-item routerLink="/account/addresses" routerLinkActive="!bg-blue-50">
              <mat-icon matListItemIcon>location_on</mat-icon>
              <span>Direcciones</span>
            </a>
            <a mat-list-item routerLink="/account/wishlist" routerLinkActive="!bg-blue-50">
              <mat-icon matListItemIcon>favorite</mat-icon>
              <span>Lista de deseos</span>
            </a>
            <a mat-list-item routerLink="/account/loyalty" routerLinkActive="!bg-blue-50">
              <mat-icon matListItemIcon>star</mat-icon>
              <span>Mis puntos de fidelidad</span>
            </a>
            <a mat-list-item routerLink="/account/profile" routerLinkActive="!bg-blue-50">
              <mat-icon matListItemIcon>person</mat-icon>
              <span>Perfil</span>
            </a>
            <a mat-list-item routerLink="/account/affiliate" routerLinkActive="!bg-blue-50">
              <mat-icon matListItemIcon>share</mat-icon>
              <span>Afiliados</span>
            </a>
          </mat-nav-list>
        </aside>
        <div class="flex-1">
          <router-outlet />
        </div>
      </div>
    </div>
  `,
})
export class AccountComponent {
  readonly authService = inject(AuthService);
}
