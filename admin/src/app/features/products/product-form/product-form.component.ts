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
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { ProductImageService } from '../product-image.service';
import { ProductStockService, StockMovement } from '../product-stock.service';
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
    MatTooltipModule,
    MatTableModule,
    MatDialogModule,
    CurrencyPipe,
    DatePipe,
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
              @if (images.length === 0) {
                <p class="text-gray-500 mb-4">No hay imágenes. Sube la primera imagen.</p>
              }
              <div class="flex flex-wrap gap-4 mb-6">
                @for (img of images; track img.id; let i = $index) {
                  <div class="relative group rounded-lg overflow-hidden shadow border-2 w-40 h-auto"
                    [class.border-blue-500]="img.cover"
                    [class.border-gray-200]="!img.cover"
                  >
                    <img [src]="getImageUrl(img.path)" class="w-full h-32 object-cover" />
                    @if (img.cover) {
                      <span
                        class="absolute top-1 left-1 bg-blue-600 text-white text-xs px-2 py-0.5 rounded flex items-center gap-1"
                      >
                        <mat-icon class="!text-xs">star</mat-icon> Portada
                      </span>
                    }
                    <div class="p-1 bg-white flex items-center justify-between gap-1">
                      <!-- Reorder buttons -->
                      <div class="flex gap-1">
                        <button
                          mat-icon-button
                          [disabled]="i === 0"
                          (click)="moveImageUp(i)"
                          matTooltip="Mover arriba"
                          class="!w-7 !h-7"
                        >
                          <mat-icon class="!text-sm">arrow_back</mat-icon>
                        </button>
                        <button
                          mat-icon-button
                          [disabled]="i === images.length - 1"
                          (click)="moveImageDown(i)"
                          matTooltip="Mover abajo"
                          class="!w-7 !h-7"
                        >
                          <mat-icon class="!text-sm">arrow_forward</mat-icon>
                        </button>
                      </div>
                      <!-- Cover & delete -->
                      <div class="flex gap-1">
                        @if (!img.cover) {
                          <button
                            mat-icon-button
                            color="primary"
                            (click)="setCover(img.id)"
                            matTooltip="Marcar como portada"
                            class="!w-7 !h-7"
                          >
                            <mat-icon class="!text-sm">star_border</mat-icon>
                          </button>
                        }
                        <button
                          mat-icon-button
                          color="warn"
                          (click)="removeImage(img.id)"
                          matTooltip="Eliminar imagen"
                          class="!w-7 !h-7"
                        >
                          <mat-icon class="!text-sm">delete</mat-icon>
                        </button>
                      </div>
                    </div>
                  </div>
                }
              </div>
              <!-- Upload zone -->
              <div
                class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                (click)="fileInput.click()"
                (dragover)="$event.preventDefault()"
                (drop)="onDrop($event)"
              >
                <mat-icon class="!text-4xl text-gray-300 mb-2">cloud_upload</mat-icon>
                <p class="text-gray-500 text-sm">Arrastra imágenes aquí o <span class="text-blue-600 font-medium">haz click para seleccionar</span></p>
                <p class="text-xs text-gray-400 mt-1">JPEG, PNG, WebP · Máx. 5MB</p>
              </div>
              <input
                type="file"
                #fileInput
                accept="image/jpeg,image/png,image/webp"
                (change)="uploadImage($event)"
                hidden
              />
              <!-- Upload preview -->
              @if (uploadPreview) {
                <div class="mt-4 flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <img [src]="uploadPreview" class="w-16 h-16 object-cover rounded" />
                  <div class="flex-1">
                    <p class="text-sm font-medium text-gray-700">{{ uploadFileName }}</p>
                    <p class="text-xs text-gray-400">Listo para subir</p>
                  </div>
                  <button mat-icon-button (click)="clearUploadPreview()">
                    <mat-icon>close</mat-icon>
                  </button>
                </div>
              }
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

          <!-- TAB: Stock & Combinaciones -->
          <mat-tab label="Stock">
            <div class="pt-4 max-w-4xl space-y-6">
              @if (combinations.length === 0) {
                <!-- Sin combinaciones: stock simple -->
                <div class="bg-white rounded-lg shadow p-6 space-y-4">
                  <h3 class="text-lg font-semibold">Stock del producto</h3>
                  <div class="flex items-end gap-4">
                    <mat-form-field appearance="outline" class="w-48">
                      <mat-label>Stock actual</mat-label>
                      <input matInput type="number" [(ngModel)]="stockEditValue" name="stockEdit" min="0" />
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="w-48">
                      <mat-label>Alerta stock bajo</mat-label>
                      <input matInput type="number" [(ngModel)]="lowStockAlertValue" name="lowStockAlert" min="0" />
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="flex-1">
                      <mat-label>Motivo del ajuste</mat-label>
                      <input matInput [(ngModel)]="stockAdjustReason" name="stockReason" placeholder="Ej: Inventario físico" />
                    </mat-form-field>
                    <button mat-flat-button color="primary" (click)="saveProductStock()" class="!mb-6">
                      <mat-icon>save</mat-icon> Guardar stock
                    </button>
                  </div>
                </div>

                <!-- Movimientos recientes -->
                <div class="bg-white rounded-lg shadow p-6">
                  <h3 class="text-lg font-semibold mb-4">Últimos movimientos</h3>
                  @if (stockMovements.length === 0) {
                    <p class="text-gray-500">No hay movimientos registrados.</p>
                  } @else {
                    <table class="w-full text-sm">
                      <thead>
                        <tr class="border-b text-left text-gray-500">
                          <th class="pb-2 pr-4">Fecha</th>
                          <th class="pb-2 pr-4">Tipo</th>
                          <th class="pb-2 pr-4">Cantidad</th>
                          <th class="pb-2 pr-4">Stock resultante</th>
                          <th class="pb-2">Motivo</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (m of stockMovements; track m.id) {
                          <tr class="border-b even:bg-gray-50">
                            <td class="py-2 pr-4">{{ m.created_at | date:'dd/MM/yy HH:mm' }}</td>
                            <td class="py-2 pr-4">
                              <span class="px-2 py-0.5 rounded text-xs font-medium"
                                [class.bg-green-100]="m.movement_type === 'in' || m.movement_type === 'order_cancelled'"
                                [class.text-green-800]="m.movement_type === 'in' || m.movement_type === 'order_cancelled'"
                                [class.bg-red-100]="m.movement_type === 'out' || m.movement_type === 'order_reserved'"
                                [class.text-red-800]="m.movement_type === 'out' || m.movement_type === 'order_reserved'"
                                [class.bg-blue-100]="m.movement_type === 'adjustment'"
                                [class.text-blue-800]="m.movement_type === 'adjustment'"
                              >{{ movementTypeLabel(m.movement_type) }}</span>
                            </td>
                            <td class="py-2 pr-4">{{ m.quantity }}</td>
                            <td class="py-2 pr-4">{{ m.stock_after }}</td>
                            <td class="py-2">{{ m.reason || '—' }}</td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  }
                </div>
              } @else {
                <!-- Con combinaciones: tabla de combinaciones + stock -->
                <div class="bg-white rounded-lg shadow p-6">
                  <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-semibold">Combinaciones y stock</h3>
                    <button mat-flat-button color="primary" (click)="showAddCombinationForm = !showAddCombinationForm">
                      <mat-icon>add</mat-icon> Añadir combinación
                    </button>
                  </div>

                  <!-- Formulario añadir combinación -->
                  @if (showAddCombinationForm) {
                    <div class="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 class="font-semibold mb-3">Nueva combinación</h4>
                      @for (attr of allAttributes; track attr.id) {
                        <mat-form-field appearance="outline" class="mr-4 mb-2">
                          <mat-label>{{ attr.name }}</mat-label>
                          <mat-select multiple [(ngModel)]="newCombAttrValues[attr.id]" [name]="'attr_' + attr.id">
                            @for (v of attr.values; track v.id) {
                              <mat-option [value]="v.id">{{ v.name }}</mat-option>
                            }
                          </mat-select>
                        </mat-form-field>
                      }
                      <div class="flex gap-4 mt-2">
                        <mat-form-field appearance="outline">
                          <mat-label>Referencia</mat-label>
                          <input matInput [(ngModel)]="newCombReference" name="newCombRef" />
                        </mat-form-field>
                        <mat-form-field appearance="outline">
                          <mat-label>Precio adicional (€)</mat-label>
                          <input matInput type="number" [(ngModel)]="newCombPriceImpact" name="newCombPrice" />
                        </mat-form-field>
                        <mat-form-field appearance="outline">
                          <mat-label>Stock inicial</mat-label>
                          <input matInput type="number" [(ngModel)]="newCombQuantity" name="newCombQty" min="0" />
                        </mat-form-field>
                      </div>
                      <div class="flex gap-2 mt-2">
                        <button mat-flat-button color="primary" (click)="addCombination()">Guardar</button>
                        <button mat-button (click)="showAddCombinationForm = false">Cancelar</button>
                      </div>
                    </div>
                  }

                  <!-- Tabla de combinaciones -->
                  <table class="w-full text-sm">
                    <thead>
                      <tr class="border-b text-left text-gray-500">
                        <th class="pb-2 pr-4">Atributos</th>
                        <th class="pb-2 pr-4">Referencia</th>
                        <th class="pb-2 pr-4">Precio ±</th>
                        <th class="pb-2 pr-4">Stock</th>
                        <th class="pb-2 pr-4">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (comb of combinations; track comb.id) {
                        <tr class="border-b even:bg-gray-50">
                          <td class="py-2 pr-4">
                            @for (av of comb.attributeValues || []; track av.id) {
                              <mat-chip class="!text-xs mr-1">{{ av.translations?.[0]?.name || av.id }}</mat-chip>
                            }
                          </td>
                          <td class="py-2 pr-4">{{ comb.reference || '—' }}</td>
                          <td class="py-2 pr-4">{{ comb.price_impact | currency:'EUR' }}</td>
                          <td class="py-2 pr-4">
                            @if (editingCombId === comb.id) {
                              <div class="flex items-center gap-2">
                                <input class="border rounded px-2 py-1 w-20" type="number" [(ngModel)]="editingCombStock" [name]="'cstock_' + comb.id" min="0" />
                                <button mat-icon-button color="primary" (click)="saveCombinationStock(comb.id)" matTooltip="Guardar">
                                  <mat-icon class="!text-sm">check</mat-icon>
                                </button>
                                <button mat-icon-button (click)="editingCombId = null" matTooltip="Cancelar">
                                  <mat-icon class="!text-sm">close</mat-icon>
                                </button>
                              </div>
                            } @else {
                              <span
                                [class.text-red-600]="comb.quantity === 0"
                                [class.text-orange-500]="comb.quantity > 0 && comb.quantity <= 5"
                                [class.text-green-600]="comb.quantity > 5"
                                class="font-semibold"
                              >{{ comb.quantity }}</span>
                              <button mat-icon-button class="!w-6 !h-6 ml-1" (click)="startEditCombStock(comb)" matTooltip="Editar stock">
                                <mat-icon class="!text-sm">edit</mat-icon>
                              </button>
                            }
                          </td>
                          <td class="py-2 pr-4">
                            <button mat-icon-button color="warn" (click)="removeCombination(comb.id)" matTooltip="Eliminar">
                              <mat-icon class="!text-sm">delete</mat-icon>
                            </button>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
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

          <!-- TAB: Historial de precios -->
          @if (!isNew) {
            <mat-tab label="Historial de precios">
              <div class="pt-4">
                @if (priceHistory.length === 0) {
                  <p class="text-gray-500 text-sm">No hay cambios de precio registrados para este producto.</p>
                } @else {
                  <table class="w-full text-sm border-collapse">
                    <thead>
                      <tr class="bg-gray-50 text-left">
                        <th class="px-3 py-2 border border-gray-200">Fecha</th>
                        <th class="px-3 py-2 border border-gray-200">Acción</th>
                        <th class="px-3 py-2 border border-gray-200">Precio anterior</th>
                        <th class="px-3 py-2 border border-gray-200">Precio nuevo</th>
                        <th class="px-3 py-2 border border-gray-200">Reducción anterior</th>
                        <th class="px-3 py-2 border border-gray-200">Reducción nueva</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (h of priceHistory; track h.id) {
                        <tr class="hover:bg-gray-50">
                          <td class="px-3 py-2 border border-gray-200 text-xs text-gray-500">
                            {{ h.changedAt | date:'dd/MM/yyyy HH:mm' }}
                          </td>
                          <td class="px-3 py-2 border border-gray-200">
                            <span [class]="h.action === 'created' ? 'text-green-600' : h.action === 'deleted' ? 'text-red-600' : 'text-blue-600'">
                              {{ h.action === 'created' ? 'Creado' : h.action === 'deleted' ? 'Eliminado' : 'Modificado' }}
                            </span>
                          </td>
                          <td class="px-3 py-2 border border-gray-200">
                            {{ h.oldPrice != null ? (h.oldPrice | currency:'EUR') : '—' }}
                          </td>
                          <td class="px-3 py-2 border border-gray-200">
                            {{ h.newPrice != null ? (h.newPrice | currency:'EUR') : '—' }}
                          </td>
                          <td class="px-3 py-2 border border-gray-200">
                            @if (h.oldReduction > 0) {
                              {{ h.oldReduction }}{{ h.reductionType === 'percentage' ? '%' : '€' }}
                            } @else { — }
                          </td>
                          <td class="px-3 py-2 border border-gray-200">
                            @if (h.newReduction > 0) {
                              {{ h.newReduction }}{{ h.reductionType === 'percentage' ? '%' : '€' }}
                            } @else { — }
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                }
              </div>
            </mat-tab>
          }
        }
      </mat-tab-group>
    }
  `,
})
export class ProductFormComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly imageService = inject(ProductImageService);
  private readonly stockService = inject(ProductStockService);
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
  uploadPreview: string | null = null;
  uploadFileName = '';
  combinations: any[] = [];
  productFeatures: any[] = [];
  allFeatures: any[] = [];
  selectedFeatureValues: any[] = [];
  newFeatureId: number | null = null;
  newFeatureValueId: number | null = null;
  allCategories: Array<{ id: number; name: string; prefix: string }> = [];
  selectedCategories = new Set<number>();
  priceHistory: any[] = [];

  // Stock & Combinations
  stockMovements: StockMovement[] = [];
  stockEditValue = 0;
  lowStockAlertValue = 5;
  stockAdjustReason = '';
  // Combination stock inline edit
  editingCombId: number | null = null;
  editingCombStock = 0;
  // Add combination form
  showAddCombinationForm = false;
  allAttributes: Array<{ id: number; name: string; values: Array<{ id: number; name: string }> }> = [];
  newCombAttrValues: Record<number, number[]> = {};
  newCombReference = '';
  newCombPriceImpact = 0;
  newCombQuantity = 0;

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
          this.stockEditValue = p.quantity;
          this.lowStockAlertValue = p.lowStockAlert ?? 5;
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
    this.imageService
      .getImages(this.productId)
      .subscribe((r) => (this.images = r.data || []));
    this.api
      .get<any>(`/products/${this.productId}/combinations`)
      .subscribe((r) => {
        this.combinations = r.data;
        // Initialize stock edit value from product
        this.stockEditValue = this.product.quantity;
      });
    this.loadProductFeatures();
    this.api.get<any>('/features').subscribe((r) => (this.allFeatures = r.data));
    this.loadCategories();
    this.loadStockData();
    this.loadAllAttributes();
    this.loadPriceHistory();
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

  private loadPriceHistory(): void {
    if (!this.productId) return;
    this.api.get<any>(`/discounts/specific-prices/history/${this.productId}`)
      .subscribe({
        next: (res) => { this.priceHistory = res.data || []; },
        error: () => { this.priceHistory = []; },
      });
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
    return environment.apiUrl.replace('/api/v1', '') + '/' + path.replace(/^\//, '');
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

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.uploadPreview = e.target?.result as string;
      this.uploadFileName = file.name;
    };
    reader.readAsDataURL(file);

    const fd = new FormData();
    fd.append('image', file);
    this.imageService.uploadImage(this.productId!, fd).subscribe({
      next: () => {
        this.snackBar.open('Imagen subida', 'OK', { duration: 2000 });
        this.uploadPreview = null;
        this.uploadFileName = '';
        this.imageService
          .getImages(this.productId!)
          .subscribe((r) => (this.images = r.data || []));
      },
      error: () => this.snackBar.open('Error al subir imagen', 'Cerrar', { duration: 3000 }),
    });
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const inputEvent = { target: { files: [file] } } as any;
    this.uploadImage(inputEvent);
  }

  clearUploadPreview(): void {
    this.uploadPreview = null;
    this.uploadFileName = '';
  }

  setCover(imageId: number): void {
    this.imageService.setCover(this.productId!, imageId).subscribe({
      next: () => {
        this.images.forEach((i) => (i.cover = i.id === imageId));
        this.snackBar.open('Portada actualizada', 'OK', { duration: 2000 });
      },
      error: () => this.snackBar.open('Error', 'Cerrar', { duration: 3000 }),
    });
  }

  moveImageUp(index: number): void {
    if (index === 0) return;
    const arr = [...this.images];
    [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
    this.images = arr;
    this.saveOrder();
  }

  moveImageDown(index: number): void {
    if (index === this.images.length - 1) return;
    const arr = [...this.images];
    [arr[index + 1], arr[index]] = [arr[index], arr[index + 1]];
    this.images = arr;
    this.saveOrder();
  }

  private saveOrder(): void {
    const items = this.images.map((img, idx) => ({ id: img.id, position: idx }));
    this.imageService.reorderImages(this.productId!, items).subscribe({
      next: (r) => (this.images = r.data || []),
      error: () => this.snackBar.open('Error al reordenar', 'Cerrar', { duration: 3000 }),
    });
  }

  removeImage(imageId: number): void {
    if (!confirm('¿Eliminar esta imagen?')) return;
    this.imageService.deleteImage(this.productId!, imageId).subscribe({
      next: () => {
        this.images = this.images.filter((i) => i.id !== imageId);
        this.snackBar.open('Imagen eliminada', 'OK', { duration: 2000 });
      },
      error: () => this.snackBar.open('Error al eliminar', 'Cerrar', { duration: 3000 }),
    });
  }

  // --- Stock ---
  private loadStockData(): void {
    if (!this.productId) return;
    this.stockService.getMovements(this.productId, 1, 10).subscribe({
      next: (r) => (this.stockMovements = r.data),
      error: () => {/* stock movements not critical */},
    });
  }

  private loadAllAttributes(): void {
    this.api.get<any>('/attributes').subscribe({
      next: (r) => {
        this.allAttributes = (r.data || []).map((a: any) => ({
          id: a.id,
          name: a.translations?.[0]?.name || `Atributo #${a.id}`,
          values: (a.values || []).map((v: any) => ({
            id: v.id,
            name: v.translations?.[0]?.name || `#${v.id}`,
          })),
        }));
        // Init newCombAttrValues
        for (const attr of this.allAttributes) {
          this.newCombAttrValues[attr.id] = [];
        }
      },
    });
  }

  saveProductStock(): void {
    if (!this.productId) return;
    this.stockService.adjustProductStock(this.productId, this.stockEditValue, this.stockAdjustReason || 'Ajuste manual').subscribe({
      next: () => {
        this.snackBar.open('Stock actualizado', 'OK', { duration: 2000 });
        this.product.quantity = this.stockEditValue;
        this.stockAdjustReason = '';
        this.loadStockData();
      },
      error: () => this.snackBar.open('Error al actualizar stock', 'Cerrar', { duration: 3000 }),
    });

    // Also save low_stock_alert via product update
    this.api.put(`/products/${this.productId}`, { lowStockAlert: this.lowStockAlertValue }).subscribe();
  }

  movementTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      in: 'Entrada',
      out: 'Salida',
      adjustment: 'Ajuste',
      order_reserved: 'Pedido',
      order_cancelled: 'Cancelación',
    };
    return labels[type] ?? type;
  }

  startEditCombStock(comb: any): void {
    this.editingCombId = comb.id;
    this.editingCombStock = comb.quantity;
  }

  saveCombinationStock(combId: number): void {
    if (!this.productId) return;
    this.stockService.adjustCombinationStock(this.productId, combId, this.editingCombStock).subscribe({
      next: () => {
        const comb = this.combinations.find((c) => c.id === combId);
        if (comb) comb.quantity = this.editingCombStock;
        this.editingCombId = null;
        this.snackBar.open('Stock de combinación actualizado', 'OK', { duration: 2000 });
      },
      error: () => this.snackBar.open('Error al actualizar stock', 'Cerrar', { duration: 3000 }),
    });
  }

  addCombination(): void {
    if (!this.productId) return;
    // Gather selected attribute value IDs
    const attributeValueIds: number[] = [];
    for (const attr of this.allAttributes) {
      const vals = this.newCombAttrValues[attr.id] ?? [];
      attributeValueIds.push(...vals);
    }
    if (attributeValueIds.length === 0) {
      this.snackBar.open('Selecciona al menos un valor de atributo', 'Cerrar', { duration: 3000 });
      return;
    }
    this.api.post(`/products/${this.productId}/combinations`, {
      reference: this.newCombReference || null,
      priceImpact: this.newCombPriceImpact,
      quantity: this.newCombQuantity,
      attributeValueIds,
    }).subscribe({
      next: (r: any) => {
        this.combinations = r.data;
        this.showAddCombinationForm = false;
        this.newCombReference = '';
        this.newCombPriceImpact = 0;
        this.newCombQuantity = 0;
        for (const attr of this.allAttributes) {
          this.newCombAttrValues[attr.id] = [];
        }
        this.snackBar.open('Combinación añadida', 'OK', { duration: 2000 });
      },
      error: () => this.snackBar.open('Error al añadir combinación', 'Cerrar', { duration: 3000 }),
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
