import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
  ],
  template: `
    <mat-sidenav-container class="h-screen">
      <mat-sidenav [mode]="'side'" [opened]="sidenavOpen()" class="w-64">
        <div class="p-4 border-b">
          <a routerLink="/dashboard" class="text-xl font-bold text-blue-600 no-underline">
            DMShop Admin
          </a>
        </div>
        <mat-nav-list>
          <a mat-list-item routerLink="/dashboard" routerLinkActive="!bg-blue-50 !text-blue-700">
            <mat-icon matListItemIcon>dashboard</mat-icon>
            <span>Dashboard</span>
          </a>
          <a mat-list-item routerLink="/products" routerLinkActive="!bg-blue-50 !text-blue-700">
            <mat-icon matListItemIcon>inventory_2</mat-icon>
            <span>Productos</span>
          </a>
          <a mat-list-item routerLink="/categories" routerLinkActive="!bg-blue-50 !text-blue-700">
            <mat-icon matListItemIcon>category</mat-icon>
            <span>Categorías</span>
          </a>
          <a mat-list-item routerLink="/orders" routerLinkActive="!bg-blue-50 !text-blue-700">
            <mat-icon matListItemIcon>receipt_long</mat-icon>
            <span>Pedidos</span>
          </a>
          <a mat-list-item routerLink="/customers" routerLinkActive="!bg-blue-50 !text-blue-700">
            <mat-icon matListItemIcon>people</mat-icon>
            <span>Clientes</span>
          </a>
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content>
        <mat-toolbar>
          <button mat-icon-button (click)="sidenavOpen.set(!sidenavOpen())">
            <mat-icon>menu</mat-icon>
          </button>
          <span class="flex-1"></span>
          <button mat-icon-button [matMenuTriggerFor]="profileMenu">
            <mat-icon>account_circle</mat-icon>
          </button>
          <mat-menu #profileMenu="matMenu">
            <span class="px-4 py-2 text-sm text-gray-500 block">
              {{ authService.user()?.firstName }} {{ authService.user()?.lastName }}
            </span>
            <button mat-menu-item (click)="authService.logout()">
              <mat-icon>logout</mat-icon>
              <span>Cerrar sesión</span>
            </button>
          </mat-menu>
        </mat-toolbar>
        <div class="p-6">
          <router-outlet />
        </div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
})
export class AdminLayoutComponent {
  readonly authService = inject(AuthService);
  readonly sidenavOpen = signal(true);
}
