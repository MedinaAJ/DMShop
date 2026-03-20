import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ReviewService, ReviewStats } from '../../core/services/review.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { SeoService } from '../../core/seo.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatFormFieldModule,
    MatTableModule,
    MatInputModule,
    CurrencyPipe,
    DatePipe,
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
                [src]="selectedImage || getImageUrl(getCoverImage(product.images))"
                [alt]="productName"
                class="w-full rounded-lg shadow-md object-cover aspect-square"
              />
              @if (product.images.length > 1) {
                <div class="flex gap-2 mt-4 overflow-x-auto pb-1">
                  @for (img of product.images; track img.id) {
                    <img
                      [src]="getImageUrl(img.path)"
                      [alt]="productName"
                      (click)="selectedImage = getImageUrl(img.path)"
                      class="w-20 h-20 rounded cursor-pointer object-cover border-2 transition-colors shrink-0"
                      [class.border-blue-500]="selectedImage === getImageUrl(img.path) || (!selectedImage && img.cover)"
                      [class.border-transparent]="selectedImage !== getImageUrl(img.path) && (selectedImage || !img.cover)"
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
              <div class="mb-6">
                @if (activeSpecificPrice) {
                  <div class="flex items-center gap-3">
                    <p class="text-3xl font-bold text-blue-600">
                      {{ discountedPrice | currency: 'EUR' }}
                    </p>
                    <p class="text-xl text-gray-400 line-through">
                      {{ product.price | currency: 'EUR' }}
                    </p>
                    <span class="bg-red-100 text-red-700 text-sm font-semibold px-2 py-1 rounded">
                      {{ discountLabel }}
                    </span>
                  </div>
                } @else {
                  <p class="text-3xl font-bold text-blue-600">
                    {{ product.price | currency: 'EUR' }}
                  </p>
                }
              </div>
            }

            @if (product.quantity > 0) {
              @if (product.quantity <= 5) {
                <p class="text-orange-500 mb-2 flex items-center gap-1">
                  <mat-icon class="!text-base">warning</mat-icon>
                  Últimas unidades ({{ product.quantity }})
                </p>
              } @else {
                <p class="text-green-600 mb-2 flex items-center gap-1">
                  <mat-icon class="!text-base">check_circle</mat-icon>
                  En stock
                </p>
              }
            } @else {
              <p class="text-red-500 mb-2 flex items-center gap-1">
                <mat-icon class="!text-base">cancel</mat-icon>
                Agotado
              </p>
            }

            @if (effectiveStock <= 0 && product.availableForOrder !== false) {
              <!-- Back-in-stock notification -->
              @if (!stockAlertSent) {
                <div class="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                  <p class="text-sm text-orange-800 font-medium mb-2">🔔 Notificarme cuando esté disponible</p>
                  <div class="flex gap-2">
                    <input
                      type="email"
                      class="flex-1 border rounded px-3 py-1.5 text-sm"
                      placeholder="tu@email.com"
                      [(ngModel)]="stockAlertEmail"
                    />
                    <button mat-stroked-button color="accent" (click)="subscribeStockAlert()" [disabled]="stockAlertLoading">
                      {{ stockAlertLoading ? '...' : 'Avisar' }}
                    </button>
                  </div>
                </div>
              } @else {
                <p class="text-green-600 text-sm mb-4">✅ Te avisaremos cuando el producto esté disponible.</p>
              }
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
                  [disabled]="qty >= effectiveStock"
                >
                  <mat-icon>add</mat-icon>
                </button>
              </div>
              <button
                mat-flat-button
                color="primary"
                (click)="addToCart()"
                [disabled]="!product.availableForOrder || effectiveStock <= 0 || addingToCart"
                class="!px-8"
              >
                <mat-icon>add_shopping_cart</mat-icon>
                {{ effectiveStock <= 0 ? 'Agotado' : 'Añadir al carrito' }}
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

        <!-- Combinations selector -->
        @if (combinations.length) {
          <div class="mt-8 bg-gray-50 rounded-lg p-6">
            <h3 class="text-lg font-semibold mb-4">Opciones disponibles</h3>
            <div class="flex flex-wrap gap-4">
              @for (group of attributeGroups; track group.name) {
                <mat-form-field appearance="outline" class="min-w-[180px]">
                  <mat-label>{{ group.name }}</mat-label>
                  <mat-select
                    [(ngModel)]="group.selectedValueId"
                    name="attr_{{ group.name }}"
                    (selectionChange)="onCombinationSelect()"
                  >
                    @for (val of group.values; track val.id) {
                      <mat-option [value]="val.id">{{ val.name }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
              }
            </div>
            @if (selectedCombination) {
              <div class="mt-3 flex items-center gap-4">
                @if (selectedCombination.price_impact) {
                  <span class="text-lg font-semibold text-blue-600">
                    {{ product.price + selectedCombination.price_impact | currency: 'EUR' }}
                  </span>
                }
                @if (selectedCombination.quantity > 5) {
                  <span class="flex items-center gap-1 text-sm text-green-600">
                    <mat-icon class="!text-sm">check_circle</mat-icon> En stock
                  </span>
                } @else if (selectedCombination.quantity > 0) {
                  <span class="flex items-center gap-1 text-sm text-orange-500">
                    <mat-icon class="!text-sm">warning</mat-icon> Últimas unidades ({{ selectedCombination.quantity }})
                  </span>
                } @else {
                  <span class="flex items-center gap-1 text-sm text-red-500">
                    <mat-icon class="!text-sm">cancel</mat-icon> Agotado
                  </span>
                }
                @if (selectedCombination.reference) {
                  <span class="text-sm text-gray-400"
                    >Ref: {{ selectedCombination.reference }}</span
                  >
                }
              </div>
            }
          </div>
        }

        <!-- Features table -->
        @if (productFeatures.length) {
          <div class="mt-8">
            <h3 class="text-lg font-semibold mb-4">Características</h3>
            <table mat-table [dataSource]="productFeatures" class="w-full shadow-sm rounded-lg">
              <ng-container matColumnDef="feature">
                <th mat-header-cell *matHeaderCellDef class="!font-semibold">Característica</th>
                <td mat-cell *matCellDef="let row">{{ row.featureName }}</td>
              </ng-container>
              <ng-container matColumnDef="value">
                <th mat-header-cell *matHeaderCellDef class="!font-semibold">Valor</th>
                <td mat-cell *matCellDef="let row">{{ row.valueName }}</td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="['feature', 'value']"></tr>
              <tr
                mat-row
                *matRowDef="let row; columns: ['feature', 'value']"
                class="even:bg-gray-50"
              ></tr>
            </table>
          </div>
        }

        <!-- Reviews section -->
        <div class="mt-10 border-t pt-8">
          <h3 class="text-2xl font-bold mb-6">Reseñas de clientes</h3>

          @if (reviewsLoading()) {
            <mat-spinner diameter="32" />
          } @else if (reviewStats()) {
            <!-- Rating summary -->
            <div class="flex flex-col sm:flex-row gap-6 mb-8">
              <div class="text-center">
                <div class="text-5xl font-bold text-blue-600">{{ reviewStats()!.avgRating }}</div>
                <div class="flex justify-center my-1">
                  @for (star of [1,2,3,4,5]; track star) {
                    <mat-icon class="!text-xl" [class.text-yellow-400]="star <= reviewStats()!.avgRating" [class.text-gray-200]="star > reviewStats()!.avgRating">
                      star
                    </mat-icon>
                  }
                </div>
                <div class="text-sm text-gray-500">{{ reviewStats()!.totalReviews }} reseñas</div>
              </div>
              <div class="flex-1 space-y-1">
                @for (star of [5,4,3,2,1]; track star) {
                  <div class="flex items-center gap-2 text-sm">
                    <span class="w-4 text-right text-gray-600">{{ star }}</span>
                    <mat-icon class="!text-sm text-yellow-400">star</mat-icon>
                    <div class="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        class="bg-yellow-400 h-2 rounded-full transition-all"
                        [style.width.%]="reviewStats()!.totalReviews > 0 ? (reviewStats()!.distribution[star] / reviewStats()!.totalReviews * 100) : 0"
                      ></div>
                    </div>
                    <span class="w-6 text-gray-500">{{ reviewStats()!.distribution[star] ?? 0 }}</span>
                  </div>
                }
              </div>
            </div>

            <!-- Review list -->
            @if (reviewStats()!.reviews.length === 0) {
              <p class="text-gray-500 italic">Todavía no hay reseñas para este producto.</p>
            } @else {
              <div class="space-y-4 mb-8">
                @for (review of reviewStats()!.reviews; track review.id) {
                  <div class="bg-gray-50 rounded-lg p-4">
                    <div class="flex items-center gap-2 mb-1">
                      @for (star of [1,2,3,4,5]; track star) {
                        <mat-icon class="!text-sm" [class.text-yellow-400]="star <= review.rating" [class.text-gray-200]="star > review.rating">star</mat-icon>
                      }
                      <span class="font-semibold ml-1">{{ review.user.firstName }}</span>
                      <span class="text-gray-400 text-sm ml-auto">{{ review.created_at | date: 'dd/MM/yyyy' }}</span>
                    </div>
                    <h4 class="font-semibold text-gray-800">{{ review.title }}</h4>
                    <p class="text-gray-600 text-sm mt-1">{{ review.content }}</p>
                  </div>
                }
              </div>
            }
          }

          <!-- Review form -->
          @if (authService.isAuthenticated()) {
            @if (reviewSubmitted()) {
              <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-700">
                <mat-icon class="align-middle mr-2">check_circle</mat-icon>
                Tu reseña está pendiente de aprobación. ¡Gracias por tu opinión!
              </div>
            } @else {
              <div class="bg-white border border-gray-200 rounded-lg p-6">
                <h4 class="text-lg font-semibold mb-4">Deja tu reseña</h4>
                <div class="flex gap-1 mb-4">
                  @for (star of [1,2,3,4,5]; track star) {
                    <button type="button" (click)="reviewRating.set(star)">
                      <mat-icon [class.text-yellow-400]="star <= reviewRating()" [class.text-gray-300]="star > reviewRating()">star</mat-icon>
                    </button>
                  }
                </div>
                <mat-form-field appearance="outline" class="w-full mb-3">
                  <mat-label>Título</mat-label>
                  <input matInput [(ngModel)]="reviewTitle" maxlength="128" placeholder="Resume tu experiencia" />
                </mat-form-field>
                <mat-form-field appearance="outline" class="w-full mb-4">
                  <mat-label>Comentario</mat-label>
                  <textarea matInput [(ngModel)]="reviewContent" rows="4" placeholder="Comparte tu experiencia con el producto..."></textarea>
                </mat-form-field>
                <button
                  mat-flat-button
                  color="primary"
                  [disabled]="reviewRating() === 0 || !reviewTitle.trim() || !reviewContent.trim() || reviewSubmitting()"
                  (click)="submitReview()"
                >
                  @if (reviewSubmitting()) {
                    <mat-spinner diameter="20" class="inline-block mr-2" />
                  }
                  Enviar reseña
                </button>
              </div>
            }
          } @else {
            <p class="text-sm text-gray-500 mt-4">
              <a routerLink="/auth/login" class="text-blue-600 hover:underline">Inicia sesión</a> para dejar una reseña.
            </p>
          }
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
  private readonly api = inject(ApiService);
  readonly authService = inject(AuthService);
  private readonly reviewService = inject(ReviewService);
  readonly wishlistService = inject(WishlistService);
  private readonly seoService = inject(SeoService);

  product: any = null;
  loading = true;
  qty = 1;
  selectedImage: string | null = null;
  addingToCart = false;
  stockAlertEmail = '';
  stockAlertLoading = false;
  stockAlertSent = false;

  combinations: any[] = [];
  attributeGroups: Array<{
    name: string;
    values: Array<{ id: number; name: string }>;
    selectedValueId: number | null;
  }> = [];
  selectedCombination: any = null;
  productFeatures: Array<{ featureName: string; valueName: string }> = [];

  // Reviews
  readonly reviewStats = signal<ReviewStats | null>(null);
  readonly reviewsLoading = signal(false);
  readonly reviewRating = signal(0);
  readonly reviewSubmitted = signal(false);
  readonly reviewSubmitting = signal(false);
  reviewTitle = '';
  reviewContent = '';

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

  /** Stock efectivo: usa la combinación si está seleccionada, sino el producto */
  get effectiveStock(): number {
    if (this.selectedCombination) return this.selectedCombination.quantity;
    return this.product?.quantity ?? 0;
  }

  /** Active specific price for current product (no combination, qty=1) */
  get activeSpecificPrice(): any | null {
    const prices: any[] = this.product?.specificPrices ?? [];
    if (!prices.length) return null;
    // Find best price for qty=1, no combination filter
    const eligible = prices.filter((sp: any) => sp.from_quantity <= 1 && !sp.id_combination);
    if (!eligible.length) return null;
    return eligible[0];
  }

  /** Discounted price based on active specific price */
  get discountedPrice(): number {
    const sp = this.activeSpecificPrice;
    const base = Number(this.product?.price ?? 0);
    if (!sp) return base;
    if (sp.price >= 0) return sp.price;
    if (sp.reduction_type === 'percentage') {
      return Math.round(base * (1 - sp.reduction / 100) * 100) / 100;
    }
    return Math.max(0, Math.round((base - sp.reduction) * 100) / 100);
  }

  /** Human-readable discount label */
  get discountLabel(): string {
    const sp = this.activeSpecificPrice;
    if (!sp) return '';
    if (sp.price >= 0) return 'Precio especial';
    if (sp.reduction_type === 'percentage') return `-${sp.reduction}%`;
    return `-${sp.reduction} €`;
  }

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const id = +params['id'];
      this.loading = true;
      this.productService.getById(id).subscribe({
        next: (product) => {
          this.product = product;
          this.loading = false;
          this.loadSubResources(id);
          this.loadReviews(id);
          // SEO meta tags
          const translations = product?.translations || {};
          const langKey = Object.keys(translations)[0];
          const trans = langKey ? translations[langKey] : null;
          const coverImg = product?.images?.find((img: any) => img.cover);
          const imageUrl = coverImg
            ? this.getImageUrl(coverImg.path)
            : undefined;
          this.seoService.setProductMeta({
            name: trans?.name ?? 'Producto',
            description: trans?.descriptionShort ?? trans?.description ?? null,
            image: imageUrl,
            url: typeof window !== 'undefined' ? window.location.href : undefined,
          });
        },
        error: () => {
          this.product = null;
          this.loading = false;
        },
      });
    });
  }

  private loadSubResources(id: number): void {
    this.api.get<any>(`/products/${id}/combinations`).subscribe((r) => {
      this.combinations = r.data || [];
      this.buildAttributeGroups();
    });
    this.api.get<any>(`/products/${id}/features`).subscribe((r) => {
      this.productFeatures = (r.data || []).map((pf: any) => ({
        featureName: pf.feature?.translations?.[0]?.name || `#${pf.id_feature}`,
        valueName:
          pf.featureValue?.translations?.[0]?.value ||
          pf.featureValue?.translations?.[0]?.name ||
          '',
      }));
    });
  }

  private async loadReviews(productId: number): Promise<void> {
    this.reviewsLoading.set(true);
    try {
      const stats = await this.reviewService.getProductReviews(productId);
      this.reviewStats.set(stats);
    } catch {
      // ignore
    } finally {
      this.reviewsLoading.set(false);
    }
  }

  async submitReview(): Promise<void> {
    if (!this.product) return;
    this.reviewSubmitting.set(true);
    try {
      await this.reviewService.submitReview(this.product.id, {
        rating: this.reviewRating(),
        title: this.reviewTitle,
        content: this.reviewContent,
      });
      this.reviewSubmitted.set(true);
    } catch {
      this.snackBar.open('Error al enviar la reseña', 'Cerrar', { duration: 3000 });
    } finally {
      this.reviewSubmitting.set(false);
    }
  }

  private buildAttributeGroups(): void {
    const groupMap = new Map<string, Map<number, string>>();
    for (const comb of this.combinations) {
      for (const av of comb.attributeValues || []) {
        const groupName = av.attribute?.translations?.[0]?.name || `Attr #${av.id_attribute}`;
        if (!groupMap.has(groupName)) groupMap.set(groupName, new Map());
        const valName = av.translations?.[0]?.name || `#${av.id}`;
        groupMap.get(groupName)!.set(av.id, valName);
      }
    }
    this.attributeGroups = Array.from(groupMap.entries()).map(([name, valuesMap]) => ({
      name,
      values: Array.from(valuesMap.entries()).map(([id, n]) => ({ id, name: n })),
      selectedValueId: null,
    }));
  }

  onCombinationSelect(): void {
    const selectedIds = new Set(
      this.attributeGroups.filter((g) => g.selectedValueId !== null).map((g) => g.selectedValueId),
    );
    if (selectedIds.size < this.attributeGroups.length) {
      this.selectedCombination = null;
      return;
    }
    this.selectedCombination =
      this.combinations.find((c) => {
        const combValueIds = new Set((c.attributeValues || []).map((av: any) => av.id));
        return (
          selectedIds.size === combValueIds.size &&
          [...selectedIds].every((id) => combValueIds.has(id))
        );
      }) || null;
  }

  increaseQty(): void {
    if (this.qty < this.effectiveStock) this.qty++;
  }

  getImageUrl(path: string): string {
    if (path.startsWith('http')) return path;
    return environment.apiUrl.replace('/api/v1', '') + '/' + path.replace(/^\//, '');
  }

  getCoverImage(images: Array<{ id: number; path: string; cover: boolean }>): string {
    const cover = images.find((img) => img.cover);
    return cover ? cover.path : images[0]?.path || '';
  }

  decreaseQty(): void {
    if (this.qty > 1) this.qty--;
  }

  async subscribeStockAlert(): Promise<void> {
    if (!this.stockAlertEmail) return;
    this.stockAlertLoading = true;
    try {
      await fetch(`/api/products/${this.product.id}/stock-alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: this.stockAlertEmail }),
      });
      this.stockAlertSent = true;
      this.snackBar.open('¡Te avisaremos cuando el producto esté disponible!', 'OK', { duration: 3000 });
    } catch {
      this.snackBar.open('Error al suscribirse. Inténtalo de nuevo.', 'Cerrar', { duration: 3000 });
    } finally {
      this.stockAlertLoading = false;
    }
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
