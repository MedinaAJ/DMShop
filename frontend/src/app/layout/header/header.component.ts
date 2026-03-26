import { Component, inject, signal, ElementRef, HostListener } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { CurrencyPipe, UpperCasePipe } from '@angular/common';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { ApiService } from '../../core/services/api.service';
import { I18nService } from '../../core/services/i18n.service';
import { CurrencyService } from '../../core/services/currency.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatMenuModule,
    MatProgressSpinner,
    CurrencyPipe,
    UpperCasePipe,
    TranslatePipe,
  ],
  template: `
    <header class="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
      <nav class="flex items-center px-4 sm:px-6 py-3 gap-4">
        <!-- Logo — left -->
        <a routerLink="/" class="text-xl font-bold text-gray-900 no-underline shrink-0">DMShop</a>

        <!-- Search bar — center, grows -->
        <div class="search-container flex-1 max-w-2xl mx-auto relative hidden sm:block" #searchContainer>
          <div class="flex items-center bg-gray-100 hover:bg-gray-200/70 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500 transition-all rounded-full px-4 py-2">
            <mat-icon class="text-gray-400 mr-2 shrink-0 !text-[20px]">search</mat-icon>
            <input
              type="text"
              class="bg-transparent text-gray-900 placeholder-gray-400 outline-none w-full text-sm"
              [placeholder]="'common.search' | translate"
              [(ngModel)]="searchQuery"
              (ngModelChange)="onSearchInput($event)"
              (keydown.enter)="goToSearch()"
              (focus)="showDropdown = true"
            />
            @if (searchQuery) {
              <button type="button" class="text-gray-400 hover:text-gray-600 ml-1" (click)="clearSearch()">
                <mat-icon class="!text-[18px]">close</mat-icon>
              </button>
            }
          </div>

          <!-- Search dropdown -->
          @if (showDropdown && searchQuery.length >= 2) {
            <div class="search-dropdown absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto border border-gray-200">
              @if (searchLoading) {
                <div class="flex justify-center py-4">
                  <mat-spinner diameter="24" />
                </div>
              } @else if (autocompleteResults.products.length > 0 || autocompleteResults.categories.length > 0) {
                @if (autocompleteResults.categories.length > 0) {
                  <div class="px-4 py-2 bg-gray-50 border-b">
                    <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{{ 'nav.catalog' | translate }}</p>
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
                <div class="px-4 py-2 bg-gray-50 border-t">
                  <button
                    type="button"
                    class="w-full text-sm text-blue-600 hover:text-blue-800 font-medium py-1"
                    (click)="goToSearch()"
                  >
                    {{ 'common.see_more' | translate }} "{{ searchQuery }}"
                  </button>
                </div>
              } @else if (!searchLoading) {
                <div class="px-4 py-6 text-center text-sm text-gray-500">
                  {{ 'catalog.no_results' | translate }}
                </div>
              }
            </div>
          }
        </div>

        <!-- Right actions -->
        <div class="flex items-center gap-1 sm:gap-2 shrink-0 ml-auto">
          <!-- Mobile search toggle -->
          <button type="button" class="sm:hidden p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100" (click)="mobileSearchOpen = !mobileSearchOpen">
            <mat-icon>search</mat-icon>
          </button>

          <!-- Language selector -->
          <button mat-icon-button [matMenuTriggerFor]="langMenu" class="text-gray-600" [title]="'Idioma'">
            <span class="text-xs font-bold">{{ i18nService.lang() | uppercase }}</span>
          </button>
          <mat-menu #langMenu="matMenu">
            @for (lang of i18nService.availableLanguages(); track lang.iso_code) {
              <button mat-menu-item (click)="changeLang(lang.iso_code)">
                @if (lang.flag) {
                  <span class="mr-2">{{ lang.flag }}</span>
                }
                <span>{{ lang.name }}</span>
              </button>
            }
          </mat-menu>

          <!-- Currency selector -->
          @if (currencyService.availableCurrencies().length > 1) {
            <button mat-icon-button [matMenuTriggerFor]="currencyMenu" class="text-gray-600" [title]="'Divisa'">
              <span class="text-xs font-bold">{{ currencyService.currentCurrency()?.iso_code ?? 'EUR' }}</span>
            </button>
            <mat-menu #currencyMenu="matMenu">
              @for (currency of currencyService.availableCurrencies(); track currency.id) {
                <button mat-menu-item (click)="currencyService.setCurrency(currency)">
                  <span class="mr-2">{{ currency.symbol }}</span>
                  <span>{{ currency.name }} ({{ currency.iso_code }})</span>
                </button>
              }
            </mat-menu>
          }

          <a routerLink="/cart" class="relative p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100">
            <mat-icon
              [matBadge]="cartService.itemCount() || null"
              matBadgeColor="warn"
              matBadgeSize="small"
            >
              shopping_cart
            </mat-icon>
          </a>

          @if (authService.isAuthenticated()) {
            <a routerLink="/account/wishlist" [title]="'nav.wishlist' | translate" class="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100">
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
            <button mat-icon-button [matMenuTriggerFor]="userMenu" class="text-gray-600">
              <mat-icon>person</mat-icon>
            </button>
            <mat-menu #userMenu="matMenu">
              <span class="px-4 py-2 text-sm text-gray-500 block">
                {{ authService.user()?.firstName }} {{ authService.user()?.lastName }}
              </span>
              <a mat-menu-item routerLink="/account">
                <mat-icon>account_circle</mat-icon>
                <span>{{ 'account.profile' | translate }}</span>
              </a>
              <a mat-menu-item routerLink="/account/orders">
                <mat-icon>receipt_long</mat-icon>
                <span>{{ 'account.orders' | translate }}</span>
              </a>
              <button mat-menu-item (click)="authService.logout()">
                <mat-icon>logout</mat-icon>
                <span>{{ 'account.logout' | translate }}</span>
              </button>
            </mat-menu>
          } @else {
            <a routerLink="/auth/login" class="hidden sm:inline-flex text-sm text-gray-700 hover:text-gray-900 font-medium whitespace-nowrap px-3 py-2 rounded-lg hover:bg-gray-100 transition">{{ 'account.login' | translate }}</a>
            <a routerLink="/auth/register" class="text-sm bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition whitespace-nowrap">{{ 'account.register' | translate }}</a>
          }
        </div>
      </nav>

      <!-- Mobile search bar -->
      @if (mobileSearchOpen) {
        <div class="sm:hidden px-4 pb-3" #searchContainer>
          <div class="flex items-center bg-gray-100 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500 rounded-full px-4 py-2">
            <mat-icon class="text-gray-400 mr-2 shrink-0 !text-[20px]">search</mat-icon>
            <input
              type="text"
              class="bg-transparent text-gray-900 placeholder-gray-400 outline-none w-full text-sm"
              [placeholder]="'common.search' | translate"
              [(ngModel)]="searchQuery"
              (ngModelChange)="onSearchInput($event)"
              (keydown.enter)="goToSearch()"
              (focus)="showDropdown = true"
            />
          </div>
        </div>
      }
    </header>
  `,
  styles: [
    `
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
  readonly i18nService = inject(I18nService);
  readonly currencyService = inject(CurrencyService);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly el = inject(ElementRef);

  searchQuery = '';
  autocompleteResults: { products: any[]; categories: any[] } = { products: [], categories: [] };
  searchLoading = false;
  showDropdown = false;
  mobileSearchOpen = false;

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
            catchError(() => of(null)),
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

  async changeLang(iso_code: string): Promise<void> {
    await this.i18nService.setLanguage(iso_code);
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
