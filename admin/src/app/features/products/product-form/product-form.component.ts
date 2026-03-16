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
import { ApiService } from '../../../core/services/api.service';

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
  translations: { es: TranslationData; en: TranslationData; [key: string]: TranslationData };
}

interface ProductDetailResponse {
  success: boolean;
  data: {
    id: number;
    price: number;
    quantity: number;
    reference: string | null;
    ean13: string | null;
    active: boolean;
    idCategoryDefault: number;
    translations: Record<string, TranslationData>;
  };
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
  ],
  template: `
    <div class="flex items-center gap-4 mb-6">
      <a mat-icon-button routerLink="/products">
        <mat-icon>arrow_back</mat-icon>
      </a>
      <h1 class="text-2xl font-bold">{{ isNew ? 'Nuevo producto' : 'Editar producto' }}</h1>
    </div>

    @if (loading) {
      <div class="flex justify-center py-12"><mat-spinner diameter="48" /></div>
    } @else {
      <form (ngSubmit)="onSubmit()" class="max-w-3xl space-y-6">
        <mat-tab-group>
          <mat-tab label="Español">
            <div class="pt-4 space-y-4">
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Nombre</mat-label>
                <input matInput [(ngModel)]="product.translations.es.name" name="nameEs" required />
              </mat-form-field>
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Slug</mat-label>
                <input matInput [(ngModel)]="product.translations.es.slug" name="slugEs" required />
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
            <input matInput type="number" [(ngModel)]="product.quantity" name="quantity" required />
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

  product: ProductData = {
    price: 0,
    quantity: 0,
    reference: '',
    ean13: '',
    active: true,
    idCategoryDefault: 2,
    translations: {
      es: { name: '', slug: '', description: '', descriptionShort: '' },
      en: { name: '', slug: '', description: '', descriptionShort: '' },
    },
  };

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id && id !== 'new') {
      this.isNew = false;
      this.productId = +id;
      this.loading = true;
      this.api.get<ProductDetailResponse>(`/products/${id}`).subscribe({
        next: (res) => {
          const p = res.data;
          this.product = {
            price: p.price,
            quantity: p.quantity,
            reference: p.reference || '',
            ean13: p.ean13 || '',
            active: p.active,
            idCategoryDefault: p.idCategoryDefault,
            translations: (p.translations ||
              this.product.translations) as ProductData['translations'],
          };
          this.loading = false;
        },
        error: () => {
          this.snackBar.open('Producto no encontrado', 'Cerrar', { duration: 3000 });
          this.router.navigate(['/products']);
        },
      });
    }
  }

  onSubmit(): void {
    this.saving = true;
    const obs = this.isNew
      ? this.api.post('/products', this.product)
      : this.api.put(`/products/${this.productId}`, this.product);

    obs.subscribe({
      next: () => {
        this.snackBar.open(this.isNew ? 'Producto creado' : 'Producto actualizado', 'OK', {
          duration: 3000,
        });
        this.router.navigate(['/products']);
      },
      error: () => {
        this.snackBar.open('Error al guardar', 'Cerrar', { duration: 3000 });
        this.saving = false;
      },
    });
  }
}
