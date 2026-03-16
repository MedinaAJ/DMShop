import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ProductService } from '../../core/services/product.service';
import { CategoryService } from '../../core/services/category.service';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, ProductCardComponent],
  template: `
    <!-- Hero -->
    <section class="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
      <div class="max-w-7xl mx-auto px-4 text-center">
        <h1 class="text-4xl md:text-5xl font-bold mb-4">Bienvenido a DMShop</h1>
        <p class="text-xl mb-8 opacity-90">Tu tienda online de confianza</p>
        <a mat-flat-button routerLink="/catalog" class="!text-lg !px-8 !py-3"> Ver catálogo </a>
      </div>
    </section>

    <!-- Featured Products -->
    <section class="max-w-7xl mx-auto px-4 py-12">
      <h2 class="text-2xl font-bold mb-6">Productos destacados</h2>
      @if (products.length) {
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          @for (product of products; track product.id) {
            <app-product-card [product]="product" />
          }
        </div>
      } @else {
        <p class="text-gray-500 text-center py-8">No hay productos disponibles aún.</p>
      }
    </section>

    <!-- Categories -->
    @if (categories.length) {
      <section class="bg-gray-50 py-12">
        <div class="max-w-7xl mx-auto px-4">
          <h2 class="text-2xl font-bold mb-6">Categorías</h2>
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            @for (cat of categories; track cat.id) {
              <a
                [routerLink]="['/catalog', cat.id]"
                class="bg-white rounded-lg shadow p-6 text-center hover:shadow-md transition-shadow"
              >
                <mat-icon class="text-blue-600 !text-3xl !w-8 !h-8 mb-2">category</mat-icon>
                <h3 class="font-semibold">{{ cat.name }}</h3>
              </a>
            }
          </div>
        </div>
      </section>
    }
  `,
})
export class HomeComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);

  products: any[] = [];
  categories: any[] = [];

  ngOnInit(): void {
    this.productService.list({ perPage: 8 }).subscribe((res) => {
      this.products = res.data;
    });
    this.categoryService.getTree().subscribe((cats) => {
      this.categories = cats;
    });
  }
}
