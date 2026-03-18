import { Component, Input, inject, signal, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CurrencyPipe } from '@angular/common';
import { WishlistService } from '../../../core/services/wishlist.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [RouterLink, MatCardModule, MatButtonModule, MatIconModule, MatTooltipModule, CurrencyPipe],
  template: `
    <mat-card class="h-full flex flex-col hover:shadow-lg transition-shadow">
      <a [routerLink]="['/product', product.id]" class="block relative">
        @if (product.coverImage) {
          <img
            mat-card-image
            [src]="product.coverImage"
            [alt]="product.name"
            class="object-cover aspect-[4/3]"
          />
        } @else {
          <div class="aspect-[4/3] bg-gray-100 flex items-center justify-center">
            <mat-icon class="!text-4xl text-gray-300">image</mat-icon>
          </div>
        }
        <!-- Stock badge -->
        @if (product.quantity === 0) {
          <span class="absolute top-2 left-2 bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded">
            Agotado
          </span>
        } @else if (product.quantity <= 5) {
          <span class="absolute top-2 left-2 bg-orange-400 text-white text-xs font-semibold px-2 py-0.5 rounded">
            Últimas unidades
          </span>
        }
        <!-- Wishlist button -->
        <button
          mat-icon-button
          class="!absolute top-1 right-1 !bg-white/80 hover:!bg-white transition-colors"
          [matTooltip]="inWishlist() ? 'Quitar de lista de deseos' : 'Añadir a lista de deseos'"
          (click)="toggleWishlist($event)"
        >
          <mat-icon [class.text-red-500]="inWishlist()" [class.text-gray-400]="!inWishlist()">
            {{ inWishlist() ? 'favorite' : 'favorite_border' }}
          </mat-icon>
        </button>
      </a>
      <mat-card-content class="flex-1 pt-4">
        @if (product.categoryName) {
          <p class="text-xs text-gray-400 uppercase tracking-wide mb-1">
            {{ product.categoryName }}
          </p>
        }
        <a
          [routerLink]="['/product', product.id]"
          class="font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2 block"
        >
          {{ product.name }}
        </a>
        @if (product.descriptionShort) {
          <p class="text-sm text-gray-500 mt-1 line-clamp-2">{{ product.descriptionShort }}</p>
        }
      </mat-card-content>
      <mat-card-actions class="flex items-center justify-between px-4 pb-4">
        <span class="text-lg font-bold text-blue-600">{{ product.price | currency: 'EUR' }}</span>
        <a mat-mini-fab color="primary" [routerLink]="['/product', product.id]">
          <mat-icon>visibility</mat-icon>
        </a>
      </mat-card-actions>
    </mat-card>
  `,
})
export class ProductCardComponent implements OnInit {
  @Input({ required: true }) product!: {
    id: number;
    name: string;
    price: number;
    quantity: number;
    coverImage: string | null;
    descriptionShort: string | null;
    categoryName: string | null;
  };

  private readonly wishlistService = inject(WishlistService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly inWishlist = signal(false);

  ngOnInit() {
    this.inWishlist.set(this.wishlistService.isInWishlist(this.product.id));
  }

  async toggleWishlist(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: this.router.url },
      });
      return;
    }

    await this.wishlistService.toggle(this.product.id);
    this.inWishlist.set(this.wishlistService.isInWishlist(this.product.id));
  }
}
