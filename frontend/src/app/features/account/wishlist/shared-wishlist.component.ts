import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { WishlistService, WishlistData } from '../../../core/services/wishlist.service';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-shared-wishlist',
  standalone: true,
  imports: [
    RouterLink,
    CurrencyPipe,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="max-w-5xl mx-auto px-4 py-8">
      @if (loading()) {
        <div class="flex justify-center py-20"><mat-spinner diameter="48" /></div>
      } @else if (error()) {
        <div class="text-center py-20 text-gray-500">
          <mat-icon class="!text-6xl text-gray-300 mb-4">link_off</mat-icon>
          <h2 class="text-xl font-semibold mb-2">Lista no encontrada</h2>
          <p class="text-sm text-gray-400 mb-4">El enlace puede haber expirado o ser incorrecto.</p>
          <a mat-flat-button color="primary" routerLink="/catalog">Ver catálogo</a>
        </div>
      } @else if (wishlist()) {
        <div class="mb-6">
          <h1 class="text-2xl font-bold">{{ wishlist()!.name }}</h1>
          <p class="text-gray-500 text-sm mt-1">Lista de deseos compartida</p>
        </div>

        @if (wishlist()!.items.length === 0) {
          <div class="text-center py-10 text-gray-500">
            <mat-icon class="!text-5xl text-gray-300 mb-3">favorite_border</mat-icon>
            <p>Esta lista está vacía.</p>
          </div>
        } @else {
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            @for (item of wishlist()!.items; track item.id_product) {
              <div class="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <a [routerLink]="['/product', item.id_product]" class="block">
                  <div class="aspect-square bg-gray-50 overflow-hidden">
                    @if (item.product.coverImage) {
                      <img
                        [src]="item.product.coverImage"
                        [alt]="item.product.name"
                        class="w-full h-full object-cover hover:scale-105 transition-transform"
                      />
                    } @else {
                      <div class="w-full h-full flex items-center justify-center">
                        <mat-icon class="!text-5xl text-gray-200">image</mat-icon>
                      </div>
                    }
                  </div>
                </a>
                <div class="p-4">
                  <a [routerLink]="['/product', item.id_product]" class="hover:text-blue-600">
                    <h3 class="font-medium text-gray-900 mb-1 line-clamp-2 text-sm">{{ item.product.name }}</h3>
                  </a>
                  <p class="text-blue-600 font-bold text-lg mb-3">
                    {{ item.product.price | currency: 'EUR' }}
                  </p>
                  <button
                    mat-flat-button
                    color="primary"
                    class="w-full text-sm"
                    [disabled]="item.product.quantity === 0 || addingToCart() === item.id_product"
                    (click)="addToCart(item.id_product)"
                  >
                    @if (addingToCart() === item.id_product) {
                      <mat-spinner diameter="16" class="inline-block mr-1" />
                    } @else {
                      <mat-icon class="!text-sm mr-1">shopping_cart</mat-icon>
                    }
                    {{ item.product.quantity === 0 ? 'Agotado' : 'Añadir al carrito' }}
                  </button>
                </div>
              </div>
            }
          </div>
        }
      }
    </div>
  `,
})
export class SharedWishlistComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly wishlistService = inject(WishlistService);
  private readonly cartService = inject(CartService);
  private readonly snackBar = inject(MatSnackBar);

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly wishlist = signal<WishlistData | null>(null);
  readonly addingToCart = signal<number | null>(null);

  async ngOnInit() {
    const token = this.route.snapshot.params['token'];
    try {
      const data = await this.wishlistService.getShared(token);
      this.wishlist.set(data);
    } catch {
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  async addToCart(productId: number) {
    this.addingToCart.set(productId);
    try {
      await this.cartService.addItem(productId, 1);
      this.snackBar.open('Producto añadido al carrito', 'OK', { duration: 2000 });
    } catch {
      this.snackBar.open('Error al añadir al carrito', 'Cerrar', { duration: 3000 });
    } finally {
      this.addingToCart.set(null);
    }
  }
}
