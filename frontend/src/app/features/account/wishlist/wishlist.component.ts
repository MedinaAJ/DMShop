import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { WishlistService } from '../../../core/services/wishlist.service';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-wishlist',
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
    <div>
      <h2 class="text-xl font-semibold mb-4">Mi lista de deseos</h2>

      @if (wishlistService.loading()) {
        <div class="flex justify-center py-10">
          <mat-spinner diameter="40" />
        </div>
      } @else if (!wishlistService.wishlist() || wishlistService.wishlist()!.items.length === 0) {
        <div class="text-center py-10 text-gray-500">
          <mat-icon class="!text-5xl mb-3 text-gray-300">favorite_border</mat-icon>
          <p class="text-lg">Tu lista de deseos está vacía</p>
          <a mat-flat-button color="primary" routerLink="/catalog" class="mt-4">
            Ver catálogo
          </a>
        </div>
      } @else {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (item of wishlistService.wishlist()!.items; track item.id_product) {
            <div class="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
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
                  <h3 class="font-medium text-gray-900 mb-1 line-clamp-2">{{ item.product.name }}</h3>
                </a>
                <p class="text-blue-600 font-bold text-lg mb-2">
                  {{ item.product.price | currency: 'EUR' }}
                </p>
                <p class="text-sm mb-3" [class.text-green-600]="item.product.quantity > 0" [class.text-red-500]="item.product.quantity === 0">
                  {{ item.product.quantity > 0 ? 'En stock' : 'Sin stock' }}
                </p>
                <div class="flex gap-2">
                  <button
                    mat-flat-button
                    color="primary"
                    class="flex-1 text-sm"
                    [disabled]="item.product.quantity === 0 || addingToCart() === item.id_product"
                    (click)="addToCart(item.id_product)"
                  >
                    @if (addingToCart() === item.id_product) {
                      <mat-spinner diameter="16" class="inline-block" />
                    } @else {
                      <mat-icon class="text-sm mr-1">shopping_cart</mat-icon>
                      Añadir
                    }
                  </button>
                  <button
                    mat-icon-button
                    color="warn"
                    (click)="removeFromWishlist(item.id_product)"
                    [disabled]="removing() === item.id_product"
                    title="Eliminar de la lista"
                  >
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class WishlistComponent implements OnInit {
  readonly wishlistService = inject(WishlistService);
  private readonly cartService = inject(CartService);
  private readonly snackBar = inject(MatSnackBar);

  readonly addingToCart = signal<number | null>(null);
  readonly removing = signal<number | null>(null);

  async ngOnInit() {
    await this.wishlistService.load();
  }

  async addToCart(productId: number) {
    this.addingToCart.set(productId);
    try {
      await this.cartService.addItem(productId, 1);
      this.snackBar.open('Producto añadido al carrito', 'OK', { duration: 2000 });
    } catch {
      this.snackBar.open('Error al añadir al carrito', 'OK', { duration: 3000 });
    } finally {
      this.addingToCart.set(null);
    }
  }

  async removeFromWishlist(productId: number) {
    this.removing.set(productId);
    try {
      await this.wishlistService.removeItem(productId);
      this.snackBar.open('Eliminado de la lista de deseos', 'OK', { duration: 2000 });
    } finally {
      this.removing.set(null);
    }
  }
}
