import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CurrencyPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { CompareService } from '../../core/services/compare.service';
import { environment } from '../../../environments/environment';

interface CompareItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  weight: number;
  coverImage: string | null;
  features: { name: string; value: string }[];
}

@Component({
  selector: 'app-compare',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule, CurrencyPipe],
  template: `
    <div class="max-w-6xl mx-auto px-4 py-8">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold">Comparar productos</h1>
        <button mat-stroked-button (click)="compareService.clear()" routerLink="/catalog">
          <mat-icon>close</mat-icon> Limpiar comparativa
        </button>
      </div>

      @if (loading) {
        <div class="flex justify-center py-12"><mat-spinner diameter="48" /></div>
      } @else if (products.length === 0) {
        <div class="text-center py-16">
          <mat-icon class="text-6xl text-gray-300 mb-4">compare_arrows</mat-icon>
          <p class="text-gray-500 text-lg">No hay productos seleccionados para comparar.</p>
          <a mat-flat-button color="primary" routerLink="/catalog" class="mt-4">
            Ir al catálogo
          </a>
        </div>
      } @else {
        <div class="overflow-x-auto">
          <table class="w-full border-collapse">
            <!-- Images row -->
            <tr>
              <th class="text-left p-3 bg-gray-50 border w-40">Producto</th>
              @for (p of products; track p.id) {
                <td class="border p-4 text-center">
                  @if (p.coverImage) {
                    <img [src]="p.coverImage" [alt]="p.name" class="w-32 h-32 object-contain mx-auto" />
                  } @else {
                    <div class="w-32 h-32 bg-gray-100 flex items-center justify-center mx-auto rounded">
                      <mat-icon class="text-4xl text-gray-300">image_not_supported</mat-icon>
                    </div>
                  }
                  <p class="font-semibold mt-2 text-sm">{{ p.name }}</p>
                </td>
              }
            </tr>

            <!-- Price row -->
            <tr class="bg-blue-50">
              <th class="text-left p-3 bg-gray-50 border font-medium">Precio</th>
              @for (p of products; track p.id) {
                <td class="border p-4 text-center font-bold text-blue-700">
                  {{ p.price | currency:'EUR' }}
                </td>
              }
            </tr>

            <!-- Stock row -->
            <tr>
              <th class="text-left p-3 bg-gray-50 border font-medium">Stock</th>
              @for (p of products; track p.id) {
                <td class="border p-4 text-center">
                  @if (p.quantity > 0) {
                    <span class="text-green-600">✅ En stock ({{ p.quantity }})</span>
                  } @else {
                    <span class="text-red-500">❌ Agotado</span>
                  }
                </td>
              }
            </tr>

            <!-- Weight row -->
            @if (hasAnyValue('weight')) {
              <tr class="bg-gray-50">
                <th class="text-left p-3 bg-gray-50 border font-medium">Peso</th>
                @for (p of products; track p.id) {
                  <td class="border p-4 text-center">{{ p.weight > 0 ? p.weight + ' kg' : '—' }}</td>
                }
              </tr>
            }

            <!-- Features rows -->
            @for (featureName of allFeatureNames; track featureName) {
              <tr [class.bg-gray-50]="$odd">
                <th class="text-left p-3 bg-gray-50 border font-medium text-sm">{{ featureName }}</th>
                @for (p of products; track p.id) {
                  <td class="border p-4 text-center text-sm">
                    {{ getFeatureValue(p, featureName) || '—' }}
                  </td>
                }
              </tr>
            }

            <!-- Actions row -->
            <tr>
              <th class="text-left p-3 bg-gray-50 border"></th>
              @for (p of products; track p.id) {
                <td class="border p-4 text-center">
                  <a mat-flat-button color="primary" [routerLink]="['/products', p.id]">
                    Ver producto
                  </a>
                  <button mat-icon-button color="warn" (click)="removeFromCompare(p.id)" title="Quitar de comparativa">
                    <mat-icon>close</mat-icon>
                  </button>
                </td>
              }
            </tr>
          </table>
        </div>
      }
    </div>
  `,
})
export class CompareComponent implements OnInit {
  readonly compareService = inject(CompareService);
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);

  products: CompareItem[] = [];
  loading = false;

  get allFeatureNames(): string[] {
    const names = new Set<string>();
    this.products.forEach((p) => p.features.forEach((f) => names.add(f.name)));
    return Array.from(names);
  }

  getFeatureValue(product: CompareItem, featureName: string): string {
    return product.features.find((f) => f.name === featureName)?.value ?? '';
  }

  hasAnyValue(key: keyof CompareItem): boolean {
    return this.products.some((p) => (p[key] as number) > 0);
  }

  async ngOnInit(): Promise<void> {
    // Accept ids from query params or from compare service
    const queryIds = this.route.snapshot.queryParamMap.get('ids');
    let ids: number[] = queryIds
      ? queryIds.split(',').map(Number).filter((n) => !isNaN(n))
      : this.compareService.getIds();

    if (ids.length === 0) {
      this.products = [];
      return;
    }

    this.loading = true;
    try {
      const res = await firstValueFrom(
        this.http.get<{ success: boolean; data: CompareItem[] }>(
          `${environment.apiUrl}/products/compare?ids=${ids.join(',')}`,
        ),
      );
      this.products = res.data ?? [];
    } catch {
      this.products = [];
    } finally {
      this.loading = false;
    }
  }

  removeFromCompare(id: number): void {
    this.compareService.remove(id);
    this.products = this.products.filter((p) => p.id !== id);
  }
}
