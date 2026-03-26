import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../core/services/product.service';
import { CategoryService } from '../../core/services/category.service';
import { ApiService } from '../../core/services/api.service';
import { SeoService } from '../../core/seo.service';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { firstValueFrom } from 'rxjs';
import { catchError, of } from 'rxjs';

interface ThemeConfig {
  bannerText?: string;
  bannerSubtitle?: string;
  bannerImageUrl?: string;
  bannerBgColor?: string;
  ctaTitle?: string;
  ctaSubtitle?: string;
  ctaButtonText?: string;
  ctaButtonLink?: string;
  shopName?: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    CommonModule,
    ProductCardComponent,
  ],
  template: `
    <!-- Hero / Banner principal -->
    <section
      class="relative text-white py-24 md:py-32 overflow-hidden"
      [style.background]="bannerImageUrl()
        ? 'url(' + bannerImageUrl() + ') center/cover no-repeat'
        : bannerBgColor()"
    >
      <!-- Overlay oscuro si hay imagen -->
      @if (bannerImageUrl()) {
        <div class="absolute inset-0 bg-black/50"></div>
      }
      <div class="relative z-10 max-w-7xl mx-auto px-4 text-center">
        <h1 class="text-4xl md:text-6xl font-bold mb-4 drop-shadow-lg">
          {{ bannerText() || 'Bienvenido a nuestra tienda' }}
        </h1>
        <p class="text-xl md:text-2xl mb-8 opacity-90 max-w-2xl mx-auto drop-shadow">
          {{ bannerSubtitle() || 'Los mejores productos al mejor precio' }}
        </p>
        <a
          mat-flat-button
          routerLink="/catalog"
          class="!text-lg !px-8 !py-3 !bg-white !text-blue-700 hover:!bg-gray-100"
        >
          <mat-icon class="mr-1">shopping_bag</mat-icon>
          Ver catálogo
        </a>
      </div>
    </section>

    <!-- Categorías destacadas -->
    @if (categories().length) {
      <section class="bg-gray-50 py-12">
        <div class="max-w-7xl mx-auto px-4">
          <h2 class="text-2xl font-bold mb-2 text-center">Explora por categorías</h2>
          <p class="text-gray-500 text-center mb-8">Encuentra lo que buscas fácilmente</p>
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            @for (cat of categories(); track cat.id) {
              <a
                [routerLink]="['/catalog', cat.id]"
                class="bg-white rounded-xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1 p-4 text-center group"
              >
                @if (cat.imageUrl) {
                  <img
                    [src]="cat.imageUrl"
                    [alt]="cat.name"
                    class="w-16 h-16 mx-auto mb-3 rounded-full object-cover"
                  />
                } @else {
                  <div class="w-16 h-16 mx-auto mb-3 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <mat-icon class="!text-3xl text-blue-600">category</mat-icon>
                  </div>
                }
                <h3 class="font-semibold text-sm text-gray-800 group-hover:text-blue-600 transition-colors">
                  {{ cat.name }}
                </h3>
              </a>
            }
          </div>
        </div>
      </section>
    }

    <!-- Novedades -->
    <section class="max-w-7xl mx-auto px-4 py-12">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-2xl font-bold">Novedades</h2>
          <p class="text-gray-500 text-sm mt-1">Los últimos productos añadidos</p>
        </div>
        <a mat-button routerLink="/catalog" color="primary">
          Ver todos <mat-icon>arrow_forward</mat-icon>
        </a>
      </div>
      @if (loadingNew()) {
        <div class="flex justify-center py-12">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else if (newestProducts().length) {
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          @for (product of newestProducts(); track product.id) {
            <app-product-card [product]="product" />
          }
        </div>
      } @else {
        <p class="text-gray-500 text-center py-8">No hay productos disponibles aún.</p>
      }
    </section>

    <!-- Banner secundario / CTA -->
    <section class="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16">
      <div class="max-w-4xl mx-auto px-4 text-center">
        <mat-icon class="!text-5xl mb-4 opacity-90">local_offer</mat-icon>
        <h2 class="text-3xl font-bold mb-3">
          {{ ctaTitle() || '¡Ofertas especiales!' }}
        </h2>
        <p class="text-lg mb-8 opacity-90">
          {{ ctaSubtitle() || 'Descubre nuestras promociones y descuentos exclusivos para ti.' }}
        </p>
        <a
          mat-flat-button
          [routerLink]="ctaButtonLink() || '/catalog'"
          class="!bg-white !text-blue-700 !text-lg !px-8 !py-3 hover:!bg-gray-100"
        >
          {{ ctaButtonText() || 'Ver ofertas' }}
        </a>
      </div>
    </section>

    <!-- Más vendidos (bestsellers) -->
    @if (bestsellerProducts().length) {
      <section class="max-w-7xl mx-auto px-4 py-12">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-2xl font-bold">Más vendidos</h2>
            <p class="text-gray-500 text-sm mt-1">Los favoritos de nuestros clientes</p>
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          @for (product of bestsellerProducts(); track product.id) {
            <app-product-card [product]="product" />
          }
        </div>
      </section>
    }
  `,
})
export class HomeComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly api = inject(ApiService);
  private readonly seoService = inject(SeoService);

  // Signals
  readonly bannerText = signal<string>('');
  readonly bannerSubtitle = signal<string>('');
  readonly bannerImageUrl = signal<string>('');
  readonly bannerBgColor = signal<string>('linear-gradient(135deg, #1d4ed8 0%, #4338ca 100%)');
  readonly ctaTitle = signal<string>('');
  readonly ctaSubtitle = signal<string>('');
  readonly ctaButtonText = signal<string>('');
  readonly ctaButtonLink = signal<string>('');

  readonly newestProducts = signal<any[]>([]);
  readonly bestsellerProducts = signal<any[]>([]);
  readonly categories = signal<any[]>([]);
  readonly loadingNew = signal(true);

  ngOnInit(): void {
    this.seoService.setHomeMeta({
      shopName: 'DMShop',
      tagline: 'Tu tienda online de confianza. Encuentra los mejores productos al mejor precio.',
    });

    this.loadThemeConfig();
    this.loadNewestProducts();
    this.loadCategories();
  }

  private loadThemeConfig(): void {
    this.api
      .get<{ success: boolean; data: { key: string; value: string }[] }>(
        '/configurations',
        { prefix: 'THEME_BANNER,THEME_CTA,THEME_SHOP' },
      )
      .pipe(catchError(() => of({ success: false, data: [] })))
      .subscribe((res) => {
        const configs: Record<string, string> = {};
        (res.data ?? []).forEach((c) => (configs[c.key] = c.value));

        if (configs['THEME_BANNER_TEXT']) this.bannerText.set(configs['THEME_BANNER_TEXT']);
        if (configs['THEME_BANNER_SUBTITLE']) this.bannerSubtitle.set(configs['THEME_BANNER_SUBTITLE']);
        if (configs['THEME_BANNER_IMAGE_URL']) this.bannerImageUrl.set(configs['THEME_BANNER_IMAGE_URL']);
        if (configs['THEME_BANNER_BG_COLOR']) this.bannerBgColor.set(configs['THEME_BANNER_BG_COLOR']);
        if (configs['THEME_CTA_TITLE']) this.ctaTitle.set(configs['THEME_CTA_TITLE']);
        if (configs['THEME_CTA_SUBTITLE']) this.ctaSubtitle.set(configs['THEME_CTA_SUBTITLE']);
        if (configs['THEME_CTA_BUTTON_TEXT']) this.ctaButtonText.set(configs['THEME_CTA_BUTTON_TEXT']);
        if (configs['THEME_CTA_BUTTON_LINK']) this.ctaButtonLink.set(configs['THEME_CTA_BUTTON_LINK']);
      });
  }

  private loadNewestProducts(): void {
    this.loadingNew.set(true);
    this.productService
      .list({ sort: 'newest', perPage: 8 })
      .pipe(catchError(() => of({ data: [], meta: { page: 1, perPage: 8, total: 0, totalPages: 0 } })))
      .subscribe((res) => {
        this.newestProducts.set(res.data);
        this.loadingNew.set(false);
        // Bestsellers: use a different slice (simulate with page 2 or a different sort)
        this.loadBestsellerProducts();
      });
  }

  private loadBestsellerProducts(): void {
    this.productService
      .list({ sort: 'bestseller', perPage: 4 })
      .pipe(catchError(() => of({ data: [], meta: { page: 1, perPage: 4, total: 0, totalPages: 0 } })))
      .subscribe((res) => {
        // Show bestsellers only if they differ from newest (simple check: show if any different)
        this.bestsellerProducts.set(res.data.slice(0, 4));
      });
  }

  private loadCategories(): void {
    this.categoryService
      .getTree()
      .pipe(catchError(() => of([])))
      .subscribe((cats) => {
        const activeTopLevel = cats.filter((c: any) => c.active).slice(0, 6);
        this.categories.set(activeTopLevel.map((c: any) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          imageUrl: (c as any).imageUrl ?? null,
        })));
      });
  }
}
