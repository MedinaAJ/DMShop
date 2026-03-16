import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    RouterLink,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatMenuModule,
  ],
  template: `
    <mat-toolbar color="primary" class="header-toolbar">
      <a routerLink="/" class="logo">
        <span class="text-xl font-bold">DMShop</span>
      </a>

      <span class="flex-1"></span>

      <a mat-icon-button routerLink="/cart" class="relative">
        <mat-icon
          [matBadge]="cartService.itemCount() || null"
          matBadgeColor="warn"
          matBadgeSize="small"
        >
          shopping_cart
        </mat-icon>
      </a>

      @if (authService.isAuthenticated()) {
        <button mat-icon-button [matMenuTriggerFor]="userMenu">
          <mat-icon>person</mat-icon>
        </button>
        <mat-menu #userMenu="matMenu">
          <span class="px-4 py-2 text-sm text-gray-500 block">
            {{ authService.user()?.firstName }} {{ authService.user()?.lastName }}
          </span>
          <a mat-menu-item routerLink="/account">
            <mat-icon>account_circle</mat-icon>
            <span>Mi cuenta</span>
          </a>
          <a mat-menu-item routerLink="/account/orders">
            <mat-icon>receipt_long</mat-icon>
            <span>Mis pedidos</span>
          </a>
          <button mat-menu-item (click)="authService.logout()">
            <mat-icon>logout</mat-icon>
            <span>Cerrar sesión</span>
          </button>
        </mat-menu>
      } @else {
        <a mat-button routerLink="/auth/login">Iniciar sesión</a>
        <a mat-flat-button routerLink="/auth/register" class="ml-2">Registrarse</a>
      }
    </mat-toolbar>
  `,
  styles: [
    `
      .header-toolbar {
        position: sticky;
        top: 0;
        z-index: 100;
      }
      .logo {
        color: inherit;
        text-decoration: none;
      }
    `,
  ],
})
export class HeaderComponent {
  readonly authService = inject(AuthService);
  readonly cartService = inject(CartService);
}
