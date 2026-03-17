import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { CurrencyPipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { environment } from '../../../../environments/environment';

interface TranslationData {
  name: string;
  slug: string;
  description: string;
  descriptionShort: string;
}

interface ProductData {
  price: number;
  quantity: number;
  reference: string;
  ean13: string;
  active: boolean;
  idCategoryDefault: number;
  idManufacturer: number | null;
  idSupplier: number | null;
  translations: { es: TranslationData; en: TranslationData; [key: string]: TranslationData };
}

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatCheckboxModule,
    MatChipsModule,
    CurrencyPipe,
  ],
  template: `
    <div class="flex items-center gap-4 mb-6">
      <a mat-icon-button routerLink="/products"><mat-icon>arrow_back</mat-icon></a>
      <h1 class="text-2xl font-bold">{{ isNew ? 'Nuevo producto' : 'Editar producto' }}</h1>
    </div>

    @if (loading) {
      <div class="flex justify-center py-12"><mat-spinner diameter="48" /></div>
    } @else {
      <mat-tab-group>
        <!-- TAB: Info básica -->
        <mat-tab label="Información">
          <form (ngSubmit)="onSubmit()" class="max-w-3xl space-y-6 pt-4">
            <mat-tab-group>
              <mat-tab label="Español">
                <div class="pt-4 space-y-4">
                  <mat-form-field appearance="outline" class="w-full">
                    <mat-label>Nombre</mat-label>
                    <input
                      matInput
                      [(ngModel)]="product.translations.es.name"
                      name="nameEs"
                      required
                    />
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="w-full">
                    <mat-label>Slug</mat-label>
                    <input
                      matInput
                      [(ngModel)]="product.translations.es.slug"
                      name="slugEs"
                      required
                    />
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="w-full">
                    <mat-label>Descripción corta</mat-label>
                    <textarea
                      matInput
                      [(ngModel)]="product.translations.es.descriptionShort"
                      name="descShortEs"
                      rows="3"
                    ></textarea>
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="w-full">
                    <mat-label>Descripción</mat-label>
                    <textarea
                      matInput
                      [(ngModel)]="product.translations.es.description"
                      name="descEs"
                      rows="6"
                    ></textarea>
                  </mat-form-field>
                </div>
              </mat-tab>
              <mat-tab label="English">
                <div class="pt-4 space-y-4">
                  <mat-form-field appearance="outline" class="w-full">
                    <mat-label>Name</mat-label>
                    <input matInput [(ngModel)]="product.translations.en.name" name="nameEn" />
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="w-full">
                    <mat-label>Slug</mat-label>
                    <input matInput [(ngModel)]="product.translations.en.slug" name="slugEn" />
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="w-full">
                    <mat-label>Short description</mat-label>
                    <textarea
                      matInput
                      [(ngModel)]="product.translations.en.descriptionShort"
                      name="descShortEn"
                      rows="3"
                    ></textarea>
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="w-full">
                    <mat-label>Description</mat-label>
                    <textarea
                      matInput
                      [(ngModel)]="product.translations.en.description"
                      name="descEn"
                      rows="6"
                    ></textarea>
                  </mat-form-field>
                </div>
              </mat-tab>
            </mat-tab-group>

            <div class="grid grid-cols-2 gap-4">
              <mat-form-field appearance="outline">
                <mat-label>Precio</mat-label>
                <input matInput type="number" [(ngModel)]="product.price" name="price" required />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Stock</mat-label>
                <input
                  matInput
                  type="number"
                  [(ngModel)]="product.quantity"
                  name="quantity"
                  required
                />
              </mat-form-field>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <mat-form-field appearance="outline">
                <mat-label>Referencia</mat-label>
                <input matInput [(ngModel)]="product.reference" name="reference" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>EAN-13</mat-label>
                <input matInput [(ngModel)]="product.ean13" name="ean13" />
              </mat-form-field>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <mat-form-field appearance="outline">
                <mat-label>Fabricante</mat-label>
                <mat-select [(ngModel)]="product.idManufacturer" name="idManufacturer">
                  <mat-option [value]="null">Ninguno</mat-option>
                  @for (m of manufacturers; track m.id) {
                    <mat-option [value]="m.id">{{ m.name }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Proveedor</mat-label>
                <mat-select [(ngModel)]="product.idSupplier" name="idSupplier">
                  <mat-option [value]="null">Ninguno</mat-option>
                  @for (s of suppliers; track s.id) {
                    <mat-option [value]="s.id">{{ s.name }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>

            <mat-slide-toggle [(ngModel)]="product.active" name="active" color="primary">
              Activo
            </mat-slide-toggle>

            <div class="flex gap-3 pt-4">
              <button mat-flat-button color="primary" type="submit" [disabled]="saving">
                @if (saving) {
                  <mat-spinner diameter="20" class="inline-block" />
                } @else {
                  {{ isNew ? 'Crear' : 'Guardar' }}
                }
              </button>
              <a mat-button routerLink="/products">Cancelar</a>
            </div>
          </form>
        </mat-tab>

        <!-- TAB: Imágenes -->
        @if (!isNew) {
          <mat-tab label="Imágenes">
            <div class="pt-4 max-w-3xl">
              <div class="flex flex-wrap gap-4 mb-6">
                @for (img of images; track img.id) {
                  <div class="relative group rounded-lg overflow-hidden shadow w-40 h-40">
                    <img [src]="getImageUrl(img.path)" class="w-full h-full object-cover" />
                    @if (img.cover) {
                      <span
                        class="absolute top-1 left-1 bg-blue-600 text-white text-xs px-2 py-0.5 rounded"
                        >Portada</span
                      >
                    }
                    <div
                      class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"
                    >
                      @if (!img.cover) {
                        <button mat-icon-button class="!text-white" (click)="setCover(img.id)">
                          <mat-icon>star</mat-icon>
                        </button>
                      }
                      <button mat-icon-button class="!text-white" (click)="removeImage(img.id)">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </div>
                  </div>
                }
              </div>
              <div>
                <input
                  type="file"
                  #fileInput
                  accept="image/*"
                  (change)="uploadImage($event)"
                  hidden
                />
                <button mat-flat-button color="primary" (click)="fileInput.click()">
                  <mat-icon>upload</mat-icon> Subir imagen
                </button>
              </div>
            </div>
          </mat-tab>

          <!-- TAB: Combinaciones -->
          <mat-tab label="Combinaciones">
            <div class="pt-4 max-w-3xl space-y-4">
              @for (comb of combinations; track comb.id) {
                <div class="bg-white rounded-lg shadow p-4 flex items-center gap-4">
                  <div class="flex-1">
                    <p class="font-semibold">
                      @for (av of comb.attributeValues || []; track av.id) {
                        <mat-chip>{{ av.translations?.[0]?.name || av.id }}</mat-chip>
                      }
                    </p>
                    <p class="text-sm text-gray-500">
                      Ref: {{ comb.reference || '—' }} · Stock: {{ comb.quantity }} · Precio ±{{
                        comb.price_impact | currency: 'EUR'
                      }}
                    </p>
                  </div>
                  <button mat-icon-button color="warn" (click)="removeCombination(comb.id)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              }
              @if (!combinations.length) {
                <p class="text-gray-500">No hay combinaciones definidas.</p>
              }
            </div>
          </mat-tab>

          <!-- TAB: Características -->
          <mat-tab label="Características">
            <div class="pt-4 max-w-3xl space-y-4">
              @for (pf of productFeatures; track pf.id_feature) {
                <div class="flex items-center gap-3 bg-white rounded-lg shadow p-3">
                  <span class="font-semibold w-40">{{ pf.featureName }}</span>
                  <span class="flex-1">{{ pf.valueName }}</span>
                  <button mat-icon-button color="warn" (click)="removeFeature(pf.id_feature)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              }

              <div class="flex items-end gap-3 bg-gray-50 rounded-lg p-4">
                <mat-form-field appearance="outline" class="flex-1 !mb-0">
                  <mat-label>Característica</mat-label>
                  <mat-select
                    [(ngModel)]="newFeatureId"
                    name="newFeature"
                    (selectionChange)="onFeatureSelect()"
                  >
                    @for (f of allFeatures; track f.id) {
                      <mat-option [value]="f.id">{{
                        f.translations?.[0]?.name || f.id
                      }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline" class="flex-1 !mb-0">
                  <mat-label>Valor</mat-label>
                  <mat-select [(ngModel)]="newFeatureValueId" name="newFeatureValue">
                    @for (v of selectedFeatureValues; track v.id) {
                      <mat-option [value]="v.id">{{
                        v.translations?.[0]?.value || v.translations?.[0]?.name || v.id
                      }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
                <button mat-flat-button color="primary" (click)="addFeature()" class="!mb-2">
                  Añadir
                </button>
              </div>
            </div>
          </mat-tab>

          <!-- TAB: Categorías -->
          <mat-tab label="Categorías">
            <div class="pt-4 max-w-xl space-y-2">
              @for (cat of allCategories; track cat.id) {
                <mat-checkbox
                  [checked]="selectedCategories.has(cat.id)"
                  (change)="toggleCategory(cat.id, $event.checked)"
                >
                  {{ cat.prefix }}{{ cat.name }}
                </mat-checkbox>
              }
              <div class="pt-4">
                <button mat-flat-button color="primary" (click)="saveCategories()">
                  <mat-icon>save</mat-icon> Guardar categorías
                </button>
              </div>
            </div>
          </mat-tab>
        }
      </mat-tab-group>
    }
  `,
})
export class ProductFormComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  isNew = true;
  loading = false;
  saving = false;
  productId: number | null = null;

  manufacturers: any[] = [];
  suppliers: any[] = [];
  images: any[] = [];
  combinations: any[] = [];
  productFeatures: any[] = [];
  allFeatures: any[] = [];
  selectedFeatureValues: any[] = [];
  newFeatureId: number | null = null;
  newFeatureValueId: number | null = null;
  allCategories: Array<{ id: number; name: string; prefix: string }> = [];
  selectedCategories = new Set<number>();

  product: ProductData = {
    price: 0,
    quantity: 0,
    reference: '',
    ean13: '',
    active: true,
    idCategoryDefault: 2,
    idManufacturer: null,
    idSupplier: null,
    translations: {
      es: { name: '', slug: '', description: '', descriptionShort: '' },
      en: { name: '', slug: '', description: '', descriptionShort: '' },
    },
  };

  ngOnInit(): void {
    this.api
      .get<any>('/manufacturers', { perPage: 100 })
      .subscribe((r) => (this.manufacturers = r.data));
    this.api.get<any>('/suppliers', { perPage: 100 }).subscribe((r) => (this.suppliers = r.data));

    const id = this.route.snapshot.params['id'];
    if (id && id !== 'new') {
      this.isNew = false;
      this.productId = +id;
      this.loading = true;
      this.api.get<any>(`/products/${id}`).subscribe({
        next: (res) => {
          const p = res.data;
          this.product = {
            price: p.price,
            quantity: p.quantity,
            reference: p.reference || '',
            ean13: p.ean13 || '',
            active: p.active,
            idCategoryDefault: p.idCategoryDefault,
            idManufacturer: p.idManufacturer || null,
            idSupplier: p.idSupplier || null,
            translations: (p.translations ||
              this.product.translations) as ProductData['translations'],
          };
          this.loading = false;
          this.loadSubResources();
        },
        error: () => {
          this.snackBar.open('Producto no encontrado', 'Cerrar', { duration: 3000 });
          this.router.navigate(['/products']);
        },
      });
    }
  }

  private loadSubResources(): void {
    if (!this.productId) return;
    this.api
      .get<any>(`/products/${this.productId}/images`)
      .subscribe((r) => (this.images = r.data));
    this.api
      .get<any>(`/products/${this.productId}/combinations`)
      .subscribe((r) => (this.combinations = r.data));
    this.loadProductFeatures();
    this.api.get<any>('/features').subscribe((r) => (this.allFeatures = r.data));
    this.loadCategories();
  }

  private loadProductFeatures(): void {
    this.api.get<any>(`/products/${this.productId}/features`).subscribe((r) => {
      this.productFeatures = (r.data || []).map((pf: any) => ({
        id_feature: pf.id_feature,
        featureName: pf.feature?.translations?.[0]?.name || `Feature #${pf.id_feature}`,
        valueName:
          pf.featureValue?.translations?.[0]?.value ||
          pf.featureValue?.translations?.[0]?.name ||
          `Value #${pf.id_feature_value}`,
      }));
    });
  }

  private loadCategories(): void {
    this.api.get<any>('/categories/tree').subscribe((res) => {
      this.allCategories = [];
      this.flattenTree(res.data?.children || res.data || [], '');
    });
    // Retrieve currently assigned categories — product detail may include them
    this.selectedCategories.clear();
    if (this.product.idCategoryDefault) {
      this.selectedCategories.add(this.product.idCategoryDefault);
    }
  }

  private flattenTree(nodes: any[], prefix: string): void {
    for (const n of nodes) {
      const name = n.translations?.[0]?.name || n.name || `Cat #${n.id}`;
      this.allCategories.push({ id: n.id, name, prefix });
      if (n.children?.length) {
        this.flattenTree(n.children, prefix + '— ');
      }
    }
  }

  getImageUrl(path: string): string {
    if (path.startsWith('http')) return path;
    return environment.apiUrl.replace('/api/v1', '') + '/' + path;
  }

  onSubmit(): void {
    this.saving = true;
    const obs = this.isNew
      ? this.api.post('/products', this.product)
      : this.api.put(`/products/${this.productId}`, this.product);

    obs.subscribe({
      next: (res: any) => {
        this.snackBar.open(this.isNew ? 'Producto creado' : 'Producto actualizado', 'OK', {
          duration: 3000,
        });
        if (this.isNew) {
          this.router.navigate(['/products', res.data?.id]);
        }
        this.saving = false;
      },
      error: () => {
        this.snackBar.open('Error al guardar', 'Cerrar', { duration: 3000 });
        this.saving = false;
      },
    });
  }

  // --- Images ---
  uploadImage(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('image', file);
    this.api.upload<any>(`/products/${this.productId}/images`, fd).subscribe({
      next: () => {
        this.snackBar.open('Imagen subida', 'OK', { duration: 2000 });
        this.api
          .get<any>(`/products/${this.productId}/images`)
          .subscribe((r) => (this.images = r.data));
      },
      error: () => this.snackBar.open('Error al subir imagen', 'Cerrar', { duration: 3000 }),
    });
  }

  setCover(imageId: number): void {
    this.api.put(`/products/${this.productId}/images/${imageId}`, { cover: true }).subscribe(() => {
      this.images.forEach((i) => (i.cover = i.id === imageId));
    });
  }

  removeImage(imageId: number): void {
    if (!confirm('¿Eliminar esta imagen?')) return;
    this.api.delete(`/products/${this.productId}/images/${imageId}`).subscribe(() => {
      this.images = this.images.filter((i) => i.id !== imageId);
    });
  }

  // --- Combinations ---
  removeCombination(combId: number): void {
    if (!confirm('¿Eliminar esta combinación?')) return;
    this.api.delete(`/products/${this.productId}/combinations/${combId}`).subscribe(() => {
      this.combinations = this.combinations.filter((c) => c.id !== combId);
    });
  }

  // --- Features ---
  onFeatureSelect(): void {
    const feat = this.allFeatures.find((f: any) => f.id === this.newFeatureId);
    this.selectedFeatureValues = feat?.values || [];
    this.newFeatureValueId = null;
  }

  addFeature(): void {
    if (!this.newFeatureId || !this.newFeatureValueId) return;
    this.api
      .post(`/products/${this.productId}/features`, {
        idFeature: this.newFeatureId,
        idFeatureValue: this.newFeatureValueId,
      })
      .subscribe({
        next: () => {
          this.snackBar.open('Característica añadida', 'OK', { duration: 2000 });
          this.loadProductFeatures();
          this.newFeatureId = null;
          this.newFeatureValueId = null;
          this.selectedFeatureValues = [];
        },
        error: () => this.snackBar.open('Error', 'Cerrar', { duration: 3000 }),
      });
  }

  removeFeature(featureId: number): void {
    this.api.delete(`/products/${this.productId}/features/${featureId}`).subscribe(() => {
      this.productFeatures = this.productFeatures.filter((f) => f.id_feature !== featureId);
    });
  }

  // --- Categories ---
  toggleCategory(id: number, checked: boolean): void {
    if (checked) this.selectedCategories.add(id);
    else this.selectedCategories.delete(id);
  }

  saveCategories(): void {
    this.api
      .put(`/products/${this.productId}/categories`, {
        categoryIds: Array.from(this.selectedCategories),
      })
      .subscribe({
        next: () => this.snackBar.open('Categorías guardadas', 'OK', { duration: 2000 }),
        error: () => this.snackBar.open('Error', 'Cerrar', { duration: 3000 }),
      });
  }
}
