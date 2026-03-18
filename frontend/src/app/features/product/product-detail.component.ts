import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTableModule } from '@angular/material/table';
import { CurrencyPipe } from '@angular/common';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { ApiService } from '../../core/services/api.service';
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
                <span
                  class="text-sm"
                  [class.text-green-600]="selectedCombination.quantity > 0"
                  [class.text-red-500]="selectedCombination.quantity <= 0"
                >
                  {{
                    selectedCombination.quantity > 0
                      ? 'En stock (' + selectedCombination.quantity + ')'
                      : 'Agotado'
                  }}
                </span>
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

  product: any = null;
  loading = true;
  qty = 1;
  selectedImage: string | null = null;
  addingToCart = false;

  combinations: any[] = [];
  attributeGroups: Array<{
    name: string;
    values: Array<{ id: number; name: string }>;
    selectedValueId: number | null;
  }> = [];
  selectedCombination: any = null;
  productFeatures: Array<{ featureName: string; valueName: string }> = [];

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
          this.loadSubResources(id);
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
    if (this.qty < this.product.quantity) this.qty++;
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
