import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ProductService, ProductFilters } from '../../core/services/product.service';
import { CategoryService } from '../../core/services/category.service';
import { ApiService } from '../../core/services/api.service';
import { SeoService } from '../../core/seo.service';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    MatDividerModule,
    ProductCardComponent,
  ],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-8">
      <div class="flex flex-col md:flex-row gap-8">
        <!-- Sidebar: categories + filters -->
        <aside class="w-full md:w-72 shrink-0 space-y-4">
          <!-- Category filter -->
          <div>
            <h3 class="text-lg font-semibold mb-3">Categorías</h3>
            <nav class="flex flex-col gap-1">
              <a
                routerLink="/catalog"
                [queryParams]="{}"
                queryParamsHandling="merge"
                (click)="clearCategory()"
                class="px-3 py-2 rounded hover:bg-gray-100 transition-colors cursor-pointer"
                [class.bg-blue-50]="!categoryId"
                [class.text-blue-700]="!categoryId"
              >
                Todas
              </a>
              @for (cat of categories; track cat.id) {
                <a
                  [routerLink]="['/catalog', cat.id]"
                  class="px-3 py-2 rounded hover:bg-gray-100 transition-colors"
                  [class.bg-blue-50]="categoryId === cat.id"
                  [class.text-blue-700]="categoryId === cat.id"
                >
                  {{ cat.name }}
                </a>
              }
            </nav>
          </div>

          <mat-divider />

          <!-- Price range filter -->
          <mat-expansion-panel [expanded]="true" class="!shadow-none !rounded-none">
            <mat-expansion-panel-header>
              <mat-panel-title class="font-semibold">Precio</mat-panel-title>
            </mat-expansion-panel-header>
            <div class="flex gap-2 pt-2">
              <div class="flex-1">
                <label class="block text-sm font-medium text-gray-700 mb-1">Mín</label>
                <input
                  type="number"
                  [(ngModel)]="minPrice"
                  (ngModelChange)="onFilterChange()"
                  min="0"
                  placeholder="0"
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
              </div>
              <div class="flex-1">
                <label class="block text-sm font-medium text-gray-700 mb-1">Máx</label>
                <input
                  type="number"
                  [(ngModel)]="maxPrice"
                  (ngModelChange)="onFilterChange()"
                  min="0"
                  placeholder="∞"
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
              </div>
            </div>
          </mat-expansion-panel>

          <mat-divider />

          <!-- Manufacturer filter -->
          @if (manufacturers.length > 0) {
            <mat-expansion-panel [expanded]="true" class="!shadow-none !rounded-none">
              <mat-expansion-panel-header>
                <mat-panel-title class="font-semibold">Fabricante</mat-panel-title>
              </mat-expansion-panel-header>
              <div class="flex flex-col gap-1 pt-1">
                @for (m of manufacturers; track m.id) {
                  <mat-checkbox
                    [checked]="selectedManufacturers.has(m.id)"
                    (change)="toggleManufacturer(m.id, $event.checked)"
                  >
                    {{ m.name }}
                  </mat-checkbox>
                }
              </div>
            </mat-expansion-panel>
            <mat-divider />
          }

          <!-- In stock filter -->
          <div class="px-2">
            <mat-checkbox [(ngModel)]="inStock" (ngModelChange)="onFilterChange()">
              Solo en stock
            </mat-checkbox>
          </div>

          <!-- Clear filters button -->
          @if (hasActiveFilters()) {
            <div class="px-2">
              <button mat-stroked-button (click)="clearFilters()" class="w-full">
                <mat-icon>filter_alt_off</mat-icon>
                Limpiar filtros
              </button>
            </div>
          }
        </aside>

        <!-- Product Grid -->
        <div class="flex-1">
          <div class="flex items-center justify-between mb-6">
            <h1 class="text-2xl font-bold">{{ categoryName || 'Catálogo' }}</h1>
            <p class="text-sm text-gray-500">{{ totalItems }} productos</p>
          </div>

          @if (searchQuery) {
            <div class="mb-4 p-3 bg-blue-50 rounded-lg flex items-center gap-2">
              <mat-icon class="text-blue-500">search</mat-icon>
              <span class="text-sm">Resultados para: <strong>"{{ searchQuery }}"</strong></span>
              <button mat-icon-button (click)="clearSearch()" class="ml-auto">
                <mat-icon>close</mat-icon>
              </button>
            </div>
          }

          @if (loading) {
            <div class="flex justify-center py-12">
              <mat-spinner diameter="48" />
            </div>
          } @else if (products.length) {
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              @for (product of products; track product.id) {
                <app-product-card [product]="product" />
              }
            </div>
            <mat-paginator
              [length]="totalItems"
              [pageSize]="perPage"
              [pageIndex]="page - 1"
              [pageSizeOptions]="[12, 24, 48]"
              (page)="onPage($event)"
              class="mt-6"
            />
          } @else {
            <div class="text-center py-12">
              <mat-icon class="!text-6xl text-gray-300 mb-4">search_off</mat-icon>
              <p class="text-gray-500">No se encontraron productos.</p>
              @if (hasActiveFilters()) {
                <button mat-button color="primary" (click)="clearFilters()" class="mt-4">
                  Quitar filtros
                </button>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class CatalogComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly api = inject(ApiService);
  private readonly seoService = inject(SeoService);
  private readonly destroy$ = new Subject<void>();
  private readonly filterChange$ = new Subject<void>();

  products: any[] = [];
  categories: any[] = [];
  manufacturers: Array<{ id: number; name: string }> = [];
  categoryId: number | null = null;
  categoryName = '';
  loading = true;
  page = 1;
  perPage = 12;
  totalItems = 0;
  searchQuery = '';

  // Filters
  minPrice: number | null = null;
  maxPrice: number | null = null;
  selectedManufacturers = new Set<number>();
  inStock = false;

  ngOnInit(): void {
    this.categoryService.getTree().subscribe((cats) => {
      this.categories = cats;
    });

    this.api.get<any>('/manufacturers', { perPage: 100 }).subscribe((r) => {
      this.manufacturers = r.data || [];
    });

    // Debounce filter changes
    this.filterChange$
      .pipe(debounceTime(400), takeUntil(this.destroy$))
      .subscribe(() => {
        this.page = 1;
        this.updateUrlAndLoad();
      });

    // React to both route params and query params
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.categoryId = params['categoryId'] ? +params['categoryId'] : null;

      if (this.categoryId) {
        this.categoryService.getById(this.categoryId).subscribe((cat) => {
          const lang = Object.keys(cat.translations || {})[0];
          this.categoryName = lang ? cat.translations[lang].name : '';
          const catUrl = typeof window !== 'undefined'
            ? `${window.location.origin}/catalog/${cat.id}`
            : '';
          // SEO — canonical always points to page 1 (no ?page= in canonical)
          this.seoService.setCategoryMeta({
            name: this.categoryName,
            description: lang ? cat.translations[lang].description : undefined,
            url: catUrl || undefined,
          });
          // Breadcrumb JSON-LD
          const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
          this.seoService.setBreadcrumbJsonLd([
            { name: 'Inicio', url: baseUrl + '/' },
            { name: 'Catálogo', url: baseUrl + '/catalog' },
            { name: this.categoryName, url: catUrl },
          ]);
        });
      } else {
        this.categoryName = '';
        this.seoService.setCategoryMeta({ name: 'Catálogo' });
      }
    });

    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((qp) => {
      // Restore filters from URL
      this.page = qp['page'] ? +qp['page'] : 1;
      this.perPage = qp['perPage'] ? +qp['perPage'] : 12;
      this.searchQuery = qp['search'] || '';
      this.minPrice = qp['min_price'] ? +qp['min_price'] : null;
      this.maxPrice = qp['max_price'] ? +qp['max_price'] : null;
      this.inStock = qp['in_stock'] === 'true';

      if (qp['manufacturer']) {
        this.selectedManufacturers = new Set(
          String(qp['manufacturer'])
            .split(',')
            .map(Number)
            .filter(Boolean),
        );
      } else {
        this.selectedManufacturers = new Set();
      }

      this.loadProducts();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadProducts(): void {
    this.loading = true;
    const filters: ProductFilters = {
      page: this.page,
      perPage: this.perPage,
    };

    if (this.categoryId) {
      filters.idCategory = this.categoryId;
    }
    if (this.searchQuery) {
      filters.search = this.searchQuery;
    }
    if (this.minPrice !== null && this.minPrice >= 0) {
      filters.min_price = this.minPrice;
    }
    if (this.maxPrice !== null && this.maxPrice > 0) {
      filters.max_price = this.maxPrice;
    }
    if (this.selectedManufacturers.size === 1) {
      filters.id_manufacturer = [...this.selectedManufacturers][0];
    }
    if (this.inStock) {
      filters.in_stock = true;
    }

    this.productService.list(filters).subscribe((res) => {
      this.products = res.data;
      this.totalItems = res.meta.total;
      this.loading = false;
    });
  }

  onFilterChange(): void {
    this.filterChange$.next();
  }

  updateUrlAndLoad(): void {
    const queryParams: Record<string, string | number | null> = {};

    if (this.page > 1) queryParams['page'] = this.page;
    if (this.perPage !== 12) queryParams['perPage'] = this.perPage;
    if (this.searchQuery) queryParams['search'] = this.searchQuery;
    if (this.minPrice !== null && this.minPrice > 0) queryParams['min_price'] = this.minPrice;
    if (this.maxPrice !== null && this.maxPrice > 0) queryParams['max_price'] = this.maxPrice;
    if (this.selectedManufacturers.size > 0)
      queryParams['manufacturer'] = [...this.selectedManufacturers].join(',');
    if (this.inStock) queryParams['in_stock'] = 'true';

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  onPage(event: PageEvent): void {
    this.page = event.pageIndex + 1;
    this.perPage = event.pageSize;
    this.updateUrlAndLoad();
    this.loadProducts();
  }

  toggleManufacturer(id: number, checked: boolean): void {
    if (checked) {
      this.selectedManufacturers.add(id);
    } else {
      this.selectedManufacturers.delete(id);
    }
    this.onFilterChange();
  }

  clearCategory(): void {
    this.categoryId = null;
    this.categoryName = '';
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.onFilterChange();
  }

  hasActiveFilters(): boolean {
    return (
      this.searchQuery.length > 0 ||
      this.minPrice !== null ||
      this.maxPrice !== null ||
      this.selectedManufacturers.size > 0 ||
      this.inStock
    );
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.minPrice = null;
    this.maxPrice = null;
    this.selectedManufacturers.clear();
    this.inStock = false;
    this.page = 1;
    this.updateUrlAndLoad();
    this.loadProducts();
  }
}
