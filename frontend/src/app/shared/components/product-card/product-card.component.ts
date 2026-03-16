import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [RouterLink, MatCardModule, MatButtonModule, MatIconModule, CurrencyPipe],
  template: `
    <mat-card class="h-full flex flex-col hover:shadow-lg transition-shadow">
      <a [routerLink]="['/product', product.id]" class="block">
        @if (product.coverImage) {
          <img
            mat-card-image
            [src]="product.coverImage"
            [alt]="product.name"
            class="object-cover aspect-[4/3]"
          />
        } @else {
          <div class="aspect-[4/3] bg-gray-100 flex items-center justify-center">
            <mat-icon class="!text-4xl text-gray-300">image</mat-icon>
          </div>
        }
      </a>
      <mat-card-content class="flex-1 pt-4">
        @if (product.categoryName) {
          <p class="text-xs text-gray-400 uppercase tracking-wide mb-1">
            {{ product.categoryName }}
          </p>
        }
        <a
          [routerLink]="['/product', product.id]"
          class="font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2 block"
        >
          {{ product.name }}
        </a>
        @if (product.descriptionShort) {
          <p class="text-sm text-gray-500 mt-1 line-clamp-2">{{ product.descriptionShort }}</p>
        }
      </mat-card-content>
      <mat-card-actions class="flex items-center justify-between px-4 pb-4">
        <span class="text-lg font-bold text-blue-600">{{ product.price | currency: 'EUR' }}</span>
        <a mat-mini-fab color="primary" [routerLink]="['/product', product.id]">
          <mat-icon>visibility</mat-icon>
        </a>
      </mat-card-actions>
    </mat-card>
  `,
})
export class ProductCardComponent {
  @Input({ required: true }) product!: {
    id: number;
    name: string;
    price: number;
    coverImage: string | null;
    descriptionShort: string | null;
    categoryName: string | null;
  };
}
