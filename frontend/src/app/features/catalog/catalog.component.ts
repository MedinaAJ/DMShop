import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProductService } from '../../core/services/product.service';
import { CategoryService } from '../../core/services/category.service';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [RouterLink, MatPaginatorModule, MatProgressSpinnerModule, ProductCardComponent],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-8">
      <div class="flex flex-col md:flex-row gap-8">
        <!-- Sidebar -->
        <aside class="w-full md:w-64 shrink-0">
          <h3 class="text-lg font-semibold mb-4">Categorías</h3>
          <nav class="flex flex-col gap-1">
            <a
              routerLink="/catalog"
              class="px-3 py-2 rounded hover:bg-gray-100 transition-colors"
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
        </aside>

        <!-- Product Grid -->
        <div class="flex-1">
          <h1 class="text-2xl font-bold mb-6">{{ categoryName || 'Catálogo' }}</h1>

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
            <p class="text-gray-500 text-center py-12">No se encontraron productos.</p>
          }
        </div>
      </div>
    </div>
  `,
})
export class CatalogComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);

  products: any[] = [];
  categories: any[] = [];
  categoryId: number | null = null;
  categoryName = '';
  loading = true;
  page = 1;
  perPage = 12;
  totalItems = 0;

  ngOnInit(): void {
    this.categoryService.getTree().subscribe((cats) => {
      this.categories = cats;
    });

    this.route.params.subscribe((params) => {
      this.categoryId = params['categoryId'] ? +params['categoryId'] : null;
      this.page = 1;
      this.loadProducts();

      if (this.categoryId) {
        this.categoryService.getById(this.categoryId).subscribe((cat) => {
          const lang = Object.keys(cat.translations || {})[0];
          this.categoryName = lang ? cat.translations[lang].name : '';
        });
      } else {
        this.categoryName = '';
      }
    });
  }

  loadProducts(): void {
    this.loading = true;
    const params: Record<string, string | number | boolean> = {
      page: this.page,
      perPage: this.perPage,
    };
    if (this.categoryId) {
      params['idCategory'] = this.categoryId;
    }
    this.productService.list(params).subscribe((res) => {
      this.products = res.data;
      this.totalItems = res.meta.total;
      this.loading = false;
    });
  }

  onPage(event: PageEvent): void {
    this.page = event.pageIndex + 1;
    this.perPage = event.pageSize;
    this.loadProducts();
  }
}
