import { Component, inject, signal, ElementRef, HostListener } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CurrencyPipe } from '@angular/common';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { ApiService } from '../../core/services/api.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    CurrencyPipe,
  ],
  template: `
    <mat-toolbar color="primary" class="header-toolbar">
      <a routerLink="/" class="logo">
        <span class="text-xl font-bold">DMShop</span>
      </a>

      <!-- Search bar -->
      <div class="search-container mx-4 flex-1 max-w-md relative" #searchContainer>
        <div class="flex items-center bg-white/15 hover:bg-white/25 transition-colors rounded-full px-3 py-1">
          <mat-icon class="!text-white/80 mr-2 shrink-0">search</mat-icon>
          <input
            type="text"
            class="bg-transparent text-white placeholder-white/70 outline-none w-full text-sm"
            placeholder="Buscar productos..."
            [(ngModel)]="searchQuery"
            (ngModelChange)="onSearchInput($event)"
            (keydown.enter)="goToSearch()"
            (focus)="showDropdown = true"
          />
          @if (searchQuery) {
            <button mat-icon-button class="!text-white/80 !w-6 !h-6 !leading-6" (click)="clearSearch()">
              <mat-icon class="!text-sm">close</mat-icon>
            </button>
          }
        </div>

        <!-- Search dropdown -->
        @if (showDropdown && searchQuery.length >= 2) {
          <div class="search-dropdown absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
            @if (searchLoading) {
              <div class="flex justify-center py-4">
                <mat-spinner diameter="24" />
              </div>
            } @else if (autocompleteResults.products.length > 0 || autocompleteResults.categories.length > 0) {
              <!-- Categories section -->
              @if (autocompleteResults.categories.length > 0) {
                <div class="px-4 py-2 bg-gray-50 border-b">
                  <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Categorías</p>
                  @for (cat of autocompleteResults.categories; track cat.id) {
                    <a
                      [routerLink]="['/catalog', cat.id]"
                      (click)="closeDropdown()"
                      class="flex items-center gap-2 py-1.5 hover:text-blue-600 transition-colors"
                    >
                      <mat-icon class="!text-sm text-gray-400">category</mat-icon>
                      <span class="text-sm text-gray-700">{{ cat.name }}</span>
                    </a>
                  }
                </div>
              }
              <!-- Products section -->
              @if (autocompleteResults.products.length > 0) {
                <div>
                  @if (autocompleteResults.categories.length > 0) {
                    <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 pt-2 mb-1">Productos</p>
                  }
                  @for (result of autocompleteResults.products; track result.id) {
                    <a
                      [routerLink]="['/product', result.id]"
                      (click)="closeDropdown()"
                      class="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                    >
                      <div class="w-12 h-12 shrink-0 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                        @if (result.coverImage) {
                          <img [src]="result.coverImage" [alt]="result.name" class="w-full h-full object-cover" />
                        } @else {
                          <mat-icon class="text-gray-300">image</mat-icon>
                        }
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-900 truncate">{{ result.name }}</p>
                      </div>
                      <span class="text-sm font-bold text-blue-600 shrink-0">
                        {{ result.price | currency: 'EUR' }}
                      </span>
                    </a>
                  }
                </div>
              }
              <div class="px-4 py-2 bg-gray-50">
                <button
                  mat-button
                  color="primary"
                  class="w-full text-sm"
                  (click)="goToSearch()"
                >
                  Ver todos los resultados para "{{ searchQuery }}"
                </button>
              </div>
            } @else if (!searchLoading) {
              <div class="px-4 py-6 text-center text-sm text-gray-500">
                Sin resultados para "{{ searchQuery }}"
              </div>
            }
          </div>
        }
      </div>

      <a mat-icon-button routerLink="/cart" class="relative">
        <mat-icon
          [matBadge]="cartService.itemCount() || null"
          matBadgeColor="warn"
          matBadgeSize="small"
          aria-hidden="false"
          aria-label="Carrito de compras"
        >
          shopping_cart
        </mat-icon>
      </a>

      @if (authService.isAuthenticated()) {
        <a mat-icon-button routerLink="/account/wishlist" title="Lista de deseos">
          <mat-icon
            [matBadge]="wishlistService.itemCount() > 0 ? wishlistService.itemCount() : null"
            matBadgeColor="accent"
            matBadgeSize="small"
          >
            favorite
          </mat-icon>
        </a>
      }

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
      .search-dropdown {
        animation: fadeIn 0.15s ease-out;
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-4px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `,
  ],
})
export class HeaderComponent {
  readonly authService = inject(AuthService);
  readonly cartService = inject(CartService);
  readonly wishlistService = inject(WishlistService);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly el = inject(ElementRef);

  searchQuery = '';
  autocompleteResults: { products: any[]; categories: any[] } = { products: [], categories: [] };
  searchLoading = false;
  showDropdown = false;

  private readonly searchSubject = new Subject<string>();

  constructor() {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((q) => {
          if (q.length < 2) {
            this.autocompleteResults = { products: [], categories: [] };
            this.searchLoading = false;
            return of(null);
          }
          this.searchLoading = true;
          return this.api.get<{ success: boolean; data: { products: any[]; categories: any[] } }>(
            '/search/autocomplete',
            { q, limit: 8 },
          ).pipe(
            catchError(() => {
              // Fallback to basic product search
              return of(null);
            }),
          );
        }),
      )
      .subscribe({
        next: (res: any) => {
          this.searchLoading = false;
          if (res && res.data) {
            this.autocompleteResults = {
              products: res.data.products ?? [],
              categories: res.data.categories ?? [],
            };
          } else {
            this.autocompleteResults = { products: [], categories: [] };
          }
        },
        error: () => {
          this.searchLoading = false;
          this.autocompleteResults = { products: [], categories: [] };
        },
      });
  }

  onSearchInput(query: string): void {
    this.showDropdown = true;
    this.searchSubject.next(query);
  }

  goToSearch(): void {
    if (this.searchQuery.trim()) {
      this.closeDropdown();
      this.router.navigate(['/catalog'], {
        queryParams: { search: this.searchQuery.trim() },
      });
    }
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.autocompleteResults = { products: [], categories: [] };
    this.showDropdown = false;
  }

  closeDropdown(): void {
    this.showDropdown = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.el.nativeElement.contains(event.target)) {
      this.showDropdown = false;
    }
  }
}
