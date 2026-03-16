import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CurrencyPipe } from '@angular/common';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    CurrencyPipe,
  ],
  template: `
    @if (loading) {
      <div class="flex justify-center py-20">
        <mat-spinner diameter="48" />
      </div>
    } @else if (product) {
      <div class="max-w-7xl mx-auto px-4 py-8">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <!-- Images -->
          <div>
            @if (product.images?.length) {
              <img
                [src]="selectedImage || product.images[0].path"
                [alt]="productName"
                class="w-full rounded-lg shadow-md object-cover aspect-square"
              />
              @if (product.images.length > 1) {
                <div class="flex gap-2 mt-4 overflow-x-auto">
                  @for (img of product.images; track img.id) {
                    <img
                      [src]="img.path"
                      [alt]="productName"
                      (click)="selectedImage = img.path"
                      class="w-20 h-20 rounded cursor-pointer object-cover border-2 transition-colors"
                      [class.border-blue-500]="selectedImage === img.path"
                      [class.border-transparent]="selectedImage !== img.path"
                    />
                  }
                </div>
              }
            } @else {
              <div
                class="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center"
              >
                <mat-icon class="!text-6xl text-gray-300">image</mat-icon>
              </div>
            }
          </div>

          <!-- Info -->
          <div>
            <h1 class="text-3xl font-bold mb-2">{{ productName }}</h1>

            @if (product.manufacturerName) {
              <p class="text-gray-500 mb-4">{{ product.manufacturerName }}</p>
            }

            @if (product.showPrice) {
              <p class="text-3xl font-bold text-blue-600 mb-6">
                {{ product.price | currency: 'EUR' }}
              </p>
            }

            @if (product.quantity > 0) {
              <p class="text-green-600 mb-2">
                <mat-icon class="!text-base align-middle">check_circle</mat-icon>
                En stock
              </p>
            } @else {
              <p class="text-red-500 mb-2">
                <mat-icon class="!text-base align-middle">cancel</mat-icon>
                Agotado
              </p>
            }

            @if (product.reference) {
              <p class="text-sm text-gray-400 mb-4">Ref: {{ product.reference }}</p>
            }

            <div class="flex items-center gap-4 mb-6">
              <div class="flex items-center border rounded">
                <button mat-icon-button (click)="decreaseQty()" [disabled]="qty <= 1">
                  <mat-icon>remove</mat-icon>
                </button>
                <span class="px-4 font-semibold">{{ qty }}</span>
                <button
                  mat-icon-button
                  (click)="increaseQty()"
                  [disabled]="qty >= product.quantity"
                >
                  <mat-icon>add</mat-icon>
                </button>
              </div>
              <button
                mat-flat-button
                color="primary"
                (click)="addToCart()"
                [disabled]="!product.availableForOrder || product.quantity <= 0 || addingToCart"
                class="!px-8"
              >
                <mat-icon>add_shopping_cart</mat-icon>
                Añadir al carrito
              </button>
            </div>

            <!-- Description -->
            @if (productDescription) {
              <div class="prose max-w-none mt-6">
                <h3 class="text-lg font-semibold mb-2">Descripción</h3>
                <div [innerHTML]="productDescription"></div>
              </div>
            }
          </div>
        </div>
      </div>
    } @else {
      <div class="max-w-7xl mx-auto px-4 py-20 text-center">
        <mat-icon class="!text-6xl text-gray-300 mb-4">search_off</mat-icon>
        <h2 class="text-xl font-semibold mb-2">Producto no encontrado</h2>
        <a mat-button routerLink="/catalog">Volver al catálogo</a>
      </div>
    }
  `,
})
export class ProductDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);
  private readonly cartService = inject(CartService);
  private readonly snackBar = inject(MatSnackBar);

  product: any = null;
  loading = true;
  qty = 1;
  selectedImage: string | null = null;
  addingToCart = false;

  get productName(): string {
    if (!this.product?.translations) return '';
    const lang = Object.keys(this.product.translations)[0];
    return lang ? this.product.translations[lang].name : '';
  }

  get productDescription(): string {
    if (!this.product?.translations) return '';
    const lang = Object.keys(this.product.translations)[0];
    return lang ? this.product.translations[lang].description || '' : '';
  }

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const id = +params['id'];
      this.loading = true;
      this.productService.getById(id).subscribe({
        next: (product) => {
          this.product = product;
          this.loading = false;
        },
        error: () => {
          this.product = null;
          this.loading = false;
        },
      });
    });
  }

  increaseQty(): void {
    if (this.qty < this.product.quantity) this.qty++;
  }

  decreaseQty(): void {
    if (this.qty > 1) this.qty--;
  }

  async addToCart(): Promise<void> {
    this.addingToCart = true;
    try {
      await this.cartService.addItem(this.product.id, this.qty);
      this.snackBar
        .open('Producto añadido al carrito', 'Ver carrito', { duration: 3000 })
        .onAction()
        .subscribe(() => {
          // Navigation would need router injection in snackbar - left simple
        });
    } catch {
      this.snackBar.open('Error al añadir al carrito', 'Cerrar', { duration: 3000 });
    } finally {
      this.addingToCart = false;
    }
  }
}
